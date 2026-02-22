const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

interface PromptInput {
  challengeTitle: string;
  description: string;
  rubric: string;
  mentorInstructions: string;
  code: string;
  stdout: string;
  stderr: string;
  expectedOutput: string;
}

export function buildPrompt(input: PromptInput): string {
  return [
    `You are a concise AI coding mentor. Reply with a 4–5 sentence hint. No code blocks. No full solutions. Guide the learner toward the next step with clear, encouraging advice.`,
    ``,
    `Challenge: ${input.challengeTitle}`,
    input.description ? `Description: ${input.description}` : "",
    input.rubric ? `Rubric: ${input.rubric}` : "",
    `Learner code:\n${input.code}`,
    input.stdout ? `stdout:\n${input.stdout}` : "",
    input.stderr ? `stderr:\n${input.stderr}` : "",
    `Expected output:\n${input.expectedOutput}`,
    ``,
    `Reply in 4–5 sentences. Be encouraging. Point toward the next step without giving the full answer.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function sanitizeHint(raw: string): string {
  // Strip code blocks
  let text = raw.replace(/```[\s\S]*?```/g, "").trim();

  // Trim to last complete sentence so we never show a half-finished thought
  const sentenceEnd = /[.!?]/;
  if (text.length > 0 && !sentenceEnd.test(text[text.length - 1])) {
    // Find the last sentence-ending punctuation
    let lastIdx = -1;
    for (let i = text.length - 1; i >= 0; i--) {
      if (sentenceEnd.test(text[i])) {
        lastIdx = i;
        break;
      }
    }
    if (lastIdx > 0) {
      text = text.substring(0, lastIdx + 1);
    }
  }

  return text.trim();
}

export function fallbackCopy(stdout: string, stderr: string): string {
  if (stderr) return "I see an error in your output. Check the traceback and try fixing the line it points to.";
  if (!stdout) return "Your code didn't produce any visible output. Add a print statement.";
  return "You're close! Compare your output carefully with the expected result.";
}

export function fallbackResponse(hint: string, tone: string) {
  return { hint, tone, model: "fallback" };
}

export async function fetchGeminiHint(prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 350, temperature: 0.7 },
    }),
  });

  if (!res.ok) return "";
  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return sanitizeHint(raw);
}
