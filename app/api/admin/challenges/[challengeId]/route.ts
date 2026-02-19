import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { authenticateAdmin } from "@/lib/admin";

const COLLECTION = "challenges";

/** PATCH — update a challenge (admin only). */
export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ challengeId: string }> }
) {
  const adm = await authenticateAdmin(request);
  if (!adm) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { challengeId } = await ctx.params;
  const docRef = db.collection(COLLECTION).doc(challengeId);
  const doc = await docRef.get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
  }

  try {
    const body = await request.json();
    const allowedFields = [
      "tag", "difficulty", "title", "description", "criteria",
      "mentorInstructions", "rubric", "steps", "starterCode",
      "expectedOutput", "retryHelp", "order", "active",
    ];

    const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        if (key === "difficulty") {
          update[key] = Math.min(Math.max(Number(body[key]) || 1, 1), 3);
        } else if (key === "steps") {
          update[key] = Array.isArray(body[key]) ? body[key].filter(Boolean) : [];
        } else {
          update[key] = body[key];
        }
      }
    }

    await docRef.update(update);

    return NextResponse.json({ id: challengeId, ...update });
  } catch (err) {
    console.error("PATCH challenge error:", err);
    return NextResponse.json({ error: "Failed to update challenge." }, { status: 500 });
  }
}

/** DELETE — remove a challenge (admin only). */
export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ challengeId: string }> }
) {
  const adm = await authenticateAdmin(request);
  if (!adm) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { challengeId } = await ctx.params;
  const docRef = db.collection(COLLECTION).doc(challengeId);
  const doc = await docRef.get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
  }

  try {
    await docRef.delete();
    return NextResponse.json({ deleted: true, id: challengeId });
  } catch (err) {
    console.error("DELETE challenge error:", err);
    return NextResponse.json({ error: "Failed to delete challenge." }, { status: 500 });
  }
}
