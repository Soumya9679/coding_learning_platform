import { authenticateFromRequest } from "./auth";
import { db } from "./firebase";

/**
 * Admin authorisation helper.
 *
 * A user is considered an admin when **either**:
 *  1. Their Firestore `users` doc has `role === "admin"`, OR
 *  2. Their email appears in the `ADMIN_EMAILS` env variable (comma-separated).
 *
 * Returns the session payload when the caller is a valid admin,
 * or `null` if authentication / authorisation fails.
 */
export async function authenticateAdmin(request: Request) {
  const session = authenticateFromRequest(request);
  if (!session) return null;

  // Fast path — check env allow-list first
  const allowList = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowList.includes(session.email.toLowerCase())) return session;

  // Slow path — check Firestore role field
  try {
    const doc = await db.collection("users").doc(session.uid).get();
    if (doc.exists && doc.data()?.role === "admin") return session;
  } catch (err) {
    console.error("Admin role check error:", err);
  }

  return null;
}
