"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const SESSION_TOKEN_KEY = "pulsepy-dev-session";

function readSessionToken() {
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

function clearSessionToken() {
  try {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {}
}

function applyAuthHeaders(headers = {}) {
  const token = readSessionToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export default function Navbar() {
  const [isAuth, setIsAuth] = useState(false);

  const hydrateAuth = useCallback(async () => {
    try {
      const headers = applyAuthHeaders({ Accept: "application/json" });
      const res = await fetch("/api/auth/session", { method: "GET", credentials: "include", headers });
      if (!res.ok) {
        if (res.status === 401) clearSessionToken();
        setIsAuth(false);
        return;
      }
      const payload = await res.json().catch(() => null);
      setIsAuth(Boolean(payload?.user));
    } catch {
      clearSessionToken();
      setIsAuth(false);
    }
  }, []);

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  const handleLogout = async () => {
    try {
      const headers = applyAuthHeaders({ "Content-Type": "application/json" });
      await fetch("/api/auth/logout", { method: "POST", credentials: "include", headers });
    } catch (error) {
      console.error("Failed to log out", error);
    } finally {
      clearSessionToken();
      setIsAuth(false);
    }
  };

  return (
    <header className="nav-shell">
      <Link href="/" className="brand-mark">PulsePy</Link>
      <nav className="nav-links">
        {isAuth && <Link href="/challenges">Challenges</Link>}
        {isAuth && <Link href="/ide">IDE</Link>}
        {isAuth && <Link href="/gamified">Game Lab</Link>}
        {isAuth ? (
          <button className="ghost-btn" onClick={handleLogout}>Log out</button>
        ) : (
          <>
            <Link href="/login"><button className="ghost-btn">Log in</button></Link>
            <Link href="/signup"><button className="solid-btn">Sign up</button></Link>
          </>
        )}
      </nav>
    </header>
  );
}
