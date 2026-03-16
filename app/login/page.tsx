"use client";

import { useState, useEffect, type FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { persistSessionToken, clearSessionToken } from "@/lib/session";
import { useAuthStore } from "@/lib/store";
import { Button, Input, StatusMessage } from "@/components/ui";
import { LogIn, Zap, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import AuthBrandingPanel from "@/components/AuthBrandingPanel";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrate = useAuthStore((s) => s.hydrate);
  const [status, setStatus] = useState<{ message: string; type: "info" | "success" | "error" }>({ message: "", type: "info" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Show success banner if arriving from email verification
  const justVerified = searchParams.get("verified") === "true";

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
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 lg:py-0">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-gradient-radial from-accent/10 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-5xl relative flex rounded-2xl overflow-hidden glass-card min-h-[560px]">
        {/* Left: Branding Panel */}
        <AuthBrandingPanel />

        {/* Right: Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-10">
          {/* Verified Banner */}
          {justVerified && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 p-3.5 mb-5 rounded-xl bg-success/10 border border-success/20 text-success text-sm"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Email verified successfully! You can now sign in.</span>
            </motion.div>
          )}

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-center gap-3 mb-4 lg:hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-hot flex items-center justify-center shadow-glow">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">PulsePy</span>
            </div>
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-sm text-muted mt-1">Sign in to continue your Python journey</p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <motion.div transition={{ delay: 0.1 }}>
              <Input
                name="username"
                type="text"
                placeholder="Username or Email"
                label="Username or Email"
                required
                disabled={loading}
                autoComplete="username"
              />
            </motion.div>

            <motion.div transition={{ delay: 0.15 }} className="relative">
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
            </motion.div>

            {/* Remember me + Forgot */}
            <motion.div transition={{ delay: 0.2 }} className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border bg-bg-elevated accent-accent cursor-pointer"
                />
                <span className="group-hover:text-white transition-colors">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-accent-light hover:text-accent font-medium">
                Forgot password?
              </Link>
            </motion.div>

            <motion.div transition={{ delay: 0.25 }}>
              <Button type="submit" loading={loading} className="w-full" size="lg">
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
            </motion.div>

            {status.message && <StatusMessage message={status.message} type={status.type} />}
          </form>

          {/* OAuth Divider */}
          <div className="flex items-center gap-3 mt-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted uppercase tracking-wider">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <a
              href="/api/auth/oauth/google"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-bg-elevated border border-border rounded-xl text-sm font-medium text-muted-light hover:text-white hover:border-accent/40 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.42l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </a>
            <a
              href="/api/auth/oauth/github"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-bg-elevated border border-border rounded-xl text-sm font-medium text-muted-light hover:text-white hover:border-accent/40 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
            </a>
          </div>

          <p className="text-center text-sm text-muted mt-4">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-accent-light hover:text-accent font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[85vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
