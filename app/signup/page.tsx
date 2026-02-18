"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { persistSessionToken } from "@/lib/session";
import { Button, Input, StatusMessage } from "@/components/ui";
import { UserPlus, Zap } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
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
