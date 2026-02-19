import { NextRequest, NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/admin";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const admin = await authenticateAdmin(request);
  if (!admin) {
    return NextResponse.json({ isAdmin: false }, { status: 200 });
  }
  return NextResponse.json({ isAdmin: true, uid: admin.uid, username: admin.username });
}
