"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button, Input, StatusMessage } from "@/components/ui";
import { KeyRound, ArrowLeft, Zap } from "lucide-react";

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<{ message: string; type: "info" | "success" | "error" }>({
    message: "",
    type: "info",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = (formData.get("email") as string).trim();
    const username = (formData.get("username") as string).trim();
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!email || !username) {
      setStatus({ message: "Email and username are required to verify your identity.", type: "error" });
      return;
    }

    if (!newPassword || newPassword.length < 8 || !/[0-9]/.test(newPassword)) {
      setStatus({ message: "Password must be 8+ characters and include a number.", type: "error" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus({ message: "Passwords don't match.", type: "error" });
      return;
    }

    setStatus({ message: "Verifying your identity...", type: "info" });
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, newPassword, confirmPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setStatus({ message: data.message || "Password reset successful!", type: "success" });
      setDone(true);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Something went wrong.";
      setStatus({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-gradient-radial from-accent/10 via-transparent to-transparent pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative"
      >
        <div className="glass-card p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-accent to-accent-hot flex items-center justify-center shadow-glow mb-4">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Reset Password</h1>
            <p className="text-sm text-muted">
              Verify your identity with your email and username
            </p>
          </div>

          {done ? (
            <div className="space-y-4 text-center">
              <StatusMessage message={status.message} type={status.type} />
              <Link href="/login">
                <Button className="w-full" size="lg">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <Input
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  label="Email Address"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
                <Input
                  name="username"
                  type="text"
                  placeholder="Your username"
                  label="Username"
                  required
                  disabled={loading}
                  autoComplete="username"
                />
                <div className="border-t border-border my-2" />
                <Input
                  name="newPassword"
                  type="password"
                  placeholder="New password"
                  label="New Password"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
                <Input
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  label="Confirm Password"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />
                <Button type="submit" loading={loading} className="w-full" size="lg">
                  <KeyRound className="w-4 h-4" />
                  Reset Password
                </Button>
                {status.message && <StatusMessage message={status.message} type={status.type} />}
              </form>

              <p className="text-center text-sm text-muted">
                Remember your password?{" "}
                <Link href="/login" className="text-accent-light hover:text-accent font-medium">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
