"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { persistSessionToken, clearSessionToken } from "@/lib/session";
import { useAuthStore } from "@/lib/store";
import { Button, Input, StatusMessage } from "@/components/ui";
import { LogIn, Zap, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const hydrate = useAuthStore((s) => s.hydrate);
  const [status, setStatus] = useState<{ message: string; type: "info" | "success" | "error" }>({ message: "Enter your credentials to continue.", type: "info" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const usernameOrEmail = (formData.get("username") as string).trim();
    const password = formData.get("password") as string;

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
      await hydrate();
      router.push(data.redirectTo || "/");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unexpected error";
      setStatus({ message: msg, type: "error" });
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
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-sm text-muted">Sign in to continue your Python journey</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              name="username"
              type="text"
              placeholder="Username or Email"
              label="Username or Email"
              required
              disabled={loading}
              autoComplete="username"
            />
            <div className="relative">
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                label="Password"
                required
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-muted hover:text-white transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg">
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
            <StatusMessage message={status.message} type={status.type} />
          </form>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted">
              <Link href="/forgot-password" className="text-accent-light hover:text-accent font-medium">
                Forgot your password?
              </Link>
            </p>
            <p className="text-sm text-muted">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-accent-light hover:text-accent font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
