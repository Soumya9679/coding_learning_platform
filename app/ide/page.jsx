"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import styles from "@/styles/ide.module.css";

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

export default function IdePage() {
  const [code, setCode] = useState(challenge.starterCode);
  const [output, setOutput] = useState("Run your code to see output here.");
  const [feedback, setFeedback] = useState("Feedback will appear right after each run.");
  const [outputStatus, setOutputStatus] = useState("idle");
  const [mentorHint, setMentorHint] = useState("Run your code first, then request a hint if you still feel stuck. Gemini will give you gentle nudges—not full solutions.");
  const [mentorTone, setMentorTone] = useState("Status: idle");
  const [running, setRunning] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const pyodideRef = useRef(null);
  const lastErrorRef = useRef("");

  useEffect(() => {
    let cancelled = false;
    async function loadPyodide() {
      try {
        /* Load Pyodide via script tag to avoid webpack bundling issues */
        if (!window.loadPyodide) {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }
        const load = window.loadPyodide;
        const pyodide = await load({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/" });
        await pyodide.runPythonAsync(`
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
          pyodideRef.current = {
            pyodide,
            runner: pyodide.globals.get("pulse_run"),
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
    } catch (error) {
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

  return (
    <main className={styles.practiceShell}>
      <section className={`${styles.panel} ${styles.challengePanel}`}>
        <p className="tag">{challenge.tag}</p>
        <h1>{challenge.title}</h1>
        <p>{challenge.description}</p>
        <div className={styles.criteria}>
          <h3>Success criteria</h3>
          <p>{challenge.criteria}</p>
        </div>
        <ul className={styles.steps}>
          {challenge.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ul>
      </section>

      <div className={styles.workspacePanels}>
        <section className={`${styles.panel} ${styles.editorPanel}`}>
          <div className={styles.panelHeading}>
            <div>
              <p className="tag">Code editor</p>
              <h2>Write your answer</h2>
            </div>
            <button className="solid-btn" onClick={runCode} disabled={running}>
              {running ? "Running…" : "Run Code"}
            </button>
          </div>
          <div className={styles.editorSurface}>
            <MonacoEditor
              height="320px"
              language="python"
              theme="vs-dark"
              value={code}
              onChange={(v) => setCode(v || "")}
              options={{
                minimap: { enabled: false },
                automaticLayout: true,
              }}
            />
          </div>
          <p className={styles.note}>
            We never auto-correct your work. If something breaks, read the feedback, tweak your
            code, and try again.
          </p>
        </section>

        <div className={styles.feedbackStack}>
          <section className={`${styles.panel} ${styles.outputPanel}`}>
            <div className={styles.outputHeader}>
              <h2>Output</h2>
              <span className={`${styles.statusPill} ${styles[outputStatus]}`}>
                {outputStatus === "success" ? "Correct" : outputStatus === "error" ? "Needs work" : "Idle"}
              </span>
            </div>
            <pre className={styles.outputText}>{output}</pre>
            <p>{feedback}</p>
          </section>

          <section className={`${styles.panel} ${styles.mentorPanel}`}>
            <div className={styles.mentorHeader}>
              <div>
                <p className="tag">AI mentor</p>
                <h2>Hint request</h2>
              </div>
              <button className="ghost-btn" onClick={requestHint} disabled={hintLoading}>
                {hintLoading ? "Thinking…" : "Ask for hint"}
              </button>
            </div>
            <article className={styles.mentorCard}>
              <p>{mentorHint}</p>
              <span className={styles.mentorTone}>{mentorTone}</span>
            </article>
          </section>
        </div>
      </div>
    </main>
  );
}
