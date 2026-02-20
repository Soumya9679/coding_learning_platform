import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import admin from "firebase-admin";
import { authenticateFromRequest } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// GET /api/comments?challengeId=xxx — fetch comments for a challenge
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = authenticateFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const challengeId = request.nextUrl.searchParams.get("challengeId");
    if (!challengeId) {
      return NextResponse.json({ error: "challengeId is required" }, { status: 400 });
    }

    const snap = await db
      .collection("comments")
      .where("challengeId", "==", challengeId)
      .get();

    const comments = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        challengeId: d.challengeId,
        userId: d.userId,
        username: d.username,
        avatar: d.avatar || "",
        text: d.text,
        createdAt: d.createdAt?.toDate?.()?.toISOString() || d.createdAt || "",
        likes: d.likes || [],
        likeCount: (d.likes || []).length,
      };
    });

    // Sort by createdAt descending (newest first)
    comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Comments GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/comments — create a new comment (user must have completed the challenge)
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = authenticateFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = getClientIp(request);
    const rl = checkRateLimit(`comment:${session.uid}:${ip}`, { max: 10, windowSeconds: 60 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many comments. Please wait." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    const { challengeId, text } = body;

    if (!challengeId || !text?.trim()) {
      return NextResponse.json({ error: "challengeId and text are required" }, { status: 400 });
    }

    if (text.trim().length > 2000) {
      return NextResponse.json({ error: "Comment too long (max 2000 chars)" }, { status: 400 });
    }

    // Verify user has completed this challenge
    const userSnap = await db.collection("users").doc(session.uid).get();
    const userData = userSnap.data();
    const completed: string[] = userData?.completedChallenges || [];

    if (!completed.includes(challengeId)) {
      return NextResponse.json(
        { error: "You must complete this challenge before discussing it." },
        { status: 403 }
      );
    }

    const comment = {
      challengeId,
      userId: session.uid,
      username: session.username,
      avatar: session.fullName?.charAt(0)?.toUpperCase() || "U",
      text: text.trim(),
      likes: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("comments").add(comment);

    return NextResponse.json({
      message: "Comment posted",
      comment: {
        id: docRef.id,
        ...comment,
        createdAt: new Date().toISOString(),
        likeCount: 0,
      },
    });
  } catch (error) {
    console.error("Comments POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH /api/comments — like/unlike a comment { commentId }
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const session = authenticateFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { commentId } = body;

    if (!commentId) {
      return NextResponse.json({ error: "commentId is required" }, { status: 400 });
    }

    const commentRef = db.collection("comments").doc(commentId);
    const commentSnap = await commentRef.get();

    if (!commentSnap.exists) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const data = commentSnap.data()!;
    const likes: string[] = data.likes || [];

    if (likes.includes(session.uid)) {
      // Unlike
      await commentRef.update({
        likes: admin.firestore.FieldValue.arrayRemove(session.uid),
      });
      return NextResponse.json({ liked: false, likeCount: likes.length - 1 });
    } else {
      // Like
      await commentRef.update({
        likes: admin.firestore.FieldValue.arrayUnion(session.uid),
      });
      return NextResponse.json({ liked: true, likeCount: likes.length + 1 });
    }
  } catch (error) {
    console.error("Comments PATCH error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
