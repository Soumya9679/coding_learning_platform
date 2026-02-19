import { NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/admin";
import { getRecentAuditLogs } from "@/lib/auditLog";

export async function GET(request: Request) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "200"), 500);

    const logs = await getRecentAuditLogs(limit);

    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
