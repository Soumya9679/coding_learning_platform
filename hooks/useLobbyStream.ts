import { useEffect, useRef, useCallback } from "react";
import { useDuelStore } from "@/lib/duelStore";
import { readSessionToken, applyAuthHeaders } from "@/lib/session";
import type { LobbyDuel, MyDuel } from "@/lib/types";

/* ─── useLobbyStream ────────────────────────────────────────────────── *
 * 1. Immediately fetches lobby data via REST (ensures loading clears fast)
 * 2. Opens an SSE connection for real-time updates
 * 3. Falls back to periodic polling if SSE keeps failing
 * ──────────────────────────────────────────────────────────────────────── */

const MAX_RECONNECT_DELAY = 10000;
const SSE_FAIL_THRESHOLD = 3;          // after 3 SSE failures, fall back to polling
const POLL_INTERVAL = 8000;            // 8s poll as fallback

export function useLobbyStream() {
  const esRef = useRef<EventSource | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelay = useRef(1000);
  const mountedRef = useRef(true);
  const visibleRef = useRef(true);
  const sseFailCount = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    setLobbyDuels,
    setMyDuels,
    setLobbyLoading,
    setLobbyConnected,
    setLobbyReconnecting,
  } = useDuelStore();

  /* ── REST fetch (immediate + fallback) ─────────────────── */
  const fetchLobby = useCallback(async () => {
    try {
      const [lobbyRes, mineRes] = await Promise.all([
        fetch("/api/duels?mode=lobby", {
          headers: applyAuthHeaders(),
          credentials: "include",
        }),
        fetch("/api/duels?mode=mine", {
          headers: applyAuthHeaders(),
          credentials: "include",
        }),
      ]);
      if (lobbyRes.ok) {
        const data = await lobbyRes.json();
        setLobbyDuels(data.duels || []);
      }
      if (mineRes.ok) {
        const data = await mineRes.json();
        setMyDuels(data.duels || []);
      }
      setLobbyLoading(false);
      setLobbyConnected(true);
    } catch (err) {
      console.error("Lobby fetch failed:", err);
      setLobbyLoading(false);
    }
  }, [setLobbyDuels, setMyDuels, setLobbyLoading, setLobbyConnected]);

  /* ── Start polling fallback ─────────────────────────────── */
  const startPolling = useCallback(() => {
    if (pollRef.current) return; // already polling
    pollRef.current = setInterval(() => {
      if (mountedRef.current && visibleRef.current) {
        fetchLobby();
      }
    }, POLL_INTERVAL);
  }, [fetchLobby]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  /* ── SSE connect ───────────────────────────────────────── */
  const connect = useCallback(() => {
    if (!mountedRef.current || !visibleRef.current) return;

    // If too many SSE failures, just use polling
    if (sseFailCount.current >= SSE_FAIL_THRESHOLD) {
      startPolling();
      return;
    }

    const token = readSessionToken();
    const url = `/api/duels/lobby-stream${
      token ? `?token=${encodeURIComponent(token)}` : ""
    }`;

    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("lobby_update", (e: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const data: LobbyDuel[] = JSON.parse(e.data);
        setLobbyDuels(data);
        setLobbyLoading(false);
        sseFailCount.current = 0; // reset on success
        stopPolling();            // SSE working, stop polling
      } catch {}
    });

    es.addEventListener("my_duels", (e: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const data: MyDuel[] = JSON.parse(e.data);
        setMyDuels(data);
      } catch {}
    });

    es.addEventListener("heartbeat", () => {
      reconnectDelay.current = 1000;
      sseFailCount.current = 0;
    });

    es.onopen = () => {
      if (!mountedRef.current) return;
      setLobbyConnected(true);
      setLobbyReconnecting(false);
      reconnectDelay.current = 1000;
    };

    es.onerror = () => {
      if (!mountedRef.current) return;
      setLobbyConnected(false);
      es.close();
      esRef.current = null;
      sseFailCount.current++;

      if (sseFailCount.current >= SSE_FAIL_THRESHOLD) {
        // Fall back to polling silently
        setLobbyReconnecting(false);
        setLobbyConnected(true); // polling works, show as connected
        startPolling();
        return;
      }

      setLobbyReconnecting(true);
      reconnectRef.current = setTimeout(() => {
        reconnectDelay.current = Math.min(
          reconnectDelay.current * 2,
          MAX_RECONNECT_DELAY
        );
        connect();
      }, reconnectDelay.current);
    };
  }, [
    setLobbyDuels,
    setMyDuels,
    setLobbyLoading,
    setLobbyConnected,
    setLobbyReconnecting,
    startPolling,
    stopPolling,
  ]);

  const disconnect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
  }, []);

  /* ── Visibility-based pause/resume ──────────────────────── */
  useEffect(() => {
    const handleVisibility = () => {
      const isVisible = document.visibilityState === "visible";
      visibleRef.current = isVisible;
      if (isVisible) {
        fetchLobby();   // immediate refresh on tab focus
        connect();
      } else {
        disconnect();
        stopPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [connect, disconnect, fetchLobby, stopPolling]);

  /* ── Mount / Unmount ────────────────────────────────────── */
  useEffect(() => {
    mountedRef.current = true;

    // 1. Fetch immediately via REST (guaranteed fast load)
    fetchLobby();

    // 2. Then try SSE for real-time updates
    connect();

    return () => {
      mountedRef.current = false;
      disconnect();
      stopPolling();
      setLobbyConnected(false);
    };
  }, [connect, disconnect, fetchLobby, stopPolling, setLobbyConnected]);

  return { reconnect: connect };
}
