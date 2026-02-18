import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import admin from "firebase-admin";
import { db } from "./firebase";

const JWT_SECRET = process.env.AUTH_JWT_SECRET || "";
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "pulsepy_session";
const TOKEN_TTL_SECONDS = Number(process.env.TOKEN_TTL_SECONDS || 60 * 60 * 24 * 7);

function requireJwtSecret() {
  if (!JWT_SECRET) throw new Error("Missing AUTH_JWT_SECRET environment variable.");
  return JWT_SECRET;
}

export function isValidEmail(value = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isStrongPassword(value = "") {
  return value.length >= 8 && /[0-9]/.test(value);
}

export async function getUserByField(field, value) {
  const snapshot = await db.collection("users").where(field, "==", value).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ref: doc.ref, ...doc.data() };
}

export function buildSessionPayload(id, profile) {
  return {
    uid: id,
    email: profile.email,
    username: profile.username,
    fullName: profile.fullName,
  };
}

export function signSessionToken(payload) {
  return jwt.sign(payload, requireJwtSecret(), { expiresIn: TOKEN_TTL_SECONDS });
}

export function verifySessionToken(token) {
  return jwt.verify(token, requireJwtSecret());
}

export function getSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  };
}

export function getClearCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 0,
  };
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function authenticateFromRequest(request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, v.join("=")];
    })
  );

  const token =
    cookies[SESSION_COOKIE_NAME] ||
    extractBearerToken(request.headers.get("authorization"));

  if (!token) return null;

  try {
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

function extractBearerToken(header = "") {
  if (!header?.startsWith("Bearer ")) return null;
  return header.substring(7);
}

export { SESSION_COOKIE_NAME, TOKEN_TTL_SECONDS, db, admin };
