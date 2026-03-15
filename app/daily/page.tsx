"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Badge, Button, toast } from "@/components/ui";
import { AuthGuard } from "@/components/AuthGuard";
import { applyAuthHeaders } from "@/lib/session";
import { runPythonInWorker } from "@/hooks/usePyodide";
import type { DailyChallenge } from "@/lib/types";
import {
  Play, Terminal, CheckCircle2, XCircle, Clock, Zap, Sun, Moon,
  Flame, CalendarCheck, Loader2, RotateCcw, Trophy, ChevronRight,
} from "lucide-react";

const CodeEditor = dynamic(() => import("@/components/CodeEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-[#1e1e1e] rounded-lg" style={{ height: "320px" }}>
      <div className="flex items-center gap-2 text-muted text-sm">
        <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        Loading editor…
      </div>
    </div>
  ),
});

interface DailyApiResponse {
  daily: DailyChallenge;
  weekly: DailyChallenge;
}

export default function DailyPage() {
  const [data, setData] = useState<DailyApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"daily" | "weekly">("daily");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ correct: boolean; xpAwarded: number; levelUp?: { title: string } } | null>(null);

  const fetchChallenges = useCallback(async () => {
    try {
      const res = await fetch("/api/daily", { credentials: "include", headers: applyAuthHeaders() });
      if (res.ok) {
        const json: DailyApiResponse = await res.json();
        setData(json);
        setCode(json.daily.starterCode || "");
      }
    } catch {
      toast.error("Failed to load challenges");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChallenges(); }, [fetchChallenges]);

  const challenge = useMemo(() => {
    if (!data) return null;
    return activeTab === "daily" ? data.daily : data.weekly;
  }, [data, activeTab]);

  // When switching tabs, load starter code
  useEffect(() => {
    if (challenge && !submitResult) {
      setCode(challenge.starterCode || "");
      setOutput("");
      setSubmitResult(null);
    }
  }, [activeTab, challenge]);

  const timeLeft = useMemo(() => {
    if (!challenge) return "";
    const now = new Date();
    const expires = new Date(challenge.expiresAt);
    const diff = expires.getTime() - now.getTime();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }, [challenge]);

  /* ─── Run Code Locally ─────────────────────────────── */
  const handleRun = async () => {
    if (!code.trim()) return;
    setRunning(true);
    setOutput("");
    try {
      const result = await runPythonInWorker(code, 10000);
      setOutput(result.stdout || result.stderr || result.error || "(no output)");
    } catch {
      setOutput("Error running code");
    } finally {
      setRunning(false);
    }
  };

  /* ─── Submit Solution ──────────────────────────────── */
  const handleSubmit = async () => {
    if (!challenge || !code.trim()) return;
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const res = await fetch("/api/daily", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...applyAuthHeaders() },
        body: JSON.stringify({ challengeId: challenge.id, code, type: challenge.type }),
      });
      const json = await res.json();
      if (res.ok) {
        setSubmitResult({ correct: json.correct, xpAwarded: json.xpAwarded, levelUp: json.levelUp });
        if (json.correct) {
          toast.success(`Correct! +${json.xpAwarded} XP`);
          // Refresh to get updated completion status
          fetchChallenges();
        } else {
          toast.error("Incorrect output. Try again!");
        }
      } else {
        toast.error(json.error || "Submission failed");
      }
    } catch {
      toast.error("Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-bg pt-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AuthGuard>
    );
  }

  if (!data || !challenge) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-bg pt-24 flex items-center justify-center text-muted">
          No challenges available today.
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-bg pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* ── Hero Header with Gradient ─────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/10 via-bg-card to-purple-600/10 border border-border p-6 sm:p-8 mb-6"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-1">Daily Challenges</h1>
                <p className="text-sm text-muted">Sharpen your Python skills every day for bonus XP</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg/60 border border-border text-xs">
                  <Clock className="w-3.5 h-3.5 text-accent" />
                  <span className="text-muted-light font-medium">{timeLeft} left</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg/60 border border-border text-xs">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-muted-light font-medium">{challenge.xpMultiplier}x XP</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Tab Toggle ────────────────────────────── */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("daily")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "daily"
                  ? "bg-accent text-white shadow-lg shadow-accent/20"
                  : "bg-bg-card text-muted hover:text-white border border-border"
              }`}
            >
              <Sun className="w-4 h-4" /> Daily
              {data.daily.completed && <CheckCircle2 className="w-3.5 h-3.5 text-green-300" />}
            </button>
            <button
              onClick={() => setActiveTab("weekly")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === "weekly"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                  : "bg-bg-card text-muted hover:text-white border border-border"
              }`}
            >
              <CalendarCheck className="w-4 h-4" /> Weekly
              {data.weekly.completed && <CheckCircle2 className="w-3.5 h-3.5 text-green-300" />}
            </button>
          </div>

          {/* ── Challenge Info Banner ─────────────────── */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className={`p-5 border-l-4 ${activeTab === "daily" ? "border-l-accent" : "border-l-purple-500"}`}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant={activeTab === "daily" ? "accent" : "info"} className="text-[10px] uppercase">
                      {challenge.type}
                    </Badge>
                    <Badge
                      variant={challenge.difficulty <= 1 ? "success" : challenge.difficulty === 2 ? "warning" : "danger"}
                      className="text-[10px]"
                    >
                      {challenge.difficulty <= 1 ? "Easy" : challenge.difficulty === 2 ? "Medium" : "Hard"}
                    </Badge>
                    <span className="text-xs text-muted">{challenge.completedBy} solved</span>
                  </div>
                  <h2 className="text-lg font-bold mb-1.5">{challenge.title}</h2>
                  <p className="text-sm text-muted-light leading-relaxed">{challenge.description}</p>
                </div>
                <div className="sm:w-56 flex-shrink-0">
                  <div className="bg-bg rounded-xl p-3">
                    <h3 className="text-xs font-semibold mb-1.5 flex items-center gap-1.5 text-accent">
                      <Terminal className="w-3.5 h-3.5" /> Expected Output
                    </h3>
                    <code className="text-xs font-mono text-green-400 whitespace-pre-wrap block">
                      {challenge.expectedOutput}
                    </code>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* ── Editor + Output (Stacked) ─────────────── */}
          <div className="space-y-4">
            {/* Editor */}
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg-elevated">
                <span className="text-xs font-medium text-muted flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  solution.py
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setCode(challenge.starterCode || ""); setOutput(""); setSubmitResult(null); }}
                  className="text-xs gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </Button>
              </div>
              <CodeEditor
                value={code}
                onChange={setCode}
                height="350px"
              />
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleRun}
                disabled={running || !code.trim()}
                className="flex-1 gap-2"
              >
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {running ? "Running..." : "Run Code"}
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={submitting || challenge.completed || !code.trim()}
                className="flex-1 gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {challenge.completed ? "Already Completed" : submitting ? "Checking..." : "Submit Solution"}
              </Button>
            </div>

            {/* Output / Result */}
            <Card className="p-4">
              <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-accent" /> Output
              </h3>
              <div className="bg-bg rounded-lg p-3 min-h-[80px] font-mono text-xs whitespace-pre-wrap">
                {submitResult ? (
                  <div className="flex items-start gap-2">
                    {submitResult.correct ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-green-400 font-bold">Correct!</span>
                          <span className="text-muted ml-2">+{submitResult.xpAwarded} XP earned</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-red-400 font-bold">Incorrect</span>
                          <span className="text-muted block mt-1">
                            Your output doesn&apos;t match the expected result. Check your logic and try again.
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                ) : output ? (
                  <span className="text-muted-light">{output}</span>
                ) : (
                  <span className="text-muted">Run or submit your code to see output...</span>
                )}
              </div>
            </Card>

            {/* Level Up Notice */}
            <AnimatePresence>
              {submitResult?.levelUp && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className="p-4 border-amber-400/30 bg-amber-400/5">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-8 h-8 text-amber-400" />
                      <div>
                        <p className="text-sm font-bold text-amber-400">Level Up!</p>
                        <p className="text-xs text-muted">You reached {submitResult.levelUp.title}!</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
