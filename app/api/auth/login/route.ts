import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";
import {
  getUserByField,
  buildSessionPayload,
  signSessionToken,
  comparePassword,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

interface LoginBody {
  usernameOrEmail?: string;
  password?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: LoginBody = await request.json();
    const { usernameOrEmail = "", password = "" } = body || {};
    const identifier = usernameOrEmail.trim().toLowerCase();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Username/email and password are both required." },
        { status: 400 }
      );
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

    // Backfill leaderboard fields for users who signed up before they existed
    const updatePayload: Record<string, unknown> = {
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (userRecord.xp === undefined) updatePayload.xp = 0;
    if (userRecord.challengesCompleted === undefined) updatePayload.challengesCompleted = 0;
    if (userRecord.gamesPlayed === undefined) updatePayload.gamesPlayed = 0;
    if (userRecord.streak === undefined) updatePayload.streak = 0;
    if (userRecord.completedChallenges === undefined) updatePayload.completedChallenges = [];
    if (userRecord.lastActiveDate === undefined) updatePayload.lastActiveDate = "";

    await userRecord.ref.update(updatePayload);

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
