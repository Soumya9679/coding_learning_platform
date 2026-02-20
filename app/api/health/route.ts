import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";

const startTime = Date.now();

export async function GET(): Promise<NextResponse> {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const timestamp = new Date().toISOString();

  // Check Firebase connectivity
  let firebaseStatus: "ok" | "unreachable" = "ok";
  let firebaseLatencyMs = 0;

  try {
    const t0 = Date.now();
    await db.collection("users").limit(1).get();
    firebaseLatencyMs = Date.now() - t0;
  } catch {
    firebaseStatus = "unreachable";
  }

  const overall = firebaseStatus === "ok" ? "ok" : "degraded";

  return NextResponse.json({
    status: overall,
    timestamp,
    uptime,
    services: {
      firebase: {
        status: firebaseStatus,
        latencyMs: firebaseLatencyMs,
      },
    },
    environment: process.env.NODE_ENV || "development",
  });
}
