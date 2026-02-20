/**
 * API route tests for /api/auth/login
 * Tests the login endpoint with mocked Firebase and auth utilities.
 *
 * @jest-environment node
 */

// Mock firebase before any imports
jest.mock("@/lib/firebase", () => ({
  db: {
    collection: jest.fn(() => ({
      where: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn(() => Promise.resolve({ empty: true, docs: [] })),
        })),
      })),
    })),
  },
  admin: { firestore: { FieldValue: { serverTimestamp: jest.fn() } } },
}));

jest.mock("firebase-admin", () => ({
  firestore: { FieldValue: { serverTimestamp: jest.fn() } },
}));

// Mock auth functions
const mockGetUserByField = jest.fn();
const mockComparePassword = jest.fn();
const mockSignSessionToken = jest.fn(() => "mock-jwt-token");
const mockBuildSessionPayload = jest.fn((uid: string, profile: Record<string, unknown>) => ({
  uid,
  username: profile.username,
  fullName: profile.fullName,
  email: profile.email,
}));

jest.mock("@/lib/auth", () => ({
  getUserByField: (...args: unknown[]) => mockGetUserByField(...args),
  comparePassword: (...args: unknown[]) => mockComparePassword(...args),
  signSessionToken: (...args: unknown[]) => mockSignSessionToken(...args),
  buildSessionPayload: (...args: unknown[]) => mockBuildSessionPayload(...args),
  getSessionCookieOptions: () => ({
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 604800,
  }),
  SESSION_COOKIE_NAME: "pulsepy_session",
}));

jest.mock("@/lib/rateLimit", () => ({
  checkRateLimit: () => ({ allowed: true, remaining: 9, retryAfterSeconds: 0 }),
  getClientIp: () => "127.0.0.1",
}));

import { POST } from "@/app/api/auth/login/route";
import { NextRequest } from "next/server";

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/auth/login", () => {
  it("returns 400 when credentials are missing", async () => {
    const res = await POST(createRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/required/i);
  });

  it("returns 400 when password is empty", async () => {
    const res = await POST(createRequest({ usernameOrEmail: "test", password: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 401 when user is not found", async () => {
    mockGetUserByField.mockResolvedValue(null);
    const res = await POST(createRequest({ usernameOrEmail: "unknown", password: "Pass123!" }));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/invalid/i);
  });

  it("returns 401 when password is wrong", async () => {
    mockGetUserByField.mockResolvedValue({
      id: "uid-1",
      ref: { update: jest.fn() },
      passwordHash: "hashed",
      username: "alice",
      fullName: "Alice",
      email: "alice@test.com",
    });
    mockComparePassword.mockResolvedValue(false);

    const res = await POST(createRequest({ usernameOrEmail: "alice", password: "WrongPass1!" }));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/invalid/i);
  });

  it("returns 200 with session token on success", async () => {
    const mockUser = {
      id: "uid-1",
      ref: { update: jest.fn().mockResolvedValue(undefined) },
      passwordHash: "hashed",
      username: "alice",
      fullName: "Alice Smith",
      email: "alice@test.com",
    };
    mockGetUserByField.mockResolvedValue(mockUser);
    mockComparePassword.mockResolvedValue(true);

    const res = await POST(createRequest({ usernameOrEmail: "alice", password: "Correct1!" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.sessionToken).toBe("mock-jwt-token");
    expect(data.message).toBeDefined();
    expect(mockSignSessionToken).toHaveBeenCalled();
  });

  it("looks up by email when identifier contains @", async () => {
    mockGetUserByField.mockResolvedValue(null);
    await POST(createRequest({ usernameOrEmail: "alice@test.com", password: "Pass123!" }));
    expect(mockGetUserByField).toHaveBeenCalledWith("emailNormalized", "alice@test.com");
  });

  it("looks up by username when identifier has no @", async () => {
    mockGetUserByField.mockResolvedValue(null);
    await POST(createRequest({ usernameOrEmail: "alice", password: "Pass123!" }));
    expect(mockGetUserByField).toHaveBeenCalledWith("usernameNormalized", "alice");
  });
});
