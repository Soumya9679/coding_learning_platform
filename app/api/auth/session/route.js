import { NextResponse } from "next/server";
import { authenticateFromRequest } from "@/lib/auth";

export async function GET(request) {
  const user = authenticateFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  return NextResponse.json({ user });
}
