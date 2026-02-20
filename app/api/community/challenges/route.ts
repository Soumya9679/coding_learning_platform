import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import admin from "firebase-admin";
import { authenticateFromRequest, sanitizeText } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// GET /api/community/challenges — list community challenges
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = authenticateFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filter = request.nextUrl.searchParams.get("filter") || "approved"; // approved | mine | pending
    const tag = request.nextUrl.searchParams.get("tag");

    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1"));
    const pageSize = Math.min(20, Math.max(1, parseInt(request.nextUrl.searchParams.get("pageSize") || "12")));
    const search = (request.nextUrl.searchParams.get("search") || "").trim().toLowerCase();

    let query: FirebaseFirestore.Query = db.collection("community_challenges");

    if (filter === "mine") {
      query = query.where("authorId", "==", session.uid);
    } else if (filter === "pending") {
      query = query.where("status", "==", "pending");
    } else {
      query = query.where("status", "==", "approved");
    }

    const snap = await query.get();

    let challenges = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        title: d.title,
        description: d.description,
        tag: d.tag || "General",
        difficulty: d.difficulty || 1,
        starterCode: d.starterCode || "",
        expectedOutput: d.expectedOutput || "",
        criteria: d.criteria || "",
        steps: d.steps || [],
        authorId: d.authorId,
        authorUsername: d.authorUsername,
        status: d.status,
        plays: d.plays || 0,
        likes: d.likes || 0,
        createdAt: d.createdAt?.toDate?.()?.toISOString() || "",
      };
    });

    if (tag) {
      challenges = challenges.filter((c) => c.tag === tag);
    }

    if (search) {
      challenges = challenges.filter(
        (c) => c.title.toLowerCase().includes(search) ||
               c.description.toLowerCase().includes(search) ||
               c.authorUsername.toLowerCase().includes(search)
      );
    }

    // Sort by likes/plays descending
    challenges.sort((a, b) => (b.likes + b.plays) - (a.likes + a.plays));

    const total = challenges.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    challenges = challenges.slice(start, start + pageSize);

    return NextResponse.json({ challenges, page, pageSize, total, totalPages });
  } catch (error) {
    console.error("Community challenges GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/community/challenges — create a new community challenge
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = authenticateFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, tag, difficulty, starterCode, expectedOutput, criteria, steps } = body;

    // Validation
    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }
    if (title.trim().length > 100) {
      return NextResponse.json({ error: "Title too long (max 100)" }, { status: 400 });
    }
    if (description.trim().length > 2000) {
      return NextResponse.json({ error: "Description too long (max 2000)" }, { status: 400 });
    }
    if (!starterCode?.trim()) {
      return NextResponse.json({ error: "Starter code is required" }, { status: 400 });
    }
    if (!expectedOutput?.trim()) {
      return NextResponse.json({ error: "Expected output is required" }, { status: 400 });
    }

    // Rate limit: max 5 challenges per user
    const existingSnap = await db
      .collection("community_challenges")
      .where("authorId", "==", session.uid)
      .get();
    if (existingSnap.size >= 20) {
      return NextResponse.json({ error: "You can create a maximum of 20 challenges" }, { status: 429 });
    }

    const challenge = {
      title: sanitizeText(title, 100),
      description: sanitizeText(description, 2000),
      tag: sanitizeText(tag || "General", 50),
      difficulty: Math.min(Math.max(Number(difficulty) || 1, 1), 3),
      starterCode: starterCode.trim(),
      expectedOutput: expectedOutput.trim(),
      criteria: sanitizeText(criteria || "", 1000),
      steps: Array.isArray(steps) ? steps.filter((s: string) => s?.trim()).map((s: string) => sanitizeText(s, 500)) : [],
      authorId: session.uid,
      authorUsername: session.username,
      status: "approved", // Auto-approve for now; can add moderation later
      plays: 0,
      likes: 0,
      likedBy: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("community_challenges").add(challenge);

    return NextResponse.json({
      message: "Challenge created!",
      challenge: { id: docRef.id, ...challenge, createdAt: new Date().toISOString() },
    });
  } catch (error) {
    console.error("Community challenges POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH /api/community/challenges — like a challenge { challengeId }
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const session = authenticateFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { challengeId } = await request.json();
    if (!challengeId) {
      return NextResponse.json({ error: "challengeId required" }, { status: 400 });
    }

    const ref = db.collection("community_challenges").doc(challengeId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data = snap.data()!;
    const likedBy: string[] = data.likedBy || [];

    if (likedBy.includes(session.uid)) {
      await ref.update({
        likedBy: admin.firestore.FieldValue.arrayRemove(session.uid),
        likes: admin.firestore.FieldValue.increment(-1),
      });
      return NextResponse.json({ liked: false });
    } else {
      await ref.update({
        likedBy: admin.firestore.FieldValue.arrayUnion(session.uid),
        likes: admin.firestore.FieldValue.increment(1),
      });
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Community challenges PATCH error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
