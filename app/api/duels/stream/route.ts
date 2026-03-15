import { NextRequest } from "next/server";
import { db } from "@/lib/firebase";
import { authenticateFromRequest } from "@/lib/auth";

/* ─── SSE: Real-time Duel Stream ─────────────────────────────────────── *
 * Single SSE connection that multiplexes:
 *   • duel_state  — Firestore onSnapshot on `duels/{id}`
 *   • presence    — Firestore onSnapshot on `duels/{id}/presence`
 *   • chat        — Firestore onSnapshot on `duels/{id}/chat`
 *   • heartbeat   — every 25 s to keep connection alive
 * ──────────────────────────────────────────────────────────────────────── */

export const runtime = "nodejs";   // required for long-lived streams
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

function sseEvent(event: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function GET(request: NextRequest): Promise<Response> {
  /* ── auth (cookie, bearer, or query param for EventSource) ── */
  let session = authenticateFromRequest(request);
  if (!session) {
    // EventSource can't send headers — accept token as query param
    const qToken = request.nextUrl.searchParams.get("token");
    if (qToken) {
      const { verifySessionToken } = await import("@/lib/auth");
      session = verifySessionToken(qToken);
    }
  }
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const duelId = request.nextUrl.searchParams.get("id");
  if (!duelId) {
    return new Response(JSON.stringify({ error: "Duel ID required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  /* ── verify participant ─────────────────────────────────── */
  const duelDoc = await db.collection("duels").doc(duelId).get();
  if (!duelDoc.exists) {
    return new Response(JSON.stringify({ error: "Duel not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  const duelData = duelDoc.data()!;
  const isParticipant =
    duelData.creatorId === session.uid || duelData.opponentId === session.uid;
  const isSpectator = !isParticipant; // future spectator mode

  if (!isParticipant && !isSpectator) {
    return new Response(JSON.stringify({ error: "Not authorized" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  /* ── SSE stream ─────────────────────────────────────────── */
  const cleanups: (() => void)[] = [];
  let controllerRef: ReadableStreamDefaultController | null = null;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;

      const safeSend = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(sseEvent(event, data));
        } catch {
          closed = true;
        }
      };

      /* ── 1. Duel document listener ──────────────────────── */
      const unsubDuel = db.collection("duels").doc(duelId).onSnapshot(
        (snap) => {
          if (!snap.exists) {
            safeSend("error", { message: "Duel deleted" });
            return;
          }
          const d = snap.data()!;
          const isCreator = d.creatorId === session.uid;

          safeSend("duel_state", {
            id: snap.id,
            challengeTitle: d.challengeTitle,
            challengeDescription: d.challengeDescription,
            expectedOutput: d.expectedOutput,
            starterCode: d.starterCode,
            difficulty: d.difficulty,
            creatorId: d.creatorId,
            creatorUsername: d.creatorUsername,
            opponentId: d.opponentId || null,
            opponentUsername: d.opponentUsername || null,
            status: d.status,
            timeLimit: d.timeLimit || 300,
            creatorPassed: d.creatorPassed || false,
            opponentPassed: d.opponentPassed || false,
            creatorFinishedAt:
              d.creatorFinishedAt?.toDate?.()?.toISOString() || null,
            opponentFinishedAt:
              d.opponentFinishedAt?.toDate?.()?.toISOString() || null,
            winnerId: d.winnerId || null,
            winnerUsername: d.winnerUsername || null,
            startedAt: d.startedAt?.toDate?.()?.toISOString() || null,
            finishedAt: d.finishedAt?.toDate?.()?.toISOString() || null,
            createdAt: d.createdAt?.toDate?.()?.toISOString() || "",
            // Own code always, opponent code only after finished
            myCode: isParticipant
              ? (isCreator ? d.creatorCode : d.opponentCode) || ""
              : "",
            opponentCode:
              d.status === "finished" && isParticipant
                ? (isCreator ? d.opponentCode : d.creatorCode) || ""
                : "",
          });
        },
        (err) => {
          console.error("Duel snapshot error:", err);
          safeSend("error", { message: "Stream error" });
        }
      );
      cleanups.push(unsubDuel);

      /* ── 2. Presence subcollection listener ─────────────── */
      const unsubPresence = db
        .collection("duels")
        .doc(duelId)
        .collection("presence")
        .onSnapshot(
          (snap) => {
            const presenceMap: Record<string, unknown> = {};
            snap.docs.forEach((doc) => {
              const p = doc.data();
              presenceMap[doc.id] = {
                uid: doc.id,
                username: p.username || "",
                online: p.online ?? false,
                typing: p.typing ?? false,
                lineCount: p.lineCount ?? 0,
                lastHeartbeat:
                  p.lastHeartbeat?.toDate?.()?.toISOString() ||
                  new Date().toISOString(),
                connected: p.connected ?? false,
              };
            });
            safeSend("presence", presenceMap);
          },
          (err) => {
            console.error("Presence snapshot error:", err);
          }
        );
      cleanups.push(unsubPresence);

      /* ── 3. Chat subcollection listener ─────────────────── */
      const unsubChat = db
        .collection("duels")
        .doc(duelId)
        .collection("chat")
        .orderBy("createdAt", "asc")
        .limitToLast(50)
        .onSnapshot(
          (snap) => {
            const messages = snap.docs.map((doc) => {
              const m = doc.data();
              return {
                id: doc.id,
                uid: m.uid,
                username: m.username,
                text: m.text,
                createdAt:
                  m.createdAt?.toDate?.()?.toISOString() ||
                  new Date().toISOString(),
              };
            });
            safeSend("chat", messages);
          },
          (err) => {
            console.error("Chat snapshot error:", err);
          }
        );
      cleanups.push(unsubChat);

      /* ── 4. Heartbeat to keep connection alive ──────────── */
      const heartbeatInterval = setInterval(() => {
        safeSend("heartbeat", { ts: new Date().toISOString() });
      }, 25_000);
      cleanups.push(() => clearInterval(heartbeatInterval));

      // Send initial heartbeat immediately
      safeSend("heartbeat", { ts: new Date().toISOString() });
    },

    cancel() {
      closed = true;
      cleanups.forEach((fn) => {
        try { fn(); } catch {}
      });
    },
  });

  // Handle client disconnect via AbortSignal
  request.signal.addEventListener("abort", () => {
    closed = true;
    cleanups.forEach((fn) => {
      try { fn(); } catch {}
    });
    try { controllerRef?.close(); } catch {}
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",        // nginx
      "X-Content-Type-Options": "nosniff",
    },
  });
}
