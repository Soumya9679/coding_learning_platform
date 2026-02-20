"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuthStore } from "@/lib/store";
import { applyAuthHeaders } from "@/lib/session";
import { AnimatedSection, toast } from "@/components/ui";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { runPythonInWorker } from "@/hooks/usePyodide";
import type { LobbyDuel, MyDuel, ActiveDuel } from "@/lib/types";
import {
  Swords,
  Plus,
  Clock,
  Trophy,
  Play,
  Loader2,
  X,
  Send,
  Users,
  Zap,
  ChevronLeft,
  Timer,
  Crown,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const diffColors: Record<number, string> = {
  1: "text-emerald-400",
  2: "text-amber-400",
  3: "text-red-400",
};

const diffLabels: Record<number, string> = {
  1: "Easy",
  2: "Medium",
  3: "Hard",
};

export default function DuelsPage() {
  const router = useRouter();
  const { isAuth, user, isLoading } = useAuthStore();
  const [view, setView] = useState<"lobby" | "duel">("lobby");
  const [lobbyDuels, setLobbyDuels] = useState<LobbyDuel[]>([]);
  const [myDuels, setMyDuels] = useState<MyDuel[]>([]);
  const [activeDuel, setActiveDuel] = useState<ActiveDuel | null>(null);
  const [activeDuelId, setActiveDuelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tab, setTab] = useState<"open" | "mine">("open");
  const [timeLimit, setTimeLimit] = useState(300);
  const [showCreate, setShowCreate] = useState(false);

  // Duel arena state
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuth) router.push("/login");
  }, [isAuth, isLoading, router]);

  // Fetch lobby and my duels
  const fetchLobby = useCallback(async () => {
    try {
      const [lobbyRes, mineRes] = await Promise.all([
        fetch("/api/duels?mode=lobby", { headers: applyAuthHeaders(), credentials: "include" }),
        fetch("/api/duels?mode=mine", { headers: applyAuthHeaders(), credentials: "include" }),
      ]);
      if (lobbyRes.ok) {
        const data = await lobbyRes.json();
        setLobbyDuels(data.duels || []);
      }
      if (mineRes.ok) {
        const data = await mineRes.json();
        setMyDuels(data.duels || []);
      }
    } catch (e) {
      console.error("Failed to fetch duels:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuth) fetchLobby();
  }, [isAuth, fetchLobby]);

  // Poll active duel state
  const fetchDuelState = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/duels?mode=duel&id=${id}`, {
        headers: applyAuthHeaders(),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setActiveDuel(data.duel);
        if (data.duel.status === "finished") {
          // Stop polling and timer when done
          if (pollRef.current) clearInterval(pollRef.current);
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }
    } catch (e) {
      console.error("Failed to fetch duel:", e);
    }
  }, []);

  // Create duel
  const handleCreate = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/duels", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...applyAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ action: "create", timeLimit }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveDuelId(data.duelId);
        setView("duel");
        setShowCreate(false);
        await fetchDuelState(data.duelId);
        // Poll for opponent
        pollRef.current = setInterval(() => fetchDuelState(data.duelId), 3000);
      } else {
        toast.error(data.error || "Failed to create duel");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionLoading(false);
    }
  };

  // Join duel
  const handleJoin = async (duelId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/duels", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...applyAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ action: "join", duelId }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveDuelId(duelId);
        setView("duel");
        await fetchDuelState(duelId);
        // Poll for state changes
        pollRef.current = setInterval(() => fetchDuelState(duelId), 3000);
      } else {
        toast.error(data.error || "Failed to join");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel duel
  const handleCancel = async (duelId: string) => {
    try {
      await fetch("/api/duels", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...applyAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ action: "cancel", duelId }),
      });
      setView("lobby");
      setActiveDuel(null);
      setActiveDuelId(null);
      if (pollRef.current) clearInterval(pollRef.current);
      fetchLobby();
    } catch {
      toast.error("Network error");
    }
  };

  // Start timer when duel becomes active
  useEffect(() => {
    if (activeDuel?.status === "active" && activeDuel.startedAt && !submitted) {
      const started = new Date(activeDuel.startedAt).getTime();
      const limit = (activeDuel.timeLimit || 300) * 1000;

      // Set initial code
      if (!code && activeDuel.starterCode) {
        setCode(activeDuel.myCode || activeDuel.starterCode);
      }

      const updateTimer = () => {
        const elapsed = Date.now() - started;
        const remaining = Math.max(0, Math.ceil((limit - elapsed) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0) {
          // Auto-submit if time is up
          handleSubmit(true);
        }
      };
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDuel?.status, activeDuel?.startedAt, submitted]);

  // Run code in Web Worker with timeout
  const handleRun = async () => {
    setRunning(true);
    setOutput("");
    try {
      const result = await runPythonInWorker(code, 10_000);
      if (result.error) {
        setOutput(`Error: ${result.error}\n`);
      } else {
        setOutput(result.stdout || "(no output)");
      }
    } catch (err) {
      setOutput(`Error: ${err}\n`);
    } finally {
      setRunning(false);
    }
  };

  // Submit solution
  const handleSubmit = async (autoTimeout = false) => {
    if (submitted || !activeDuelId) return;

    let finalOutput = output;
    // If not run yet, run first
    if (!finalOutput && !autoTimeout) {
      await handleRun();
      // Wait a tick since output updates async
      await new Promise((r) => setTimeout(r, 500));
      finalOutput = output;
    }

    const passed = finalOutput.trim() === activeDuel?.expectedOutput?.trim();
    setSubmitted(true);

    try {
      await fetch("/api/duels", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...applyAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({
          action: "submit",
          duelId: activeDuelId,
          code,
          output: finalOutput,
          passed: autoTimeout ? false : passed,
        }),
      });
      // Refresh duel state
      await fetchDuelState(activeDuelId);
    } catch {
      toast.error("Failed to submit");
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Back to lobby
  const backToLobby = () => {
    setView("lobby");
    setActiveDuel(null);
    setActiveDuelId(null);
    setCode("");
    setOutput("");
    setSubmitted(false);
    setTimeLeft(0);
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    fetchLobby();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // ─── DUEL ARENA VIEW ─────────────────
  if (view === "duel" && activeDuel) {
    const isCreator = activeDuel.creatorId === user?.uid;
    const opponentName = isCreator ? activeDuel.opponentUsername : activeDuel.creatorUsername;
    const myPassed = isCreator ? activeDuel.creatorPassed : activeDuel.opponentPassed;
    const oppPassed = isCreator ? activeDuel.opponentPassed : activeDuel.creatorPassed;
    const myFinished = isCreator ? activeDuel.creatorFinishedAt : activeDuel.opponentFinishedAt;
    const oppFinished = isCreator ? activeDuel.opponentFinishedAt : activeDuel.creatorFinishedAt;
    const iWon = activeDuel.winnerId === user?.uid;

    return (
      <div className="min-h-screen bg-bg pt-20 px-4 pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Duel header */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={backToLobby} className="flex items-center gap-1.5 text-muted hover:text-white transition-colors text-sm">
              <ChevronLeft className="w-4 h-4" /> Back to Lobby
            </button>
            <div className="flex items-center gap-3">
              {activeDuel.status === "active" && (
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-sm font-bold",
                  timeLeft <= 30 ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-bg-elevated text-white"
                )}>
                  <Timer className="w-4 h-4" />
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                </div>
              )}
              <span className={cn(
                "px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider",
                activeDuel.status === "waiting" && "bg-amber-500/20 text-amber-400",
                activeDuel.status === "active" && "bg-emerald-500/20 text-emerald-400",
                activeDuel.status === "finished" && "bg-accent/20 text-accent-light",
              )}>
                {activeDuel.status}
              </span>
            </div>
          </div>

          {/* Waiting for opponent */}
          {activeDuel.status === "waiting" && (
            <AnimatedSection className="text-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-accent mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Waiting for an opponent…</h2>
              <p className="text-muted mb-6">Share this page or wait for someone to join from the lobby.</p>
              <button
                onClick={() => handleCancel(activeDuel.id)}
                className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
              >
                Cancel Duel
              </button>
            </AnimatedSection>
          )}

          {/* Active duel */}
          {activeDuel.status === "active" && (
            <div className="space-y-4">
              {/* Players bar */}
              <div className="flex items-center justify-between bg-bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                    {user?.username?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{user?.username} <span className="text-muted">(you)</span></p>
                    {myFinished ? (
                      <span className="text-xs text-emerald-400">Submitted</span>
                    ) : (
                      <span className="text-xs text-muted">Coding…</span>
                    )}
                  </div>
                </div>
                <Swords className="w-6 h-6 text-accent" />
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold text-sm">{opponentName}</p>
                    {oppFinished ? (
                      <span className="text-xs text-emerald-400">Submitted</span>
                    ) : (
                      <span className="text-xs text-muted">Coding…</span>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-accent-hot/20 flex items-center justify-center text-accent-hot font-bold text-sm">
                    {opponentName?.[0]?.toUpperCase() || "?"}
                  </div>
                </div>
              </div>

              {/* Challenge info */}
              <div className="bg-bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold">{activeDuel.challengeTitle}</h3>
                  <span className={cn("text-xs font-semibold", diffColors[activeDuel.difficulty] || "text-muted")}>
                    {diffLabels[activeDuel.difficulty] || "?"}
                  </span>
                </div>
                <p className="text-sm text-muted">{activeDuel.challengeDescription}</p>
                <p className="text-xs text-muted mt-2">Expected output: <code className="text-accent-light">{activeDuel.expectedOutput}</code></p>
              </div>

              {/* Code editor + output */}
              {!submitted ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-muted">Your Code</span>
                      <div className="flex gap-2">
                        <button
                          onClick={handleRun}
                          disabled={running}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                          Run
                        </button>
                        <button
                          onClick={() => handleSubmit(false)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/20 text-accent-light hover:bg-accent/30 text-xs font-medium transition-colors"
                        >
                          <Send className="w-3 h-3" /> Submit
                        </button>
                      </div>
                    </div>
                    <MonacoEditor
                      height="320px"
                      defaultLanguage="python"
                      theme="vs-dark"
                      value={code}
                      onChange={(val) => setCode(val || "")}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        fontFamily: "var(--font-mono), monospace",
                        lineNumbers: "on",
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                        padding: { top: 12 },
                        renderLineHighlight: "gutter",
                        automaticLayout: true,
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-semibold text-muted">Output</span>
                    <div className="w-full h-64 lg:h-80 bg-bg-elevated rounded-xl border border-border p-4 font-mono text-sm text-emerald-400 overflow-auto whitespace-pre-wrap">
                      {output || "Run your code to see output here..."}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-bg-card rounded-xl border border-border p-6 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-3" />
                  <p className="font-semibold">Solution submitted!</p>
                  <p className="text-sm text-muted">Waiting for opponent to finish…</p>
                </div>
              )}
            </div>
          )}

          {/* Finished duel */}
          {activeDuel.status === "finished" && (
            <AnimatedSection className="space-y-6">
              <div className="text-center py-8">
                {activeDuel.winnerId ? (
                  <>
                    <Crown className={cn("w-14 h-14 mx-auto mb-3", iWon ? "text-amber-400" : "text-muted")} />
                    <h2 className="text-3xl font-bold mb-1">
                      {iWon ? "You Won! 🎉" : `${activeDuel.winnerUsername} Wins`}
                    </h2>
                    {iWon && <p className="text-accent-light font-semibold">+50 XP earned!</p>}
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-14 h-14 text-amber-400 mx-auto mb-3" />
                    <h2 className="text-3xl font-bold mb-1">Draw!</h2>
                    <p className="text-muted">Neither player passed the challenge.</p>
                  </>
                )}
              </div>

              {/* Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={cn(
                  "bg-bg-card rounded-xl border p-4",
                  myPassed ? "border-emerald-500/40" : "border-red-500/40"
                )}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-semibold">{user?.username} (You)</span>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      myPassed ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    )}>
                      {myPassed ? "Passed" : "Failed"}
                    </span>
                  </div>
                  <pre className="bg-bg-elevated rounded-lg p-3 text-xs font-mono overflow-auto max-h-48 text-white/80">
                    {activeDuel.myCode || "No code submitted"}
                  </pre>
                </div>
                <div className={cn(
                  "bg-bg-card rounded-xl border p-4",
                  oppPassed ? "border-emerald-500/40" : "border-red-500/40"
                )}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-semibold">{opponentName}</span>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      oppPassed ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                    )}>
                      {oppPassed ? "Passed" : "Failed"}
                    </span>
                  </div>
                  <pre className="bg-bg-elevated rounded-lg p-3 text-xs font-mono overflow-auto max-h-48 text-white/80">
                    {activeDuel.opponentCode || "No code submitted"}
                  </pre>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={backToLobby}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hot transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> Back to Lobby
                </button>
              </div>
            </AnimatedSection>
          )}
        </div>
      </div>
    );
  }

  // ─── LOBBY VIEW ───────────────────────
  return (
    <div className="min-h-screen bg-bg pt-20 px-4 pb-12">
      <div className="max-w-4xl mx-auto">
        <AnimatedSection>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent-light text-sm font-medium mb-4">
              <Swords className="w-4 h-4" /> Coding Duels
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              Real-time <span className="gradient-text">Coding Duels</span>
            </h1>
            <p className="text-muted max-w-lg mx-auto">
              Challenge other coders to head-to-head Python battles. Solve faster. Win XP.
            </p>
          </div>
        </AnimatedSection>

        {/* Actions */}
        <AnimatedSection delay={0.1}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setTab("open")}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  tab === "open"
                    ? "bg-accent text-white shadow-glow"
                    : "bg-bg-card text-muted border border-border hover:text-white"
                )}
              >
                <Users className="w-4 h-4 inline mr-1.5" /> Open Duels
              </button>
              <button
                onClick={() => setTab("mine")}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  tab === "mine"
                    ? "bg-accent text-white shadow-glow"
                    : "bg-bg-card text-muted border border-border hover:text-white"
                )}
              >
                <Trophy className="w-4 h-4 inline mr-1.5" /> My Duels
              </button>
            </div>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent to-accent-hot text-white font-semibold shadow-glow hover:shadow-glow-lg transition-all"
            >
              <Plus className="w-4 h-4" /> Create Duel
            </button>
          </div>
        </AnimatedSection>

        {/* Create panel */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-bg-card rounded-2xl border border-border p-6">
                <h3 className="font-bold mb-4">New Duel</h3>
                <p className="text-sm text-muted mb-4">A random challenge will be assigned. Set a time limit and create!</p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div>
                    <label className="block text-xs text-muted mb-1">Time Limit</label>
                    <select
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(Number(e.target.value))}
                      className="bg-bg-elevated border border-border rounded-lg px-3 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-accent/50"
                    >
                      <option value={120}>2 minutes</option>
                      <option value={180}>3 minutes</option>
                      <option value={300}>5 minutes</option>
                      <option value={420}>7 minutes</option>
                      <option value={600}>10 minutes</option>
                    </select>
                  </div>
                  <div className="flex gap-2 mt-2 sm:mt-5">
                    <button
                      onClick={handleCreate}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hot transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      Create
                    </button>
                    <button
                      onClick={() => setShowCreate(false)}
                      className="px-4 py-2.5 rounded-xl bg-bg-elevated text-muted hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Duel list */}
        <AnimatedSection delay={0.2}>
          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent" />
            </div>
          ) : tab === "open" ? (
            lobbyDuels.length === 0 ? (
              <div className="text-center py-16 text-muted">
                <Swords className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-semibold mb-1">No open duels right now</p>
                <p className="text-sm">Create one and wait for a challenger!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lobbyDuels.map((d) => (
                  <div
                    key={d.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-bg-card rounded-xl border border-border p-4 hover:border-accent/30 transition-colors gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{d.challengeTitle}</h4>
                        <span className={cn("text-xs font-semibold", diffColors[d.difficulty])}>
                          {diffLabels[d.difficulty]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted">
                        <span>by {d.creatorUsername}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {d.timeLimit / 60}m</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoin(d.id)}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/20 text-accent-light hover:bg-accent/30 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <Swords className="w-4 h-4" /> Join
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            myDuels.length === 0 ? (
              <div className="text-center py-16 text-muted">
                <Trophy className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-semibold mb-1">No duels yet</p>
                <p className="text-sm">Create or join a duel to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myDuels.map((d) => {
                  const iWon = d.winnerId === user?.uid;
                  return (
                    <div
                      key={d.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-bg-card rounded-xl border border-border p-4 gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{d.challengeTitle}</h4>
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-semibold",
                            d.status === "waiting" && "bg-amber-500/20 text-amber-400",
                            d.status === "active" && "bg-emerald-500/20 text-emerald-400",
                            d.status === "finished" && iWon ? "bg-accent/20 text-accent-light" : "",
                            d.status === "finished" && !iWon && d.winnerId ? "bg-red-500/20 text-red-400" : "",
                            d.status === "finished" && !d.winnerId ? "bg-gray-500/20 text-gray-400" : "",
                            d.status === "cancelled" && "bg-gray-500/20 text-gray-400",
                          )}>
                            {d.status === "finished"
                              ? (d.winnerId ? (iWon ? "Won" : "Lost") : "Draw")
                              : d.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted">
                          <span>vs {d.opponentUsername || "waiting…"}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {d.timeLimit / 60}m</span>
                        </div>
                      </div>
                      {d.status === "waiting" && (
                        <button
                          onClick={() => handleCancel(d.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs transition-colors"
                        >
                          <X className="w-3 h-3" /> Cancel
                        </button>
                      )}
                      {d.status === "active" && (
                        <button
                          onClick={() => { setActiveDuelId(d.id); setView("duel"); fetchDuelState(d.id); pollRef.current = setInterval(() => fetchDuelState(d.id), 3000); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs transition-colors"
                        >
                          <Play className="w-3 h-3" /> Resume
                        </button>
                      )}
                      {d.status === "finished" && (
                        <button
                          onClick={() => { setActiveDuelId(d.id); setView("duel"); fetchDuelState(d.id); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-elevated text-muted hover:text-white text-xs transition-colors"
                        >
                          View
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </AnimatedSection>
      </div>
    </div>
  );
}
