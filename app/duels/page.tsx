"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuthStore } from "@/lib/store";
import { useDuelStore } from "@/lib/duelStore";
import { applyAuthHeaders } from "@/lib/session";
import { useDuelStream, usePresenceHeartbeat } from "@/hooks/useDuelStream";
import { useLobbyStream } from "@/hooks/useLobbyStream";
import { AnimatedSection, toast } from "@/components/ui";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { runPythonInWorker } from "@/hooks/usePyodide";
import type { DuelPresence } from "@/lib/types";
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
  Wifi,
  WifiOff,
  MessageCircle,
  Eye,
  Code2,
  Keyboard,
} from "lucide-react";

const CodeEditor = dynamic(() => import("@/components/CodeEditor"), { ssr: false });

/* ─── Constants ──────────────────────────────────────────────────────── */

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

/* ─── Pulse Animation Component ──────────────────────────────────────── */

function LivePulse({ color = "emerald" }: { color?: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span
        className={cn(
          "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
          color === "emerald" && "bg-emerald-400",
          color === "amber" && "bg-amber-400",
          color === "red" && "bg-red-400",
          color === "accent" && "bg-accent"
        )}
      />
      <span
        className={cn(
          "relative inline-flex h-2.5 w-2.5 rounded-full",
          color === "emerald" && "bg-emerald-500",
          color === "amber" && "bg-amber-500",
          color === "red" && "bg-red-500",
          color === "accent" && "bg-accent"
        )}
      />
    </span>
  );
}

/* ─── Typing Indicator ───────────────────────────────────────────────── */

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-accent-light font-medium">typing</span>
      <div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1 h-1 rounded-full bg-accent-light"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Connection Badge ───────────────────────────────────────────────── */

function ConnectionBadge() {
  const { view, lobbyConnected, lobbyReconnecting, duelConnected, duelReconnecting } = useDuelStore();

  // Use the appropriate connection state based on current view
  const connected = view === "duel" ? duelConnected : lobbyConnected;
  const reconnecting = view === "duel" ? duelReconnecting : lobbyReconnecting;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all",
        connected
          ? "bg-emerald-500/10 text-emerald-400"
          : reconnecting
          ? "bg-amber-500/10 text-amber-400 animate-pulse"
          : "bg-red-500/10 text-red-400"
      )}
    >
      {connected ? (
        <>
          <Wifi className="w-3 h-3" /> Live
        </>
      ) : reconnecting ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin" /> Reconnecting
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" /> Offline
        </>
      )}
    </div>
  );
}

/* ─── Presence Card ──────────────────────────────────────────────────── */

function PresenceCard({
  username,
  presence,
  isSelf,
  submitted,
  passed,
  isCreator,
}: {
  username: string;
  presence?: DuelPresence;
  isSelf: boolean;
  submitted: boolean;
  passed: boolean;
  isCreator: boolean;
}) {
  const online = isSelf || (presence?.online ?? false);
  const typing = !isSelf && (presence?.typing ?? false);
  const lineCount = isSelf ? 0 : (presence?.lineCount ?? 0);

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
            isCreator
              ? "bg-accent/20 text-accent"
              : "bg-accent-hot/20 text-accent-hot"
          )}
        >
          {username?.[0]?.toUpperCase() || "?"}
        </div>
        {/* Online indicator */}
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-bg-card",
            online ? "bg-emerald-500" : "bg-gray-500"
          )}
        />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm truncate">
          {username} {isSelf && <span className="text-muted">(you)</span>}
        </p>
        <div className="flex items-center gap-2">
          {submitted ? (
            <span
              className={cn(
                "text-xs font-medium",
                passed ? "text-emerald-400" : "text-amber-400"
              )}
            >
              ✓ Submitted
            </span>
          ) : typing ? (
            <TypingIndicator />
          ) : online ? (
            <span className="text-xs text-muted flex items-center gap-1">
              <Code2 className="w-3 h-3" /> Coding…
              {lineCount > 0 && (
                <span className="text-[10px] text-muted/60">
                  ({lineCount} lines)
                </span>
              )}
            </span>
          ) : (
            <span className="text-xs text-muted/50">Offline</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Chat Panel ─────────────────────────────────────────────────────── */

function ChatPanel({ duelId }: { duelId: string }) {
  const { chatMessages, showChat, setShowChat } = useDuelStore();
  const { user } = useAuthStore();
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendMessage = async () => {
    if (!msg.trim() || sending) return;
    const text = msg.trim();
    setMsg("");
    setSending(true);
    try {
      const res = await fetch("/api/duels/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...applyAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ duelId, text }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to send");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSending(false);
    }
  };

  if (!showChat) {
    return (
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-accent text-white shadow-glow hover:shadow-glow-lg transition-all"
      >
        <MessageCircle className="w-5 h-5" />
        {chatMessages.length > 0 && (
          <span className="bg-white/20 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
            {chatMessages.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed bottom-6 right-6 z-40 w-80 h-96 bg-bg-card rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-elevated">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-accent" />
          <span className="font-semibold text-sm">Duel Chat</span>
          <LivePulse color="accent" />
        </div>
        <button
          onClick={() => setShowChat(false)}
          className="text-muted hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {chatMessages.length === 0 && (
          <p className="text-xs text-muted text-center mt-8">
            No messages yet. Say hi! 👋
          </p>
        )}
        {chatMessages.map((m) => {
          const isMine = m.uid === user?.uid;
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex", isMine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-1.5 text-sm",
                  isMine
                    ? "bg-accent text-white rounded-br-sm"
                    : "bg-bg-elevated text-white rounded-bl-sm"
                )}
              >
                {!isMine && (
                  <p className="text-[10px] font-semibold text-accent-light mb-0.5">
                    {m.username}
                  </p>
                )}
                <p className="break-words">{m.text}</p>
              </div>
            </motion.div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message…"
            maxLength={280}
            className="flex-1 bg-bg-elevated border border-border rounded-xl px-3 py-2 text-sm text-white placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <button
            onClick={sendMessage}
            disabled={!msg.trim() || sending}
            className="px-3 py-2 rounded-xl bg-accent text-white hover:bg-accent-hot transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
 * MAIN PAGE COMPONENT
 * ═══════════════════════════════════════════════════════════════════════ */

export default function DuelsPage() {
  const router = useRouter();
  const { isAuth, user, isLoading } = useAuthStore();
  const duel = useDuelStore();
  const typingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Auth guard ──────────────────────────────────────────── */
  useEffect(() => {
    if (!isLoading && !isAuth) router.push("/login");
  }, [isAuth, isLoading, router]);

  /* ── Real-time streams ───────────────────────────────────── */
  useLobbyStream();
  useDuelStream(duel.view === "duel" ? duel.activeDuelId : null);
  usePresenceHeartbeat(
    duel.view === "duel" && duel.activeDuel?.status === "active"
      ? duel.activeDuelId
      : null,
    duel.code,
    typingRef
  );

  /* ── Typing detection ────────────────────────────────────── */
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleCodeChange = useCallback(
    (val: string) => {
      duel.setCode(val || "");
      typingRef.current = true;
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        typingRef.current = false;
      }, 1500);
    },
    [duel]
  );

  /* ── Timer logic ─────────────────────────────────────────── */
  useEffect(() => {
    if (
      duel.activeDuel?.status === "active" &&
      duel.activeDuel.startedAt &&
      !duel.submitted
    ) {
      const started = new Date(duel.activeDuel.startedAt).getTime();
      const limit = (duel.activeDuel.timeLimit || 300) * 1000;

      // Set initial code
      if (!duel.code && duel.activeDuel.starterCode) {
        duel.setCode(duel.activeDuel.myCode || duel.activeDuel.starterCode);
      }

      const updateTimer = () => {
        const elapsed = Date.now() - started;
        const remaining = Math.max(0, Math.ceil((limit - elapsed) / 1000));
        duel.setTimeLeft(remaining);
        if (remaining <= 0) {
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
  }, [duel.activeDuel?.status, duel.activeDuel?.startedAt, duel.submitted]);

  /* ── Actions ─────────────────────────────────────────────── */

  const handleCreate = async () => {
    duel.setActionLoading(true);
    try {
      const res = await fetch("/api/duels", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...applyAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ action: "create", timeLimit: duel.timeLimit }),
      });
      const data = await res.json();
      if (res.ok) {
        duel.setActiveDuelId(data.duelId);
        duel.setView("duel");
        duel.setShowCreate(false);
        // SSE will pick up the duel state automatically — no polling needed
      } else {
        toast.error(data.error || "Failed to create duel");
      }
    } catch {
      toast.error("Network error");
    } finally {
      duel.setActionLoading(false);
    }
  };

  const handleJoin = async (duelId: string) => {
    duel.setActionLoading(true);
    try {
      const res = await fetch("/api/duels", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...applyAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ action: "join", duelId }),
      });
      const data = await res.json();
      if (res.ok) {
        duel.setActiveDuelId(duelId);
        duel.setView("duel");
        // SSE will automatically push the state change to "active" — instant
      } else {
        toast.error(data.error || "Failed to join");
      }
    } catch {
      toast.error("Network error");
    } finally {
      duel.setActionLoading(false);
    }
  };

  const handleCancel = async (duelId: string) => {
    try {
      await fetch("/api/duels", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...applyAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ action: "cancel", duelId }),
      });
      backToLobby();
    } catch {
      toast.error("Network error");
    }
  };

  const handleRun = async () => {
    duel.setRunning(true);
    duel.setOutput("");
    try {
      const result = await runPythonInWorker(duel.code, 10_000);
      if (result.error) {
        duel.setOutput(`Error: ${result.error}\n`);
      } else {
        duel.setOutput(result.stdout || "(no output)");
      }
    } catch (err) {
      duel.setOutput(`Error: ${err}\n`);
    } finally {
      duel.setRunning(false);
    }
  };

  const handleSubmit = async (autoTimeout = false) => {
    if (duel.submitted || !duel.activeDuelId) return;

    let finalOutput = duel.output;
    if (!finalOutput && !autoTimeout) {
      await handleRun();
      await new Promise((r) => setTimeout(r, 500));
      finalOutput = useDuelStore.getState().output;
    }

    const passed =
      finalOutput.trim() === duel.activeDuel?.expectedOutput?.trim();
    duel.setSubmitted(true);

    try {
      await fetch("/api/duels", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...applyAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({
          action: "submit",
          duelId: duel.activeDuelId,
          code: duel.code,
          output: finalOutput,
          passed: autoTimeout ? false : passed,
        }),
      });
      // SSE will deliver the updated state — no manual fetch needed
    } catch {
      toast.error("Failed to submit");
    }
  };

  const backToLobby = () => {
    duel.resetDuel();
    duel.setView("lobby");
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  /* ── Loading state ───────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════
   * DUEL ARENA VIEW
   * ═══════════════════════════════════════════════════════════════════ */
  if (duel.view === "duel" && duel.activeDuel) {
    const ad = duel.activeDuel;
    const isCreator = ad.creatorId === user?.uid;
    const myUsername = user?.username || "";
    const opponentUsername = isCreator
      ? ad.opponentUsername
      : ad.creatorUsername;
    const myPassed = isCreator ? ad.creatorPassed : ad.opponentPassed;
    const oppPassed = isCreator ? ad.opponentPassed : ad.creatorPassed;
    const myFinished = isCreator
      ? ad.creatorFinishedAt
      : ad.opponentFinishedAt;
    const oppFinished = isCreator
      ? ad.opponentFinishedAt
      : ad.creatorFinishedAt;
    const iWon = ad.winnerId === user?.uid;

    // Presence data
    const myPresence = duel.presence[user?.uid || ""];
    const oppUid = isCreator ? ad.opponentId : ad.creatorId;
    const oppPresence = oppUid ? duel.presence[oppUid] : undefined;

    // Timer progress
    const timerPercent =
      ad.timeLimit > 0 ? (duel.timeLeft / ad.timeLimit) * 100 : 100;

    return (
      <div className="min-h-screen bg-bg pt-20 px-4 pb-8">
        <div className="max-w-6xl mx-auto">
          {/* ── Top bar ──────────────────────────────────── */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={backToLobby}
              className="flex items-center gap-1.5 text-muted hover:text-white transition-colors text-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Lobby
            </button>
            <div className="flex items-center gap-3">
              <ConnectionBadge />
              {ad.status === "active" && (
                <div className="relative">
                  <div
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-sm font-bold",
                      duel.timeLeft <= 30
                        ? "bg-red-500/20 text-red-400"
                        : duel.timeLeft <= 60
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-bg-elevated text-white"
                    )}
                  >
                    <Timer className="w-4 h-4" />
                    {Math.floor(duel.timeLeft / 60)}:
                    {String(duel.timeLeft % 60).padStart(2, "0")}
                  </div>
                  {/* Timer progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-bg-elevated rounded-b-lg overflow-hidden">
                    <motion.div
                      className={cn(
                        "h-full",
                        timerPercent > 50
                          ? "bg-emerald-500"
                          : timerPercent > 20
                          ? "bg-amber-500"
                          : "bg-red-500"
                      )}
                      style={{ width: `${timerPercent}%` }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </div>
                  {duel.timeLeft <= 30 && duel.timeLeft > 0 && (
                    <motion.div
                      className="absolute -inset-1 rounded-xl border-2 border-red-500/50"
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </div>
              )}
              <span
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider",
                  ad.status === "waiting" &&
                    "bg-amber-500/20 text-amber-400",
                  ad.status === "active" &&
                    "bg-emerald-500/20 text-emerald-400",
                  ad.status === "finished" &&
                    "bg-accent/20 text-accent-light"
                )}
              >
                {ad.status === "active" && <LivePulse color="emerald" />}
                {ad.status}
              </span>
            </div>
          </div>

          {/* ── Waiting state ────────────────────────────── */}
          {ad.status === "waiting" && (
            <AnimatedSection className="text-center py-20">
              <div className="relative inline-block mb-6">
                <motion.div
                  className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Swords className="w-10 h-10 text-accent" />
                </motion.div>
                <motion.div
                  className="absolute -inset-3 rounded-full border-2 border-accent/30"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                Waiting for an opponent…
              </h2>
              <p className="text-muted mb-2">
                Your duel will start instantly when someone joins.
              </p>
              <div className="flex items-center justify-center gap-2 mb-6">
                <LivePulse color="accent" />
                <span className="text-xs text-accent-light font-medium">
                  Listening for challengers in real-time
                </span>
              </div>
              <button
                onClick={() => handleCancel(ad.id)}
                className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
              >
                Cancel Duel
              </button>
            </AnimatedSection>
          )}

          {/* ── Active duel ──────────────────────────────── */}
          {ad.status === "active" && (
            <div className="space-y-4">
              {/* Players bar with live presence */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between bg-bg-card rounded-xl border border-border p-4"
              >
                <PresenceCard
                  username={myUsername}
                  presence={myPresence}
                  isSelf
                  submitted={!!myFinished}
                  passed={myPassed}
                  isCreator={isCreator}
                />

                <div className="flex flex-col items-center gap-1">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Swords className="w-6 h-6 text-accent" />
                  </motion.div>
                  <span className="text-[10px] text-muted font-mono">VS</span>
                </div>

                <PresenceCard
                  username={opponentUsername || "???"}
                  presence={oppPresence}
                  isSelf={false}
                  submitted={!!oppFinished}
                  passed={oppPassed}
                  isCreator={!isCreator}
                />
              </motion.div>

              {/* Challenge info */}
              <div className="bg-bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold">{ad.challengeTitle}</h3>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      diffColors[ad.difficulty] || "text-muted"
                    )}
                  >
                    {diffLabels[ad.difficulty] || "?"}
                  </span>
                </div>
                <p className="text-sm text-muted">
                  {ad.challengeDescription}
                </p>
                <p className="text-xs text-muted mt-2">
                  Expected output:{" "}
                  <code className="text-accent-light">
                    {ad.expectedOutput}
                  </code>
                </p>
              </div>

              {/* Code editor + output */}
              {!duel.submitted ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-muted">
                          Your Code
                        </span>
                        {/* Live opponent typing indicator */}
                        {oppPresence?.typing && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent/10">
                            <Keyboard className="w-3 h-3 text-accent-light" />
                            <span className="text-[10px] text-accent-light font-medium">
                              Opponent is typing
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleRun}
                          disabled={duel.running}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-medium transition-colors disabled:opacity-50"
                        >
                          {duel.running ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
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
                    <CodeEditor
                      height="320px"
                      value={duel.code}
                      onChange={handleCodeChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-muted">
                        Output
                      </span>
                      {/* Opponent progress indicator */}
                      {oppPresence && !oppFinished && (
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <Eye className="w-3 h-3" />
                          <span>
                            Opponent:{" "}
                            {oppPresence.lineCount > 0
                              ? `${oppPresence.lineCount} lines written`
                              : "thinking…"}
                          </span>
                          {oppPresence.typing && <TypingIndicator />}
                        </div>
                      )}
                      {oppFinished && (
                        <div className="flex items-center gap-1.5 text-xs text-amber-400">
                          <AlertTriangle className="w-3 h-3" />
                          Opponent submitted!
                        </div>
                      )}
                    </div>
                    <div className="w-full h-64 lg:h-80 bg-bg-elevated rounded-xl border border-border p-4 font-mono text-sm text-emerald-400 overflow-auto whitespace-pre-wrap">
                      {duel.output || "Run your code to see output here..."}
                    </div>
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-bg-card rounded-xl border border-border p-8 text-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Loader2 className="w-10 h-10 text-accent mx-auto mb-4" />
                  </motion.div>
                  <p className="font-semibold text-lg">Solution submitted!</p>
                  <p className="text-sm text-muted mt-1">
                    Waiting for opponent to finish…
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <LivePulse color="accent" />
                    <span className="text-xs text-accent-light">
                      You&apos;ll see results instantly
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Chat panel */}
              <AnimatePresence>
                <ChatPanel duelId={ad.id} />
              </AnimatePresence>
            </div>
          )}

          {/* ── Finished duel ────────────────────────────── */}
          {ad.status === "finished" && (
            <AnimatedSection className="space-y-6">
              {/* Victory / Defeat / Draw animation */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="text-center py-8"
              >
                {ad.winnerId ? (
                  <>
                    <motion.div
                      initial={{ rotateY: 0 }}
                      animate={{ rotateY: 360 }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    >
                      <Crown
                        className={cn(
                          "w-16 h-16 mx-auto mb-4",
                          iWon ? "text-amber-400" : "text-muted"
                        )}
                      />
                    </motion.div>
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-3xl font-bold mb-1"
                    >
                      {iWon ? (
                        <span className="gradient-text">You Won! 🎉</span>
                      ) : (
                        `${ad.winnerUsername} Wins`
                      )}
                    </motion.h2>
                    {iWon && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-accent-light font-semibold text-lg"
                      >
                        +50 XP earned!
                      </motion.p>
                    )}
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold mb-1">Draw!</h2>
                    <p className="text-muted">
                      Neither player passed the challenge.
                    </p>
                  </>
                )}
              </motion.div>

              {/* Results with animated code reveal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* My result */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className={cn(
                    "bg-bg-card rounded-xl border p-4",
                    myPassed
                      ? "border-emerald-500/40"
                      : "border-red-500/40"
                  )}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-semibold">
                      {myUsername} (You)
                    </span>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        myPassed
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      )}
                    >
                      {myPassed ? "Passed" : "Failed"}
                    </span>
                    {iWon && (
                      <Crown className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <pre className="bg-bg-elevated rounded-lg p-3 text-xs font-mono overflow-auto max-h-48 text-white/80">
                    {ad.myCode || "No code submitted"}
                  </pre>
                </motion.div>

                {/* Opponent result */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className={cn(
                    "bg-bg-card rounded-xl border p-4",
                    oppPassed
                      ? "border-emerald-500/40"
                      : "border-red-500/40"
                  )}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-semibold">
                      {opponentUsername}
                    </span>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        oppPassed
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      )}
                    >
                      {oppPassed ? "Passed" : "Failed"}
                    </span>
                    {ad.winnerId && !iWon && (
                      <Crown className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <pre className="bg-bg-elevated rounded-lg p-3 text-xs font-mono overflow-auto max-h-48 text-white/80">
                    {ad.opponentCode || "No code submitted"}
                  </pre>
                </motion.div>
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

  /* ═══════════════════════════════════════════════════════════════════
   * LOBBY VIEW
   * ═══════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-bg pt-20 px-4 pb-12">
      <div className="max-w-4xl mx-auto">
        <AnimatedSection>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent-light text-sm font-medium mb-4">
              <Swords className="w-4 h-4" /> Coding Duels
              <LivePulse color="accent" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              Real-time <span className="gradient-text">Coding Duels</span>
            </h1>
            <p className="text-muted max-w-lg mx-auto">
              Challenge other coders to head-to-head Python battles. Solve
              faster. Win XP.
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <ConnectionBadge />
              <span className="text-xs text-muted">
                Duels appear &amp; update instantly
              </span>
            </div>
          </div>
        </AnimatedSection>

        {/* Actions */}
        <AnimatedSection delay={0.1}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => duel.setTab("open")}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  duel.tab === "open"
                    ? "bg-accent text-white shadow-glow"
                    : "bg-bg-card text-muted border border-border hover:text-white"
                )}
              >
                <Users className="w-4 h-4 inline mr-1.5" /> Open Duels
                {duel.lobbyDuels.length > 0 && (
                  <span className="ml-1.5 bg-white/20 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] inline-block text-center">
                    {duel.lobbyDuels.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => duel.setTab("mine")}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  duel.tab === "mine"
                    ? "bg-accent text-white shadow-glow"
                    : "bg-bg-card text-muted border border-border hover:text-white"
                )}
              >
                <Trophy className="w-4 h-4 inline mr-1.5" /> My Duels
              </button>
            </div>
            <button
              onClick={() => duel.setShowCreate(!duel.showCreate)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent to-accent-hot text-white font-semibold shadow-glow hover:shadow-glow-lg transition-all"
            >
              <Plus className="w-4 h-4" /> Create Duel
            </button>
          </div>
        </AnimatedSection>

        {/* Create panel */}
        <AnimatePresence>
          {duel.showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-bg-card rounded-2xl border border-border p-6">
                <h3 className="font-bold mb-4">New Duel</h3>
                <p className="text-sm text-muted mb-4">
                  A random challenge will be assigned. Set a time limit and
                  create!
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div>
                    <label className="block text-xs text-muted mb-1">
                      Time Limit
                    </label>
                    <select
                      value={duel.timeLimit}
                      onChange={(e) =>
                        duel.setTimeLimit(Number(e.target.value))
                      }
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
                      disabled={duel.actionLoading}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hot transition-colors disabled:opacity-50"
                    >
                      {duel.actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                      Create
                    </button>
                    <button
                      onClick={() => duel.setShowCreate(false)}
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
          {duel.lobbyLoading ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent" />
            </div>
          ) : duel.tab === "open" ? (
            duel.lobbyDuels.length === 0 ? (
              <div className="text-center py-16 text-muted">
                <Swords className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-semibold mb-1">No open duels right now</p>
                <p className="text-sm">
                  Create one and wait for a challenger!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {duel.lobbyDuels.map((d) => (
                    <motion.div
                      key={d.id}
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, x: -20 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                      }}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-bg-card rounded-xl border border-border p-4 hover:border-accent/30 transition-colors gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <LivePulse color="emerald" />
                          <h4 className="font-semibold text-sm">
                            {d.challengeTitle}
                          </h4>
                          <span
                            className={cn(
                              "text-xs font-semibold",
                              diffColors[d.difficulty]
                            )}
                          >
                            {diffLabels[d.difficulty]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted">
                          <span>by {d.creatorUsername}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {d.timeLimit / 60}m
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleJoin(d.id)}
                        disabled={duel.actionLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/20 text-accent-light hover:bg-accent/30 text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        <Swords className="w-4 h-4" /> Join
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )
          ) : duel.myDuels.length === 0 ? (
            <div className="text-center py-16 text-muted">
              <Trophy className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-semibold mb-1">No duels yet</p>
              <p className="text-sm">
                Create or join a duel to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {duel.myDuels.map((d) => {
                  const iWon = d.winnerId === user?.uid;
                  return (
                    <motion.div
                      key={d.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-bg-card rounded-xl border border-border p-4 gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">
                            {d.challengeTitle}
                          </h4>
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full font-semibold",
                              d.status === "waiting" &&
                                "bg-amber-500/20 text-amber-400",
                              d.status === "active" &&
                                "bg-emerald-500/20 text-emerald-400",
                              d.status === "finished" && iWon
                                ? "bg-accent/20 text-accent-light"
                                : "",
                              d.status === "finished" &&
                                !iWon &&
                                d.winnerId
                                ? "bg-red-500/20 text-red-400"
                                : "",
                              d.status === "finished" && !d.winnerId
                                ? "bg-gray-500/20 text-gray-400"
                                : "",
                              d.status === "cancelled" &&
                                "bg-gray-500/20 text-gray-400"
                            )}
                          >
                            {d.status === "finished"
                              ? d.winnerId
                                ? iWon
                                  ? "Won"
                                  : "Lost"
                                : "Draw"
                              : d.status}
                          </span>
                          {d.status === "active" && (
                            <LivePulse color="emerald" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted">
                          <span>
                            vs {d.opponentUsername || "waiting…"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {d.timeLimit / 60}m
                          </span>
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
                          onClick={() => {
                            duel.setActiveDuelId(d.id);
                            duel.setView("duel");
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs transition-colors"
                        >
                          <Play className="w-3 h-3" /> Resume
                        </button>
                      )}
                      {d.status === "finished" && (
                        <button
                          onClick={() => {
                            duel.setActiveDuelId(d.id);
                            duel.setView("duel");
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-elevated text-muted hover:text-white text-xs transition-colors"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </AnimatedSection>
      </div>
    </div>
  );
}
