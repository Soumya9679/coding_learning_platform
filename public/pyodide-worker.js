/* eslint-disable no-restricted-globals */
/**
 * Pyodide Web Worker — executes Python code in a sandboxed thread.
 * The main thread can terminate this worker if execution times out.
 */

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/";

let pyodide = null;
let runner = null;

async function initPyodide() {
  importScripts(`${PYODIDE_CDN}pyodide.js`);
  pyodide = await self.loadPyodide({ indexURL: PYODIDE_CDN });
  await pyodide.runPythonAsync(`
from io import StringIO
import sys, traceback

def pulse_run(source):
    stdout = sys.stdout
    stderr = sys.stderr
    out = StringIO()
    err = StringIO()
    result = {"stdout": "", "stderr": "", "error": ""}
    sys.stdout = out
    sys.stderr = err
    try:
        exec(source, {})
    except Exception as exc:
        result["error"] = f"{exc.__class__.__name__}: {exc}"
        err.write(traceback.format_exc())
    finally:
        result["stdout"] = out.getvalue()
        result["stderr"] = err.getvalue()
        sys.stdout = stdout
        sys.stderr = stderr
    return result
`);
  runner = pyodide.globals.get("pulse_run");
  self.postMessage({ type: "ready" });
}

self.onmessage = async function (e) {
  const { type, code, id } = e.data;

  if (type === "init") {
    try {
      await initPyodide();
    } catch (err) {
      self.postMessage({ type: "error", id, error: "Failed to load Python runtime." });
    }
    return;
  }

  if (type === "run") {
    if (!runner) {
      self.postMessage({ type: "error", id, error: "Python runtime not ready." });
      return;
    }
    try {
      const proxy = runner(code);
      const result = proxy.toJs({ dict_converter: Object.fromEntries });
      proxy.destroy();
      self.postMessage({ type: "result", id, result });
    } catch (err) {
      self.postMessage({ type: "error", id, error: err.message || "Execution error" });
    }
  }
};
