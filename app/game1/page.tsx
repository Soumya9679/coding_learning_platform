"use client";

import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Button, Badge, Card, AnimatedSection } from "@/components/ui";
import { AuthGuard } from "@/components/AuthGuard";
import { applyAuthHeaders } from "@/lib/session";
import { Bug, Heart, RotateCcw, ArrowRight, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

function awardGameXP(gameId: string, perfect: boolean) {
  const action = perfect ? "game_perfect" : "game_complete";
  fetch("/api/leaderboard/xp", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...applyAuthHeaders() },
    body: JSON.stringify({ action, gameId }),
  }).catch(() => {});
}

const questions = [
  { q: "What is the output of: print(2 ** 3)?", options: ["6", "8", "9", "Error"], answer: 1 },
  { q: "Which keyword is used to define a function in Python?", options: ["function", "define", "def", "fun"], answer: 2 },
  { q: "What is the correct file extension for Python?", options: [".pt", ".py", ".python", ".p"], answer: 1 },
  { q: "What does len('hello') return?", options: ["4", "5", "6", "Error"], answer: 1 },
  { q: "Which collection is ordered and mutable?", options: ["tuple", "list", "set", "dict"], answer: 1 },
  { q: "How do you start a comment in Python?", options: ["//", "<!-- -->", "#", "/* */"], answer: 2 },
  { q: "What is the output of print(type(3.0))?", options: ["<class 'int'>", "<class 'float'>", "<class 'str'>", "<class 'bool'>"], answer: 1 },
  { q: "Which keyword exits a loop early?", options: ["exit", "stop", "break", "quit"], answer: 2 },
  { q: "Select the correct boolean operators.", options: ["and / or / not", "plus / minus", "if / else", "greater / less"], answer: 0 },
  { q: "What does list.append(x) do?", options: ["Adds x to end", "Adds x to start", "Removes x", "Copies list"], answer: 0 },
  { q: "How to open a file for reading?", options: ["open('file', 'r')", "open('file', 'w')", "read('file')", "file.open()"], answer: 0 },
  { q: "What is the output of bool('')?", options: ["True", "False", "0", "Error"], answer: 1 },
  { q: "Which loop guarantees at least one run?", options: ["for", "while", "do-while", "None"], answer: 3 },
  { q: "PEP 8 refers to?", options: ["Style guide", "Loop type", "Data type", "Package"], answer: 0 },
  { q: "What is a virtual environment for?", options: ["Game dev", "Isolating deps", "Speeding CPU", "Compiling"], answer: 1 },
  { q: "Which built-in converts to int?", options: ["toInt()", "int()", "cast()", "number()"], answer: 1 },
  { q: "How to format with f-strings?", options: ["f'{name}'", "format(name)", "'%s' % name", "concat(name)"], answer: 0 },
  { q: "What does range(3) produce?", options: ["1,2,3", "0,1,2", "0,1,2,3", "2,3,4"], answer: 1 },
  { q: "Pick an immutable type.", options: ["list", "dict", "set", "tuple"], answer: 3 },
  { q: "What does pass keyword do?", options: ["Skip placeholder", "Stop loop", "Throw error", "Import"], answer: 0 },
];

export default function Game1Page() {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [feedback, setFeedback] = useState("Pick the best answer to squash the bug.");
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const xpAwarded = useRef(false);

  const checkAnswer = useCallback((idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);

    const q = questions[current];
    if (idx === q.answer) {
      setScore((s) => s + 10);
      setFeedback("✅ Correct! Bug fixed.");
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      setFeedback(`❌ Wrong. Correct: ${q.options[q.answer]}`);
      if (newLives <= 0) {
        setGameOver(true);
        setFeedback(`💀 Game over. Final score: ${score}. Restart to try again.`);
      }
    }
  }, [answered, current, lives, score]);

  const nextQuestion = () => {
    if (gameOver) return;
    const next = current + 1;
    if (next >= questions.length) {
      const finalScore = score + (selected === questions[current].answer ? 10 : 0);
      setFeedback(`🏆 You finished all levels! Final score: ${finalScore}.`);
      setGameOver(true);
      if (!xpAwarded.current) {
        xpAwarded.current = true;
        awardGameXP("game1", lives === 3);
      }
      return;
    }
    setCurrent(next);
    setAnswered(false);
    setSelected(null);
  };

  const resetGame = () => {
    setCurrent(0);
    setScore(0);
    setLives(3);
    setFeedback("Pick the best answer to squash the bug.");
    setAnswered(false);
    setSelected(null);
    setGameOver(false);
    xpAwarded.current = false;
  };

  const q = questions[current];
  const pct = ((current + 1) / questions.length) * 100;

  return (
    <AuthGuard>
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-danger/8 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 relative space-y-6">
        {/* Header */}
        <AnimatedSection>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-danger-muted flex items-center justify-center">
                <Bug className="w-5 h-5 text-danger" />
              </div>
              <div>
                <p className="text-xs text-muted font-mono">Python Quest</p>
                <h1 className="text-xl font-bold">Bug Hunter</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="accent">Score <span className="font-bold ml-1">{score}</span></Badge>
              <Badge variant={lives > 1 ? "success" : "danger"}>
                <Heart className="w-3 h-3 mr-1" />
                {lives}
              </Badge>
              <Badge variant="neutral">Lvl {current + 1}</Badge>
            </div>
          </div>
        </AnimatedSection>

        {/* Question Card */}
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="space-y-6">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-accent to-accent-hot rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-xs text-muted text-right">Question {current + 1} of {questions.length}</p>
            </div>

            {/* Question */}
            <p className="text-lg font-medium leading-relaxed">{q.q}</p>

            {/* Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {q.options.map((opt, idx) => (
                <button
                  key={idx}
                  className={cn(
                    "text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200",
                    !answered && "border-border hover:border-accent/40 hover:bg-accent-muted/30 cursor-pointer",
                    answered && idx === q.answer && "border-success/50 bg-success-muted text-success",
                    answered && idx === selected && idx !== q.answer && "border-danger/50 bg-danger-muted text-danger",
                    answered && idx !== q.answer && idx !== selected && "border-border opacity-50",
                    "disabled:cursor-default"
                  )}
                  disabled={answered}
                  onClick={() => checkAnswer(idx)}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Feedback */}
            <div className={cn(
              "px-4 py-3 rounded-xl text-sm",
              feedback.includes("✅") && "bg-success-muted/50 text-success",
              feedback.includes("❌") && "bg-danger-muted/50 text-danger",
              feedback.includes("💀") && "bg-danger-muted/50 text-danger",
              feedback.includes("🏆") && "bg-success-muted/50 text-success",
              !feedback.includes("✅") && !feedback.includes("❌") && !feedback.includes("💀") && !feedback.includes("🏆") && "bg-bg-elevated text-muted-light"
            )}>
              {feedback}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={resetGame}>
                <RotateCcw className="w-4 h-4" />
                Restart
              </Button>
              <Button
                disabled={!answered || gameOver}
                onClick={nextQuestion}
              >
                Next Level
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
    </AuthGuard>
  );
}
