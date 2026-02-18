import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "./firebase";

const JWT_SECRET = process.env.JWT_SECRET || "pulsepy-dev-secret-change-me";
const SALT_ROUNDS = 12;

export const SESSION_COOKIE_NAME = "pulsepy_session";
export const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

interface SessionPayload {
  uid: string;
  username: string;
  fullName: string;
  email: string;
  iat?: number;
  exp?: number;
}

interface UserRecord {
  id: string;
  ref: FirebaseFirestore.DocumentReference;
  fullName: string;
  email: string;
  emailNormalized: string;
  username: string;
  usernameNormalized: string;
  passwordHash: string;
  [key: string]: unknown;
}

export function signSessionToken(payload: Record<string, unknown>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL_SECONDS });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isStrongPassword(password: string): boolean {
  return password.length >= 8 && /[0-9]/.test(password);
}

export async function getUserByField(field: string, value: string): Promise<UserRecord | null> {
  const snap = await db.collection("users").where(field, "==", value).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ref: doc.ref, ...doc.data() } as UserRecord;
}

export function buildSessionPayload(uid: string, profile: Record<string, unknown>): Record<string, unknown> {
  return {
    uid,
    username: profile.username || profile.usernameNormalized || "",
    fullName: profile.fullName || "",
    email: profile.email || profile.emailNormalized || "",
  };
}

export function authenticateFromRequest(request: Request): SessionPayload | null {
  // Try cookie first
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, v.join("=")];
    })
  );
  const cookieToken = cookies[SESSION_COOKIE_NAME];
  if (cookieToken) {
    const user = verifySessionToken(cookieToken);
    if (user) return user;
  }

  // Try bearer token
  const authHeader = request.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    return verifySessionToken(token);
  }

  return null;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  };
}

export function getClearCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}
