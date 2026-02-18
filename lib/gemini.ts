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
    `Challenge: ${input.challengeTitle}`,
    `Description: ${input.description}`,
    `Rubric: ${input.rubric}`,
    `Instructions: ${input.mentorInstructions}`,
    `Learner code:\n${input.code}`,
    input.stdout ? `stdout:\n${input.stdout}` : "",
    input.stderr ? `stderr:\n${input.stderr}` : "",
    `Expected output:\n${input.expectedOutput}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function sanitizeHint(raw: string): string {
  return raw.replace(/```[\s\S]*?```/g, "[code hidden]").trim();
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
      generationConfig: { maxOutputTokens: 256, temperature: 0.7 },
    }),
  });

  if (!res.ok) return "";
  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return sanitizeHint(raw);
}
