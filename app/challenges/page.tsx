"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { applyAuthHeaders } from "@/lib/session";
import { Button, Badge, Card, AnimatedSection } from "@/components/ui";
import { AuthGuard } from "@/components/AuthGuard";
import { CheckCircle2, XCircle, AlertTriangle, Play, Code2, Trophy } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface Challenge {
  id: number;
  title: string;
  desc: string;
  hint: string;
  file: string;
}

const CHALLENGES: Challenge[] = [
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

function getSavedDraft(id: number): string {
  try { return localStorage.getItem(`${STORAGE_PREFIX}${id}`) || ""; } catch { return ""; }
}

function persistDraft(id: number, value: string) {
  try { localStorage.setItem(`${STORAGE_PREFIX}${id}`, value); } catch {}
}

function formatValue(value: unknown): string {
  if (typeof value === "string") return `"${value}"`;
  try { return JSON.stringify(value); } catch { return String(value); }
}

interface TestResult {
  index: number;
  passed: boolean;
  value?: unknown;
  expected?: unknown;
  error?: string;
}

interface SubmitResult {
  summary: string;
  type: "pass" | "fail" | "pending";
  tests?: TestResult[];
  stdout?: string;
  stderr?: string;
}

function ChallengeCard({ challenge, index }: { challenge: Challenge; index: number }) {
  const [code, setCode] = useState(() => getSavedDraft(challenge.id));
  const [statusLabel, setStatusLabel] = useState("Not attempted");
  const [statusVariant, setStatusVariant] = useState<"neutral" | "success" | "danger" | "warning">("neutral");
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [running, setRunning] = useState(false);

  const handleCodeChange = useCallback((value: string | undefined) => {
    setCode(value || "");
    persistDraft(challenge.id, value || "");
  }, [challenge.id]);

  const handleSubmit = async () => {
    if (!code.trim()) {
      setResult({ summary: "Please write some code before running the tests.", type: "fail" });
      setStatusLabel("No code");
      setStatusVariant("danger");
      return;
    }

    setRunning(true);
    setStatusLabel("Running tests…");
    setStatusVariant("warning");
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
        setStatusLabel("Missing function");
        setStatusVariant("danger");
        setResult({ summary: `Define the function "${missingEntryPoint}" exactly as described.`, type: "fail" });
        return;
      }

      if (setupError) {
        setStatusLabel("Crashed");
        setStatusVariant("danger");
        setResult({ summary: `Your code crashed: ${setupError}`, type: "fail", stderr });
        return;
      }

      const failedCount = tests.filter((t: TestResult) => !t.passed).length;
      setStatusLabel(passed ? "All passed" : "Needs work");
      setStatusVariant(passed ? "success" : "danger");
      setResult({
        summary: tests.length
          ? passed ? "All tests passed!" : `${failedCount} of ${tests.length} tests failed.`
          : "Tests did not return any results.",
        type: passed ? "pass" : "fail",
        tests, stdout, stderr,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unexpected error.";
      setStatusLabel("Error");
      setStatusVariant("danger");
      setResult({ summary: msg, type: "fail" });
    } finally {
      setRunning(false);
    }
  };

  return (
    <AnimatedSection delay={index * 0.05}>
      <Card className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-muted">#{String(challenge.id).padStart(2, "0")}</span>
              <h3 className="text-lg font-semibold">{challenge.title}</h3>
            </div>
            <p className="text-sm text-muted">{challenge.desc}</p>
          </div>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>

        <div className="text-sm text-muted-light bg-bg-elevated/50 px-4 py-3 rounded-xl border border-border" dangerouslySetInnerHTML={{ __html: challenge.hint }} />

        <div className="rounded-xl overflow-hidden border border-border">
          <MonacoEditor
            height="260px"
            language="python"
            theme="vs-dark"
            value={code}
            onChange={handleCodeChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
              padding: { top: 12, bottom: 18 },
              fontFamily: "var(--font-mono), JetBrains Mono, monospace",
            }}
          />
        </div>

        <Button onClick={handleSubmit} loading={running} variant="primary">
          <Play className="w-4 h-4" />
          {running ? "Running…" : "Run Tests"}
        </Button>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className={`flex items-center gap-2 text-sm font-medium ${result.type === "pass" ? "text-success" : result.type === "fail" ? "text-danger" : "text-warning"}`}>
                {result.type === "pass" ? <CheckCircle2 className="w-4 h-4" /> : result.type === "fail" ? <XCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {result.summary}
              </div>

              {result.tests && result.tests.length > 0 && (
                <div className="space-y-1.5">
                  {result.tests.map((t) => (
                    <div key={t.index} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono ${t.passed ? "bg-success-muted/50 text-success" : "bg-danger-muted/50 text-danger"}`}>
                      <span>{t.passed ? "✓" : "✗"} Test {t.index}</span>
                      <span className="text-right">
                        {t.error
                          ? t.error
                          : t.passed
                            ? `Got ${formatValue(t.value)}`
                            : `Expected ${formatValue(t.expected)} got ${formatValue(t.value)}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {result.stderr && (
                <details className="text-xs">
                  <summary className="text-muted cursor-pointer hover:text-white">stderr</summary>
                  <pre className="mt-2 p-3 bg-bg-elevated rounded-lg text-danger/80 overflow-x-auto">{result.stderr}</pre>
                </details>
              )}
              {result.stdout && (
                <details className="text-xs">
                  <summary className="text-muted cursor-pointer hover:text-white">stdout</summary>
                  <pre className="mt-2 p-3 bg-bg-elevated rounded-lg text-muted-light overflow-x-auto">{result.stdout}</pre>
                </details>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </AnimatedSection>
  );
}

export default function ChallengesPage() {
  return (
    <AuthGuard>
    <div className="min-h-screen">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 relative">
        <AnimatedSection>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center">
                <Trophy className="w-5 h-5 text-accent-light" />
              </div>
              <h1 className="text-heading font-bold">Coding Challenges</h1>
            </div>
            <p className="text-muted text-lg max-w-2xl">
              Write pure Python functions that match each signature, then run the tests for instant feedback.
            </p>
          </div>
        </AnimatedSection>

        <div className="space-y-6">
          {CHALLENGES.map((ch, idx) => (
            <ChallengeCard key={ch.id} challenge={ch} index={idx} />
          ))}
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
