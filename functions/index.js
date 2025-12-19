const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.mentorHint = functions.https.onCall(async (data) => {
  const { code = "" } = data;
  if (!code) {
    return {
      hint: "Drop some code so I can help!",
      tone: "spark",
    };
  }

  const hasLoop = /for\s+.+in\s+range/.test(code);
  const hasPrint = /print\s*\(/.test(code);

  const hint = hasLoop
    ? "Looks like a loop party. Check the range stop value so it runs enough times."
    : hasPrint
    ? "You're printing like a pro. Try storing the phrase in a variable to remix it."
    : "Start with a print statement to see instant feedback.";

  return {
    hint,
    tone: hasLoop ? "calm" : "spark",
    model: "GPT-5.1-Codex-Max backed Gemini experience",
  };
});
