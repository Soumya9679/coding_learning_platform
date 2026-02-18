import { NextResponse } from "next/server";
import { challengeSuites, evaluatePythonSubmission, MAX_CODE_CHARACTERS } from "@/lib/challenges";

export async function POST(request, { params }) {
  const { challengeId } = await params;
  const challenge = challengeSuites[challengeId];

  if (!challenge) {
    return NextResponse.json({ error: "Unknown challenge." }, { status: 404 });
  }

  try {
    const body = await request.json();
    const code = (body?.code || "").trim();

    if (!code) {
      return NextResponse.json({ error: "Send some code to evaluate." }, { status: 400 });
    }
    if (code.length > MAX_CODE_CHARACTERS) {
      return NextResponse.json({ error: "Code is too large. Keep submissions under 8k characters." }, { status: 413 });
    }

    const evaluation = await evaluatePythonSubmission(code, challenge);
    return NextResponse.json({
      challengeId,
      title: challenge.title,
      ...evaluation,
    });
  } catch (error) {
    console.error("Challenge evaluation failed", error);
    return NextResponse.json(
      { error: error.message || "Unable to evaluate code right now." },
      { status: error.statusCode || 500 }
    );
  }
}
