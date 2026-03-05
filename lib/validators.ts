/* ─── Zod Request Validators ──────────────────────────────────────────── *
 * Centralised schemas for every mutating API endpoint.
 * Import the relevant schema in each route and call `parseBody(schema, body)`.
 * ──────────────────────────────────────────────────────────────────────── */

import { z } from "zod";
import { NextResponse } from "next/server";

/* ────────────────────────── Reusable Helpers ──────────────────────────── */

/** Parse a body against a Zod schema, returning either the parsed data or a 400 NextResponse. */
export function parseBody<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown
): { data: z.infer<T>; error?: never } | { data?: never; error: NextResponse } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const messages = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return { error: NextResponse.json({ error: `Validation failed: ${messages}` }, { status: 400 }) };
  }
  return { data: result.data };
}

/* ────────────────────────── Auth Schemas ──────────────────────────────── */

export const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, "Username or email required"),
  password: z.string().min(1, "Password required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email"),
  username: z.string().min(3),
  newPassword: z.string().min(8),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
});

/* ────────────────────────── Challenge Schemas ────────────────────────── */

export const challengeSubmitSchema = z.object({
  challengeId: z.string().min(1, "challengeId is required"),
  stdout: z.string().default(""),
  code: z.string().min(1, "Code cannot be empty"),
});

export const dailySubmitSchema = z.object({
  challengeId: z.string().min(1, "challengeId required"),
  code: z.string().min(1, "Code required"),
  output: z.string().default(""),
});

/* ────────────────────────── XP Schema ────────────────────────────────── */

export const xpClaimSchema = z.object({
  xpToken: z.string().min(1, "XP proof token required"),
});

/* ────────────────────────── Duels Schemas ────────────────────────────── */

const duelCreateSchema = z.object({
  action: z.literal("create"),
  timeLimit: z.number().int().min(60).max(600).optional().default(300),
});

const duelJoinSchema = z.object({
  action: z.literal("join"),
  duelId: z.string().min(1, "duelId required"),
});

const duelSubmitSchema = z.object({
  action: z.literal("submit"),
  duelId: z.string().min(1, "duelId required"),
  code: z.string().default(""),
  output: z.string().default(""),
  passed: z.boolean().default(false),
});

const duelCancelSchema = z.object({
  action: z.literal("cancel"),
  duelId: z.string().min(1, "duelId required"),
});

export const duelActionSchema = z.discriminatedUnion("action", [
  duelCreateSchema,
  duelJoinSchema,
  duelSubmitSchema,
  duelCancelSchema,
]);

export const duelChatSchema = z.object({
  duelId: z.string().min(1, "duelId required"),
  text: z.string().min(1).max(500),
});

export const duelPresenceSchema = z.object({
  duelId: z.string().min(1),
  typing: z.boolean().optional(),
  lineCount: z.number().int().optional(),
  online: z.boolean().optional(),
});

/* ────────────────────────── Comments Schema ──────────────────────────── */

export const commentCreateSchema = z.object({
  challengeId: z.string().min(1, "challengeId required"),
  text: z.string().min(1).max(2000, "Comment too long (max 2000 chars)"),
});

export const commentLikeSchema = z.object({
  commentId: z.string().min(1, "commentId required"),
});

/* ────────────────────────── Community Challenge Schema ───────────────── */

export const communityCreateSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  tag: z.string().max(50).optional().default("General"),
  difficulty: z.number().int().min(1).max(3).optional().default(1),
  starterCode: z.string().max(5000).optional().default(""),
  expectedOutput: z.string().max(2000).optional().default(""),
  criteria: z.string().max(2000).optional().default(""),
  steps: z.array(z.string()).optional().default([]),
});

export const communityLikeSchema = z.object({
  challengeId: z.string().min(1),
});

/* ────────────────────────── Notifications Schemas ────────────────────── */

export const notificationPatchSchema = z.union([
  z.object({ all: z.literal(true) }),
  z.object({ ids: z.array(z.string().min(1)).min(1).max(50) }),
]);

export const notificationDeleteSchema = z.object({
  id: z.string().min(1, "ID required"),
});

/* ────────────────────────── Settings Schemas ─────────────────────────── */

export const settingsChangePasswordSchema = z.object({
  action: z.literal("change_password"),
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const settingsDeleteAccountSchema = z.object({
  password: z.string().min(1),
});

/* ────────────────────────── Profile Schema ───────────────────────────── */

export const profileUpdateSchema = z.object({
  fullName: z.string().min(2).max(100),
});

/* ────────────────────────── Social Schema ────────────────────────────── */

export const followSchema = z.object({
  targetUserId: z.string().min(1, "Target user ID required"),
});

/* ────────────────────────── Mentor Hint Schema ──────────────────────── */

export const mentorHintSchema = z.object({
  code: z.string().max(10000).default(""),
  challengeTitle: z.string().default(""),
  description: z.string().default(""),
  rubric: z.string().default(""),
  mentorInstructions: z.string().default(""),
  stdout: z.string().default(""),
  stderr: z.string().default(""),
  expectedOutput: z.string().default(""),
});

/* ────────────────────────── Admin Schemas ────────────────────────────── */

export const adminChallengeCreateSchema = z.object({
  id: z.string().min(1),
  tag: z.string().optional().default("Basics"),
  difficulty: z.number().int().min(1).max(5).optional().default(1),
  title: z.string().min(1),
  description: z.string().min(1),
  criteria: z.string().default(""),
  mentorInstructions: z.string().default(""),
  rubric: z.string().default(""),
  steps: z.array(z.string()).default([]),
  starterCode: z.string().default(""),
  expectedOutput: z.string().default(""),
  retryHelp: z.string().default(""),
  order: z.number().int().default(0),
  active: z.boolean().default(true),
});

export const adminChallengeUpdateSchema = z.object({
  tag: z.string().optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  criteria: z.string().optional(),
  mentorInstructions: z.string().optional(),
  rubric: z.string().optional(),
  steps: z.array(z.string()).optional(),
  starterCode: z.string().optional(),
  expectedOutput: z.string().optional(),
  retryHelp: z.string().optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});

export const adminUserUpdateSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  xp: z.number().int().min(0).optional(),
  resetXp: z.boolean().optional(),
  ban: z.boolean().optional(),
});
