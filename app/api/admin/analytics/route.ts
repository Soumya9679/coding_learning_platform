import { NextRequest, NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/admin";
import { db } from "@/lib/firebase";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const admin = await authenticateAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const usersSnap = await db.collection("users").get();

    // ── XP distribution buckets ──
    const xpBuckets: Record<string, number> = {
      "0": 0,
      "1-100": 0,
      "101-300": 0,
      "301-500": 0,
      "501-1000": 0,
      "1001-2000": 0,
      "2000+": 0,
    };

    // ── Challenge completion distribution ──
    const challengeBuckets: Record<string, number> = {
      "0": 0,
      "1-3": 0,
      "4-7": 0,
      "8-12": 0,
      "13-17": 0,
      "18-20": 0,
    };

    // ── Games played distribution ──
    const gameBuckets: Record<string, number> = {
      "0": 0,
      "1-5": 0,
      "6-15": 0,
      "16-30": 0,
      "30+": 0,
    };

    // ── Activity by day of week (from lastActiveDate) ──
    const dayOfWeekActivity = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // ── Streak distribution ──
    const streakBuckets: Record<string, number> = {
      "0": 0,
      "1-3": 0,
      "4-7": 0,
      "8-14": 0,
      "15+": 0,
    };

    // ── Signups over last 30 days ──
    const now = new Date();
    const signupsByDay: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      signupsByDay[d.toISOString().split("T")[0]] = 0;
    }

    // ── Per-challenge completion count ──
    const challengeCompletions: Record<string, number> = {};

    // ── Aggregated user-level metrics ──
    let totalXp = 0;
    let maxXp = 0;
    let maxStreak = 0;
    let maxChallenges = 0;
    let usersWithZeroXp = 0;

    usersSnap.docs.forEach((doc) => {
      const d = doc.data();
      const xp = d.xp ?? 0;
      const cc = d.challengesCompleted ?? 0;
      const gp = d.gamesPlayed ?? 0;
      const streak = d.streak ?? 0;
      const completedChallenges: string[] = d.completedChallenges || [];

      totalXp += xp;
      if (xp > maxXp) maxXp = xp;
      if (streak > maxStreak) maxStreak = streak;
      if (cc > maxChallenges) maxChallenges = cc;
      if (xp === 0) usersWithZeroXp++;

      // XP dist
      if (xp === 0) xpBuckets["0"]++;
      else if (xp <= 100) xpBuckets["1-100"]++;
      else if (xp <= 300) xpBuckets["101-300"]++;
      else if (xp <= 500) xpBuckets["301-500"]++;
      else if (xp <= 1000) xpBuckets["501-1000"]++;
      else if (xp <= 2000) xpBuckets["1001-2000"]++;
      else xpBuckets["2000+"]++;

      // Challenge dist
      if (cc === 0) challengeBuckets["0"]++;
      else if (cc <= 3) challengeBuckets["1-3"]++;
      else if (cc <= 7) challengeBuckets["4-7"]++;
      else if (cc <= 12) challengeBuckets["8-12"]++;
      else if (cc <= 17) challengeBuckets["13-17"]++;
      else challengeBuckets["18-20"]++;

      // Game dist
      if (gp === 0) gameBuckets["0"]++;
      else if (gp <= 5) gameBuckets["1-5"]++;
      else if (gp <= 15) gameBuckets["6-15"]++;
      else if (gp <= 30) gameBuckets["16-30"]++;
      else gameBuckets["30+"]++;

      // Streak dist
      if (streak === 0) streakBuckets["0"]++;
      else if (streak <= 3) streakBuckets["1-3"]++;
      else if (streak <= 7) streakBuckets["4-7"]++;
      else if (streak <= 14) streakBuckets["8-14"]++;
      else streakBuckets["15+"]++;

      // Last active day of week
      if (d.lastActiveDate) {
        const day = new Date(d.lastActiveDate + "T12:00:00Z").getUTCDay();
        dayOfWeekActivity[day]++;
      }

      // Signups by day
      const createdStr = d.createdAt?.toDate?.()
        ? d.createdAt.toDate().toISOString().split("T")[0]
        : "";
      if (createdStr && signupsByDay[createdStr] !== undefined) {
        signupsByDay[createdStr]++;
      }

      // Per-challenge completions
      completedChallenges.forEach((cId: string) => {
        challengeCompletions[cId] = (challengeCompletions[cId] || 0) + 1;
      });
    });

    const totalUsers = usersSnap.size;
    const avgXp = totalUsers > 0 ? Math.round(totalXp / totalUsers) : 0;

    // ── Submission-level analytics ──
    let submissionStats: Record<string, { attempts: number; passes: number; totalXp: number }> = {};
    try {
      const subsSnap = await db.collection("submissions").get();
      subsSnap.docs.forEach((doc) => {
        const d = doc.data();
        const cId = d.challengeId || "unknown";
        if (!submissionStats[cId]) {
          submissionStats[cId] = { attempts: 0, passes: 0, totalXp: 0 };
        }
        submissionStats[cId].attempts++;
        if (d.passed) submissionStats[cId].passes++;
        submissionStats[cId].totalXp += d.xpAwarded || 0;
      });
    } catch {
      // submissions collection may not exist yet
    }

    const challengeAnalytics = Object.entries(submissionStats)
      .map(([id, stats]) => ({
        challengeId: id,
        attempts: stats.attempts,
        passes: stats.passes,
        successRate: stats.attempts > 0 ? Math.round((stats.passes / stats.attempts) * 100) : 0,
        totalXpAwarded: stats.totalXp,
      }))
      .sort((a, b) => a.successRate - b.successRate); // most-failed first

    return NextResponse.json({
      overview: {
        totalUsers,
        totalXp,
        avgXp,
        maxXp,
        maxStreak,
        maxChallenges,
        usersWithZeroXp,
        engagementRate: totalUsers > 0 ? Math.round(((totalUsers - usersWithZeroXp) / totalUsers) * 100) : 0,
      },
      xpDistribution: xpBuckets,
      challengeDistribution: challengeBuckets,
      gameDistribution: gameBuckets,
      streakDistribution: streakBuckets,
      activityByDayOfWeek: dayLabels.map((label, i) => ({ day: label, count: dayOfWeekActivity[i] })),
      signupTrend: Object.entries(signupsByDay).map(([date, count]) => ({ date, count })),
      challengeCompletions: Object.entries(challengeCompletions)
        .map(([id, count]) => ({ challengeId: id, completions: count }))
        .sort((a, b) => b.completions - a.completions),
      challengeAnalytics,
    });
  } catch (err) {
    console.error("Admin analytics error:", err);
    return NextResponse.json({ error: "Failed to load analytics." }, { status: 500 });
  }
}
