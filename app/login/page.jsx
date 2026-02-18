"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { persistSessionToken, clearSessionToken } from "@/lib/session";
import styles from "@/styles/login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState({ message: "Enter your credentials to continue.", type: "info" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const usernameOrEmail = form.username.value.trim();
    const password = form.password.value;

    if (usernameOrEmail.length < 2 || password.length < 8 || !/[0-9]/.test(password)) {
      setStatus({ message: "Use a valid username/email and a password with 8+ characters including a number.", type: "error" });
      return;
    }

    setStatus({ message: "Signing you in...", type: "info" });
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.sessionToken) persistSessionToken(data.sessionToken);
      if (!res.ok) {
        if (res.status === 401) clearSessionToken();
        throw new Error(data.error || "Unexpected error. Please try again.");
      }

      setStatus({ message: "Welcome back! Redirecting...", type: "success" });
      router.push(data.redirectTo || "/");
    } catch (error) {
      setStatus({ message: error.message, type: "error" });
      setLoading(false);
    }
  }

  return (
    <div className={styles.loginBox}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit} noValidate>
        <input name="username" type="text" placeholder="Username" required disabled={loading} />
        <input name="password" type="password" placeholder="Password" required disabled={loading} />
        <button type="submit" disabled={loading}>Login</button>
        <p className={`${styles.formStatus} ${styles[status.type]}`}>{status.message}</p>
      </form>
      <p>Don&apos;t have an account? <a href="/signup">Sign up</a></p>
    </div>
  );
}
