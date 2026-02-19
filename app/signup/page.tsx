"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { persistSessionToken } from "@/lib/session";
import { useAuthStore } from "@/lib/store";
import { Button, Input, StatusMessage } from "@/components/ui";
import { UserPlus, Zap } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const hydrate = useAuthStore((s) => s.hydrate);
  const [status, setStatus] = useState<{ message: string; type: "info" | "success" | "error" }>({ message: "Create your learner profile.", type: "info" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const fullName = (formData.get("fullName") as string).trim();
    const email = (formData.get("email") as string).trim();
    const username = (formData.get("username") as string).trim();
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const passwordOk = password.length >= 8 && /[0-9]/.test(password);

    if (fullName.length < 2 || !emailOk || username.length < 3 || !passwordOk || password !== confirmPassword) {
      setStatus({ message: "Please fill every field, use a real email, and ensure both passwords match.", type: "error" });
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
      if (!res.ok) throw new Error(data.error || data.errors?.[0] || "Unexpected error.");

      setStatus({ message: "Account ready! Redirecting...", type: "success" });
      await hydrate();
      router.push(data.redirectTo || "/");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unexpected error";
      setStatus({ message: msg, type: "error" });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-gradient-radial from-accent-hot/10 via-transparent to-transparent pointer-events-none" />

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
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-sm text-muted">Start learning Python the fun way</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input name="fullName" type="text" placeholder="John Doe" label="Full Name" required disabled={loading} autoComplete="name" />
            <Input name="email" type="email" placeholder="you@example.com" label="Email" required disabled={loading} autoComplete="email" />
            <Input name="username" type="text" placeholder="pythonista" label="Username" required disabled={loading} autoComplete="username" />
            <div className="space-y-1">
              <Input name="password" type="password" placeholder="••••••••" label="Password" required disabled={loading} autoComplete="new-password" />
              <p className="text-xs text-muted pl-1">At least 8 characters with a number.</p>
            </div>
            <Input name="confirmPassword" type="password" placeholder="••••••••" label="Confirm Password" required disabled={loading} autoComplete="new-password" />

            <Button type="submit" loading={loading} className="w-full" size="lg">
              <UserPlus className="w-4 h-4" />
              Create Account
            </Button>
            <StatusMessage message={status.message} type={status.type} />
          </form>

          {/* OAuth Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted">or sign up with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* OAuth Buttons */}
          <div className="flex gap-3">
            <a
              href="/api/auth/oauth/google"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-bg-elevated hover:bg-bg-elevated/80 text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </a>
            <a
              href="/api/auth/oauth/github"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-bg-elevated hover:bg-bg-elevated/80 text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </a>
          </div>

          <p className="text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-accent-light hover:text-accent font-medium">
              Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
