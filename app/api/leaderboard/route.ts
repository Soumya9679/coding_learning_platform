import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`leaderboard:${ip}`, { max: 30, windowSeconds: 60 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get("pageSize") || "25")));
    const search = (url.searchParams.get("search") || "").trim().toLowerCase();

    // Fetch a generous amount to support search + pagination
    const fetchLimit = search ? 200 : page * pageSize + pageSize;
    const snapshot = await db
      .collection("users")
      .orderBy("xp", "desc")
      .limit(fetchLimit)
      .get();

    let allEntries = snapshot.docs.map((doc, index) => {
      const data = doc.data();
      const fullName: string = data.fullName || data.username || "Anonymous";
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

    // Apply search filter
    if (search) {
      allEntries = allEntries.filter(
        (e) => e.name.toLowerCase().includes(search) || e.username.toLowerCase().includes(search)
      );
    }

    const total = allEntries.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const entries = allEntries.slice(start, start + pageSize);

    return NextResponse.json({ entries, page, pageSize, total, totalPages });
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    return NextResponse.json(
      { error: "Failed to load leaderboard." },
      { status: 500 }
    );
  }
}
