"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { applyAuthHeaders } from "@/lib/session";
import type { Notification } from "@/lib/types";

const POLL_INTERVAL = 30_000; // 30 seconds

const iconMap: Record<string, string> = {
  achievement_unlocked: "🏆",
  level_up: "⬆️",
  streak: "🔥",
  daily_complete: "📅",
  duel_challenge: "⚔️",
  duel_result: "🎯",
  system: "🔔",
  welcome: "👋",
  milestone: "⭐",
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=20", {
        credentials: "include",
        headers: applyAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch { /* silently fail */ }
  }, []);

  // Poll for notifications
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click / escape
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const markAllRead = async () => {
    setLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...applyAuthHeaders() },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...applyAuthHeaders() },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* ignore */ }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className="relative p-2 rounded-xl text-muted hover:text-white hover:bg-white/5 transition-all"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-accent text-white text-[10px] font-bold rounded-full px-1 shadow-glow">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 max-h-[420px] bg-bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-card overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-bold">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={loading}
                  className="text-xs text-accent hover:text-accent-light transition-colors flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto max-h-[340px] divide-y divide-border">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 transition-all hover:bg-white/3 group",
                      !n.read && "bg-accent/5"
                    )}
                  >
                    <span className="text-lg mt-0.5" aria-hidden>
                      {iconMap[n.type] || "🔔"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm truncate", !n.read ? "font-semibold" : "text-muted-light")}>
                        {n.title}
                      </p>
                      <p className="text-xs text-muted mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted mt-1">
                        {formatTimeAgo(n.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted hover:text-danger transition-all"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
