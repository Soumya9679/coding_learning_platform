import { NextResponse } from "next/server";
import {
  buildPrompt,
  sanitizeHint,
  fallbackResponse,
  fallbackCopy,
  fetchGeminiHint,
  GEMINI_MODEL,
} from "@/lib/gemini";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      code = "",
      challengeTitle = "Untitled challenge",
      description = "",
      rubric = "",
      mentorInstructions = "Offer one short hint.",
      stdout = "",
      stderr = "",
      expectedOutput = "",
    } = body || {};

    if (!code.trim()) {
      return NextResponse.json(fallbackResponse("Drop some code so I can help!", "spark"));
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        fallbackResponse("Mentor is offline. Focus on matching the expected output first!", "info")
      );
    }

    const prompt = buildPrompt({
      challengeTitle, description, rubric, mentorInstructions,
      code, stdout, stderr, expectedOutput,
    });

    const hint = await fetchGeminiHint(prompt);

    return NextResponse.json({
      hint: hint || fallbackCopy(stdout, stderr),
      tone: stderr ? "calm" : "spark",
      model: `Gemini (${GEMINI_MODEL})`,
    });
  } catch (error) {
    console.error("mentorHint failure", error);
    return NextResponse.json(
      fallbackResponse("Mentor had a hiccup. Check your loop length or print spacing while we reconnect.", "calm")
    );
  }
}
