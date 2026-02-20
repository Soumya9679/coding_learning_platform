import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

/**
 * GET /api/auth/verify-email?token=xxx — verify a user's email address.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`verify-email:${ip}`, { max: 10, windowSeconds: 60 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    const token = request.nextUrl.searchParams.get("token");
    if (!token || token.length !== 64) {
      return NextResponse.json({ error: "Invalid or missing verification token." }, { status: 400 });
    }

    // Find user with matching token
    const snap = await db
      .collection("users")
      .where("verificationToken", "==", token)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 404 });
    }

    const userDoc = snap.docs[0];
    const data = userDoc.data();

    if (data.emailVerified) {
      return NextResponse.json({ message: "Email already verified." });
    }

    if (data.verificationTokenExpiry && Date.now() > data.verificationTokenExpiry) {
      return NextResponse.json({ error: "Token has expired. Please request a new verification email." }, { status: 410 });
    }

    await userDoc.ref.update({
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    });

    // Redirect to login with a success message
    return NextResponse.redirect(new URL("/login?verified=true", request.url));
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
