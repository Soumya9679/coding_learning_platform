import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import admin from "firebase-admin";
import { authenticateFromRequest } from "@/lib/auth";

// POST /api/social/follow — follow or unfollow a user { targetUserId }
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = authenticateFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId } = await request.json();
    if (!targetUserId || targetUserId === session.uid) {
      return NextResponse.json({ error: "Invalid target user" }, { status: 400 });
    }

    // Check target user exists
    const targetDoc = await db.collection("users").doc(targetUserId).get();
    if (!targetDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check existing follow
    const followId = `${session.uid}_${targetUserId}`;
    const followRef = db.collection("follows").doc(followId);
    const followSnap = await followRef.get();

    if (followSnap.exists) {
      // Unfollow
      await followRef.delete();
      return NextResponse.json({ following: false, message: "Unfollowed" });
    } else {
      // Follow
      await followRef.set({
        followerId: session.uid,
        followerUsername: session.username,
        followingId: targetUserId,
        followingUsername: targetDoc.data()?.username || "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ following: true, message: "Now following" });
    }
  } catch (error) {
    console.error("Follow error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET /api/social/follow?userId=xxx — get follow status and counts
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = authenticateFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targetUserId = request.nextUrl.searchParams.get("userId") || session.uid;

    // Get followers (people who follow this user)
    const followersSnap = await db
      .collection("follows")
      .where("followingId", "==", targetUserId)
      .get();

    // Get following (people this user follows)
    const followingSnap = await db
      .collection("follows")
      .where("followerId", "==", targetUserId)
      .get();

    const followers = followersSnap.docs.map((d) => ({
      userId: d.data().followerId,
      username: d.data().followerUsername,
    }));

    const following = followingSnap.docs.map((d) => ({
      userId: d.data().followingId,
      username: d.data().followingUsername,
    }));

    // Check if current user follows the target
    const isFollowing = targetUserId !== session.uid
      ? followersSnap.docs.some((d) => d.data().followerId === session.uid)
      : false;

    return NextResponse.json({
      followers,
      following,
      followerCount: followers.length,
      followingCount: following.length,
      isFollowing,
    });
  } catch (error) {
    console.error("Social GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
