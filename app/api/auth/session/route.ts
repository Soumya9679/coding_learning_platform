import { NextRequest, NextResponse } from "next/server";
import { authenticateFromRequest } from "@/lib/auth";
import { db } from "@/lib/firebase";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = authenticateFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  // Enrich with xp from Firestore (non-blocking failure)
  let xp = 0;
  try {
    const doc = await db.collection("users").doc(user.uid).get();
    if (doc.exists) {
      xp = doc.data()?.xp || 0;
    }
  } catch { /* ignore */ }

  return NextResponse.json({ user: { ...user, xp } });
}
