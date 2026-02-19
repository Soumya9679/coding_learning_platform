import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { authenticateAdmin } from "@/lib/admin";

export interface ChallengeDoc {
  id: string;
  tag: string;
  difficulty: number;
  title: string;
  description: string;
  criteria: string;
  mentorInstructions: string;
  rubric: string;
  steps: string[];
  starterCode: string;
  expectedOutput: string;
  retryHelp: string;
  order: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const COLLECTION = "challenges";

/** GET — list all challenges. Public (for IDE) or admin (full data). */
export async function GET(request: NextRequest) {
  try {
    const isAdmin = !!(await authenticateAdmin(request).catch(() => null));
    const snap = await db.collection(COLLECTION).orderBy("order", "asc").get();
    
    const challenges: ChallengeDoc[] = [];
    snap.forEach((doc) => {
      const d = doc.data();
      // Non-admin: only return active challenges, hide admin-only fields
      if (!isAdmin && d.active === false) return;
      challenges.push({
        id: doc.id,
        tag: d.tag || "",
        difficulty: d.difficulty || 1,
        title: d.title || "",
        description: d.description || "",
        criteria: d.criteria || "",
        mentorInstructions: isAdmin ? d.mentorInstructions || "" : "",
        rubric: isAdmin ? d.rubric || "" : "",
        steps: d.steps || [],
        starterCode: d.starterCode || "",
        expectedOutput: d.expectedOutput || "",
        retryHelp: d.retryHelp || "",
        order: d.order ?? 999,
        active: d.active !== false,
        ...(isAdmin && { createdAt: d.createdAt || "", updatedAt: d.updatedAt || "" }),
      });
    });

    return NextResponse.json({ challenges });
  } catch (err) {
    console.error("GET /api/admin/challenges error:", err);
    return NextResponse.json({ error: "Failed to fetch challenges." }, { status: 500 });
  }
}

/** POST — create a new challenge (admin only). */
export async function POST(request: NextRequest) {
  const adm = await authenticateAdmin(request);
  if (!adm) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const body = await request.json();
    const {
      id,
      tag = "",
      difficulty = 1,
      title = "",
      description = "",
      criteria = "",
      mentorInstructions = "",
      rubric = "",
      steps = [],
      starterCode = "",
      expectedOutput = "",
      retryHelp = "",
      order,
      active = true,
    } = body || {};

    if (!title.trim()) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    // Determine document ID: use provided id or auto-generate
    const docId = id?.trim() || `ch_${Date.now()}`;
    
    // Check for duplicate
    const existing = await db.collection(COLLECTION).doc(docId).get();
    if (existing.exists) {
      return NextResponse.json({ error: `Challenge with id "${docId}" already exists.` }, { status: 409 });
    }

    // Auto-assign order if not provided
    let assignedOrder = order;
    if (assignedOrder == null) {
      const last = await db.collection(COLLECTION).orderBy("order", "desc").limit(1).get();
      assignedOrder = last.empty ? 1 : (last.docs[0].data().order || 0) + 1;
    }

    const now = new Date().toISOString();
    const challengeData = {
      tag: tag.trim(),
      difficulty: Math.min(Math.max(Number(difficulty) || 1, 1), 3),
      title: title.trim(),
      description: description.trim(),
      criteria: criteria.trim(),
      mentorInstructions: mentorInstructions.trim(),
      rubric: rubric.trim(),
      steps: Array.isArray(steps) ? steps.filter(Boolean) : [],
      starterCode,
      expectedOutput: expectedOutput.trim(),
      retryHelp: retryHelp.trim(),
      order: assignedOrder,
      active,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection(COLLECTION).doc(docId).set(challengeData);

    return NextResponse.json({ id: docId, ...challengeData }, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/challenges error:", err);
    return NextResponse.json({ error: "Failed to create challenge." }, { status: 500 });
  }
}
