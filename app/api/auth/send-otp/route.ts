import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/firebase";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { sendOtpEmail, sendPasswordResetOtp } from "@/lib/email";

/**
 * POST /api/auth/send-otp
 * body: { email: string, type?: "signup" | "reset" }
 *
 * Generates a 6-digit OTP, stores it on the user doc, and sends it via email.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`send-otp:${ip}`, { max: 5, windowSeconds: 900 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${rl.retryAfterSeconds}s.` },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();
    const type = body.type || "signup"; // "signup" | "reset"

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required." }, { status: 400 });
    }

    // Find user by email
    const snap = await db
      .collection("users")
      .where("emailNormalized", "==", email)
      .limit(1)
      .get();

    if (snap.empty) {
      // For security, don't reveal whether the email exists for reset
      if (type === "reset") {
        return NextResponse.json({ message: "If that email is registered, a code has been sent." });
      }
      return NextResponse.json({ error: "No account found with that email." }, { status: 404 });
    }

    const userDoc = snap.docs[0];
    const userData = userDoc.data();

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP on user document
    await userDoc.ref.update({
      otpCode: otp,
      otpExpiry,
      otpAttempts: 0,
      otpType: type,
    });

    // Send email
    if (type === "reset") {
      await sendPasswordResetOtp(email, otp);
    } else {
      await sendOtpEmail(email, otp, userData.fullName);
    }

    return NextResponse.json({
      message: "Verification code sent to your email.",
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    const msg = error instanceof Error ? error.message : "Failed to send code.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
