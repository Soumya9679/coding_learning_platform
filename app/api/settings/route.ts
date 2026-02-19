import { NextRequest, NextResponse } from "next/server";
import { authenticateFromRequest, hashPassword, comparePassword, isStrongPassword } from "@/lib/auth";
import { db } from "@/lib/firebase";

/**
 * PATCH /api/settings — change password or delete account.
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const user = authenticateFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const userDoc = await db.collection("users").doc(user.uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    const userData = userDoc.data()!;

    // --- Change Password ---
    if (action === "change_password") {
      const { currentPassword, newPassword } = body;

      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: "Both current and new passwords are required." }, { status: 400 });
      }

      const valid = await comparePassword(currentPassword, userData.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
      }

      if (!isStrongPassword(newPassword)) {
        return NextResponse.json({ error: "New password must be at least 8 characters with a number." }, { status: 400 });
      }

      if (currentPassword === newPassword) {
        return NextResponse.json({ error: "New password must be different from current." }, { status: 400 });
      }

      const hash = await hashPassword(newPassword);
      await db.collection("users").doc(user.uid).update({ passwordHash: hash });

      return NextResponse.json({ message: "Password changed successfully." });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    console.error("Settings PATCH error:", error);
    return NextResponse.json({ error: "Failed to update settings." }, { status: 500 });
  }
}

/**
 * DELETE /api/settings — delete own account.
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const user = authenticateFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: "Password required to delete account." }, { status: 400 });
    }

    const userDoc = await db.collection("users").doc(user.uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const valid = await comparePassword(password, userDoc.data()!.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 403 });
    }

    // Delete user's submissions
    const subs = await db.collection("submissions").where("userId", "==", user.uid).get();
    const batch = db.batch();
    subs.docs.forEach((doc) => batch.delete(doc.ref));
    batch.delete(db.collection("users").doc(user.uid));
    await batch.commit();

    // Clear session cookie
    const response = NextResponse.json({ message: "Account deleted." });
    response.cookies.set("pulsepy_session", "", { maxAge: 0, path: "/" });
    return response;
  } catch (error) {
    console.error("Settings DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete account." }, { status: 500 });
  }
}
