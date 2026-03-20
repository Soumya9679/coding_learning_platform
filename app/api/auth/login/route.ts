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
import { checkRateLimitAsync, getClientIp } from "@/lib/rateLimit";
import { loginSchema, parseBody } from "@/lib/validators";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limit: 10 attempts per 15 minutes per IP
    const ip = getClientIp(request);
    const rl = await checkRateLimitAsync(`login:${ip}`, { max: 10, windowSeconds: 900 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Try again in ${rl.retryAfterSeconds}s.` },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }
    const raw = await request.json();
    const parsed = parseBody(loginSchema, raw);
    if (parsed.error) return parsed.error;
    const { usernameOrEmail, password } = parsed.data;
    const identifier = usernameOrEmail.trim().toLowerCase();

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
