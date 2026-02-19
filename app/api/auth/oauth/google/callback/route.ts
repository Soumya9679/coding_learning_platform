import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";
import { db } from "@/lib/firebase";
import {
  buildSessionPayload,
  signSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
  hashPassword,
} from "@/lib/auth";

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
}

// GET /api/auth/oauth/google/callback — handle Google OAuth callback
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const error = request.nextUrl.searchParams.get("error");

    if (error) {
      return NextResponse.redirect(new URL("/login?error=oauth_denied", request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL("/login?error=oauth_invalid", request.url));
    }

    // Verify state (CSRF protection)
    const cookieHeader = request.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [k, ...v] = c.trim().split("=");
        return [k, v.join("=")];
      })
    );
    if (cookies["oauth_state"] !== state) {
      return NextResponse.redirect(new URL("/login?error=oauth_state", request.url));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL("/login?error=oauth_config", request.url));
    }

    // Exchange code for tokens
    const redirectUri = `${request.nextUrl.origin}/api/auth/oauth/google/callback`;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL("/login?error=oauth_token", request.url));
    }

    const tokenData: GoogleTokenResponse = await tokenRes.json();

    // Get user info
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoRes.ok) {
      return NextResponse.redirect(new URL("/login?error=oauth_userinfo", request.url));
    }

    const userInfo: GoogleUserInfo = await userInfoRes.json();

    if (!userInfo.email) {
      return NextResponse.redirect(new URL("/login?error=oauth_no_email", request.url));
    }

    const emailNorm = userInfo.email.toLowerCase();

    // Check if user exists by email
    let userDoc: FirebaseFirestore.DocumentSnapshot | null = null;
    const existingSnap = await db.collection("users").where("emailNormalized", "==", emailNorm).limit(1).get();

    if (!existingSnap.empty) {
      // Existing user — log them in
      userDoc = existingSnap.docs[0];

      // Link OAuth provider if not already
      const userData = userDoc.data()!;
      if (!userData.oauthProviders?.includes("google")) {
        await userDoc.ref.update({
          oauthProviders: admin.firestore.FieldValue.arrayUnion("google"),
          googleSub: userInfo.sub,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } else {
      // New user — create account
      const username = userInfo.name
        ?.replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase()
        .slice(0, 20) || `user_${Date.now()}`;

      // Ensure unique username
      let finalUsername = username;
      const usernameSnap = await db.collection("users").where("usernameNormalized", "==", finalUsername).limit(1).get();
      if (!usernameSnap.empty) {
        finalUsername = `${username}${Date.now() % 10000}`;
      }

      const randomPass = crypto.randomUUID();
      const newUser = {
        fullName: userInfo.name || "",
        email: userInfo.email,
        emailNormalized: emailNorm,
        username: finalUsername,
        usernameNormalized: finalUsername,
        passwordHash: await hashPassword(randomPass),
        role: "user",
        oauthProviders: ["google"],
        googleSub: userInfo.sub,
        xp: 0,
        challengesCompleted: 0,
        gamesPlayed: 0,
        streak: 0,
        completedChallenges: [],
        lastActiveDate: "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await db.collection("users").add(newUser);
      userDoc = await docRef.get();
    }

    // Create session
    const userData = userDoc!.data()!;
    const sessionPayload = buildSessionPayload(userDoc!.id, userData);
    const sessionToken = signSessionToken(sessionPayload);
    const cookieOpts = getSessionCookieOptions();

    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, cookieOpts);
    response.cookies.delete("oauth_state");

    // Persist token for client-side usage
    // We'll set a temporary cookie that the client can read
    response.cookies.set("pulsepy_oauth_token", sessionToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30, // Short-lived, client reads and stores in localStorage
    });

    return response;
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(new URL("/login?error=oauth_server", request.url));
  }
}
