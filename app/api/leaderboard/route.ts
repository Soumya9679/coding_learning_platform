import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";

export async function GET(): Promise<NextResponse> {
  try {
    const snapshot = await db
      .collection("users")
      .orderBy("xp", "desc")
      .limit(50)
      .get();

    const entries = snapshot.docs.map((doc, index) => {
      const data = doc.data();
      const fullName: string = data.fullName || data.username || "Anonymous";
      // Build initials from full name (max 2 chars)
      const parts = fullName.trim().split(/\s+/);
      const avatar =
        parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : fullName.slice(0, 2).toUpperCase();

      return {
        uid: doc.id,
        rank: index + 1,
        name: fullName,
        username: data.username || "",
        avatar,
        xp: data.xp ?? 0,
        challengesCompleted: data.challengesCompleted ?? 0,
        gamesPlayed: data.gamesPlayed ?? 0,
        streak: data.streak ?? 0,
      };
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load leaderboard." },
      { status: 500 }
    );
  }
}
