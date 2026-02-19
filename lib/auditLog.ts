/**
 * Audit log — writes admin actions to Firestore `audit_logs` collection.
 */

import { db } from "./firebase";
import admin from "firebase-admin";

export type AuditAction =
  | "user.promote"
  | "user.demote"
  | "user.delete"
  | "user.reset_xp"
  | "user.ban"
  | "user.unban"
  | "challenge.create"
  | "challenge.update"
  | "challenge.delete"
  | "challenge.seed"
  | "challenge.toggle_active"
  | "export.users"
  | "export.analytics";

interface AuditLogEntry {
  action: AuditAction;
  actorUid: string;
  actorEmail: string;
  targetId?: string;
  targetType?: "user" | "challenge";
  details?: Record<string, unknown>;
  timestamp: FirebaseFirestore.FieldValue;
}

/**
 * Write an audit log entry to Firestore.
 */
export async function writeAuditLog(
  action: AuditAction,
  actor: { uid: string; email: string },
  opts?: {
    targetId?: string;
    targetType?: "user" | "challenge";
    details?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    const entry: AuditLogEntry = {
      action,
      actorUid: actor.uid,
      actorEmail: actor.email,
      targetId: opts?.targetId,
      targetType: opts?.targetType,
      details: opts?.details,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("audit_logs").add(entry);
  } catch (err) {
    // Never let audit logging break the primary operation
    console.error("Audit log write failed:", err);
  }
}

/**
 * Read recent audit log entries (admin only).
 */
export async function getRecentAuditLogs(limit = 50): Promise<Record<string, unknown>[]> {
  const snap = await db
    .collection("audit_logs")
    .orderBy("timestamp", "desc")
    .limit(limit)
    .get();

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || "",
  }));
}
