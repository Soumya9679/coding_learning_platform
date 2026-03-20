import { NextRequest, NextResponse } from "next/server";
import { authenticateFromRequest } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { checkRateLimitAsync, getClientIp } from "@/lib/rateLimit";

/**
 * GET /api/submissions — list the current user's past submissions with code.
 * Query params:
 *   ?challengeId=xyz  — filter by challenge (optional)
 *   ?limit=50         — max results (default 50)
 *   ?page=1           — page number (default 1)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(request);
    const rl = await checkRateLimitAsync(`submissions:${ip}`, { max: 30, windowSeconds: 60 });
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

    const url = new URL(request.url);
    const challengeId = url.searchParams.get("challengeId");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));

    let query = db
      .collection("submissions")
      .where("userId", "==", user.uid);

    if (challengeId) {
      query = query.where("challengeId", "==", challengeId);
    }
    
    // Get total count efficiently
    const countSnap = await query.count().get();
    const total = countSnap.data().count;
    
    const pageSize = Math.min(limit, 25);
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;

    // Fetch only the requested page natively (requires composite index)
    const snap = await query
                 .orderBy("createdAt", "desc")
                 .offset(start)
                 .limit(pageSize)
                 .get();

    const submissions = snap.docs
      .map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          challengeId: d.challengeId || "",
          code: d.code || "",
          stdout: d.stdout || "",
          passed: d.passed ?? false,
          xpAwarded: d.xpAwarded || 0,
          isRepeat: d.isRepeat ?? false,
          createdAt: d.createdAt?.toDate?.()?.toISOString() || "",
        };
      });



    return NextResponse.json({ submissions, page, pageSize, total, totalPages });
  } catch (error) {
    console.error("Submissions GET error:", error);
    return NextResponse.json({ error: "Failed to load submissions." }, { status: 500 });
  }
}
