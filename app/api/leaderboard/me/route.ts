import { NextRequest, NextResponse } from "next/server";
import { authenticateFromRequest } from "@/lib/auth";
import { db } from "@/lib/firebase";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = authenticateFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const userDoc = await db.collection("users").doc(user.uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const data = userDoc.data() || {};

    // Calculate rank: count users with more XP
    const userXp = data.xp ?? 0;
    let rank = 1;
    if (userXp > 0) {
      const higherSnap = await db
        .collection("users")
        .where("xp", ">", userXp)
        .count()
        .get();
      rank = (higherSnap.data().count ?? 0) + 1;
    } else {
      // For 0 XP, rank is total users count
      const totalSnap = await db.collection("users").count().get();
      rank = totalSnap.data().count ?? 1;
    }

    const fullName: string = data.fullName || data.username || "Anonymous";
    const parts = fullName.trim().split(/\s+/);
    const avatar =
      parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : fullName.slice(0, 2).toUpperCase();

    return NextResponse.json({
      uid: userDoc.id,
      rank,
      name: fullName,
      username: data.username || "",
      avatar,
      xp: data.xp ?? 0,
      challengesCompleted: data.challengesCompleted ?? 0,
      gamesPlayed: data.gamesPlayed ?? 0,
      streak: data.streak ?? 0,
    });
  } catch (error) {
    console.error("User stats error:", error);
    return NextResponse.json(
      { error: "Failed to load user stats." },
      { status: 500 }
    );
  }
}
