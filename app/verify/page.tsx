"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { persistSessionToken } from "@/lib/session";
import { useAuthStore } from "@/lib/store";
import { Button, StatusMessage } from "@/components/ui";
import { Zap, CheckCircle2, MailOpen, RefreshCw, ArrowLeft } from "lucide-react";

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrate = useAuthStore((s) => s.hydrate);
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [status, setStatus] = useState<{ message: string; type: "info" | "success" | "error" }>({ message: "", type: "info" });
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const submitOtp = useCallback(async (code: string) => {
    if (code.length !== 6 || loading) return;

    setStatus({ message: "Verifying...", type: "info" });
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, otp: code }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Invalid code.");

      if (data.sessionToken) persistSessionToken(data.sessionToken);

      setStatus({ message: "Email verified! 🎉", type: "success" });
      setVerified(true);

      // Auto-redirect after success animation
      await hydrate();
      setTimeout(() => router.push("/"), 1500);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Verification failed.";
      setStatus({ message: msg, type: "error" });
      setOtp(Array(6).fill(""));
      setLoading(false);
      inputRefs.current[0]?.focus();
    }
  }, [email, loading, hydrate, router]);

  function handleInput(index: number, value: string) {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    const code = newOtp.join("");
    if (code.length === 6 && newOtp.every((d) => d)) {
      submitOtp(code);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newOtp = Array(6).fill("");
    pasted.split("").forEach((d, i) => { newOtp[i] = d; });
    setOtp(newOtp);

    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();

    if (pasted.length === 6) {
      submitOtp(pasted);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;

    setStatus({ message: "Sending new code...", type: "info" });

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "signup" }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to resend.");

      setStatus({ message: "New code sent to your email!", type: "success" });
      setResendCooldown(60);
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to resend.";
      setStatus({ message: msg, type: "error" });
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
        <div className="glass-card p-8 sm:p-10 space-y-6">
          <AnimatePresence mode="wait">
            {verified ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                >
                  <CheckCircle2 className="w-16 h-16 mx-auto text-success" />
                </motion.div>
                <h2 className="text-2xl font-bold">You&apos;re verified!</h2>
                <p className="text-muted text-sm">Redirecting to your dashboard...</p>
              </motion.div>
            ) : (
              <motion.div key="form" exit={{ opacity: 0 }}>
                {/* Header */}
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-accent to-accent-hot flex items-center justify-center shadow-glow mb-2">
                    <MailOpen className="w-7 h-7 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold">Check your email</h1>
                  <p className="text-sm text-muted">
                    We sent a 6-digit code to{" "}
                    <span className="text-accent-light font-medium">{email || "your email"}</span>
                  </p>
                </div>

                {/* OTP Inputs */}
                <div className="flex justify-center gap-2.5 sm:gap-3 mt-8" onPaste={handlePaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleInput(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      disabled={loading}
                      className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 bg-bg-elevated outline-none transition-all duration-200 ${
                        digit
                          ? "border-accent/60 text-white"
                          : "border-border text-muted"
                      } focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50`}
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </div>

                {/* Status */}
                {status.message && (
                  <div className="mt-4">
                    <StatusMessage message={status.message} type={status.type} />
                  </div>
                )}

                {/* Resend */}
                <div className="text-center mt-6">
                  <p className="text-sm text-muted mb-2">Didn&apos;t receive a code?</p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className="inline-flex items-center gap-2 text-sm font-medium text-accent-light hover:text-accent transition-colors disabled:text-muted disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resendCooldown > 0 ? "animate-spin" : ""}`} />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                  </button>
                </div>

                {/* Back to signup */}
                <div className="text-center mt-4 pt-4 border-t border-border">
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent-light transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Change email or sign up again
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[85vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyPageContent />
    </Suspense>
  );
}
