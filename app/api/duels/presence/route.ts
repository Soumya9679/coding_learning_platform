import { NextRequest, NextResponse } from "next/server";
import { db, admin } from "@/lib/firebase";
import { authenticateFromRequest } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const FieldValue = admin.firestore.FieldValue;

/* ─── Presence & Typing Indicator API ────────────────────────────────── *
 * POST /api/duels/presence
 * Body: { duelId, typing?: boolean, lineCount?: number, online?: boolean }
 *
 * Updates the real-time presence document in `duels/{id}/presence/{uid}`.
 * The SSE stream picks this up instantly via onSnapshot.
 * ──────────────────────────────────────────────────────────────────────── */

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = authenticateFromRequest(request);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ip = getClientIp(request);
    const rl = checkRateLimit(`presence:${session.uid}:${ip}`, {
      max: 120,           // generous: typing + heartbeat combined
      windowSeconds: 60,
    });
    if (!rl.allowed)
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });

    const body = await request.json();
    const { duelId, typing, lineCount, online } = body;

    if (!duelId)
      return NextResponse.json({ error: "duelId required" }, { status: 400 });

    // Verify participation
    const duelDoc = await db.collection("duels").doc(duelId).get();
    if (!duelDoc.exists)
      return NextResponse.json({ error: "Duel not found" }, { status: 404 });

    const d = duelDoc.data()!;
    if (d.creatorId !== session.uid && d.opponentId !== session.uid)
      return NextResponse.json({ error: "Not a participant" }, { status: 403 });

    // Upsert presence document
    const presenceRef = db
      .collection("duels")
      .doc(duelId)
      .collection("presence")
      .doc(session.uid);

    const update: Record<string, unknown> = {
      username: session.username,
      lastHeartbeat: FieldValue.serverTimestamp(),
    };

    if (typeof typing === "boolean") update.typing = typing;
    if (typeof lineCount === "number") update.lineCount = lineCount;
    if (typeof online === "boolean") {
      update.online = online;
      update.connected = online;
    }

    await presenceRef.set(update, { merge: true });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Presence POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ─── Disconnect cleanup (called on beforeunload via navigator.sendBeacon) */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const session = authenticateFromRequest(request);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { duelId } = await request.json();
    if (!duelId)
      return NextResponse.json({ error: "duelId required" }, { status: 400 });

    const presenceRef = db
      .collection("duels")
      .doc(duelId)
      .collection("presence")
      .doc(session.uid);

    await presenceRef.set(
      {
        online: false,
        connected: false,
        typing: false,
        lastHeartbeat: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Presence DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
