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
import { checkRateLimitAsync, getClientIp } from "@/lib/rateLimit";
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
    const rl = await checkRateLimitAsync(`signup:${ip}`, { max: 5, windowSeconds: 900 });
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

    // Send OTP email FIRST — if it fails, throw error and don't save.
    try {
      await sendOtpEmail(normalizedEmail, otpCode, trimmedFullName);
    } catch (emailErr) {
      console.error("Failed to send OTP on signup:", emailErr);
      return NextResponse.json(
        { error: "Failed to send verification email. Please check your email address." },
        { status: 500 }
      );
    }

    // Check for existing pending signup
    const pendingSnap = await db.collection("pending_signups").where("emailNormalized", "==", normalizedEmail).get();
    if (!pendingSnap.empty) {
      const existingDoc = pendingSnap.docs[0].data();
      // If there is an active OTP that hasn't expired yet, do not allow overriding the signup.
      // This prevents a pre-account takeover where an attacker sets their own password before the real user verifies.
      if (existingDoc.otpExpiry && Date.now() < existingDoc.otpExpiry) {
        return NextResponse.json(
          { error: "A signup is already pending for this email. Please check your inbox for the code or wait 10 minutes." },
          { status: 409 }
        );
      }
      // If expired, it's safe to delete old pending signups
      const batch = db.batch();
      pendingSnap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    // Save to pending_signups collection
    const pendingRef = db.collection("pending_signups").doc();
    await pendingRef.set(userProfile);

    // Don't issue a session token — defer to post-OTP verification
    return NextResponse.json(
      {
        message: "Code sent! Check your email for a verification code.",
        redirectTo: `/verify?email=${encodeURIComponent(normalizedEmail)}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error", error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
