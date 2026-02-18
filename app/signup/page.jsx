"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { persistSessionToken } from "@/lib/session";
import styles from "@/styles/signup.module.css";

export default function SignupPage() {
  const router = useRouter();
  const [status, setStatus] = useState({ message: "Create your learner profile.", type: "info" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const fullName = form.fullName.value.trim();
    const email = form.email.value.trim();
    const username = form.username.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const passwordOk = password.length >= 8 && /[0-9]/.test(password);

    if (fullName.length < 2 || !emailOk || username.length < 3 || !passwordOk || password !== confirmPassword) {
      setStatus({
        message: "Please fill every field, use a real email, and ensure both passwords match.",
        type: "error",
      });
      return;
    }

    setStatus({ message: "Creating your account...", type: "info" });
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fullName, email, username, password, confirmPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.sessionToken) persistSessionToken(data.sessionToken);
      if (!res.ok) {
        throw new Error(data.error || data.errors?.[0] || "Unexpected error. Please try again.");
      }

      setStatus({ message: "Account ready! Redirecting...", type: "success" });
      router.push(data.redirectTo || "/");
    } catch (error) {
      setStatus({ message: error.message, type: "error" });
      setLoading(false);
    }
  }

  return (
    <div className={styles.signupBox}>
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit} noValidate>
        <input name="fullName" type="text" placeholder="Full Name" required disabled={loading} />
        <input name="email" type="email" placeholder="Email" required disabled={loading} />
        <input name="username" type="text" placeholder="Username" required disabled={loading} />
        <input name="password" type="password" placeholder="Password" required disabled={loading} />
        <p className={styles.fieldHint}>Use at least 8 characters, mixing letters and numbers.</p>
        <input name="confirmPassword" type="password" placeholder="Confirm Password" required disabled={loading} />
        <button type="submit" disabled={loading}>Create Account</button>
        <p className={`${styles.formStatus} ${styles[status.type]}`}>{status.message}</p>
      </form>
      <p>Already have an account? <a href="/login">Login</a></p>
    </div>
  );
}
