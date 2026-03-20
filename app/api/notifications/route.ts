import { NextRequest, NextResponse } from "next/server";
import { authenticateFromRequest } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { checkRateLimitAsync, getClientIp } from "@/lib/rateLimit";
import { notificationPatchSchema, notificationDeleteSchema, parseBody } from "@/lib/validators";

/**
 * GET /api/notifications — get notifications for the current user.
 * ?unread=true to filter unread only
 * ?limit=20 (default 30, max 50)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(request);
    const rl = await checkRateLimitAsync(`notif:${ip}`, { max: 60, windowSeconds: 60 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    const user = authenticateFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const unreadOnly = request.nextUrl.searchParams.get("unread") === "true";
    const limit = Math.min(
      parseInt(request.nextUrl.searchParams.get("limit") || "30", 10) || 30,
      50
    );

    let query = db
      .collection("users")
      .doc(user.uid)
      .collection("notifications")
      .orderBy("createdAt", "desc")
      .limit(limit);

    if (unreadOnly) {
      query = db
        .collection("users")
        .doc(user.uid)
        .collection("notifications")
        .where("read", "==", false)
        .limit(limit);
    }

    const snap = await query.get();
    const notifications = snap.docs
      .map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          type: d.type,
          title: d.title,
          message: d.message,
          icon: d.icon || null,
          color: d.color || null,
          link: d.link || null,
          read: d.read ?? false,
          createdAt: d.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Get unread count
    const unreadSnap = await db
      .collection("users")
      .doc(user.uid)
      .collection("notifications")
      .where("read", "==", false)
      .count()
      .get();
    const unreadCount = unreadSnap.data().count || 0;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications — mark notifications as read.
 * Body: { ids: string[] } or { all: true }
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const user = authenticateFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const raw = await request.json();
    const parsed = parseBody(notificationPatchSchema, raw);
    if (parsed.error) return parsed.error;
    const body = parsed.data;
    const all = "all" in body ? body.all : false;
    const ids = "ids" in body ? body.ids : undefined;

    if (all) {
      // Mark all as read
      const unreadSnap = await db
        .collection("users")
        .doc(user.uid)
        .collection("notifications")
        .where("read", "==", false)
        .get();

      const batch = db.batch();
      unreadSnap.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });
      await batch.commit();

      return NextResponse.json({ message: "All marked as read", count: unreadSnap.size });
    }

    if (Array.isArray(ids) && ids.length > 0) {
      const batch = db.batch();
      for (const id of ids.slice(0, 50)) {
        const ref = db
          .collection("users")
          .doc(user.uid)
          .collection("notifications")
          .doc(id);
        batch.update(ref, { read: true });
      }
      await batch.commit();
      return NextResponse.json({ message: "Marked as read", count: ids.length });
    }

    return NextResponse.json({ error: "Provide ids[] or all:true" }, { status: 400 });
  } catch (error) {
    console.error("Notifications PATCH error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/notifications — delete a notification.
 * Body: { id: string }
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const user = authenticateFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const raw = await request.json();
    const parsed = parseBody(notificationDeleteSchema, raw);
    if (parsed.error) return parsed.error;
    const { id } = parsed.data;

    await db
      .collection("users")
      .doc(user.uid)
      .collection("notifications")
      .doc(id)
      .delete();

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Notifications DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
