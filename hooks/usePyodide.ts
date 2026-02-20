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

/**
 * Execute Python code in a Web Worker with a timeout.
 * If the code runs longer than `timeoutMs`, the worker is terminated.
 */
export function runPythonInWorker(
  code: string,
  timeoutMs = DEFAULT_EXECUTION_TIMEOUT_MS
): Promise<PyodideRunResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker("/pyodide-worker.js");
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        worker.terminate();
        resolve({ stdout: "", stderr: "", error: "Execution timed out (10s limit). Check for infinite loops." });
      }
    }, timeoutMs);

    worker.onmessage = (e) => {
      const { type, result, error } = e.data;
      if (type === "ready") {
        worker.postMessage({ type: "run", code, id: 1 });
      } else if (type === "result" && !settled) {
        settled = true;
        clearTimeout(timer);
        worker.terminate();
        resolve(result as PyodideRunResult);
      } else if (type === "error" && !settled) {
        settled = true;
        clearTimeout(timer);
        worker.terminate();
        resolve({ stdout: "", stderr: "", error: error || "Execution error" });
      }
    };

    worker.onerror = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        worker.terminate();
        resolve({ stdout: "", stderr: "", error: "Worker error. Please try again." });
      }
    };

    worker.postMessage({ type: "init" });
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

  /** Run Python code via Web Worker with timeout kill-switch */
  const runWithTimeout = useCallback(
    (code: string, timeoutMs = DEFAULT_EXECUTION_TIMEOUT_MS) =>
      runPythonInWorker(code, timeoutMs),
    []
  );

  return { pyodide: pyodideRef.current, loading, error, ready, load, runWithTimeout };
}
