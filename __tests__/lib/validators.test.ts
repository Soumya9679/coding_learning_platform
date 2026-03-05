/**
 * Tests for lib/validators.ts — Zod schemas and parseBody helper
 * @jest-environment node
 */
import { NextResponse } from "next/server";
import {
  parseBody,
  loginSchema,
  signupSchema,
  challengeSubmitSchema,
  dailySubmitSchema,
  xpClaimSchema,
  duelActionSchema,
  commentCreateSchema,
  followSchema,
  notificationPatchSchema,
  notificationDeleteSchema,
  communityCreateSchema,
  mentorHintSchema,
} from "@/lib/validators";

describe("parseBody", () => {
  it("returns data for valid input", () => {
    const result = parseBody(loginSchema, { usernameOrEmail: "user@test.com", password: "pass123" });
    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
    expect(result.data!.usernameOrEmail).toBe("user@test.com");
  });

  it("returns error NextResponse for invalid input", () => {
    const result = parseBody(loginSchema, { usernameOrEmail: "", password: "" });
    expect(result.error).toBeInstanceOf(NextResponse);
    expect(result.data).toBeUndefined();
  });

  it("returns error for completely wrong type", () => {
    const result = parseBody(loginSchema, null);
    expect(result.error).toBeInstanceOf(NextResponse);
  });
});

describe("loginSchema", () => {
  it("accepts valid login", () => {
    const result = loginSchema.safeParse({ usernameOrEmail: "user", password: "12345678" });
    expect(result.success).toBe(true);
  });

  it("rejects empty usernameOrEmail", () => {
    const result = loginSchema.safeParse({ usernameOrEmail: "", password: "pass" });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ usernameOrEmail: "user", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("signupSchema", () => {
  const valid = {
    fullName: "John Doe",
    email: "john@example.com",
    username: "johndoe",
    password: "password123",
    confirmPassword: "password123",
  };

  it("accepts valid signup", () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    expect(signupSchema.safeParse({ ...valid, confirmPassword: "wrong" }).success).toBe(false);
  });

  it("rejects short username", () => {
    expect(signupSchema.safeParse({ ...valid, username: "ab" }).success).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(signupSchema.safeParse({ ...valid, email: "not-email" }).success).toBe(false);
  });

  it("rejects short password", () => {
    expect(signupSchema.safeParse({ ...valid, password: "short", confirmPassword: "short" }).success).toBe(false);
  });
});

describe("challengeSubmitSchema", () => {
  it("accepts valid submission", () => {
    const result = challengeSubmitSchema.safeParse({
      challengeId: "ch1",
      stdout: "hello",
      code: "print('hello')",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty challengeId", () => {
    expect(challengeSubmitSchema.safeParse({ challengeId: "", code: "x" }).success).toBe(false);
  });

  it("rejects empty code", () => {
    expect(challengeSubmitSchema.safeParse({ challengeId: "ch1", code: "" }).success).toBe(false);
  });

  it("defaults stdout to empty string", () => {
    const result = challengeSubmitSchema.safeParse({ challengeId: "ch1", code: "x" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.stdout).toBe("");
  });
});

describe("dailySubmitSchema", () => {
  it("accepts valid daily submission", () => {
    const result = dailySubmitSchema.safeParse({
      challengeId: "daily_2025-01-01",
      code: "print(1)",
      output: "1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing code", () => {
    expect(dailySubmitSchema.safeParse({ challengeId: "d1" }).success).toBe(false);
  });
});

describe("xpClaimSchema", () => {
  it("accepts valid token", () => {
    expect(xpClaimSchema.safeParse({ xpToken: "some-token" }).success).toBe(true);
  });

  it("rejects empty token", () => {
    expect(xpClaimSchema.safeParse({ xpToken: "" }).success).toBe(false);
  });
});

describe("duelActionSchema", () => {
  it("accepts create action", () => {
    const result = duelActionSchema.safeParse({ action: "create" });
    expect(result.success).toBe(true);
  });

  it("accepts create with timeLimit", () => {
    const result = duelActionSchema.safeParse({ action: "create", timeLimit: 120 });
    expect(result.success).toBe(true);
  });

  it("rejects create with timeLimit too low", () => {
    expect(duelActionSchema.safeParse({ action: "create", timeLimit: 10 }).success).toBe(false);
  });

  it("accepts join action", () => {
    expect(duelActionSchema.safeParse({ action: "join", duelId: "abc123" }).success).toBe(true);
  });

  it("rejects join without duelId", () => {
    expect(duelActionSchema.safeParse({ action: "join" }).success).toBe(false);
  });

  it("accepts submit action", () => {
    const result = duelActionSchema.safeParse({
      action: "submit",
      duelId: "d1",
      code: "print(1)",
      output: "1",
      passed: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts cancel action", () => {
    expect(duelActionSchema.safeParse({ action: "cancel", duelId: "d1" }).success).toBe(true);
  });

  it("rejects unknown action", () => {
    expect(duelActionSchema.safeParse({ action: "unknown" }).success).toBe(false);
  });
});

describe("commentCreateSchema", () => {
  it("accepts valid comment", () => {
    expect(commentCreateSchema.safeParse({ challengeId: "c1", text: "Great!" }).success).toBe(true);
  });

  it("rejects empty text", () => {
    expect(commentCreateSchema.safeParse({ challengeId: "c1", text: "" }).success).toBe(false);
  });

  it("rejects text over 2000 chars", () => {
    const longText = "a".repeat(2001);
    expect(commentCreateSchema.safeParse({ challengeId: "c1", text: longText }).success).toBe(false);
  });
});

describe("followSchema", () => {
  it("accepts valid targetUserId", () => {
    expect(followSchema.safeParse({ targetUserId: "user123" }).success).toBe(true);
  });

  it("rejects empty targetUserId", () => {
    expect(followSchema.safeParse({ targetUserId: "" }).success).toBe(false);
  });
});

describe("notificationPatchSchema", () => {
  it("accepts { all: true }", () => {
    expect(notificationPatchSchema.safeParse({ all: true }).success).toBe(true);
  });

  it("accepts { ids: [...] }", () => {
    expect(notificationPatchSchema.safeParse({ ids: ["n1", "n2"] }).success).toBe(true);
  });

  it("rejects empty ids array", () => {
    expect(notificationPatchSchema.safeParse({ ids: [] }).success).toBe(false);
  });
});

describe("notificationDeleteSchema", () => {
  it("accepts valid id", () => {
    expect(notificationDeleteSchema.safeParse({ id: "notif1" }).success).toBe(true);
  });

  it("rejects empty id", () => {
    expect(notificationDeleteSchema.safeParse({ id: "" }).success).toBe(false);
  });
});

describe("communityCreateSchema", () => {
  it("accepts valid community challenge", () => {
    const result = communityCreateSchema.safeParse({
      title: "My Challenge",
      description: "A description that is long enough to be valid",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tag).toBe("General");
      expect(result.data.difficulty).toBe(1);
    }
  });

  it("rejects short title", () => {
    expect(communityCreateSchema.safeParse({ title: "Ab", description: "Valid desc here" }).success).toBe(false);
  });
});

describe("mentorHintSchema", () => {
  it("accepts empty body with defaults", () => {
    const result = mentorHintSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe("");
    }
  });

  it("accepts populated body", () => {
    const result = mentorHintSchema.safeParse({
      code: "print('hi')",
      challengeTitle: "Test",
      description: "Desc",
    });
    expect(result.success).toBe(true);
  });
});
