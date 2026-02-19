import { NextRequest, NextResponse } from "next/server";
import { authenticateAdmin } from "@/lib/admin";
import { db } from "@/lib/firebase";
import { writeAuditLog } from "@/lib/auditLog";

/**
 * GET /api/admin/export?type=users|analytics|audit
 * Returns CSV data for the requested export type.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const adm = await authenticateAdmin(request);
  if (!adm) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const type = request.nextUrl.searchParams.get("type") || "users";

  try {
    let csv = "";
    let filename = "";

    if (type === "users") {
      csv = await exportUsers();
      filename = `pulsepy-users-${dateStamp()}.csv`;
      writeAuditLog("export.users", { uid: adm.uid, email: adm.email });
    } else if (type === "analytics") {
      csv = await exportAnalytics();
      filename = `pulsepy-analytics-${dateStamp()}.csv`;
      writeAuditLog("export.analytics", { uid: adm.uid, email: adm.email });
    } else if (type === "audit") {
      csv = await exportAuditLogs();
      filename = `pulsepy-audit-${dateStamp()}.csv`;
    } else {
      return NextResponse.json({ error: "Invalid export type. Use: users, analytics, audit" }, { status: 400 });
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json({ error: "Failed to generate export." }, { status: 500 });
  }
}

function dateStamp(): string {
  return new Date().toISOString().split("T")[0];
}

function escapeCsv(val: unknown): string {
  const str = String(val ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(values: unknown[]): string {
  return values.map(escapeCsv).join(",");
}

async function exportUsers(): Promise<string> {
  const snap = await db.collection("users").orderBy("xp", "desc").get();

  const headers = [
    "UID", "Full Name", "Username", "Email", "XP", "Challenges Completed",
    "Games Played", "Streak", "Role", "Last Active", "Created At",
  ];

  const rows = snap.docs.map((doc) => {
    const d = doc.data();
    return toCsvRow([
      doc.id,
      d.fullName || "",
      d.username || "",
      d.email || "",
      d.xp ?? 0,
      d.challengesCompleted ?? 0,
      d.gamesPlayed ?? 0,
      d.streak ?? 0,
      d.role || "user",
      d.lastActiveDate || "",
      d.createdAt?.toDate?.()?.toISOString() || "",
    ]);
  });

  return [toCsvRow(headers), ...rows].join("\n");
}

async function exportAnalytics(): Promise<string> {
  const snap = await db.collection("users").get();

  // Per-user detailed analytics
  const headers = [
    "UID", "Username", "XP", "Challenges Completed", "Completed Challenge IDs",
    "Games Played", "Streak", "Last Active", "Days Since Signup",
  ];

  const now = new Date();
  const rows = snap.docs.map((doc) => {
    const d = doc.data();
    const createdAt = d.createdAt?.toDate?.();
    const daysSinceSignup = createdAt
      ? Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return toCsvRow([
      doc.id,
      d.username || "",
      d.xp ?? 0,
      d.challengesCompleted ?? 0,
      (d.completedChallenges || []).join(";"),
      d.gamesPlayed ?? 0,
      d.streak ?? 0,
      d.lastActiveDate || "",
      daysSinceSignup,
    ]);
  });

  return [toCsvRow(headers), ...rows].join("\n");
}

async function exportAuditLogs(): Promise<string> {
  const snap = await db
    .collection("audit_logs")
    .orderBy("timestamp", "desc")
    .limit(500)
    .get();

  const headers = ["Timestamp", "Action", "Actor Email", "Actor UID", "Target Type", "Target ID"];

  const rows = snap.docs.map((doc) => {
    const d = doc.data();
    return toCsvRow([
      d.timestamp?.toDate?.()?.toISOString() || "",
      d.action || "",
      d.actorEmail || "",
      d.actorUid || "",
      d.targetType || "",
      d.targetId || "",
    ]);
  });

  return [toCsvRow(headers), ...rows].join("\n");
}
