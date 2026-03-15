import { NextRequest, NextResponse } from "next/server";
import { authenticateFromRequest, sanitizeText } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { computeLevel } from "@/lib/levels";
import { ACHIEVEMENTS, getAchievementRarityStats } from "@/lib/achievements";

/**
 * GET /api/profile — get full profile + stats for the current user.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`profile:${ip}`, { max: 30, windowSeconds: 60 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    const user = authenticateFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const userDoc = await db.collection("users").doc(user.uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const data = userDoc.data()!;

    // Calculate rank
    const userXp = data.xp || 0;
    const higherXp = await db
      .collection("users")
      .where("xp", ">", userXp)
      .count()
      .get();
    const rank = (higherXp.data().count || 0) + 1;

    // Get recent submissions (sort in-memory to avoid needing a composite index)
    const subsSnap = await db
      .collection("submissions")
      .where("userId", "==", user.uid)
      .get();

    const recentSubmissions = subsSnap.docs
      .map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          challengeId: d.challengeId,
          passed: d.passed,
          xpAwarded: d.xpAwarded,
          isRepeat: d.isRepeat,
          createdAt: d.createdAt?.toDate?.()?.toISOString() || "",
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);

    // Build achievements (new server-side persistent system)
    const unlockedAchievements: string[] = data.unlockedAchievements || [];
    const achievements = ACHIEVEMENTS.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      icon: a.icon,
      color: a.color,
      category: a.category,
      rarity: a.rarity,
      unlocked: unlockedAchievements.includes(a.id),
    }));
    const achievementStats = getAchievementRarityStats(unlockedAchievements);

    // Compute level
    const level = computeLevel(userXp);

    return NextResponse.json({
      uid: user.uid,
      fullName: data.fullName || "",
      username: data.username || "",
      email: data.email || "",
      xp: userXp,
      rank,
      level,
      challengesCompleted: data.challengesCompleted || 0,
      completedChallenges: data.completedChallenges || [],
      gamesPlayed: data.gamesPlayed || 0,
      streak: data.streak || 0,
      bestStreak: data.bestStreak || data.streak || 0,
      lastActiveDate: data.lastActiveDate || "",
      createdAt: data.createdAt?.toDate?.()?.toISOString() || "",
      recentSubmissions,
      achievements,
      achievementStats,
    });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Failed to load profile." }, { status: 500 });
  }
}

/**
 * PATCH /api/profile — update display name.
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const user = authenticateFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json();
    const { fullName } = body || {};

    if (!fullName || fullName.trim().length < 2) {
      return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
    }

    await db.collection("users").doc(user.uid).update({
      fullName: sanitizeText(fullName, 100),
    });

    return NextResponse.json({ message: "Profile updated.", fullName: fullName.trim() });
  } catch (error) {
    console.error("Profile PATCH error:", error);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}

/* Achievement computation is now in lib/achievements.ts */
