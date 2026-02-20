import { NextRequest, NextResponse } from "next/server";
import { authenticateFromRequest, sanitizeText } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

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

    // Build achievements
    const completedChallenges: string[] = data.completedChallenges || [];
    const achievements = computeAchievements({
      xp: userXp,
      challengesCompleted: data.challengesCompleted || 0,
      gamesPlayed: data.gamesPlayed || 0,
      streak: data.streak || 0,
      rank,
    });

    return NextResponse.json({
      uid: user.uid,
      fullName: data.fullName || "",
      username: data.username || "",
      email: data.email || "",
      xp: userXp,
      rank,
      challengesCompleted: data.challengesCompleted || 0,
      completedChallenges,
      gamesPlayed: data.gamesPlayed || 0,
      streak: data.streak || 0,
      lastActiveDate: data.lastActiveDate || "",
      createdAt: data.createdAt?.toDate?.()?.toISOString() || "",
      recentSubmissions,
      achievements,
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

/* ─── Achievement computation (server-side, shared with leaderboard) ─── */

interface UserStats {
  xp: number;
  challengesCompleted: number;
  gamesPlayed: number;
  streak: number;
  rank: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  color: string;
}

function computeAchievements(stats: UserStats): Achievement[] {
  return [
    { id: "first_run", title: "First Run", description: "Earn your first XP", icon: "Zap", unlocked: stats.xp > 0, color: "warning" },
    { id: "coder", title: "Coder", description: "Complete 3+ challenges", icon: "Code2", unlocked: stats.challengesCompleted >= 3, color: "success" },
    { id: "sharpshooter", title: "Sharpshooter", description: "Complete 5 challenges", icon: "Target", unlocked: stats.challengesCompleted >= 5, color: "success" },
    { id: "champion", title: "Champion", description: "Complete 10 challenges", icon: "Trophy", unlocked: stats.challengesCompleted >= 10, color: "warning" },
    { id: "master", title: "Grand Master", description: "Complete 20 challenges", icon: "Crown", unlocked: stats.challengesCompleted >= 20, color: "accent-hot" },
    { id: "on_fire", title: "On Fire", description: "7-day streak", icon: "Flame", unlocked: stats.streak >= 7, color: "accent-hot" },
    { id: "unstoppable", title: "Unstoppable", description: "30-day streak", icon: "Flame", unlocked: stats.streak >= 30, color: "danger" },
    { id: "gamer", title: "Gamer", description: "Play 3 mini-games", icon: "Gamepad2", unlocked: stats.gamesPlayed >= 3, color: "accent-light" },
    { id: "arcade_king", title: "Arcade King", description: "Play 10 mini-games", icon: "Gamepad2", unlocked: stats.gamesPlayed >= 10, color: "accent" },
    { id: "top3", title: "Top 3", description: "Reach top 3 on leaderboard", icon: "Crown", unlocked: stats.rank <= 3, color: "warning" },
    { id: "xp_master", title: "XP Master", description: "Earn 1,000+ XP", icon: "Star", unlocked: stats.xp >= 1000, color: "accent" },
    { id: "xp_legend", title: "XP Legend", description: "Earn 5,000+ XP", icon: "Star", unlocked: stats.xp >= 5000, color: "accent-hot" },
  ];
}
