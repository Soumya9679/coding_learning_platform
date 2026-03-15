/* ─── Server-Side XP Proof Token ──────────────────────────────────────── *
 * Generates and validates HMAC-signed single-use tokens that prove a user
 * legitimately earned XP (e.g., from a verified challenge submission).
 * The XP endpoint rejects requests without a valid proof token.
 * ──────────────────────────────────────────────────────────────────────── */

import crypto from "crypto";
import { db } from "./firebase";

const XP_TOKEN_SECRET = process.env.JWT_SECRET || "pulsepy-xp-secret-key";
const TOKEN_TTL_MS = 60_000; // token valid for 60 seconds

export interface XpTokenPayload {
  uid: string;
  action: string;
  challengeId?: string;
  gameId?: string;
  amount: number;
  nonce: string;
  exp: number;
}

/**
 * Generate a signed XP proof token (server-side only).
 * Called after verifying the user actually completed a challenge/game.
 */
export function generateXpToken(payload: Omit<XpTokenPayload, "nonce" | "exp">): string {
  const full: XpTokenPayload = {
    ...payload,
    nonce: crypto.randomBytes(16).toString("hex"),
    exp: Date.now() + TOKEN_TTL_MS,
  };

  const data = JSON.stringify(full);
  const sig = crypto.createHmac("sha256", XP_TOKEN_SECRET).update(data).digest("hex");

  // Base64 encode data + signature
  return Buffer.from(`${data}.${sig}`).toString("base64url");
}

/**
 * Verify and decode an XP proof token. Returns the payload if valid, null otherwise.
 * Also checks that the token has not already been consumed (single-use).
 */
export async function verifyXpToken(token: string, expectedUid: string): Promise<XpTokenPayload | null> {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const dotIdx = decoded.lastIndexOf(".");
    if (dotIdx === -1) return null;

    const data = decoded.slice(0, dotIdx);
    const sig = decoded.slice(dotIdx + 1);

    // Verify HMAC
    const expectedSig = crypto.createHmac("sha256", XP_TOKEN_SECRET).update(data).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return null;
    }

    const payload: XpTokenPayload = JSON.parse(data);

    // Check expiry
    if (Date.now() > payload.exp) return null;

    // Check uid matches
    if (payload.uid !== expectedUid) return null;

    // Check single-use (nonce not already consumed)
    const nonceRef = db.collection("xp_nonces").doc(payload.nonce);
    const nonceDoc = await nonceRef.get();
    if (nonceDoc.exists) return null; // already used

    // Mark nonce as consumed (TTL: the nonce doc can be cleaned up later)
    await nonceRef.set({ uid: expectedUid, usedAt: new Date().toISOString() });

    return payload;
  } catch {
    return null;
  }
}
