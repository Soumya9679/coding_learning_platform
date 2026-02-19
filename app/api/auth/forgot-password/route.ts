import { NextRequest, NextResponse } from "next/server";
import {
  getUserByField,
  isStrongPassword,
  hashPassword,
} from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limit: 5 attempts per 15 minutes per IP
    const ip = getClientIp(request);
    const rl = checkRateLimit(`forgot:${ip}`, { max: 5, windowSeconds: 900 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${rl.retryAfterSeconds}s.` },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }
    const body = await request.json();
    const { email = "", username = "", newPassword = "", confirmPassword = "" } = body || {};

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    if (!normalizedEmail || !normalizedUsername) {
      return NextResponse.json(
        { error: "Both email and username are required to verify your identity." },
        { status: 400 }
      );
    }

    if (!newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "New password and confirmation are required." },
        { status: 400 }
      );
    }

    if (!isStrongPassword(newPassword)) {
      return NextResponse.json(
        { error: "Password must be 8+ characters and include a number." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Password and confirmation must match." },
        { status: 400 }
      );
    }

    // Look up user by email
    const userByEmail = await getUserByField("emailNormalized", normalizedEmail);
    if (!userByEmail) {
      // Generic message to avoid user enumeration
      return NextResponse.json(
        { error: "We couldn't verify your identity. Please check your email and username." },
        { status: 400 }
      );
    }

    // Verify username matches the email
    const storedUsername = (userByEmail.usernameNormalized || userByEmail.username || "").toLowerCase();
    if (storedUsername !== normalizedUsername) {
      return NextResponse.json(
        { error: "We couldn't verify your identity. Please check your email and username." },
        { status: 400 }
      );
    }

    // Identity verified — update password
    const newHash = await hashPassword(newPassword);
    await userByEmail.ref.update({ passwordHash: newHash });

    return NextResponse.json({ message: "Password reset successful! You can now sign in." });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
