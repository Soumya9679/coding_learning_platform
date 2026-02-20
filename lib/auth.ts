import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "./firebase";

const JWT_SECRET_FALLBACK = "pulsepy-dev-secret-change-me";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET environment variable is required in production.");
  }
  return secret || JWT_SECRET_FALLBACK;
}
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
  return jwt.sign(payload, getJwtSecret(), { expiresIn: TOKEN_TTL_SECONDS });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as SessionPayload;
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
  if (password.length < 8) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[^a-zA-Z0-9]/.test(password)) return false;
  return true;
}

/** Returns specific password requirement failures for inline validation. */
export function getPasswordErrors(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 8) errors.push("At least 8 characters");
  if (!/[a-z]/.test(password)) errors.push("One lowercase letter");
  if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
  if (!/[0-9]/.test(password)) errors.push("One number");
  if (!/[^a-zA-Z0-9]/.test(password)) errors.push("One special character");
  return errors;
}

/** Strip HTML tags and trim whitespace from user input. */
export function sanitizeText(input: string, maxLength = 5000): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .trim()
    .slice(0, maxLength);
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
