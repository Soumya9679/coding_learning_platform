import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";
import { authenticateFromRequest } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { evaluateAchievements } from "@/lib/achievements";
import { checkLevelUp } from "@/lib/levels";

// Valid XP actions and their point values
const XP_ACTIONS: Record<string, number> = {
  challenge_complete: 100,
  challenge_first_try: 150,
  game_complete: 50,
  game_perfect: 100,
  daily_login: 25,
};

interface XpBody {
  action?: string;
  challengeId?: string;
  gameId?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = authenticateFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body: XpBody = await request.json();
    const { action = "", challengeId, gameId } = body;

    const xpAmount = XP_ACTIONS[action];
    if (!xpAmount) {
      return NextResponse.json(
        { error: `Invalid action. Allowed: ${Object.keys(XP_ACTIONS).join(", ")}` },
        { status: 400 }
      );
    }

    // Find user doc by uid
    const userRef = db.collection("users").doc(user.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const userData = userDoc.data() || {};
    const now = new Date();
    const today = now.toISOString().split("T")[0]; // "YYYY-MM-DD"

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      xp: admin.firestore.FieldValue.increment(xpAmount),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Track challenge completions (avoid duplicates)
    if (action.startsWith("challenge") && challengeId) {
      const completedChallenges: string[] = userData.completedChallenges || [];
      if (!completedChallenges.includes(challengeId)) {
        updatePayload.completedChallenges = admin.firestore.FieldValue.arrayUnion(challengeId);
        updatePayload.challengesCompleted = admin.firestore.FieldValue.increment(1);
      } else {
        // Already completed this challenge, award reduced XP
        updatePayload.xp = admin.firestore.FieldValue.increment(Math.floor(xpAmount * 0.25));
      }
    }

    // Track game completions
    if (action.startsWith("game") && gameId) {
      updatePayload.gamesPlayed = admin.firestore.FieldValue.increment(1);
    }

    // Streak tracking
    const lastActiveDate: string = userData.lastActiveDate || "";
    if (lastActiveDate !== today) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (lastActiveDate === yesterdayStr) {
        // Consecutive day — increment streak
        updatePayload.streak = admin.firestore.FieldValue.increment(1);
      } else if (lastActiveDate !== today) {
        // Streak broken — reset to 1
        updatePayload.streak = 1;
      }
      updatePayload.lastActiveDate = today;
    }

    // Track active days for streak calendar
    updatePayload.activeDays = admin.firestore.FieldValue.arrayUnion(today);

    // Track best streak
    const currentStreak = userData.streak || 0;
    const bestStreak = userData.bestStreak || 0;
    if (currentStreak + 1 > bestStreak) {
      updatePayload.bestStreak = currentStreak + 1;
    }

    const oldXp = userData.xp || 0;
    await userRef.update(updatePayload);

    // Read back updated stats
    const updatedDoc = await userRef.get();
    const updatedData = updatedDoc.data() || {};
    const newXp = updatedData.xp || 0;

    // Check for level up
    const levelUp = checkLevelUp(oldXp, newXp);
    if (levelUp) {
      await db.collection("users").doc(user.uid).collection("notifications").add({
        type: "level_up",
        title: "Level Up!",
        message: `You reached Level ${levelUp.level} — ${levelUp.title}!`,
        icon: levelUp.icon,
        color: levelUp.color.replace("text-", ""),
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Evaluate achievements (non-blocking)
    evaluateAchievements(user.uid, {
      xp: newXp,
      challengesCompleted: updatedData.challengesCompleted || 0,
      gamesPlayed: updatedData.gamesPlayed || 0,
      streak: updatedData.streak || 0,
      rank: 0,
      duelsWon: updatedData.duelsWon || 0,
      duelsPlayed: updatedData.duelsPlayed || 0,
      commentsPosted: 0,
      followersCount: 0,
      daysActive: (updatedData.activeDays || []).length,
    }).catch((err) => console.error("Achievement eval error:", err));

    return NextResponse.json({
      message: `+${xpAmount} XP`,
      xp: newXp,
      challengesCompleted: updatedData.challengesCompleted || 0,
      gamesPlayed: updatedData.gamesPlayed || 0,
      streak: updatedData.streak || 0,
      levelUp: levelUp ? { level: levelUp.level, title: levelUp.title } : null,
    });
  } catch (error) {
    console.error("XP update error:", error);
    return NextResponse.json(
      { error: "Failed to update XP." },
      { status: 500 }
    );
  }
}
