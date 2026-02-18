import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";
import {
  isValidEmail,
  isStrongPassword,
  getUserByField,
  buildSessionPayload,
  signSessionToken,
  hashPassword,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import { db } from "@/lib/firebase";

interface SignupBody {
  fullName?: string;
  email?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
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
    const userRef = db.collection("users").doc();
    const userProfile = {
      fullName: trimmedFullName,
      email: normalizedEmail,
      emailNormalized: normalizedEmail,
      username: username.trim(),
      usernameNormalized: normalizedUsername,
      passwordHash,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await userRef.set(userProfile);

    const sessionPayload = buildSessionPayload(userRef.id, userProfile);
    const sessionToken = signSessionToken(sessionPayload);
    const cookieOpts = getSessionCookieOptions();

    const response = NextResponse.json(
      { message: "Account created successfully.", redirectTo: "/", sessionToken },
      { status: 201 }
    );

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, cookieOpts);
    return response;
  } catch (error) {
    console.error("Signup error", error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
