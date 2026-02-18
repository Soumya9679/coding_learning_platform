const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export function buildPrompt({ challengeTitle, description, rubric, mentorInstructions, code, stdout, stderr, expectedOutput }) {
  return `You are Gemini acting as a patient Python mentor. ${mentorInstructions}

Challenge: ${challengeTitle}
Brief: ${description}
Success rubric: ${rubric}
Expected output:\n${expectedOutput}

Learner code:\n${code}

Program stdout:\n${stdout}

Errors or mismatch info:\n${stderr || "No runtime error."}

Respond with:
1. A gentle explanation of what is wrong or missing (max 2 sentences).
2. One actionable hint. No full solutions, no full code snippets. Encourage them to retry.`;
}

export function sanitizeHint(text = "") {
  if (!text) return "Focus on matching the three-loop pattern and keep the print text identical each time.";
  const withoutCode = text.replace(/```[\s\S]*?```/g, "").replace(/print\s*\(.+\)/gi, "use print(..)");
  const trimmed = withoutCode.split(/\n{2,}/)[0]?.trim();
  return trimmed || text;
}

export function fallbackResponse(message, tone = "info") {
  return { hint: message, tone, model: "mentor-fallback" };
}

export function fallbackCopy(stdout, stderr) {
  if (stderr) return "Check the exact error message and verify your loop syntax or indentation.";
  if (!stdout?.trim()) return "Nothing printed yet. Make sure your loop calls print inside the body.";
  return "Compare your lines with the expected output and adjust the spacing or count.";
}

export async function fetchGeminiHint(promptText) {
  if (!GEMINI_API_KEY) return null;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: promptText }] }],
      }),
    }
  );

  if (!response.ok) throw new Error(`Gemini error: ${response.status}`);

  const result = await response.json();
  const rawText = result?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join(" ").trim();
  return sanitizeHint(rawText);
}

export { GEMINI_MODEL };
