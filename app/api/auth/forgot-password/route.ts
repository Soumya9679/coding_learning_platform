import { NextRequest, NextResponse } from "next/server";
import {
  getUserByField,
  isStrongPassword,
  hashPassword,
} from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

/**
 * POST /api/auth/forgot-password
 * body: { email, newPassword, confirmPassword }
 *
 * Requires OTP to have been verified first (via /api/auth/verify-otp with type "reset").
 * The verify-otp endpoint clears otpCode/otpExpiry but does NOT issue a session —
 * it just confirms the user's identity so they can reset their password here.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`forgot:${ip}`, { max: 5, windowSeconds: 900 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${rl.retryAfterSeconds}s.` },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    const { email = "", newPassword = "", confirmPassword = "" } = body || {};
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    if (!newPassword || !confirmPassword) {
      return NextResponse.json({ error: "New password and confirmation are required." }, { status: 400 });
    }

    if (!isStrongPassword(newPassword)) {
      return NextResponse.json({ error: "Password must be 8+ characters and include a number." }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Password and confirmation must match." }, { status: 400 });
    }

    const user = await getUserByField("emailNormalized", normalizedEmail);
    if (!user) {
      return NextResponse.json(
        { error: "We couldn't find an account with that email." },
        { status: 400 }
      );
    }

    // Update password
    const newHash = await hashPassword(newPassword);
    await user.ref.update({ passwordHash: newHash });

    return NextResponse.json({ message: "Password reset successful! You can now sign in." });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
