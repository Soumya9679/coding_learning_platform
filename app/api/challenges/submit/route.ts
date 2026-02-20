import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";
import { authenticateFromRequest } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

/**
 * POST /api/challenges/submit
 * Validates a client-submitted challenge result.
 * Body: { challengeId, stdout, code }
 * Awards XP on first completion; reduced XP on repeat.
 */

interface SubmitBody {
  challengeId?: string;
  stdout?: string;
  code?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = authenticateFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const ip = getClientIp(request);
    const rl = checkRateLimit(`submit:${user.uid}:${ip}`, { max: 20, windowSeconds: 60 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many submissions. Please slow down." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    const body: SubmitBody = await request.json();
    const { challengeId = "", stdout = "", code = "" } = body;

    if (!challengeId) {
      return NextResponse.json({ error: "challengeId is required." }, { status: 400 });
    }
    if (!code.trim()) {
      return NextResponse.json({ error: "Code cannot be empty." }, { status: 400 });
    }

    // Fetch challenge from Firestore
    const challengeDoc = await db.collection("challenges").doc(challengeId).get();
    if (!challengeDoc.exists) {
      return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
    }

    const challenge = challengeDoc.data()!;
    const expectedOutput = (challenge.expectedOutput || "").trim();
    const actualOutput = stdout.trim();

    // Validate output
    const passed = actualOutput.length > 0 && actualOutput.includes(expectedOutput);

    if (!passed) {
      return NextResponse.json({
        passed: false,
        message: "Output does not match expected result.",
        expected: expectedOutput,
        actual: actualOutput,
        hint: challenge.retryHelp || "Review the criteria and try again.",
      });
    }

    // Award XP
    const userRef = db.collection("users").doc(user.uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const userData = userDoc.data()!;
    const completedChallenges: string[] = userData.completedChallenges || [];
    const isRepeat = completedChallenges.includes(challengeId);

    const baseXp = 100;
    const xpAwarded = isRepeat ? Math.floor(baseXp * 0.25) : baseXp;

    const updatePayload: Record<string, unknown> = {
      xp: admin.firestore.FieldValue.increment(xpAwarded),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!isRepeat) {
      updatePayload.completedChallenges = admin.firestore.FieldValue.arrayUnion(challengeId);
      updatePayload.challengesCompleted = admin.firestore.FieldValue.increment(1);
    }

    // Update streak
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const lastActiveDate: string = userData.lastActiveDate || "";

    if (lastActiveDate !== today) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (lastActiveDate === yesterdayStr) {
        updatePayload.streak = admin.firestore.FieldValue.increment(1);
      } else {
        updatePayload.streak = 1;
      }
      updatePayload.lastActiveDate = today;
    }

    // Record submission
    await db.collection("submissions").add({
      userId: user.uid,
      challengeId,
      code,
      stdout: actualOutput,
      passed: true,
      xpAwarded,
      isRepeat,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await userRef.update(updatePayload);

    // Read back updated stats
    const updatedDoc = await userRef.get();
    const updatedData = updatedDoc.data() || {};

    return NextResponse.json({
      passed: true,
      message: isRepeat ? `Correct! +${xpAwarded} XP (repeat)` : `Correct! +${xpAwarded} XP`,
      xpAwarded,
      isRepeat,
      xp: updatedData.xp || 0,
      challengesCompleted: updatedData.challengesCompleted || 0,
      streak: updatedData.streak || 0,
    });
  } catch (error) {
    console.error("Challenge submit error:", error);
    return NextResponse.json({ error: "Failed to submit challenge." }, { status: 500 });
  }
}
