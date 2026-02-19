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

    let totalXp = 0;
    let totalChallengesCompleted = 0;
    let totalGamesPlayed = 0;
    let activeToday = 0;
    let activeLast7Days = 0;
    let adminsCount = 0;

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const last7 = new Date(now);
    last7.setDate(last7.getDate() - 7);
    const last7Str = last7.toISOString().split("T")[0];

    interface RecentUser {
      uid: string;
      username: string;
      fullName: string;
      email: string;
      xp: number;
      createdAt: string;
    }
    interface TopUser {
      uid: string;
      username: string;
      fullName: string;
      xp: number;
      challengesCompleted: number;
      gamesPlayed: number;
    }

    const recentSignups: RecentUser[] = [];
    const topUsers: TopUser[] = [];

    usersSnap.docs.forEach((doc) => {
      const d = doc.data();
      const xp = d.xp ?? 0;
      totalXp += xp;
      totalChallengesCompleted += d.challengesCompleted ?? 0;
      totalGamesPlayed += d.gamesPlayed ?? 0;

      if (d.role === "admin") adminsCount++;

      const lastActive: string = d.lastActiveDate || "";
      if (lastActive === todayStr) activeToday++;
      if (lastActive >= last7Str) activeLast7Days++;

      // Collect for recent signups (we'll sort later)
      const createdAt = d.createdAt?.toDate?.()
        ? d.createdAt.toDate().toISOString()
        : d.createdAt || "";

      recentSignups.push({
        uid: doc.id,
        username: d.username || "",
        fullName: d.fullName || "",
        email: d.email || d.emailNormalized || "",
        xp,
        createdAt,
      });

      topUsers.push({
        uid: doc.id,
        username: d.username || "",
        fullName: d.fullName || "",
        xp,
        challengesCompleted: d.challengesCompleted ?? 0,
        gamesPlayed: d.gamesPlayed ?? 0,
      });
    });

    // Sort & slice
    recentSignups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    topUsers.sort((a, b) => b.xp - a.xp);

    return NextResponse.json({
      totalUsers: usersSnap.size,
      totalXp,
      totalChallengesCompleted,
      totalGamesPlayed,
      activeToday,
      activeLast7Days,
      adminsCount,
      recentSignups: recentSignups.slice(0, 8),
      topUsers: topUsers.slice(0, 5),
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    return NextResponse.json({ error: "Failed to load stats." }, { status: 500 });
  }
}
