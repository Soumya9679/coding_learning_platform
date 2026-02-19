"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Button, Badge, Card } from "@/components/ui";
import { AuthGuard } from "@/components/AuthGuard";
import { Play, Lightbulb, Terminal, CheckCircle2, XCircle, BookOpen, ListChecks } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const challenge = {
  id: "loop-basics",
  tag: "Quest · Beginner",
  title: "Make Byte wave three times",
  description: "Use a loop to print a short status message for each wave. Keep the format identical on each line.",
  criteria: "You should see exactly three lines that increment from 0 to 2.",
  mentorInstructions: "Give 1-2 upbeat hints, point out mistakes, never share final code.",
  rubric: "Learner must print 'PulsePy >>>' followed by 0, 1, 2 on separate lines using a loop.",
  steps: [
    "Create a for loop that runs three times",
    "Inside the loop, print the label `PulsePy >>>` and the current counter",
    "Keep the spacing and capitalization consistent",
  ],
  starterCode: `# Print PulsePy >>> 0, 1, 2 using a loop\nfor wave in range(3):\n    print("PulsePy >>>", wave)`,
  expectedOutput: "PulsePy >>> 0\nPulsePy >>> 1\nPulsePy >>> 2",
  retryHelp: "Aim for three lines, each ending with the numbers 0, 1, and 2 respectively.",
};

type OutputStatus = "idle" | "success" | "error" | "info";

interface PyodideRuntime {
  pyodide: unknown;
  runner: (code: string) => { toJs: (opts: { dict_converter: typeof Object.fromEntries }) => { stdout: string; stderr: string; error: string }; destroy: () => void };
}

export default function IdePage() {
  const [code, setCode] = useState(challenge.starterCode);
  const [output, setOutput] = useState("Run your code to see output here.");
  const [feedback, setFeedback] = useState("Feedback will appear right after each run.");
  const [outputStatus, setOutputStatus] = useState<OutputStatus>("idle");
  const [mentorHint, setMentorHint] = useState("Run your code first, then request a hint if you still feel stuck.");
  const [mentorTone, setMentorTone] = useState("Status: idle");
  const [running, setRunning] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const pyodideRef = useRef<PyodideRuntime | null>(null);
  const lastErrorRef = useRef("");

  useEffect(() => {
    let cancelled = false;
    async function loadPyodide() {
      try {
        if (!(window as unknown as Record<string, unknown>).loadPyodide) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }
        const load = (window as unknown as Record<string, unknown>).loadPyodide as (opts: { indexURL: string }) => Promise<unknown>;
        const pyodide: Record<string, unknown> = await load({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/" }) as Record<string, unknown>;
        const runPythonAsync = pyodide.runPythonAsync as (code: string) => Promise<unknown>;
        await runPythonAsync(`
from io import StringIO
import sys, traceback

def pulse_run(source: str):
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
        if (!cancelled) {
          const globals = pyodide.globals as { get: (name: string) => unknown };
          pyodideRef.current = {
            pyodide,
            runner: globals.get("pulse_run") as PyodideRuntime["runner"],
          };
        }
      } catch (error) {
        console.error("Pyodide failed to initialize", error);
      }
    }
    loadPyodide();
    return () => { cancelled = true; };
  }, []);

  const runCode = useCallback(async () => {
    if (!code.trim()) {
      setOutput("");
      setFeedback("Type your solution before running.");
      setOutputStatus("error");
      return;
    }

    setRunning(true);
    setFeedback("Running code…");
    setOutputStatus("info");

    const runtime = pyodideRef.current;
    if (!runtime) {
      setFeedback("Python runtime is still loading. Please try again in a moment.");
      setOutputStatus("info");
      setRunning(false);
      return;
    }

    try {
      const proxy = runtime.runner(code);
      const result = proxy.toJs({ dict_converter: Object.fromEntries });
      proxy.destroy();

      if (result.error) {
        setOutput(result.stdout || result.stderr);
        setFeedback(`${result.error}. Check your syntax and try again.`);
        setOutputStatus("error");
        lastErrorRef.current = result.error;
      } else {
        const normalizedOutput = (result.stdout || "").trim();
        const expected = challenge.expectedOutput.trim();
        setOutput(result.stdout || "(no output captured)");

        if (normalizedOutput === expected) {
          setFeedback("Great work! Your output matches the goal. Try remixing the code to explore.");
          setOutputStatus("success");
          lastErrorRef.current = "";
        } else {
          setFeedback(`Your output doesn't match yet. ${challenge.retryHelp}`);
          setOutputStatus("error");
          lastErrorRef.current = "Output mismatch";
        }
      }
    } catch {
      setOutput("");
      setFeedback("Unexpected error. Refresh the page and try again.");
      setOutputStatus("error");
      lastErrorRef.current = "Runtime failure";
    } finally {
      setRunning(false);
    }
  }, [code]);

  const requestHint = useCallback(async () => {
    setHintLoading(true);
    setMentorHint("Thinking through your code…");
    setMentorTone("Status: contacting mentor");

    try {
      const res = await fetch("/api/mentorHint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          code,
          challengeTitle: challenge.title,
          description: challenge.description,
          rubric: challenge.rubric,
          mentorInstructions: challenge.mentorInstructions,
          stdout: output,
          stderr: lastErrorRef.current,
          expectedOutput: challenge.expectedOutput,
        }),
      });

      const data = await res.json();
      setMentorHint(data?.hint || "Keep iterating—focus on matching the spacing and count.");
      setMentorTone(`Tone: ${data?.tone ?? "spark"}`);
    } catch {
      setMentorHint("Mentor had a hiccup. Re-run your code and try again in a bit.");
      setMentorTone("Status: retry later");
    } finally {
      setHintLoading(false);
    }
  }, [code, output]);

  const statusConfig = {
    idle: { label: "Idle", color: "text-muted", icon: Terminal },
    success: { label: "Correct", color: "text-success", icon: CheckCircle2 },
    error: { label: "Needs work", color: "text-danger", icon: XCircle },
    info: { label: "Running…", color: "text-warning", icon: Terminal },
  };
  const st = statusConfig[outputStatus];
  const StatusIcon = st.icon;

  return (
    <AuthGuard>
    <div className="min-h-screen">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className="grid lg:grid-cols-[340px_1fr] gap-6">
          {/* Challenge Panel */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="sticky top-24 space-y-5">
              <Badge variant="accent">{challenge.tag}</Badge>
              <h1 className="text-xl font-bold">{challenge.title}</h1>
              <p className="text-sm text-muted leading-relaxed">{challenge.description}</p>

              <div className="space-y-2 bg-bg-elevated/50 p-4 rounded-xl border border-border">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  Success criteria
                </div>
                <p className="text-xs text-muted">{challenge.criteria}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ListChecks className="w-4 h-4 text-accent-light" />
                  Steps
                </div>
                <ol className="space-y-2 text-xs text-muted">
                  {challenge.steps.map((step, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-accent font-mono">{String(i + 1).padStart(2, "0")}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </Card>
          </motion.aside>

          {/* Workspace */}
          <div className="space-y-6">
            {/* Editor */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral">Code editor</Badge>
                    <h2 className="text-lg font-semibold">Write your answer</h2>
                  </div>
                  <Button onClick={runCode} loading={running}>
                    <Play className="w-4 h-4" />
                    {running ? "Running…" : "Run Code"}
                  </Button>
                </div>

                <div className="rounded-xl overflow-hidden border border-border">
                  <MonacoEditor
                    height="320px"
                    language="python"
                    theme="vs-dark"
                    value={code}
                    onChange={(v) => setCode(v || "")}
                    options={{
                      minimap: { enabled: false },
                      automaticLayout: true,
                      fontSize: 14,
                      fontFamily: "var(--font-mono), JetBrains Mono, monospace",
                      padding: { top: 12, bottom: 12 },
                    }}
                  />
                </div>

                <p className="text-xs text-muted">
                  We never auto-correct your work. Read the feedback, tweak your code, and try again.
                </p>
              </Card>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Output */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="h-full space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Output</h2>
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${st.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {st.label}
                    </div>
                  </div>
                  <pre className="p-4 bg-bg-elevated rounded-xl text-sm font-mono min-h-[100px] overflow-x-auto text-muted-light">
                    {output}
                  </pre>
                  <p className="text-sm text-muted">{feedback}</p>
                </Card>
              </motion.div>

              {/* Mentor */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="h-full space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="accent">AI mentor</Badge>
                      <h2 className="font-semibold">Hint</h2>
                    </div>
                    <Button variant="ghost" size="sm" onClick={requestHint} loading={hintLoading}>
                      <Lightbulb className="w-4 h-4" />
                      {hintLoading ? "Thinking…" : "Ask for hint"}
                    </Button>
                  </div>
                  <div className="p-4 bg-accent-muted/30 rounded-xl border border-accent/10 space-y-3">
                    <p className="text-sm text-muted-light leading-relaxed">{mentorHint}</p>
                    <span className="text-xs text-muted font-mono">{mentorTone}</span>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
