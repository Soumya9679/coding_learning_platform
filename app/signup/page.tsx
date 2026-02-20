"use client";

import { useState, type FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { persistSessionToken } from "@/lib/session";
import { useAuthStore } from "@/lib/store";
import { Button, Input, StatusMessage } from "@/components/ui";
import { UserPlus, Zap, Check, X } from "lucide-react";

const PW_RULES = [
  { test: (pw: string) => pw.length >= 8, label: "8+ characters" },
  { test: (pw: string) => /[a-z]/.test(pw), label: "Lowercase letter" },
  { test: (pw: string) => /[A-Z]/.test(pw), label: "Uppercase letter" },
  { test: (pw: string) => /[0-9]/.test(pw), label: "Number" },
  { test: (pw: string) => /[^a-zA-Z0-9]/.test(pw), label: "Special character" },
];

export default function SignupPage() {
  const router = useRouter();
  const hydrate = useAuthStore((s) => s.hydrate);
  const [status, setStatus] = useState<{ message: string; type: "info" | "success" | "error" }>({ message: "Create your learner profile.", type: "info" });
  const [loading, setLoading] = useState(false);

  // Field values for live validation
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const touch = (field: string) => setTouched((t) => ({ ...t, [field]: true }));

  // Validation
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const allPwRulesPass = PW_RULES.every((r) => r.test(password));
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const fieldErrors = {
    fullName: touched.fullName && fullName.length > 0 && fullName.trim().length < 2 ? "Name must be at least 2 characters" : undefined,
    email: touched.email && email.length > 0 && !emailValid ? "Enter a valid email address" : undefined,
    username: touched.username && username.length > 0 && username.trim().length < 3 ? "Username must be at least 3 characters" : undefined,
    confirmPassword: touched.confirmPassword && confirmPassword.length > 0 && !passwordsMatch ? "Passwords do not match" : undefined,
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched({ fullName: true, email: true, username: true, password: true, confirmPassword: true });

    if (fullName.trim().length < 2 || !emailValid || username.trim().length < 3 || !allPwRulesPass || !passwordsMatch) {
      setStatus({ message: "Please fix the errors above.", type: "error" });
      return;
    }

    setStatus({ message: "Creating your account...", type: "info" });
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fullName: fullName.trim(), email: email.trim(), username: username.trim(), password, confirmPassword }),
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
            <Input name="fullName" type="text" placeholder="John Doe" label="Full Name" required disabled={loading} autoComplete="name"
              value={fullName} onChange={(e) => setFullName(e.target.value)} onBlur={() => touch("fullName")} error={fieldErrors.fullName} />
            <Input name="email" type="email" placeholder="you@example.com" label="Email" required disabled={loading} autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => touch("email")} error={fieldErrors.email} />
            <Input name="username" type="text" placeholder="pythonista" label="Username" required disabled={loading} autoComplete="username"
              value={username} onChange={(e) => setUsername(e.target.value)} onBlur={() => touch("username")} error={fieldErrors.username} />

            <div className="space-y-2">
              <Input name="password" type="password" placeholder="••••••••" label="Password" required disabled={loading} autoComplete="new-password"
                value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => touch("password")} />
              {/* Password strength indicators */}
              {(touched.password || password.length > 0) && (
                <div className="grid grid-cols-2 gap-1 px-1">
                  {PW_RULES.map((rule) => {
                    const pass = rule.test(password);
                    return (
                      <div key={rule.label} className={`flex items-center gap-1.5 text-[11px] ${pass ? "text-success" : "text-muted"}`}>
                        {pass ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {rule.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Input name="confirmPassword" type="password" placeholder="••••••••" label="Confirm Password" required disabled={loading} autoComplete="new-password"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onBlur={() => touch("confirmPassword")} error={fieldErrors.confirmPassword} />

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
