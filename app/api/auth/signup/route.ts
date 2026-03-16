import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";
import crypto from "crypto";
import {
  isValidEmail,
  isStrongPassword,
  getUserByField,
  hashPassword,
} from "@/lib/auth";
import { db } from "@/lib/firebase";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { sendOtpEmail } from "@/lib/email";

interface SignupBody {
  fullName?: string;
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limit: 5 signups per 15 minutes per IP
    const ip = getClientIp(request);
    const rl = checkRateLimit(`signup:${ip}`, { max: 5, windowSeconds: 900 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many signup attempts. Try again in ${rl.retryAfterSeconds}s.` },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }
    const body: SignupBody = await request.json();
    const {
      fullName = "",
      email = "",
      username = "",
      password = "",
      confirmPassword = "",
    } = body || {};

    const trimmedFullName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    const validationErrors: string[] = [];
    if (trimmedFullName.length < 2)
      validationErrors.push("Full name must be at least 2 characters long.");
    if (!isValidEmail(normalizedEmail))
      validationErrors.push("Provide a valid email address.");
    if (normalizedUsername.length < 3)
      validationErrors.push("Username must be at least 3 characters long.");
    if (!isStrongPassword(password))
      validationErrors.push("Password must be 8+ characters and include a number.");
    if (password !== confirmPassword)
      validationErrors.push("Password and confirmation must match.");

    if (validationErrors.length) {
      return NextResponse.json({ errors: validationErrors }, { status: 400 });
    }

    const [emailMatch, usernameMatch] = await Promise.all([
      getUserByField("emailNormalized", normalizedEmail),
      getUserByField("usernameNormalized", normalizedUsername),
    ]);

    if (emailMatch)
      return NextResponse.json({ error: "That email is already registered." }, { status: 409 });
    if (usernameMatch)
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });

    const passwordHash = await hashPassword(password);

    // Generate 6-digit OTP for email verification
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    const userRef = db.collection("users").doc();
    const userProfile = {
      fullName: trimmedFullName,
      email: normalizedEmail,
      emailNormalized: normalizedEmail,
      username: username.trim(),
      usernameNormalized: normalizedUsername,
      passwordHash,
      xp: 0,
      challengesCompleted: 0,
      gamesPlayed: 0,
      streak: 0,
      completedChallenges: [],
      lastActiveDate: "",
      emailVerified: false,
      otpCode,
      otpExpiry,
      otpAttempts: 0,
      otpType: "signup",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await userRef.set(userProfile);

    // Send OTP email (non-blocking failure — user can resend from verify page)
    try {
      await sendOtpEmail(normalizedEmail, otpCode, trimmedFullName);
    } catch (emailErr) {
      console.error("Failed to send OTP on signup:", emailErr);
    }

    // Don't issue a session token — defer to post-OTP verification
    return NextResponse.json(
      {
        message: "Account created! Check your email for a verification code.",
        redirectTo: `/verify?email=${encodeURIComponent(normalizedEmail)}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error", error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
