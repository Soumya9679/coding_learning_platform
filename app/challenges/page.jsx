"use client";

import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { applyAuthHeaders } from "@/lib/session";
import styles from "@/styles/challenges.module.css";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const CHALLENGES = [
  { id: 1, title: "Even or Odd", desc: "Check whether a number is even or odd.", hint: 'Implement <code>even_or_odd(n: int) → str</code> and return "Even" or "Odd".', file: "even_or_odd.py" },
  { id: 2, title: "Prime Number", desc: "Check whether a number is prime.", hint: "Implement <code>is_prime(n: int) → bool</code> and return <code>True</code> only for primes.", file: "prime_check.py" },
  { id: 3, title: "Factorial", desc: "Find the factorial of a number.", hint: "Implement <code>factorial(n: int) → int</code> with recursion or loops (0! should be 1).", file: "factorial.py" },
  { id: 4, title: "Fibonacci Series", desc: "Generate Fibonacci series up to n terms.", hint: "Implement <code>fibonacci(n: int) → list[int]</code> returning the first <code>n</code> numbers.", file: "fibonacci.py" },
  { id: 5, title: "Reverse a String", desc: "Reverse a given string.", hint: "Implement <code>reverse_string(text: str) → str</code> and return the reversed text.", file: "reverse_string.py" },
  { id: 6, title: "Palindrome Check", desc: "Check whether a string is palindrome.", hint: "Implement <code>is_palindrome(text: str) → bool</code> ignoring casing and spaces.", file: "palindrome.py" },
  { id: 7, title: "Sum of Digits", desc: "Find the sum of digits of a number.", hint: "Implement <code>sum_of_digits(number: int) → int</code> and use the absolute value.", file: "sum_digits.py" },
  { id: 8, title: "Largest in List", desc: "Find the largest element in a list.", hint: "Implement <code>largest_in_list(values: list[int]) → int</code> without using built-in <code>max</code>.", file: "largest_in_list.py" },
  { id: 9, title: "Count Vowels", desc: "Count the vowels in a string.", hint: "Implement <code>count_vowels(text: str) → int</code> counting a, e, i, o, u (case-insensitive).", file: "count_vowels.py" },
  { id: 10, title: "Armstrong Number", desc: "Check whether a number is Armstrong.", hint: "Implement <code>is_armstrong(n: int) → bool</code> where the sum of each digit to the power of the digit count equals <code>n</code>.", file: "armstrong.py" },
];

const STORAGE_PREFIX = "challenge-code-";

function getSavedDraft(id) {
  try { return localStorage.getItem(`${STORAGE_PREFIX}${id}`) || ""; } catch { return ""; }
}

function persistDraft(id, value) {
  try { localStorage.setItem(`${STORAGE_PREFIX}${id}`, value); } catch {}
}

function escapeHTML(value = "") {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatValue(value) {
  if (typeof value === "string") return `"${value}"`;
  try { return JSON.stringify(value); } catch { return String(value); }
}

function ChallengeCard({ challenge }) {
  const [code, setCode] = useState(() => getSavedDraft(challenge.id));
  const [status, setStatus] = useState({ label: "Not attempted", className: "" });
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  const handleCodeChange = useCallback((value) => {
    setCode(value || "");
    persistDraft(challenge.id, value || "");
  }, [challenge.id]);

  const handleSubmit = async () => {
    if (!code.trim()) {
      setResult({ summary: "Please write some code before running the tests.", type: "fail" });
      setStatus({ label: "No code", className: styles.statusFailed });
      return;
    }

    setRunning(true);
    setStatus({ label: "Running tests…", className: styles.statusPending });
    setResult({ summary: "⏳ Evaluating your code…", type: "pending" });

    try {
      const res = await fetch(`/api/challenges/${challenge.id}/submit`, {
        method: "POST",
        headers: applyAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({ code }),
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || "Server error while grading code.");

      const { passed, tests = [], missingEntryPoint, setupError, stdout, stderr } = payload;

      if (missingEntryPoint) {
        setStatus({ label: "Missing function", className: styles.statusFailed });
        setResult({ summary: `Define the function "${missingEntryPoint}" exactly as described before running tests.`, type: "fail" });
        return;
      }

      if (setupError) {
        setStatus({ label: "Crashed", className: styles.statusFailed });
        setResult({ summary: `Your code crashed before tests could run: ${setupError}`, type: "fail", stderr });
        return;
      }

      const failedCount = tests.filter(t => !t.passed).length;
      setStatus({
        label: passed ? "All tests passed" : "Needs work",
        className: passed ? styles.statusPassed : styles.statusFailed,
      });
      setResult({
        summary: tests.length
          ? passed
            ? "✅ All tests passed!"
            : `❌ ${failedCount} of ${tests.length} tests failed.`
          : "⚠️ Tests did not return any results.",
        type: passed ? "pass" : "fail",
        tests,
        stdout,
        stderr,
      });
    } catch (error) {
      setStatus({ label: "Error", className: styles.statusFailed });
      setResult({ summary: error.message || "Unexpected error.", type: "fail" });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3>{challenge.id}. {challenge.title}</h3>
        <span className={`${styles.statusBadge} ${status.className}`}>{status.label}</span>
      </div>
      <p>{challenge.desc}</p>
      <p className={styles.challengeHint} dangerouslySetInnerHTML={{ __html: challenge.hint }} />

      <div className={styles.editorWrap}>
        <MonacoEditor
          height="260px"
          language="python"
          theme="vs-dark"
          value={code}
          onChange={handleCodeChange}
          options={{
            minimap: { enabled: false },
            fontSize: 15,
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 18 },
          }}
        />
      </div>

      <button className={styles.submitBtn} onClick={handleSubmit} disabled={running}>
        {running ? "Running…" : "Run Tests"}
      </button>

      {result && (
        <div className={styles.result}>
          <p className={`${styles.resultSummary} ${styles[result.type]}`}>{result.summary}</p>
          {result.tests?.length > 0 && (
            <ul className={styles.testList}>
              {result.tests.map((t) => (
                <li key={t.index} className={`${styles.testRow} ${t.passed ? styles.pass : styles.fail}`}>
                  <span>{t.passed ? "✅" : "⚠️"} Test {t.index}</span>
                  <span>
                    {t.error
                      ? escapeHTML(t.error)
                      : t.passed
                        ? `Got ${formatValue(t.value)}`
                        : `Expected ${formatValue(t.expected)} but got ${formatValue(t.value)}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {result.stderr && (
            <details className={styles.logBlock} open>
              <summary>stderr</summary>
              <pre>{result.stderr}</pre>
            </details>
          )}
          {result.stdout && (
            <details className={styles.logBlock}>
              <summary>stdout</summary>
              <pre>{result.stdout}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChallengesPage() {
  return (
    <main className={styles.container}>
      <h1>🐍 Python Coding Challenges</h1>
      <p className={styles.pageSubtitle}>
        Write pure Python functions that match each signature, then run the tests to get instant feedback.
      </p>
      {CHALLENGES.map((ch) => (
        <ChallengeCard key={ch.id} challenge={ch} />
      ))}
    </main>
  );
}
