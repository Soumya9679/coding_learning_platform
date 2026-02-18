import { NextResponse } from "next/server";
import { getClearCookieOptions, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(SESSION_COOKIE_NAME, "", getClearCookieOptions());
  return response;
}
