import { spawn } from "child_process";

interface TestCase {
  input: unknown[];
  expected: unknown;
}

interface ChallengeSuite {
  title: string;
  entryPoint: string;
  tests: TestCase[];
}

export const MAX_CODE_CHARACTERS = 8000;
const PYTHON_TIMEOUT_MS = 5000;

export const challengeSuites: Record<string, ChallengeSuite> = {
  "1": { title: "Even or Odd", entryPoint: "even_or_odd", tests: [{ input: [2], expected: "Even" }, { input: [3], expected: "Odd" }, { input: [0], expected: "Even" }, { input: [-7], expected: "Odd" }] },
  "2": { title: "Prime Number", entryPoint: "is_prime", tests: [{ input: [2], expected: true }, { input: [4], expected: false }, { input: [13], expected: true }, { input: [1], expected: false }] },
  "3": { title: "Factorial", entryPoint: "factorial", tests: [{ input: [0], expected: 1 }, { input: [1], expected: 1 }, { input: [5], expected: 120 }, { input: [7], expected: 5040 }] },
  "4": { title: "Fibonacci Series", entryPoint: "fibonacci", tests: [{ input: [1], expected: [0] }, { input: [5], expected: [0, 1, 1, 2, 3] }, { input: [0], expected: [] }] },
  "5": { title: "Reverse a String", entryPoint: "reverse_string", tests: [{ input: ["hello"], expected: "olleh" }, { input: [""], expected: "" }, { input: ["a"], expected: "a" }] },
  "6": { title: "Palindrome Check", entryPoint: "is_palindrome", tests: [{ input: ["racecar"], expected: true }, { input: ["hello"], expected: false }, { input: ["A man a plan a canal Panama"], expected: true }] },
  "7": { title: "Sum of Digits", entryPoint: "sum_of_digits", tests: [{ input: [123], expected: 6 }, { input: [0], expected: 0 }, { input: [-456], expected: 15 }] },
  "8": { title: "Largest in List", entryPoint: "largest_in_list", tests: [{ input: [[3, 1, 4, 1, 5]], expected: 5 }, { input: [[-1, -2, -3]], expected: -1 }, { input: [[42]], expected: 42 }] },
  "9": { title: "Count Vowels", entryPoint: "count_vowels", tests: [{ input: ["hello"], expected: 2 }, { input: ["xyz"], expected: 0 }, { input: ["AEIOU"], expected: 5 }] },
  "10": { title: "Armstrong Number", entryPoint: "is_armstrong", tests: [{ input: [153], expected: true }, { input: [370], expected: true }, { input: [10], expected: false }, { input: [9], expected: true }] },
};

export function buildPythonHarness(code: string, suite: ChallengeSuite): string {
  const testCases = JSON.stringify(suite.tests);
  return `
import json, sys, traceback

${code}

_tests = json.loads('${testCases.replace(/'/g, "\\'")}')
_results = []
_all_pass = True

try:
    ${suite.entryPoint}
except NameError:
    print(json.dumps({"missingEntryPoint": "${suite.entryPoint}"}))
    sys.exit(0)

for _i, _t in enumerate(_tests, 1):
    try:
        _val = ${suite.entryPoint}(*_t["input"])
        _pass = _val == _t["expected"]
        if not _pass:
            _all_pass = False
        _results.append({"index": _i, "passed": _pass, "value": _val, "expected": _t["expected"]})
    except Exception as _e:
        _all_pass = False
        _results.append({"index": _i, "passed": False, "error": str(_e)})

print(json.dumps({"passed": _all_pass, "tests": _results}))
`;
}

interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
}

export function runWithPython(code: string): Promise<RunResult> {
  return new Promise((resolve) => {
    const proc = spawn("python3", ["-c", code], {
      timeout: PYTHON_TIMEOUT_MS,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });

    proc.on("close", (exitCode) => {
      resolve({ stdout, stderr, exitCode, timedOut: false });
    });

    proc.on("error", (err) => {
      resolve({ stdout, stderr: err.message, exitCode: 1, timedOut: false });
    });

    setTimeout(() => {
      try { proc.kill("SIGKILL"); } catch {}
      resolve({ stdout, stderr: "Execution timed out.", exitCode: null, timedOut: true });
    }, PYTHON_TIMEOUT_MS + 500);
  });
}

interface EvaluationResult {
  passed: boolean;
  tests?: Array<{ index: number; passed: boolean; value?: unknown; expected?: unknown; error?: string }>;
  missingEntryPoint?: string;
  setupError?: string;
  stdout?: string;
  stderr?: string;
}

export function parseRunnerOutput(stdout: string, stderr: string): EvaluationResult {
  const lines = stdout.trim().split("\n");
  const lastLine = lines[lines.length - 1] || "";
  try {
    const parsed = JSON.parse(lastLine);
    return {
      ...parsed,
      stdout: lines.slice(0, -1).join("\n") || undefined,
      stderr: stderr || undefined,
    };
  } catch {
    return {
      passed: false,
      setupError: stderr || "Could not parse test output.",
      stdout: stdout || undefined,
      stderr: stderr || undefined,
    };
  }
}

export async function evaluatePythonSubmission(code: string, suite: ChallengeSuite): Promise<EvaluationResult> {
  const harness = buildPythonHarness(code, suite);
  const result = await runWithPython(harness);

  if (result.timedOut) {
    return { passed: false, setupError: "Your code took too long to execute." };
  }

  return parseRunnerOutput(result.stdout, result.stderr);
}
