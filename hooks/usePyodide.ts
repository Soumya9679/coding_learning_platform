"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Ensure the Pyodide CDN script tag is present */
function ensurePyodideScript(): Promise<void> {
  if ((window as any).loadPyodide) return Promise.resolve();
  if (document.querySelector(`script[src*="pyodide"]`)) {
    // Script tag exists but not yet loaded — wait for it
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if ((window as any).loadPyodide) {
          clearInterval(check);
          resolve();
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

/**
 * Shared hook that handles loading the Pyodide runtime.
 *
 * @param autoLoad - When true load immediately on mount (default: false)
 * @returns { pyodide, loading, error, load }
 */
export function usePyodide(autoLoad = false) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pyodideRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    if (pyodideRef.current) return pyodideRef.current;
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return { pyodide: pyodideRef.current, loading, error, ready, load };
}
