import { NextRequest, NextResponse } from "next/server";
import { db, admin } from "@/lib/firebase";
import { authenticateFromRequest } from "@/lib/auth";
import { sanitizeText } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const FieldValue = admin.firestore.FieldValue;

/* ─── Duel Chat API ──────────────────────────────────────────────────── *
 * POST /api/duels/chat
 * Body: { duelId, text }
 *
 * Adds a chat message to `duels/{id}/chat` subcollection.
 * The SSE stream picks new messages up instantly via onSnapshot.
 * ──────────────────────────────────────────────────────────────────────── */

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = authenticateFromRequest(request);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ip = getClientIp(request);
    const rl = checkRateLimit(`duelchat:${session.uid}:${ip}`, {
      max: 30,
      windowSeconds: 60,
    });
    if (!rl.allowed)
      return NextResponse.json(
        { error: "Too many messages. Slow down." },
        { status: 429 }
      );

    const body = await request.json();
    const { duelId, text } = body;

    if (!duelId)
      return NextResponse.json({ error: "duelId required" }, { status: 400 });

    const sanitized = sanitizeText(text || "", 280);
    if (!sanitized)
      return NextResponse.json({ error: "Message is empty" }, { status: 400 });

    // Verify participation
    const duelDoc = await db.collection("duels").doc(duelId).get();
    if (!duelDoc.exists)
      return NextResponse.json({ error: "Duel not found" }, { status: 404 });

    const d = duelDoc.data()!;
    if (d.creatorId !== session.uid && d.opponentId !== session.uid)
      return NextResponse.json({ error: "Not a participant" }, { status: 403 });

    // Add message
    const ref = await db
      .collection("duels")
      .doc(duelId)
      .collection("chat")
      .add({
        uid: session.uid,
        username: session.username,
        text: sanitized,
        createdAt: FieldValue.serverTimestamp(),
      });

    return NextResponse.json({
      ok: true,
      messageId: ref.id,
    });
  } catch (error) {
    console.error("Duel chat POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
