"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/";
const SCRIPT_POLL_TIMEOUT_MS = 30_000;
const DEFAULT_EXECUTION_TIMEOUT_MS = 10_000;

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Ensure the Pyodide CDN script tag is present */
function ensurePyodideScript(): Promise<void> {
  if ((window as any).loadPyodide) return Promise.resolve();
  if (document.querySelector(`script[src*="pyodide"]`)) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = setInterval(() => {
        if ((window as any).loadPyodide) {
          clearInterval(check);
          resolve();
        } else if (Date.now() - start > SCRIPT_POLL_TIMEOUT_MS) {
          clearInterval(check);
          reject(new Error("Pyodide script loading timed out"));
        }
      }, 100);
    });
  }
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${PYODIDE_CDN}pyodide.js`;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export interface PyodideRunResult {
  stdout: string;
  stderr: string;
  error: string;
}

/* ─── Persistent Worker Pool ─────────────────────────────────────────── *
 * Keep a singleton warm worker so we don't re-download ~10 MB of Pyodide
 * on every run. The worker is initialised once and reused across calls.
 * If it crashes or times out, we destroy it and spin a fresh one.
 * ──────────────────────────────────────────────────────────────────────── */

let _warmWorker: Worker | null = null;
let _workerReady = false;
let _initPromise: Promise<void> | null = null;
let _msgId = 0;

/** Resolvers keyed by request ID so concurrent runs don't clash */
const _pending = new Map<number, {
  resolve: (r: PyodideRunResult) => void;
  timer: ReturnType<typeof setTimeout>;
}>();

function spawnWorker(): Worker {
  const w = new Worker("/pyodide-worker.js");

  w.onmessage = (e) => {
    const { type, id, result, error } = e.data;

    if (type === "ready") {
      _workerReady = true;
      return;
    }

    const entry = _pending.get(id);
    if (!entry) return;
    _pending.delete(id);
    clearTimeout(entry.timer);

    if (type === "result") {
      entry.resolve(result as PyodideRunResult);
    } else if (type === "error") {
      entry.resolve({ stdout: "", stderr: "", error: error || "Execution error" });
    }
  };

  w.onerror = () => {
    // Worker crashed — reject all pending, dispose, and let next call re-create
    for (const [, entry] of _pending) {
      clearTimeout(entry.timer);
      entry.resolve({ stdout: "", stderr: "", error: "Worker crashed. Please try again." });
    }
    _pending.clear();
    destroyWorker();
  };

  return w;
}

function destroyWorker() {
  if (_warmWorker) {
    try { _warmWorker.terminate(); } catch { /* ignore */ }
  }
  _warmWorker = null;
  _workerReady = false;
  _initPromise = null;
}

/** Get (or create) the singleton warm worker, wait until it's ready */
function getWarmWorker(): Promise<Worker> {
  if (_warmWorker && _workerReady) return Promise.resolve(_warmWorker);

  if (!_initPromise) {
    _warmWorker = spawnWorker();
    _warmWorker.postMessage({ type: "init" });

    _initPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        destroyWorker();
        reject(new Error("Worker init timed out"));
      }, SCRIPT_POLL_TIMEOUT_MS);

      const origHandler = _warmWorker!.onmessage;
      _warmWorker!.onmessage = (e) => {
        if (e.data.type === "ready") {
          clearTimeout(timeout);
          _workerReady = true;
          // Restore the standard handler
          _warmWorker!.onmessage = origHandler;
          resolve();
        }
        // Forward to standard handler too
        if (origHandler) (origHandler as (e: MessageEvent) => void)(e);
      };
    });
  }

  return _initPromise.then(() => _warmWorker!);
}

/**
 * Execute Python code in the persistent warm Worker.
 * Times out individual executions without killing the worker.
 * If the worker becomes unresponsive, it is destroyed and recreated.
 */
export function runPythonInWorker(
  code: string,
  timeoutMs = DEFAULT_EXECUTION_TIMEOUT_MS
): Promise<PyodideRunResult> {
  return new Promise(async (resolve) => {
    try {
      const worker = await getWarmWorker();
      const id = ++_msgId;

      const timer = setTimeout(() => {
        _pending.delete(id);
        // Hard-kill the unresponsive worker so next call gets a fresh one
        destroyWorker();
        resolve({ stdout: "", stderr: "", error: "Execution timed out (10s limit). Check for infinite loops." });
      }, timeoutMs);

      _pending.set(id, { resolve, timer });
      worker.postMessage({ type: "run", code, id });
    } catch {
      resolve({ stdout: "", stderr: "", error: "Failed to start Python runtime. Please retry." });
    }
  });
}

/**
 * Shared hook that handles loading the Pyodide runtime.
 *
 * @param autoLoad - When true load immediately on mount (default: false)
 * @returns { pyodide, loading, error, load, runWithTimeout }
 */
export function usePyodide(autoLoad = false) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pyodideRef = useRef<any>(null);
  const loadingRef = useRef(false);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    if (pyodideRef.current) return pyodideRef.current;
    // Prevent concurrent loads — if already loading, wait for it
    if (loadingRef.current) return null;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      await ensurePyodideScript();
      const py = await (window as any).loadPyodide({ indexURL: PYODIDE_CDN });
      pyodideRef.current = py;
      setReady(true);
      return py;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load Pyodide";
      setError(msg);
      console.error("Pyodide load error:", e);
      return null;
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  /** Pre-warm the persistent worker on mount */
  useEffect(() => {
    getWarmWorker().catch(() => { /* swallow — will retry on next run */ });
  }, []);

  /** Run Python code via persistent warm Worker with timeout */
  const runWithTimeout = useCallback(
    (code: string, timeoutMs = DEFAULT_EXECUTION_TIMEOUT_MS) =>
      runPythonInWorker(code, timeoutMs),
    []
  );

  return { pyodide: pyodideRef.current, loading, error, ready, load, runWithTimeout };
}
