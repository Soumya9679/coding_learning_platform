import { NextRequest, NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/admin";
import { db } from "@/lib/firebase";
import admin from "firebase-admin";

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function PATCH(request: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  const adm = await authenticateAdmin(request);
  if (!adm) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const { userId } = await ctx.params;
    const body = await request.json();
    const { role, xp, resetXp, ban } = body as {
      role?: string;
      xp?: number;
      resetXp?: boolean;
      ban?: boolean;
    };

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const payload: Record<string, unknown> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (role !== undefined) {
      payload.role = role === "admin" ? "admin" : "user";
    }

    if (resetXp) {
      payload.xp = 0;
      payload.challengesCompleted = 0;
      payload.gamesPlayed = 0;
      payload.streak = 0;
      payload.completedChallenges = [];
      payload.lastActiveDate = "";
    } else if (xp !== undefined && typeof xp === "number") {
      payload.xp = Math.max(0, xp);
    }

    if (ban !== undefined) {
      payload.banned = ban;
    }

    await userRef.update(payload);

    return NextResponse.json({ message: "User updated." });
  } catch (err) {
    console.error("Admin user update error:", err);
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  const adm = await authenticateAdmin(request);
  if (!adm) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const { userId } = await ctx.params;

    // Prevent self-deletion
    if (userId === adm.uid) {
      return NextResponse.json({ error: "Cannot delete yourself." }, { status: 400 });
    }

    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await userRef.delete();
    return NextResponse.json({ message: "User deleted." });
  } catch (err) {
    console.error("Admin user delete error:", err);
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
  }
}
