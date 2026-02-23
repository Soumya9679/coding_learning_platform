import { NextRequest } from "next/server";
import { db } from "@/lib/firebase";
import { authenticateFromRequest } from "@/lib/auth";

/* ─── SSE: Real-time Lobby Stream ────────────────────────────────────── *
 * Streams lobby updates (new/removed waiting duels) in real-time.
 * Uses Firestore onSnapshot on the `duels` collection where status=waiting.
 * ──────────────────────────────────────────────────────────────────────── */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

function sseEvent(event: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function GET(request: NextRequest): Promise<Response> {
  let session = authenticateFromRequest(request);
  if (!session) {
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

      /* ── Lobby listener: waiting duels ──────────────────── */
      const unsubLobby = db
        .collection("duels")
        .where("status", "==", "waiting")
        .onSnapshot(
          (snap) => {
            const duels = snap.docs
              .filter((doc) => doc.data().creatorId !== session.uid)
              .map((doc) => {
                const d = doc.data();
                return {
                  id: doc.id,
                  challengeTitle: d.challengeTitle,
                  difficulty: d.difficulty,
                  creatorUsername: d.creatorUsername,
                  timeLimit: d.timeLimit || 300,
                  createdAt:
                    d.createdAt?.toDate?.()?.toISOString() || "",
                };
              })
              .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
              .slice(0, 30);
            safeSend("lobby_update", duels);
          },
          (err) => {
            console.error("Lobby snapshot error:", err);
            safeSend("error", { message: "Lobby stream error" });
          }
        );
      cleanups.push(unsubLobby);

      /* ── My duels listener ──────────────────────────────── */
      const unsubMyCreated = db
        .collection("duels")
        .where("creatorId", "==", session.uid)
        .onSnapshot(
          (snap) => {
            sendMyDuels();
          },
          (err) => {
            console.error("My duels (creator) snapshot error:", err);
          }
        );
      cleanups.push(unsubMyCreated);

      const unsubMyJoined = db
        .collection("duels")
        .where("opponentId", "==", session.uid)
        .onSnapshot(
          () => {
            sendMyDuels();
          },
          (err) => {
            console.error("My duels (opponent) snapshot error:", err);
          }
        );
      cleanups.push(unsubMyJoined);

      // Debounced sender for my duels (both queries fire)
      let myDuelsTimeout: ReturnType<typeof setTimeout> | null = null;
      async function sendMyDuels() {
        if (myDuelsTimeout) clearTimeout(myDuelsTimeout);
        myDuelsTimeout = setTimeout(async () => {
          try {
            const uid = session!.uid;
            const [creatorSnap, oppSnap] = await Promise.all([
              db
                .collection("duels")
                .where("creatorId", "==", uid)
                .get(),
              db
                .collection("duels")
                .where("opponentId", "==", uid)
                .get(),
            ]);
            const allDocs = [...creatorSnap.docs, ...oppSnap.docs];
            // deduplicate
            const seen = new Set<string>();
            const unique = allDocs.filter((doc) => {
              if (seen.has(doc.id)) return false;
              seen.add(doc.id);
              return true;
            });
            unique.sort(
              (a, b) =>
                (b.data().createdAt?.toMillis?.() || 0) -
                (a.data().createdAt?.toMillis?.() || 0)
            );

            const duels = unique.slice(0, 15).map((doc) => {
              const d = doc.data();
              return {
                id: doc.id,
                challengeTitle: d.challengeTitle,
                difficulty: d.difficulty,
                creatorUsername: d.creatorUsername,
                opponentUsername: d.opponentUsername || null,
                status: d.status,
                winnerId: d.winnerId || null,
                winnerUsername: d.winnerUsername || null,
                timeLimit: d.timeLimit || 300,
                createdAt:
                  d.createdAt?.toDate?.()?.toISOString() || "",
              };
            });
            safeSend("my_duels", duels);
          } catch (err) {
            console.error("Failed to send my duels:", err);
          }
        }, 200);
      }

      /* ── Heartbeat ──────────────────────────────────────── */
      const heartbeat = setInterval(() => {
        safeSend("heartbeat", { ts: new Date().toISOString() });
      }, 25_000);
      cleanups.push(() => clearInterval(heartbeat));

      safeSend("heartbeat", { ts: new Date().toISOString() });
    },

    cancel() {
      closed = true;
      cleanups.forEach((fn) => {
        try { fn(); } catch {}
      });
    },
  });

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
      "X-Accel-Buffering": "no",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
