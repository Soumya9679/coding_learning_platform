"use client";

import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Input, StatusMessage } from "@/components/ui";
import { KeyRound, ArrowLeft, ArrowRight, Zap, Check, X, MailOpen, RefreshCw, Shield } from "lucide-react";
import AuthBrandingPanel from "@/components/AuthBrandingPanel";

const PW_RULES = [
  { test: (pw: string) => pw.length >= 8, label: "8+ characters" },
  { test: (pw: string) => /[a-z]/.test(pw), label: "Lowercase letter" },
  { test: (pw: string) => /[A-Z]/.test(pw), label: "Uppercase letter" },
  { test: (pw: string) => /[0-9]/.test(pw), label: "Number" },
  { test: (pw: string) => /[^a-zA-Z0-9]/.test(pw), label: "Special character" },
];

const STEPS = [
  { number: 1, label: "Email" },
  { number: 2, label: "Verify" },
  { number: 3, label: "Password" },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [status, setStatus] = useState<{ message: string; type: "info" | "success" | "error" }>({ message: "", type: "info" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Step 1
  const [email, setEmail] = useState("");
  // Step 2
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  // Step 3
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const touch = (field: string) => setTouched((t) => ({ ...t, [field]: true }));

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const allPwRulesPass = PW_RULES.every((r) => r.test(newPassword));
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  // Resend cooldown timer
  useState(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  });

  function goTo(target: number) {
    setDirection(target > step ? 1 : -1);
    setStep(target);
    setStatus({ message: "", type: "info" });
  }

  // Step 1: Send OTP
  async function handleSendOtp(e?: FormEvent) {
    e?.preventDefault();
    if (!emailValid) {
      setStatus({ message: "Enter a valid email address.", type: "error" });
      return;
    }

    setStatus({ message: "Sending reset code...", type: "info" });
    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), type: "reset" }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to send code.");

      setStatus({ message: "Code sent! Check your inbox.", type: "success" });
      setResendCooldown(60);
      goTo(2);
      setTimeout(() => inputRefs.current[0]?.focus(), 300);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Something went wrong.";
      setStatus({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify OTP
  async function submitOtp(code: string) {
    if (code.length !== 6 || loading) return;

    setStatus({ message: "Verifying code...", type: "info" });
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: code }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Invalid code.");

      setStatus({ message: "Verified! Set your new password.", type: "success" });
      goTo(3);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Verification failed.";
      setStatus({ message: msg, type: "error" });
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  function handleOtpInput(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) inputRefs.current[index + 1]?.focus();

    const code = newOtp.join("");
    if (code.length === 6 && newOtp.every((d) => d)) submitOtp(code);
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = Array(6).fill("");
    pasted.split("").forEach((d, i) => { newOtp[i] = d; });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    if (pasted.length === 6) submitOtp(pasted);
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setStatus({ message: "Sending new code...", type: "info" });
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), type: "reset" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to resend.");
      setStatus({ message: "New code sent!", type: "success" });
      setResendCooldown(60);
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to resend.";
      setStatus({ message: msg, type: "error" });
    }
  }

  // Step 3: Reset password
  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    setTouched({ newPassword: true, confirmPassword: true });

    if (!allPwRulesPass || !passwordsMatch) {
      setStatus({ message: "Please fix the errors above.", type: "error" });
      return;
    }

    setStatus({ message: "Resetting password...", type: "info" });
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), newPassword, confirmPassword }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to reset password.");

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
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 lg:py-0">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-gradient-radial from-accent/10 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-5xl relative flex rounded-2xl overflow-hidden glass-card min-h-[560px]">
        <AuthBrandingPanel />

        <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-10">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-center gap-3 mb-4 lg:hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-hot flex items-center justify-center shadow-glow">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">PulsePy</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-hot flex items-center justify-center shadow-glow lg:hidden">
                <KeyRound className="w-5 h-5 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Reset Password</h1>
            <p className="text-sm text-muted mt-1">
              {step === 1 && "Enter your email to receive a reset code"}
              {step === 2 && "Enter the 6-digit code sent to your email"}
              {step === 3 && "Set your new password"}
            </p>
          </motion.div>

          {/* Step Indicator (only if not done) */}
          {!done && (
            <div className="flex items-center gap-2 mb-6">
              {STEPS.map((s, i) => (
                <div key={s.number} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all duration-300 ${
                      step === s.number
                        ? "bg-gradient-to-br from-accent to-accent-hot text-white shadow-glow"
                        : step > s.number
                        ? "bg-accent/20 text-accent-light border border-accent/30"
                        : "bg-white/5 text-muted border border-white/10"
                    }`}
                  >
                    {step > s.number ? <Check className="w-3.5 h-3.5" /> : s.number}
                  </div>
                  <span className={`text-xs font-medium hidden sm:inline ${step === s.number ? "text-white" : "text-muted"}`}>
                    {s.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className={`w-6 sm:w-10 h-px mx-0.5 transition-colors ${step > s.number ? "bg-accent/50" : "bg-white/10"}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Content */}
          {done ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 text-center py-6">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-success/15 flex items-center justify-center">
                <Check className="w-7 h-7 text-success" />
              </div>
              <StatusMessage message={status.message} type={status.type} />
              <Link href="/login">
                <Button className="w-full" size="lg">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className="flex-1 relative overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                {/* Step 1: Email */}
                {step === 1 && (
                  <motion.form
                    key="step1"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25 }}
                    onSubmit={handleSendOtp}
                    className="space-y-4"
                  >
                    <Input
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      label="Email Address"
                      required
                      disabled={loading}
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button type="submit" loading={loading} className="w-full" size="lg">
                      Send Reset Code
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </motion.form>
                )}

                {/* Step 2: OTP */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-accent/5 border border-accent/10 text-sm text-muted">
                      <MailOpen className="w-5 h-5 text-accent-light shrink-0" />
                      Code sent to <span className="text-accent-light font-medium">{email}</span>
                    </div>

                    <div className="flex justify-center gap-2.5 sm:gap-3" onPaste={handleOtpPaste}>
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => { inputRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpInput(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          disabled={loading}
                          className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border-2 bg-bg-elevated outline-none transition-all duration-200 ${
                            digit ? "border-accent/60 text-white" : "border-border text-muted"
                          } focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50`}
                          aria-label={`Digit ${i + 1}`}
                        />
                      ))}
                    </div>

                    {/* Resend */}
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resendCooldown > 0 || loading}
                        className="inline-flex items-center gap-2 text-sm font-medium text-accent-light hover:text-accent transition-colors disabled:text-muted disabled:cursor-not-allowed"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: New Password */}
                {step === 3 && (
                  <motion.form
                    key="step3"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25 }}
                    onSubmit={handleResetPassword}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/20 text-success text-sm mb-2">
                      <Shield className="w-4 h-4 shrink-0" />
                      Identity verified. Choose a new password.
                    </div>

                    <div className="space-y-2">
                      <Input name="newPassword" type="password" placeholder="New password" label="New Password" required disabled={loading} autoComplete="new-password"
                        value={newPassword} onChange={(e) => setNewPassword(e.target.value)} onBlur={() => touch("newPassword")} />
                      {(touched.newPassword || newPassword.length > 0) && (
                        <div className="grid grid-cols-2 gap-1 px-1">
                          {PW_RULES.map((rule) => {
                            const pass = rule.test(newPassword);
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

                    <Input name="confirmPassword" type="password" placeholder="Confirm new password" label="Confirm Password" required disabled={loading} autoComplete="new-password"
                      value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onBlur={() => touch("confirmPassword")}
                      error={touched.confirmPassword && confirmPassword.length > 0 && !passwordsMatch ? "Passwords do not match" : undefined} />

                    <Button type="submit" loading={loading} className="w-full" size="lg">
                      <KeyRound className="w-4 h-4" />
                      Reset Password
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>

              {status.message && (
                <div className="mt-4">
                  <StatusMessage message={status.message} type={status.type} />
                </div>
              )}
            </div>
          )}

          <p className="text-center text-sm text-muted mt-6">
            Remember your password?{" "}
            <Link href="/login" className="text-accent-light hover:text-accent font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
