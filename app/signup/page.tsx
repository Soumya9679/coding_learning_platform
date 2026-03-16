"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Input, StatusMessage } from "@/components/ui";
import { UserPlus, Zap, Check, X, ArrowRight, ArrowLeft, Shield, Users } from "lucide-react";
import AuthBrandingPanel from "@/components/AuthBrandingPanel";

const PW_RULES = [
  { test: (pw: string) => pw.length >= 8, label: "8+ characters" },
  { test: (pw: string) => /[a-z]/.test(pw), label: "Lowercase letter" },
  { test: (pw: string) => /[A-Z]/.test(pw), label: "Uppercase letter" },
  { test: (pw: string) => /[0-9]/.test(pw), label: "Number" },
  { test: (pw: string) => /[^a-zA-Z0-9]/.test(pw), label: "Special character" },
];

const STEPS = [
  { number: 1, label: "Identity" },
  { number: 2, label: "Security" },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [status, setStatus] = useState<{ message: string; type: "info" | "success" | "error" }>({ message: "", type: "info" });
  const [loading, setLoading] = useState(false);

  // Field values
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

  const step1Valid = fullName.trim().length >= 2 && emailValid && username.trim().length >= 3;

  function goToStep(target: number) {
    if (target === 2 && !step1Valid) {
      setTouched({ fullName: true, email: true, username: true });
      setStatus({ message: "Please fill in all fields correctly.", type: "error" });
      return;
    }
    setDirection(target > step ? 1 : -1);
    setStep(target);
    setStatus({ message: "", type: "info" });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched({ fullName: true, email: true, username: true, password: true, confirmPassword: true });

    if (!step1Valid || !allPwRulesPass || !passwordsMatch) {
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
      if (!res.ok) throw new Error(data.error || data.errors?.[0] || "Unexpected error.");

      setStatus({ message: data.message || "Check your email!", type: "success" });
      router.push(data.redirectTo || `/verify?email=${encodeURIComponent(email.trim())}`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unexpected error";
      setStatus({ message: msg, type: "error" });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 lg:py-0">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-gradient-radial from-accent-hot/10 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-5xl relative flex rounded-2xl overflow-hidden glass-card min-h-[600px]">
        {/* Left: Branding Panel */}
        <AuthBrandingPanel />

        {/* Right: Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-10">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-center gap-3 mb-4 lg:hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-hot flex items-center justify-center shadow-glow">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">PulsePy</span>
            </div>
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-sm text-muted mt-1">Start learning Python the fun way</p>
          </motion.div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-6">
            {STEPS.map((s, i) => (
              <div key={s.number} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => s.number < step && goToStep(s.number)}
                  className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all duration-300 ${
                    step === s.number
                      ? "bg-gradient-to-br from-accent to-accent-hot text-white shadow-glow"
                      : step > s.number
                      ? "bg-accent/20 text-accent-light border border-accent/30"
                      : "bg-white/5 text-muted border border-white/10"
                  }`}
                >
                  {step > s.number ? <Check className="w-3.5 h-3.5" /> : s.number}
                </button>
                <span className={`text-xs font-medium hidden sm:inline ${step === s.number ? "text-white" : "text-muted"}`}>
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 sm:w-12 h-px mx-1 transition-colors ${step > s.number ? "bg-accent/50" : "bg-white/10"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="min-h-[240px]">
              <AnimatePresence mode="wait" custom={direction}>
                {step === 1 && (
                  <motion.div
                    key="step1"
                    custom={direction}
                    variants={slideVariants}
                    initial={false}
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <Input name="fullName" type="text" placeholder="John Doe" label="Full Name" required disabled={loading} autoComplete="name"
                      value={fullName} onChange={(e) => setFullName(e.target.value)} onBlur={() => touch("fullName")} error={fieldErrors.fullName} />
                    <Input name="email" type="email" placeholder="you@example.com" label="Email" required disabled={loading} autoComplete="email"
                      value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => touch("email")} error={fieldErrors.email} />
                    <Input name="username" type="text" placeholder="pythonista" label="Username" required disabled={loading} autoComplete="username"
                      value={username} onChange={(e) => setUsername(e.target.value)} onBlur={() => touch("username")} error={fieldErrors.username} />
                    <Button type="button" onClick={() => goToStep(2)} className="w-full" size="lg">
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    custom={direction}
                    variants={slideVariants}
                    initial={false}
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Input name="password" type="password" placeholder="••••••••" label="Password" required disabled={loading} autoComplete="new-password"
                        value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => touch("password")} />
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

                    <div className="flex gap-3">
                      <Button type="button" onClick={() => goToStep(1)} className="px-4" size="lg" variant="secondary">
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <Button type="submit" loading={loading} className="flex-1" size="lg">
                        <UserPlus className="w-4 h-4" />
                        Create Account
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {status.message && (
              <div className="mt-4">
                <StatusMessage message={status.message} type={status.type} />
              </div>
            )}
          </form>

          {/* Trust signals (mobile only) */}
          <div className="flex items-center gap-4 text-xs text-muted mt-4 lg:hidden">
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> 256-bit encrypted</span>
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> 10K+ learners</span>
          </div>

          {/* OAuth Divider */}
          <div className="flex items-center gap-3 mt-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted uppercase tracking-wider">or sign up with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Social Signup */}
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
            Already have an account?{" "}
            <Link href="/login" className="text-accent-light hover:text-accent font-medium">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
