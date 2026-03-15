"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Pick up OAuth session token cookie and persist to localStorage
    const match = document.cookie.match(/(?:^|;\s*)pulsepy_oauth_token=([^;]*)/);
    if (match) {
      try {
        localStorage.setItem("pulsepy_session_token", decodeURIComponent(match[1]));
      } catch {}
      // Clear the short-lived cookie
      document.cookie = "pulsepy_oauth_token=; max-age=0; path=/";
    }

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Service worker registration failed — not critical
      });
    }
  }, []);

  return null;
}
