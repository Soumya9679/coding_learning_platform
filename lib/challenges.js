import { spawn } from "child_process";

const PYTHON_BINARIES = [process.env.PYTHON_BIN, "python3", "python"].filter(Boolean);
const PYTHON_TIMEOUT_MS = Number(process.env.PYTHON_TIMEOUT_MS || 5000);
const MAX_CODE_CHARACTERS = Number(process.env.MAX_CODE_CHARACTERS || 8000);
const RESULT_START = "__PY_EVAL_START__";
const RESULT_END = "__PY_EVAL_END__";

export const challengeSuites = {
  1: {
    id: "1", title: "Even or Odd", entrypoint: "even_or_odd",
    tests: [
      { input: [2], expected: "Even" },
      { input: [7], expected: "Odd" },
      { input: [0], expected: "Even" },
      { input: [-5], expected: "Odd" },
    ],
  },
  2: {
    id: "2", title: "Prime Number", entrypoint: "is_prime",
    tests: [
      { input: [2], expected: true },
      { input: [3], expected: true },
      { input: [15], expected: false },
      { input: [17], expected: true },
      { input: [1], expected: false },
    ],
  },
  3: {
    id: "3", title: "Factorial", entrypoint: "factorial",
    tests: [
      { input: [0], expected: 1 },
      { input: [5], expected: 120 },
      { input: [7], expected: 5040 },
    ],
  },
  4: {
    id: "4", title: "Fibonacci Series", entrypoint: "fibonacci",
    tests: [
      { input: [1], expected: [0] },
      { input: [2], expected: [0, 1] },
      { input: [6], expected: [0, 1, 1, 2, 3, 5] },
    ],
  },
  5: {
    id: "5", title: "Reverse a String", entrypoint: "reverse_string",
    tests: [
      { input: ["hello"], expected: "olleh" },
      { input: ["Python"], expected: "nohtyP" },
    ],
  },
  6: {
    id: "6", title: "Palindrome Check", entrypoint: "is_palindrome",
    tests: [
      { input: ["level"], expected: true },
      { input: ["RaceCar"], expected: true },
      { input: ["nurses run"], expected: true },
      { input: ["python"], expected: false },
    ],
  },
  7: {
    id: "7", title: "Sum of Digits", entrypoint: "sum_of_digits",
    tests: [
      { input: [123], expected: 6 },
      { input: [90210], expected: 12 },
      { input: [-409], expected: 13 },
    ],
  },
  8: {
    id: "8", title: "Largest in List", entrypoint: "largest_in_list",
    tests: [
      { input: [[3, 9, 2]], expected: 9 },
      { input: [[-5, -2, -10]], expected: -2 },
      { input: [[100, 50, 75, 25]], expected: 100 },
    ],
  },
  9: {
    id: "9", title: "Count Vowels", entrypoint: "count_vowels",
    tests: [
      { input: ["hello world"], expected: 3 },
      { input: ["PYTHON"], expected: 1 },
      { input: ["aeiou"], expected: 5 },
    ],
  },
  10: {
    id: "10", title: "Armstrong Number", entrypoint: "is_armstrong",
    tests: [
      { input: [153], expected: true },
      { input: [370], expected: true },
      { input: [371], expected: true },
      { input: [9474], expected: true },
      { input: [9475], expected: false },
    ],
  },
};

export { MAX_CODE_CHARACTERS };

export async function evaluatePythonSubmission(code, challenge) {
  const harness = buildPythonHarness(code, challenge);
  const { payload, stdout, stderr } = await runWithPython(harness);

  const tests = Array.isArray(payload?.tests) ? payload.tests : [];
  const missingEntryPoint = payload?.missingEntryPoint || null;
  const setupError = payload?.setupError || null;
  const passed = !missingEntryPoint && !setupError && tests.length > 0 && tests.every((t) => Boolean(t.passed));

  return { passed, tests, stdout, stderr, missingEntryPoint, setupError };
}

function buildPythonHarness(sourceCode, challenge) {
  const encodedTests = Buffer.from(JSON.stringify(challenge.tests), "utf8").toString("base64");
  const encodedSource = Buffer.from(sourceCode, "utf8").toString("base64");
  return `
import json, sys, base64

START = "${RESULT_START}"
END = "${RESULT_END}"

source_code = base64.b64decode("${encodedSource}").decode("utf-8")
tests = json.loads(base64.b64decode("${encodedTests}").decode("utf-8"))

namespace = {"__builtins__": __builtins__, "__name__": "__main__"}
payload = {}

try:
    exec(source_code, namespace)
except Exception as exec_err:
    payload = {"setupError": repr(exec_err)}
else:
    fn_name = ${JSON.stringify(challenge.entrypoint)}
    fn = namespace.get(fn_name)
    if not callable(fn):
        payload = {"missingEntryPoint": fn_name}
    else:
        report = []
        for idx, case in enumerate(tests, 1):
            args = case.get("input", [])
            kwargs = case.get("kwargs", {})
            expected = case.get("expected")
            try:
                value = fn(*args, **kwargs)
                entry = {"index": idx, "passed": bool(value == expected), "expected": expected, "value": value}
                if case.get("message"):
                    entry["message"] = case["message"]
                report.append(entry)
            except Exception as call_err:
                report.append({"index": idx, "passed": False, "error": repr(call_err)})
        payload = {"tests": report, "entrypoint": fn_name}

print(START)
print(json.dumps(payload, default=str))
print(END)
`.trim();
}

async function runWithPython(script) {
  let lastError = null;
  for (const binary of PYTHON_BINARIES) {
    try {
      return await executePython(binary, script);
    } catch (error) {
      if (error.code === "ENOENT") { lastError = error; continue; }
      throw error;
    }
  }
  const runtimeError = lastError || new Error("Python runtime is not available.");
  runtimeError.statusCode = 500;
  throw runtimeError;
}

function executePython(binary, script) {
  return new Promise((resolve, reject) => {
    const proc = spawn(binary, ["-c", script], {
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });

    const stdoutChunks = [];
    const stderrChunks = [];
    const timeout = setTimeout(() => proc.kill("SIGKILL"), PYTHON_TIMEOUT_MS);

    proc.stdout.on("data", (chunk) => stdoutChunks.push(chunk));
    proc.stderr.on("data", (chunk) => stderrChunks.push(chunk));

    proc.on("error", (error) => { clearTimeout(timeout); reject(error); });

    proc.on("close", (code, signal) => {
      clearTimeout(timeout);
      if (signal === "SIGKILL") {
        const err = new Error("Code execution timed out.");
        err.statusCode = 408;
        return reject(err);
      }

      const stdout = Buffer.concat(stdoutChunks).toString("utf8");
      const stderr = Buffer.concat(stderrChunks).toString("utf8");

      try {
        const { payload, strippedStdout } = parseRunnerOutput(stdout);
        return resolve({ payload, stdout: strippedStdout, stderr: stderr.trim() });
      } catch (error) {
        error.statusCode = 500;
        return reject(error);
      }
    });
  });
}

function parseRunnerOutput(stdoutText = "") {
  const startIndex = stdoutText.indexOf(RESULT_START);
  const endIndex = stdoutText.indexOf(RESULT_END);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error("Missing result payload from Python runner.");
  }

  const jsonSegment = stdoutText.substring(startIndex + RESULT_START.length, endIndex).trim();
  const payload = jsonSegment ? JSON.parse(jsonSegment) : {};
  const strippedStdout = `${stdoutText.substring(0, startIndex)}${stdoutText.substring(endIndex + RESULT_END.length)}`.trim();

  return { payload, strippedStdout };
}
