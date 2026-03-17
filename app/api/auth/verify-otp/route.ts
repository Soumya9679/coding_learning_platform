import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  buildSessionPayload,
  signSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { sendWelcomeEmail } from "@/lib/email";

/**
 * POST /api/auth/verify-otp
 * body: { email: string, otp: string }
 *
 * Validates the OTP, marks email as verified, issues a session token.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`verify-otp:${ip}`, { max: 10, windowSeconds: 300 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();
    const otp = (body.otp || "").trim();

    if (!email || !otp || otp.length !== 6) {
      return NextResponse.json({ error: "Email and 6-digit code are required." }, { status: 400 });
    }

    // Find user in users or pending_signups
    let snap = await db.collection("users").where("emailNormalized", "==", email).limit(1).get();
    let isPending = false;
    
    if (snap.empty) {
      snap = await db.collection("pending_signups").where("emailNormalized", "==", email).limit(1).get();
      if (!snap.empty) {
        isPending = true;
      }
    }

    if (snap.empty) {
      return NextResponse.json({ error: "Invalid verification attempt." }, { status: 404 });
    }

    const userDoc = snap.docs[0];
    const data = userDoc.data();

    // Check if already verified (for signup OTPs only)
    if (data.emailVerified && data.otpType !== "reset") {
      return NextResponse.json({ message: "Email already verified." });
    }

    // Check OTP attempts (max 5)
    if ((data.otpAttempts || 0) >= 5) {
      return NextResponse.json(
        { error: "Too many failed attempts. Please request a new code." },
        { status: 429 }
      );
    }

    // Check expiry
    if (!data.otpCode || !data.otpExpiry || Date.now() > data.otpExpiry) {
      return NextResponse.json(
        { error: "Code has expired. Please request a new one." },
        { status: 410 }
      );
    }

    // Validate OTP
    if (data.otpCode !== otp) {
      // Increment attempts
      await userDoc.ref.update({ otpAttempts: (data.otpAttempts || 0) + 1 });
      const remaining = 5 - (data.otpAttempts || 0) - 1;
      return NextResponse.json(
        { error: `Invalid code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` },
        { status: 401 }
      );
    }

    // OTP is valid — clear OTP fields
    const updatePayload: Record<string, unknown> = {
      otpCode: null,
      otpExpiry: null,
      otpAttempts: null,
      otpType: null,
    };

    let finalUserDocId = userDoc.id;

    // For signup verification: mark email verified
    if (data.otpType !== "reset") {
      updatePayload.emailVerified = true;
      updatePayload.verificationToken = null;
      updatePayload.verificationTokenExpiry = null;
      
      if (isPending) {
        // Move to users collection
        const newUserRef = db.collection("users").doc();
        await newUserRef.set({
          ...data,
          ...updatePayload
        });
        await userDoc.ref.delete();
        finalUserDocId = newUserRef.id;
      } else {
        await userDoc.ref.update(updatePayload);
      }
    } else {
      await userDoc.ref.update(updatePayload);
    }

    // For signup: send welcome email (non-blocking)
    if (data.otpType !== "reset") {
      sendWelcomeEmail(email, data.fullName || "Learner").catch(() => {});
    }

    // For reset flow: don't issue a session, just confirm OTP is valid
    if (data.otpType === "reset") {
      return NextResponse.json({
        message: "Code verified. You can now set a new password.",
        verified: true,
      });
    }

    // For signup: issue session token
    const sessionPayload = buildSessionPayload(finalUserDocId, { ...data, ...updatePayload });
    const sessionToken = signSessionToken(sessionPayload);
    const cookieOpts = getSessionCookieOptions();

    const response = NextResponse.json({
      message: "Email verified successfully!",
      verified: true,
      redirectTo: "/",
      sessionToken,
    });

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, cookieOpts);
    return response;
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
