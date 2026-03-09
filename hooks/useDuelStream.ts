import { useEffect, useRef, useCallback } from "react";
import { useDuelStore } from "@/lib/duelStore";
import { readSessionToken } from "@/lib/session";
import type { ActiveDuel, DuelPresence, DuelChatMessage } from "@/lib/types";

/* ─── useDuelStream ──────────────────────────────────────────────────── *
 * Opens a single SSE connection to /api/duels/stream?id={duelId}
 * that multiplexes duel state, presence, and chat in real-time.
 *
 * Features:
 *   • Automatic reconnection with exponential backoff (1s → 2s → 4s → 8s max)
 *   • Presence heartbeat every 3s (typing + line count)
 *   • Graceful disconnect on unmount via navigator.sendBeacon
 *   • Connection state tracking (connected / reconnecting)
 * ──────────────────────────────────────────────────────────────────────── */

const MAX_RECONNECT_DELAY = 8000;

export function useDuelStream(duelId: string | null) {
  const esRef = useRef<EventSource | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelay = useRef(1000);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const {
    setActiveDuel,
    setPresence,
    setChatMessages,
    setDuelConnected,
    setDuelReconnecting,
  } = useDuelStore();

  const didConnectRef = useRef(false); // tracks whether we ever opened a connection

  /* ── Connect ─────────────────────────────────────────────── */
  const connect = useCallback(() => {
    if (!duelId || !mountedRef.current) return;

    const token = readSessionToken();
    const url = `/api/duels/stream?id=${encodeURIComponent(duelId)}${
      token ? `&token=${encodeURIComponent(token)}` : ""
    }`;

    // Close existing
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("duel_state", (e: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const data: ActiveDuel = JSON.parse(e.data);
        setActiveDuel(data);
      } catch {}
    });

    es.addEventListener("presence", (e: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const data: Record<string, DuelPresence> = JSON.parse(e.data);
        setPresence(data);
      } catch {}
    });

    es.addEventListener("chat", (e: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const data: DuelChatMessage[] = JSON.parse(e.data);
        setChatMessages(data);
      } catch {}
    });

    es.addEventListener("heartbeat", () => {
      if (!mountedRef.current) return;
      reconnectDelay.current = 1000; // reset backoff on successful heartbeat
    });

    es.addEventListener("error", (e: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const data = JSON.parse(e.data);
        console.error("SSE error event:", data.message);
      } catch {}
    });

    es.onopen = () => {
      if (!mountedRef.current) return;
      didConnectRef.current = true;
      setDuelConnected(true);
      setDuelReconnecting(false);
      reconnectDelay.current = 1000;
    };

    es.onerror = () => {
      if (!mountedRef.current) return;
      setDuelConnected(false);
      es.close();
      esRef.current = null;

      // Reconnect with exponential backoff
      setDuelReconnecting(true);
      reconnectRef.current = setTimeout(() => {
        reconnectDelay.current = Math.min(
          reconnectDelay.current * 2,
          MAX_RECONNECT_DELAY
        );
        connect();
      }, reconnectDelay.current);
    };
  }, [duelId, setActiveDuel, setPresence, setChatMessages, setDuelConnected, setDuelReconnecting]);

  /* ── Lifecycle ───────────────────────────────────────────── */
  useEffect(() => {
    mountedRef.current = true;
    didConnectRef.current = false;
    connect();

    return () => {
      mountedRef.current = false;
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
      }
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      // Only touch duel connection state if we actually connected
      if (didConnectRef.current) {
        setDuelConnected(false);
        setDuelReconnecting(false);
      }
    };
  }, [connect, setDuelConnected, setDuelReconnecting]);

  /* ── Return reconnect trigger ─────────────────────────────── */
  return { reconnect: connect };
}

/* ─── usePresenceHeartbeat ───────────────────────────────────────────── *
 * Sends presence updates (typing, lineCount, online) every 3 seconds.
 * Uses navigator.sendBeacon on unmount for graceful disconnect.
 * ──────────────────────────────────────────────────────────────────────── */

export function usePresenceHeartbeat(
  duelId: string | null,
  code: string,
  typingRef: React.MutableRefObject<boolean>
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCodeRef = useRef("");

  useEffect(() => {
    if (!duelId) return;

    const token = readSessionToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Mark online
    fetch("/api/duels/presence", {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({ duelId, online: true }),
    }).catch(() => {});

    // Periodic heartbeat
    intervalRef.current = setInterval(() => {
      const lineCount = (code || "").split("\n").length;
      const isTyping = lastCodeRef.current !== code;
      lastCodeRef.current = code;

      fetch("/api/duels/presence", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          duelId,
          typing: isTyping || typingRef.current,
          lineCount,
          online: true,
        }),
      }).catch(() => {});
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);

      // Graceful disconnect via sendBeacon (works on page close)
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob(
          [JSON.stringify({ duelId })],
          { type: "application/json" }
        );
        // sendBeacon doesn't support custom headers, so we'll use DELETE endpoint
        // as a fallback, just mark offline via POST
        navigator.sendBeacon(
          `/api/duels/presence`,
          blob
        );
      }

      // Also try fetch for SPA navigation
      fetch("/api/duels/presence", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ duelId, online: false }),
        keepalive: true,
      }).catch(() => {});
    };
  // Update dependency on code is intentionally excluded to avoid re-creating interval
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duelId]);

  // Keep lastCodeRef current  
  useEffect(() => {
    lastCodeRef.current = code;
  }, [code]);
}
