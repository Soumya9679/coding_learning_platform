import { NextRequest, NextResponse } from "next/server";
import { authenticateFromRequest } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { computeLevel } from "@/lib/levels";
import { ACHIEVEMENTS, getAchievementRarityStats } from "@/lib/achievements";

/**
 * GET /api/progress — returns full progress dashboard data.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`progress:${ip}`, { max: 20, windowSeconds: 60 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const user = authenticateFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userDoc = await db.collection("users").doc(user.uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data = userDoc.data()!;
    const xp = data.xp || 0;
    const level = computeLevel(xp);

    // ── Streak calendar (last 365 days) ─────────────────────
    const now = new Date();
    const streakCalendar: Array<{ date: string; active: boolean; xpEarned: number }> = [];
    const activeDays: Set<string> = new Set(data.activeDays || []);

    for (let i = 364; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      streakCalendar.push({
        date: dateStr,
        active: activeDays.has(dateStr),
        xpEarned: 0, // enriched below if available
      });
    }

    // ── XP History (last 30 days from submissions) ──────────
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const subsSnap = await db
      .collection("submissions")
      .where("userId", "==", user.uid)
      .get();

    const xpByDate: Record<string, number> = {};
    let challengeXp = 0;
    let totalAttempts = 0;
    let passedAttempts = 0;

    subsSnap.docs.forEach((doc) => {
      const d = doc.data();
      totalAttempts++;
      if (d.passed) passedAttempts++;

      const createdAt = d.createdAt?.toDate?.();
      if (!createdAt) return;
      const dateStr = createdAt.toISOString().split("T")[0];
      const xpVal = d.xpAwarded || 0;

      if (createdAt >= thirtyDaysAgo) {
        xpByDate[dateStr] = (xpByDate[dateStr] || 0) + xpVal;
      }
      challengeXp += xpVal;
    });

    const xpHistory: Array<{ date: string; xp: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      xpHistory.push({ date: dateStr, xp: xpByDate[dateStr] || 0 });
    }

    // Enrich streak calendar with XP data
    for (const entry of streakCalendar) {
      if (xpByDate[entry.date]) {
        entry.xpEarned = xpByDate[entry.date];
      }
    }

    // ── XP breakdown ────────────────────────────────────────
    const gameXp = (data.gamesPlayed || 0) * 50; // approximate
    const duelXp = (data.duelsWon || 0) * 50;
    const dailyXp = ((data.dailyCompleted || 0) + (data.weeklyCompleted || 0)) * 100;
    const otherXp = Math.max(0, xp - challengeXp - gameXp - duelXp - dailyXp);

    // ── Weekly / Monthly XP ─────────────────────────────────
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);

    let weeklyXp = 0;
    let monthlyXp = 0;
    for (const [dateStr, val] of Object.entries(xpByDate)) {
      const d = new Date(dateStr);
      if (d >= weekAgo) weeklyXp += val;
      if (d >= monthAgo) monthlyXp += val;
    }

    // ── Achievements ────────────────────────────────────────
    const unlockedAchievements: string[] = data.unlockedAchievements || [];
    const rarityStats = getAchievementRarityStats(unlockedAchievements);

    // ── Recent milestones (from notifications) ──────────────
    const milestonesSnap = await db
      .collection("users")
      .doc(user.uid)
      .collection("notifications")
      .where("type", "in", ["achievement_unlock", "level_up", "streak_milestone"])
      .limit(10)
      .get();

    const recentMilestones = milestonesSnap.docs
      .map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          type: d.type,
          title: d.title,
          message: d.message,
          icon: d.icon || null,
          color: d.color || null,
          link: d.link || null,
          read: d.read ?? false,
          createdAt: d.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // ── Best streak ─────────────────────────────────────────
    const bestStreak = data.bestStreak || data.streak || 0;

    return NextResponse.json({
      level,
      streakCalendar,
      xpHistory,
      xpBreakdown: {
        challenges: challengeXp,
        games: gameXp,
        duels: duelXp,
        daily: dailyXp,
        other: otherXp,
      },
      completionRate: totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0,
      totalTimeSpent: Math.round(totalAttempts * 5), // ~5 min per attempt estimate
      bestStreak,
      currentStreak: data.streak || 0,
      weeklyXp,
      monthlyXp,
      recentMilestones,
      achievementStats: rarityStats,
      achievements: ACHIEVEMENTS.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        icon: a.icon,
        color: a.color,
        category: a.category,
        rarity: a.rarity,
        unlocked: unlockedAchievements.includes(a.id),
      })),
    });
  } catch (error) {
    console.error("Progress GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
