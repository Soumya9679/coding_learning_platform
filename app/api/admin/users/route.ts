import { NextRequest, NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/admin";
import { db } from "@/lib/firebase";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const admin = await authenticateAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const sortBy = searchParams.get("sortBy") || "xp";
    const order = searchParams.get("order") || "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const usersSnap = await db.collection("users").get();

    interface UserEntry {
      uid: string;
      fullName: string;
      email: string;
      username: string;
      xp: number;
      challengesCompleted: number;
      gamesPlayed: number;
      streak: number;
      role: string;
      lastActiveDate: string;
      createdAt: string;
    }

    let users: UserEntry[] = usersSnap.docs.map((doc) => {
      const d = doc.data();
      const createdAt = d.createdAt?.toDate?.()
        ? d.createdAt.toDate().toISOString()
        : d.createdAt || "";

      return {
        uid: doc.id,
        fullName: d.fullName || "",
        email: d.email || d.emailNormalized || "",
        username: d.username || "",
        xp: d.xp ?? 0,
        challengesCompleted: d.challengesCompleted ?? 0,
        gamesPlayed: d.gamesPlayed ?? 0,
        streak: d.streak ?? 0,
        role: d.role || "user",
        lastActiveDate: d.lastActiveDate || "",
        createdAt,
      };
    });

    // Search filter
    if (search) {
      users = users.filter(
        (u) =>
          u.fullName.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          u.username.toLowerCase().includes(search)
      );
    }

    // Sort
    const validSortFields = ["xp", "challengesCompleted", "gamesPlayed", "streak", "createdAt", "username", "fullName"];
    const sf = validSortFields.includes(sortBy) ? sortBy : "xp";
    users.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sf];
      const bVal = (b as unknown as Record<string, unknown>)[sf];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return order === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal || "");
      const bStr = String(bVal || "");
      return order === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });

    const total = users.length;
    const paginated = users.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      users: paginated,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Admin users error:", err);
    return NextResponse.json({ error: "Failed to load users." }, { status: 500 });
  }
}
