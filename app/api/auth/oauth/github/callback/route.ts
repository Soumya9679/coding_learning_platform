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

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

// GET /api/auth/oauth/github/callback
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

    // Verify state
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

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL("/login?error=oauth_config", request.url));
    }

    // Exchange code for access token
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL("/login?error=oauth_token", request.url));
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return NextResponse.redirect(new URL("/login?error=oauth_token", request.url));
    }

    // Get user info
    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    });
    if (!userRes.ok) {
      return NextResponse.redirect(new URL("/login?error=oauth_userinfo", request.url));
    }
    const ghUser: GitHubUser = await userRes.json();

    // Get primary email if not in profile
    let email = ghUser.email;
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
      });
      if (emailsRes.ok) {
        const emails: GitHubEmail[] = await emailsRes.json();
        const primary = emails.find((e) => e.primary && e.verified);
        email = primary?.email || emails.find((e) => e.verified)?.email || null;
      }
    }

    if (!email) {
      return NextResponse.redirect(new URL("/login?error=oauth_no_email", request.url));
    }

    const emailNorm = email.toLowerCase();

    // Check if user exists
    let userDoc: FirebaseFirestore.DocumentSnapshot | null = null;
    const existingSnap = await db.collection("users").where("emailNormalized", "==", emailNorm).limit(1).get();

    if (!existingSnap.empty) {
      userDoc = existingSnap.docs[0];
      const userData = userDoc.data()!;
      if (!userData.oauthProviders?.includes("github")) {
        await userDoc.ref.update({
          oauthProviders: admin.firestore.FieldValue.arrayUnion("github"),
          githubId: ghUser.id,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } else {
      // Create new user
      let username = ghUser.login?.toLowerCase().slice(0, 20) || `user_${Date.now()}`;
      const usernameSnap = await db.collection("users").where("usernameNormalized", "==", username).limit(1).get();
      if (!usernameSnap.empty) {
        username = `${username}${Date.now() % 10000}`;
      }

      const randomPass = crypto.randomUUID();
      const newUser = {
        fullName: ghUser.name || ghUser.login || "",
        email,
        emailNormalized: emailNorm,
        username,
        usernameNormalized: username,
        passwordHash: await hashPassword(randomPass),
        role: "user",
        oauthProviders: ["github"],
        githubId: ghUser.id,
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

    // Session
    const userData = userDoc!.data()!;
    const sessionPayload = buildSessionPayload(userDoc!.id, userData);
    const sessionToken = signSessionToken(sessionPayload);
    const cookieOpts = getSessionCookieOptions();

    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, cookieOpts);
    response.cookies.delete("oauth_state");
    response.cookies.set("pulsepy_oauth_token", sessionToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30,
    });

    return response;
  } catch (error) {
    console.error("GitHub OAuth callback error:", error);
    return NextResponse.redirect(new URL("/login?error=oauth_server", request.url));
  }
}
