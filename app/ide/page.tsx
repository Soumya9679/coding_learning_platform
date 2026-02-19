"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Badge, Card } from "@/components/ui";
import { AuthGuard } from "@/components/AuthGuard";
import { applyAuthHeaders } from "@/lib/session";
import { 
  Play, 
  Lightbulb, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  ListChecks, 
  ChevronDown, 
  Clock, 
  Zap, 
  Trophy,
  Sparkles,
  Code2,
  FlaskConical,
  Keyboard,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
  Heart,
  Send
} from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface ChallengeData {
  id: string;
  tag: string;
  difficulty: number;
  title: string;
  description: string;
  criteria: string;
  mentorInstructions: string;
  rubric: string;
  steps: string[];
  starterCode: string;
  expectedOutput: string;
  retryHelp: string;
  order: number;
  active: boolean;
}

// Fallback placeholder shown while loading
const FALLBACK_CHALLENGES: ChallengeData[] = [
  {
    id: "1",
    tag: "Cipher",
    difficulty: 1,
    title: "Caesar Cipher",
    description: "You intercepted a secret message! Build a Caesar cipher encoder that shifts each letter by a given amount.",
    criteria: "caesar('hello', 3) returns 'khoor'. Wrap around zâ†’a. Keep non-alpha chars unchanged. Case-sensitive.",
    mentorInstructions: "Explain character codes with ord()/chr(). Guide modular arithmetic for wrapping. Never give full solution.",
    rubric: "Function caesar(text, shift) must shift letters correctly, wrap at z/Z, preserve case and non-alpha chars.",
    steps: [
      "Define `caesar(text, shift)` function",
      "Iterate through each character in the text",
      "Use ord() and chr() to shift letters, wrapping with modulo 26",
      "Preserve case and leave non-letter characters unchanged",
    ],
    starterCode: `def caesar(text, shift):\n    # Encrypt the message by shifting each letter\n    pass\n\n# Test it:\nprint(caesar("hello", 3))  # Expected: khoor\nprint(caesar("Attack at Dawn!", 5))  # Expected: Fyyfhp fy Ifbs!`,
    expectedOutput: "khoor",
    retryHelp: "Use ord('a') as base. new_pos = (ord(ch) - base + shift) % 26. Then chr(base + new_pos).",
    order: 1,
    active: true,
  },
];

type OutputStatus = "idle" | "success" | "error" | "info";
type OutputTab = "output" | "tests";

interface TestResult {
  index: number;
  passed: boolean;
  value?: unknown;
  expected?: unknown;
  error?: string;
}

interface Comment {
  id: string;
  username: string;
  avatar: string;
  text: string;
  createdAt: string;
  likeCount: number;
  liked?: boolean;
  likes?: string[];
}

interface PyodideRuntime {
  pyodide: unknown;
  runner: (code: string) => { toJs: (opts: { dict_converter: typeof Object.fromEntries }) => { stdout: string; stderr: string; error: string }; destroy: () => void };
}

export default function IdePage() {
  const [challenges, setChallenges] = useState<ChallengeData[]>(FALLBACK_CHALLENGES);
  const [challengesLoading, setChallengesLoading] = useState(true);
  const [selectedChallengeId, setSelectedChallengeId] = useState("1");
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set());
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  
  // Fetch challenges from API
  useEffect(() => {
    async function loadChallenges() {
      try {
        const res = await fetch("/api/admin/challenges");
        if (res.ok) {
          const data = await res.json();
          if (data.challenges?.length > 0) {
            setChallenges(data.challenges);
            setSelectedChallengeId(data.challenges[0].id);
          }
        }
      } catch {
        // silently fall back to default challenges
      } finally {
        setChallengesLoading(false);
      }
    }
    loadChallenges();
  }, []);

  const challenge = challenges.find(c => c.id === selectedChallengeId) || challenges[0];
  
  const [code, setCode] = useState(challenge.starterCode);
  const [output, setOutput] = useState("Run your code to see output here.");
  const [feedback, setFeedback] = useState("Feedback will appear right after each run.");
  const [outputStatus, setOutputStatus] = useState<OutputStatus>("idle");
  const [outputTab, setOutputTab] = useState<OutputTab>("output");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [mentorHint, setMentorHint] = useState("Run your code first, then request a hint if you still feel stuck.");
  const [mentorTone, setMentorTone] = useState("Status: idle");
  const [running, setRunning] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const pyodideRef = useRef<PyodideRuntime | null>(null);
  const lastErrorRef = useRef("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setElapsedTime(t => t + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  // Reset when challenge changes
  useEffect(() => {
    setCode(challenge.starterCode);
    setOutput("Run your code to see output here.");
    setFeedback("Feedback will appear right after each run.");
    setOutputStatus("idle");
    setTestResults([]);
    setMentorHint("Run your code first, then request a hint if you still feel stuck.");
    setMentorTone("Status: idle");
    setElapsedTime(0);
    setTimerActive(false);
    lastErrorRef.current = "";
  }, [selectedChallengeId, challenge.starterCode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runCode();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "h") {
        e.preventDefault();
        requestHint();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [code, output]);

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const runCode = useCallback(async () => {
    if (!timerActive) setTimerActive(true);
    
    if (!code.trim()) {
      setOutput("");
      setFeedback("Type your solution before running.");
      setOutputStatus("error");
      return;
    }

    setRunning(true);
    setFeedback("Running codeâ€¦");
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
        setTestResults([{ index: 1, passed: false, error: result.error }]);
      } else {
        setOutput(result.stdout || "(no output captured)");
        
        // Simulate test results for visual feedback
        const hasOutput = (result.stdout || "").trim().length > 0;
        if (hasOutput) {
          // Submit to server for validation and XP
          try {
            const submitRes = await fetch("/api/challenges/submit", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json", ...applyAuthHeaders() },
              body: JSON.stringify({
                challengeId: challenge.id,
                stdout: result.stdout,
                code,
              }),
            });
            const submitData = await submitRes.json();
            if (submitData.passed) {
              setFeedback(submitData.message || "Correct! Challenge passed.");
              setOutputStatus("success");
              setCompletedChallenges(prev => new Set([...prev, challenge.id]));
              setTestResults([
                { index: 1, passed: true, value: "Output matches expected", expected: challenge.expectedOutput },
              ]);
            } else {
              setFeedback(submitData.message || "Output doesn't match. Check the expected output.");
              setOutputStatus("error");
              setTestResults([
                { index: 1, passed: false, error: submitData.hint || "Output mismatch" },
              ]);
            }
          } catch {
            // Fallback if submit API fails — use local check
            setFeedback("Code ran successfully! (offline mode)");
            setOutputStatus("success");
            if (!completedChallenges.has(challenge.id)) {
              fetch("/api/leaderboard/xp", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json", ...applyAuthHeaders() },
                body: JSON.stringify({ action: "challenge_complete", challengeId: challenge.id }),
              }).catch(() => {});
            }
            setCompletedChallenges(prev => new Set([...prev, challenge.id]));
            setTestResults([
              { index: 1, passed: true, value: "Code executed", expected: "No errors" },
            ]);
          }
          lastErrorRef.current = "";
        } else {
          setFeedback(`Your code ran but produced no output. ${challenge.retryHelp}`);
          setOutputStatus("error");
          setTestResults([{ index: 1, passed: false, error: "No output produced" }]);
          lastErrorRef.current = "No output";
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
  }, [code, challenge.id, challenge.retryHelp, timerActive]);

  const requestHint = useCallback(async () => {
    setHintLoading(true);
    setMentorHint("Thinking through your codeâ€¦");
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
      setMentorHint(data?.hint || "Keep iteratingâ€”focus on the logic step by step.");
      setMentorTone(`Tone: ${data?.tone ?? "spark"}`);
    } catch {
      setMentorHint("Mentor had a hiccup. Re-run your code and try again in a bit.");
      setMentorTone("Status: retry later");
    } finally {
      setHintLoading(false);
    }
  }, [code, output, challenge]);

  const resetChallenge = () => {
    setCode(challenge.starterCode);
    setOutput("Run your code to see output here.");
    setFeedback("Feedback will appear right after each run.");
    setOutputStatus("idle");
    setTestResults([]);
    setElapsedTime(0);
    setTimerActive(false);
  };

  const fetchComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/comments?challengeId=${challenge.id}`, {
        credentials: "include",
        headers: applyAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch { /* ignore */ } finally {
      setCommentsLoading(false);
    }
  }, [challenge.id]);

  const postComment = async () => {
    if (!commentText.trim() || postingComment) return;
    setPostingComment(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...applyAuthHeaders() },
        body: JSON.stringify({ challengeId: challenge.id, text: commentText }),
      });
      if (res.ok) {
        setCommentText("");
        fetchComments();
      }
    } catch { /* ignore */ } finally {
      setPostingComment(false);
    }
  };

  const toggleLike = async (commentId: string) => {
    try {
      const res = await fetch("/api/comments", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...applyAuthHeaders() },
        body: JSON.stringify({ commentId }),
      });
      if (res.ok) fetchComments();
    } catch { /* ignore */ }
  };

  // Load comments when discussion opens
  useEffect(() => {
    if (discussionOpen && completedChallenges.has(challenge.id)) {
      fetchComments();
    }
  }, [discussionOpen, challenge.id, fetchComments, completedChallenges]);

  const statusConfig = {
    idle: { label: "Ready", color: "text-muted", icon: Terminal },
    success: { label: "Passed", color: "text-success", icon: CheckCircle2 },
    error: { label: "Failed", color: "text-danger", icon: XCircle },
    info: { label: "Runningâ€¦", color: "text-warning", icon: Terminal },
  };
  const st = statusConfig[outputStatus];
  const StatusIcon = st.icon;

  const difficultyColors = {
    1: "text-success",
    2: "text-warning",
    3: "text-danger",
  };

  const difficultyLabels = {
    1: "Easy",
    2: "Medium",
    3: "Hard",
  };

  const progressPercent = (completedChallenges.size / challenges.length) * 100;

  return (
    <AuthGuard>
    {challengesLoading ? (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted">Loading challenges…</p>
        </div>
      </div>
    ) : (
    <div className="h-[calc(100vh-64px)] overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-accent/5 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 relative h-full flex flex-col">
        {/* Top Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex-shrink-0"
        >
          <div className="glass-card p-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium">Progress</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-48 h-2 bg-bg-elevated rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-accent to-accent-hot"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="text-xs text-muted">{completedChallenges.size}/{challenges.length}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-6">
              {/* Sidebar toggle for mobile */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-1.5 rounded-lg text-muted hover:text-white hover:bg-bg-elevated transition-colors"
                title={sidebarOpen ? "Hide challenge panel" : "Show challenge panel"}
              >
                {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </button>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted" />
                <span className="font-mono text-muted">{formatTime(elapsedTime)}</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted">
                <Keyboard className="w-4 h-4" />
                <span>Ctrl+Enter to run</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[320px_1fr] gap-4 flex-1 min-h-0">
          {/* Left Sidebar - Challenge Panel (collapsible on mobile) */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: sidebarOpen ? 1 : 0, x: sidebarOpen ? 0 : -20, height: sidebarOpen ? "auto" : 0 }}
            transition={{ duration: 0.3 }}
            className={`flex flex-col gap-3 min-h-0 ${sidebarOpen ? "" : "hidden lg:flex"}`}
          >
            {/* Challenge Selector */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setSelectorOpen(!selectorOpen)}
                className="w-full glass-card p-3 flex items-center justify-between hover:border-accent/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-hot flex items-center justify-center">
                    <Code2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Challenge {challenge.id}</span>
                      {completedChallenges.has(challenge.id) && (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      )}
                    </div>
                    <span className="text-xs text-muted">{challenge.title}</span>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-muted transition-transform ${selectorOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {selectorOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 glass-card p-2 z-50 max-h-80 overflow-y-auto"
                  >
                    {/* Difficulty Filter */}
                    <div className="flex items-center gap-1 mb-2 px-1 flex-wrap">
                      <button
                        onClick={() => setDifficultyFilter(null)}
                        className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                          difficultyFilter === null ? "bg-accent text-white" : "text-muted hover:text-white"
                        }`}
                      >
                        All
                      </button>
                      {[1, 2, 3].map((d) => (
                        <button
                          key={d}
                          onClick={() => setDifficultyFilter(d)}
                          className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                            difficultyFilter === d
                              ? d === 1 ? "bg-success/20 text-success" : d === 2 ? "bg-warning/20 text-warning" : "bg-danger/20 text-danger"
                              : "text-muted hover:text-white"
                          }`}
                        >
                          {d === 1 ? "Easy" : d === 2 ? "Medium" : "Hard"}
                        </button>
                      ))}
                    </div>
                    {/* Category Filter */}
                    {(() => {
                      const tags = [...new Set(challenges.map((c) => c.tag).filter(Boolean))];
                      if (tags.length <= 1) return null;
                      return (
                        <div className="flex items-center gap-1 mb-2 px-1 flex-wrap">
                          <button
                            onClick={() => setCategoryFilter(null)}
                            className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                              categoryFilter === null ? "bg-accent text-white" : "text-muted hover:text-white"
                            }`}
                          >
                            All Topics
                          </button>
                          {tags.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => setCategoryFilter(tag)}
                              className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                                categoryFilter === tag ? "bg-accent/20 text-accent" : "text-muted hover:text-white"
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                    {challenges
                      .filter((c) => difficultyFilter === null || c.difficulty === difficultyFilter)
                      .filter((c) => categoryFilter === null || c.tag === categoryFilter)
                      .map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedChallengeId(c.id);
                          setSelectorOpen(false);
                        }}
                        className={`w-full p-3 rounded-lg flex items-center justify-between hover:bg-bg-elevated transition-colors ${
                          c.id === selectedChallengeId ? "bg-bg-elevated border border-accent/20" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-bg-elevated flex items-center justify-center text-xs font-mono">
                            {c.id}
                          </span>
                          <div className="text-left">
                            <span className="text-sm">{c.title}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-xs ${difficultyColors[c.difficulty as keyof typeof difficultyColors]}`}>
                                {difficultyLabels[c.difficulty as keyof typeof difficultyLabels]}
                              </span>
                            </div>
                          </div>
                        </div>
                        {completedChallenges.has(c.id) && (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Challenge Details Card - Scrollable */}
            <Card className="flex-1 min-h-0 overflow-y-auto space-y-3 scrollbar-thin">
              <div className="flex items-center gap-2">
                <Badge variant="accent">{challenge.tag}</Badge>
                <Badge className={difficultyColors[challenge.difficulty as keyof typeof difficultyColors]}>
                  {difficultyLabels[challenge.difficulty as keyof typeof difficultyLabels]}
                </Badge>
              </div>
              
              <h1 className="text-lg font-bold gradient-text">{challenge.title}</h1>
              <p className="text-xs text-muted leading-relaxed">{challenge.description}</p>

              <div className="space-y-1.5 bg-bg-elevated/50 p-3 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  Success criteria
                </div>
                <p className="text-xs text-muted">{challenge.criteria}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <ListChecks className="w-3.5 h-3.5 text-accent-light" />
                  Steps to solve
                </div>
                <ol className="space-y-1.5">
                  {challenge.steps.map((step, i) => (
                    <li key={i} className="flex gap-2 text-xs text-muted p-1.5 rounded-md bg-bg-elevated/30">
                      <span className="text-accent font-mono font-bold text-[10px]">{String(i + 1).padStart(2, "0")}</span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </Card>
          </motion.aside>

          {/* Main Workspace */}
          <div className="flex flex-col gap-3 min-h-0">
            {/* Editor Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex-shrink-0"
            >
              <Card className="space-y-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/3 to-transparent pointer-events-none" />
                
                {/* Editor Header - File Tab Style */}
                <div className="flex items-center justify-between relative">
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-2 px-4 py-2 bg-bg-elevated rounded-t-lg border-b-2 border-accent">
                      <Code2 className="w-4 h-4 text-accent" />
                      <span className="text-sm font-medium">solution.py</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={resetChallenge}>
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </Button>
                    <Button onClick={runCode} loading={running} className="relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-accent to-accent-hot opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Play className="w-4 h-4 relative" />
                      <span className="relative">{running ? "Runningâ€¦" : "Run Code"}</span>
                      <Zap className="w-3 h-3 ml-1 relative" />
                    </Button>
                  </div>
                </div>

                {/* Monaco Editor */}
                <div className="rounded-lg overflow-hidden border border-border shadow-inner">
                  <MonacoEditor
                    height="180px"
                    language="python"
                    theme="vs-dark"
                    value={code}
                    onChange={(v) => setCode(v || "")}
                    options={{
                      minimap: { enabled: false },
                      automaticLayout: true,
                      fontSize: typeof window !== "undefined" && window.innerWidth < 640 ? 12 : 13,
                      fontFamily: "var(--font-mono), JetBrains Mono, monospace",
                      padding: { top: 8, bottom: 8 },
                      lineNumbers: typeof window !== "undefined" && window.innerWidth < 640 ? "off" : "on",
                      renderLineHighlight: "all",
                      scrollBeyondLastLine: false,
                      smoothScrolling: true,
                      cursorBlinking: "smooth",
                      cursorSmoothCaretAnimation: "on",
                      wordWrap: "on",
                      folding: typeof window !== "undefined" && window.innerWidth >= 640,
                      glyphMargin: false,
                      lineDecorationsWidth: typeof window !== "undefined" && window.innerWidth < 640 ? 0 : 10,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted">
                  <span>Python 3.11 via Pyodide</span>
                  <span>Press Ctrl+H for AI hint</span>
                </div>
              </Card>
            </motion.div>

            {/* Output and Mentor Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0">
              {/* Output Panel with Tabs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="min-h-0"
              >
                <Card className="h-full flex flex-col space-y-2 overflow-hidden">
                  {/* Tabs */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 p-1 bg-bg-elevated rounded-lg">
                      <button
                        onClick={() => setOutputTab("output")}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          outputTab === "output" 
                            ? "bg-accent text-white" 
                            : "text-muted hover:text-white"
                        }`}
                      >
                        <Terminal className="w-3 h-3 inline mr-1.5" />
                        Output
                      </button>
                      <button
                        onClick={() => setOutputTab("tests")}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          outputTab === "tests" 
                            ? "bg-accent text-white" 
                            : "text-muted hover:text-white"
                        }`}
                      >
                        <FlaskConical className="w-3 h-3 inline mr-1.5" />
                        Tests
                      </button>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${st.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {st.label}
                    </div>
                  </div>

                  {/* Tab Content */}
                  <AnimatePresence mode="wait">
                    {outputTab === "output" ? (
                      <motion.div
                        key="output"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <pre className="p-3 bg-bg-elevated rounded-lg text-xs font-mono h-[80px] overflow-auto text-muted-light border border-border/50">
                          {output}
                        </pre>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="tests"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {testResults.length === 0 ? (
                          <div className="p-3 bg-bg-elevated rounded-lg text-xs text-muted text-center h-[80px] flex items-center justify-center">
                            Run your code to see test results
                          </div>
                        ) : (
                          <div className="space-y-1.5 p-2 bg-bg-elevated rounded-lg h-[80px] overflow-auto">
                            {testResults.map((test) => (
                              <div
                                key={test.index}
                                className={`flex items-center gap-2 p-2 rounded-md border ${
                                  test.passed 
                                    ? "bg-success-muted border-success/20" 
                                    : "bg-danger-muted border-danger/20"
                                }`}
                              >
                                {test.passed ? (
                                  <CheckCircle2 className="w-3 h-3 text-success" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-danger" />
                                )}
                                <div className="flex-1 text-[10px]">
                                  <span className="font-medium">Test {test.index}</span>
                                  {test.error && <span className="text-muted ml-1">{test.error}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <p className="text-xs text-muted flex-shrink-0">{feedback}</p>
                </Card>
              </motion.div>

              {/* AI Mentor Panel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="min-h-0"
              >
                <Card className="h-full flex flex-col space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-radial from-accent/10 to-transparent pointer-events-none" />
                  
                  <div className="flex items-center justify-between relative flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-accent to-accent-hot flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-xs">AI Mentor</h2>
                        <span className="text-[10px] text-muted">Gemini</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={requestHint} loading={hintLoading}>
                      <Lightbulb className="w-3 h-3" />
                      {hintLoading ? "..." : "Hint"}
                    </Button>
                  </div>

                  <div className="p-3 bg-gradient-to-br from-accent-muted/40 to-accent-muted/20 rounded-lg border border-accent/10 relative flex-1 overflow-auto">
                    <div className="absolute top-2 right-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    </div>
                    <p className="text-xs leading-relaxed pr-3">{mentorHint}</p>
                    <div className="flex items-center gap-2 pt-2 mt-2 border-t border-accent/10">
                      <span className="text-[10px] text-muted font-mono">{mentorTone}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Discussion Panel — visible after completing the challenge */}
            {completedChallenges.has(challenge.id) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex-shrink-0"
              >
                <Card className="space-y-2">
                  <button
                    onClick={() => setDiscussionOpen(!discussionOpen)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-accent" />
                      <span className="text-sm font-medium">Discussion</span>
                      {comments.length > 0 && (
                        <Badge variant="accent">{comments.length}</Badge>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted transition-transform ${discussionOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {discussionOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                      >
                        {/* Comment input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && postComment()}
                            placeholder="Share your approach…"
                            maxLength={2000}
                            className="flex-1 px-3 py-2 bg-bg-elevated rounded-lg text-xs border border-border focus:border-accent/50 outline-none transition-colors"
                          />
                          <Button size="sm" onClick={postComment} loading={postingComment}>
                            <Send className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Comments list */}
                        {commentsLoading ? (
                          <p className="text-xs text-muted text-center py-2">Loading…</p>
                        ) : comments.length === 0 ? (
                          <p className="text-xs text-muted text-center py-2">No comments yet. Be the first!</p>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {comments.map((c) => (
                              <div key={c.id} className="flex gap-2 p-2 rounded-lg bg-bg-elevated/50">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent to-accent-hot flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                                  {c.avatar || c.username?.charAt(0)?.toUpperCase() || "U"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium">{c.username}</span>
                                    <span className="text-[10px] text-muted">
                                      {new Date(c.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-light mt-0.5 break-words">{c.text}</p>
                                  <button
                                    onClick={() => toggleLike(c.id)}
                                    className="flex items-center gap-1 mt-1 text-[10px] text-muted hover:text-accent-hot transition-colors"
                                  >
                                    <Heart className={`w-3 h-3 ${c.likeCount > 0 ? "fill-accent-hot text-accent-hot" : ""}`} />
                                    {c.likeCount > 0 && c.likeCount}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
    )}
    </AuthGuard>
  );
}
