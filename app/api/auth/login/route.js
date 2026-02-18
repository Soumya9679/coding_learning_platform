import { NextResponse } from "next/server";
import admin from "firebase-admin";
import {
  getUserByField,
  buildSessionPayload,
  signSessionToken,
  comparePassword,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const { usernameOrEmail = "", password = "" } = body || {};
    const identifier = usernameOrEmail.trim().toLowerCase();

    if (!identifier || !password) {
      return NextResponse.json({ error: "Username/email and password are both required." }, { status: 400 });
    }

    const lookupField = identifier.includes("@") ? "emailNormalized" : "usernameNormalized";
    const userRecord = await getUserByField(lookupField, identifier);

    if (!userRecord) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const passwordsMatch = await comparePassword(password, userRecord.passwordHash || "");
    if (!passwordsMatch) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    await userRecord.ref.update({
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const sessionPayload = buildSessionPayload(userRecord.id, userRecord);
    const sessionToken = signSessionToken(sessionPayload);
    const cookieOpts = getSessionCookieOptions();

    const response = NextResponse.json({
      message: "Welcome back!",
      redirectTo: "/",
      sessionToken,
    });

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, cookieOpts);
    return response;
  } catch (error) {
    console.error("Login error", error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
