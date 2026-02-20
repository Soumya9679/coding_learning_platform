"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Badge, Card } from "@/components/ui";
import { AuthGuard } from "@/components/AuthGuard";
import { applyAuthHeaders } from "@/lib/session";
import {
  Crosshair, Timer, Flame, Trophy, RotateCcw, ChevronRight,
  Zap, Target, ArrowRight, Keyboard, CheckCircle2, XCircle
} from "lucide-react";
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

interface Snippet {
  code: string;
  concept: string;
  explanation: string;
  difficulty: number;
}

const snippetBank: Snippet[] = [
  // Difficulty 1 — short lines
  { difficulty: 1, code: "print('Hello, World!')", concept: "Print statement", explanation: "print() outputs text to the console. Strings go in quotes." },
  { difficulty: 1, code: "x = 42", concept: "Variable assignment", explanation: "Variables store values. No type declaration needed in Python." },
  { difficulty: 1, code: "name = input('Name: ')", concept: "User input", explanation: "input() reads from stdin and returns a string." },
  { difficulty: 1, code: "nums = [1, 2, 3, 4, 5]", concept: "List literal", explanation: "Lists are ordered, mutable collections defined with square brackets." },
  { difficulty: 1, code: "for i in range(10):", concept: "For loop", explanation: "range(10) generates 0 through 9. Don't forget the colon!" },
  { difficulty: 1, code: "if x > 0:", concept: "Conditional", explanation: "if statements control flow. The colon marks the start of the block." },
  { difficulty: 1, code: "len('python')", concept: "String length", explanation: "len() returns the number of characters in a string." },
  { difficulty: 1, code: "words = text.split(' ')", concept: "String split", explanation: "split() breaks a string into a list at each separator." },
  { difficulty: 1, code: "result = a + b", concept: "Addition", explanation: "The + operator adds numbers or concatenates strings." },
  { difficulty: 1, code: "import random", concept: "Module import", explanation: "import brings external modules into your namespace." },

  // Difficulty 2 — medium lines
  { difficulty: 2, code: "def greet(name):", concept: "Function definition", explanation: "def creates functions. Parameters go in parentheses." },
  { difficulty: 2, code: "squares = [x**2 for x in range(5)]", concept: "List comprehension", explanation: "Compact syntax to build lists from iterables with optional filters." },
  { difficulty: 2, code: "data = {'key': 'value'}", concept: "Dictionary literal", explanation: "Dicts store key-value pairs. Keys must be immutable." },
  { difficulty: 2, code: "with open('file.txt') as f:", concept: "Context manager", explanation: "with ensures the file is closed automatically after use." },
  { difficulty: 2, code: "return sum(nums) / len(nums)", concept: "Return statement", explanation: "return sends a value back from a function to its caller." },
  { difficulty: 2, code: "except ValueError as e:", concept: "Exception handling", explanation: "except catches specific errors. 'as e' binds the exception." },
  { difficulty: 2, code: "prices = {k: v for k, v in items}", concept: "Dict comprehension", explanation: "Comprehension syntax works for dicts too with {key: value...}." },
  { difficulty: 2, code: "lambda x: x * 2", concept: "Lambda function", explanation: "lambda creates small anonymous functions in a single expression." },
  { difficulty: 2, code: "filtered = list(filter(bool, data))", concept: "Filter function", explanation: "filter() keeps only items where the function returns True." },
  { difficulty: 2, code: "', '.join(['a', 'b', 'c'])", concept: "String join", explanation: "join() glues a list of strings with the separator between them." },

  // Difficulty 3 — longer/trickier lines
  { difficulty: 3, code: "from collections import defaultdict", concept: "Specific import", explanation: "Import specific classes from modules to keep namespace clean." },
  { difficulty: 3, code: "result = [x for x in data if x % 2 == 0]", concept: "Filtered comprehension", explanation: "Add an if clause to list comprehensions to filter items." },
  { difficulty: 3, code: "sorted(users, key=lambda u: u.age)", concept: "Custom sorting", explanation: "key= accepts a function that extracts the comparison value." },
  { difficulty: 3, code: "@staticmethod", concept: "Decorator", explanation: "Decorators modify function behavior. @ is syntactic sugar." },
  { difficulty: 3, code: "async def fetch_data(url: str):", concept: "Async function", explanation: "async def creates coroutines for non-blocking I/O operations." },
  { difficulty: 3, code: "yield from generate_items(batch)", concept: "Yield delegation", explanation: "yield from delegates to a sub-generator, forwarding its values." },
  { difficulty: 3, code: "total = sum(p.price for p in products)", concept: "Generator expression", explanation: "Generator expressions are memory-efficient — no list is created." },
  { difficulty: 3, code: "if __name__ == '__main__':", concept: "Main guard", explanation: "This idiom prevents code from running when the module is imported." },
  { difficulty: 3, code: "class Node:", concept: "Class definition", explanation: "class creates a blueprint for objects with shared behavior." },
  { difficulty: 3, code: "a, *rest, z = [1, 2, 3, 4, 5]", concept: "Extended unpacking", explanation: "* captures remaining items into a list during unpacking." },
];

function shuffle<T>(list: T[]): T[] {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const TOTAL_ROUNDS = 12;
const TIME_LIMIT = 90; // seconds

interface GameState {
  deck: Snippet[];
  round: number;
  score: number;
  streak: number;
  bestStreak: number;
  mistakes: number;
  perfectRounds: number;
  finished: boolean;
  totalCharsTyped: number;
  totalCharsCorrect: number;
}

function buildDeck(): Snippet[] {
  const easy = shuffle(snippetBank.filter(s => s.difficulty === 1)).slice(0, 4);
  const med = shuffle(snippetBank.filter(s => s.difficulty === 2)).slice(0, 4);
  const hard = shuffle(snippetBank.filter(s => s.difficulty === 3)).slice(0, 4);
  return [...easy, ...med, ...hard];
}

export default function Game1Page() {
  const [state, setState] = useState<GameState>(() => ({
    deck: buildDeck(), round: 0, score: 0, streak: 0, bestStreak: 0,
    mistakes: 0, perfectRounds: 0, finished: false, totalCharsTyped: 0, totalCharsCorrect: 0,
  }));
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [roundStatus, setRoundStatus] = useState<"typing" | "correct" | "wrong">("typing");
  const [showExplanation, setShowExplanation] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [charStatuses, setCharStatuses] = useState<("correct" | "wrong" | "pending")[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const xpAwarded = useRef(false);

  const currentSnippet = state.deck[state.round];

  // Focus input on mount and round change
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [state.round]);

  // Timer
  useEffect(() => {
    if (state.finished) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setState(s => ({ ...s, finished: true }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state.finished]);

  // Update character-by-character status
  useEffect(() => {
    if (!currentSnippet) return;
    const target = currentSnippet.code;
    const statuses: ("correct" | "wrong" | "pending")[] = [];
    for (let i = 0; i < target.length; i++) {
      if (i >= input.length) statuses.push("pending");
      else if (input[i] === target[i]) statuses.push("correct");
      else statuses.push("wrong");
    }
    setCharStatuses(statuses);
  }, [input, currentSnippet]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (roundStatus !== "typing" || state.finished) return;
    const val = e.target.value;
    setInput(val);

    const target = currentSnippet.code;
    if (val === target) {
      // Perfect match!
      const isPerfect = val.split("").every((c, i) => c === target[i]);
      const diffBonus = currentSnippet.difficulty * 20;
      const streakBonus = state.streak * 5;
      const roundScore = 50 + diffBonus + streakBonus;

      setRoundStatus("correct");
      setShowExplanation(true);
      setState(prev => ({
        ...prev,
        score: prev.score + roundScore,
        streak: prev.streak + 1,
        bestStreak: Math.max(prev.bestStreak, prev.streak + 1),
        perfectRounds: prev.perfectRounds + (isPerfect ? 1 : 0),
        totalCharsTyped: prev.totalCharsTyped + val.length,
        totalCharsCorrect: prev.totalCharsCorrect + val.length,
      }));
    }
  }, [roundStatus, state.finished, state.streak, currentSnippet]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && roundStatus === "typing" && input.length > 0) {
      const target = currentSnippet.code;
      if (input !== target) {
        setRoundStatus("wrong");
        setShowExplanation(true);
        setState(prev => ({
          ...prev,
          mistakes: prev.mistakes + 1,
          streak: 0,
          totalCharsTyped: prev.totalCharsTyped + input.length,
          totalCharsCorrect: prev.totalCharsCorrect + input.split("").filter((c, i) => i < target.length && c === target[i]).length,
        }));
      }
    }
    if (e.key === "Tab") {
      e.preventDefault();
      setInput(prev => prev + "    ");
    }
  }, [roundStatus, input, currentSnippet]);

  const nextRound = useCallback(() => {
    const nextIdx = state.round + 1;
    if (nextIdx >= TOTAL_ROUNDS || nextIdx >= state.deck.length) {
      setState(prev => ({ ...prev, finished: true }));
      return;
    }
    setState(prev => ({ ...prev, round: nextIdx }));
    setInput("");
    setRoundStatus("typing");
    setShowExplanation(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [state.round, state.deck.length]);

  const handleFinish = useCallback(() => {
    if (!xpAwarded.current) {
      xpAwarded.current = true;
      const perfect = state.mistakes === 0 && state.perfectRounds >= TOTAL_ROUNDS * 0.8;
      awardGameXP("game1", perfect);
    }
    setShowResults(true);
  }, [state.mistakes, state.perfectRounds]);

  const handleRestart = useCallback(() => {
    setState({
      deck: buildDeck(), round: 0, score: 0, streak: 0, bestStreak: 0,
      mistakes: 0, perfectRounds: 0, finished: false, totalCharsTyped: 0, totalCharsCorrect: 0,
    });
    setInput("");
    setTimeLeft(TIME_LIMIT);
    setRoundStatus("typing");
    setShowExplanation(false);
    setShowResults(false);
    xpAwarded.current = false;
  }, []);

  const accuracy = state.totalCharsTyped > 0 ? Math.round((state.totalCharsCorrect / state.totalCharsTyped) * 100) : 100;
  const wpm = timeLeft < TIME_LIMIT ? Math.round((state.totalCharsCorrect / 5) / ((TIME_LIMIT - timeLeft) / 60)) : 0;
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const progressPct = ((state.round + (roundStatus !== "typing" ? 1 : 0)) / TOTAL_ROUNDS) * 100;
  const timePercent = (timeLeft / TIME_LIMIT) * 100;

  // Results screen
  if (showResults || (state.finished && showResults)) {
    const grade = accuracy >= 95 && state.bestStreak >= 8 ? "S" : accuracy >= 90 ? "A" : accuracy >= 80 ? "B" : accuracy >= 70 ? "C" : "D";
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
            className="glass-card max-w-lg w-full p-8 space-y-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
            <div className="relative space-y-6">
              <div className="text-center space-y-3">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-gradient-to-br from-accent/20 to-success/20">
                  <span className="text-3xl font-black gradient-text">{grade}</span>
                </motion.div>
                <h2 className="text-2xl font-bold">Mission Complete</h2>
                <p className="text-muted">Your Python typing reflexes have been tested.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Score", value: `${state.score}` },
                  { label: "Accuracy", value: `${accuracy}%` },
                  { label: "WPM", value: `${wpm}` },
                  { label: "Best Streak", value: `${state.bestStreak}` },
                  { label: "Perfect Rounds", value: `${state.perfectRounds}/${TOTAL_ROUNDS}` },
                  { label: "Mistakes", value: `${state.mistakes}` },
                ].map(s => (
                  <div key={s.label} className="bg-bg-elevated rounded-xl p-3 text-center">
                    <p className="text-xs text-muted">{s.label}</p>
                    <p className="text-lg font-bold">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button onClick={handleRestart} className="flex-1"><RotateCcw className="w-4 h-4" /> Play Again</Button>
                <Button variant="secondary" onClick={() => window.location.href = "/gamified"} className="flex-1">Game Lab</Button>
              </div>
            </div>
          </motion.div>
        </div>
      </AuthGuard>
    );
  }

  // Finished but not showing results yet
  if (state.finished && !showResults) {
    handleFinish();
  }

  return (
    <AuthGuard>
      <div className="min-h-screen relative overflow-hidden">
        <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-radial from-accent/6 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 relative space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent/20 to-danger/20 flex items-center justify-center">
                <Crosshair className="w-6 h-6 text-accent-light" />
              </div>
              <div>
                <p className="text-[10px] text-muted font-mono uppercase tracking-wider">Python Typing Drills</p>
                <h1 className="text-xl font-bold">Syntax Sniper</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs" aria-live="polite" role="status">
              <Badge variant="accent"><Zap className="w-3 h-3 mr-1" />{state.score} pts</Badge>
              <Badge variant={state.streak >= 3 ? "success" : "neutral"}><Flame className="w-3 h-3 mr-1" />{state.streak}x</Badge>
              <Badge variant={timeLeft <= 15 ? "danger" : "neutral"}><Timer className="w-3 h-3 mr-1" />{fmt(timeLeft)}</Badge>
            </div>
          </div>

          {/* Progress & Timer Bars */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted w-16">Progress</span>
              <div className="flex-1 h-2 bg-bg-elevated rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-accent to-accent-hot rounded-full"
                  animate={{ width: `${progressPct}%` }} transition={{ duration: 0.4 }} />
              </div>
              <span className="text-[10px] font-mono">{state.round + (roundStatus !== "typing" ? 1 : 0)}/{TOTAL_ROUNDS}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted w-16">Time</span>
              <div className="flex-1 h-2 bg-bg-elevated rounded-full overflow-hidden">
                <motion.div className={cn("h-full rounded-full", timePercent > 30 ? "bg-success" : timePercent > 15 ? "bg-warning" : "bg-danger")}
                  animate={{ width: `${timePercent}%` }} transition={{ duration: 0.3 }} />
              </div>
              <span className="text-[10px] font-mono">{timeLeft}s</span>
            </div>
          </div>

          {/* Snippet Display */}
          <AnimatePresence mode="wait">
            <motion.div key={state.round}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="space-y-5 !p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="accent">{currentSnippet?.concept}</Badge>
                    <Badge variant={
                      currentSnippet?.difficulty === 1 ? "success" :
                      currentSnippet?.difficulty === 2 ? "neutral" : "danger"
                    }>
                      {"\u2605".repeat(currentSnippet?.difficulty || 1)}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted font-mono">Round {state.round + 1}/{TOTAL_ROUNDS}</span>
                </div>

                {/* Code to type — character by character */}
                <div className="p-4 bg-bg-elevated rounded-xl overflow-x-auto">
                  <div className="font-mono text-base leading-relaxed whitespace-pre select-none">
                    {currentSnippet?.code.split("").map((char, i) => (
                      <span key={i} className={cn(
                        "transition-colors duration-100",
                        charStatuses[i] === "correct" && "text-success",
                        charStatuses[i] === "wrong" && "text-danger bg-danger/20 rounded",
                        charStatuses[i] === "pending" && "text-muted-light",
                        i === input.length && roundStatus === "typing" && "border-b-2 border-accent"
                      )}>
                        {char}
                      </span>
                    ))}
                    {roundStatus === "typing" && input.length >= (currentSnippet?.code.length || 0) && (
                      <span className="border-r-2 border-accent animate-pulse">&nbsp;</span>
                    )}
                  </div>
                </div>

                {/* Input field */}
                <div className="relative">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    disabled={roundStatus !== "typing" || state.finished}
                    placeholder={roundStatus === "typing" ? "Start typing the code above..." : ""}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border font-mono text-sm bg-bg-card outline-none transition-all",
                      roundStatus === "typing" && "border-border focus:border-accent/50 focus:ring-2 focus:ring-accent/20",
                      roundStatus === "correct" && "border-success/50 bg-success-muted/20 text-success",
                      roundStatus === "wrong" && "border-danger/50 bg-danger-muted/20 text-danger"
                    )}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {roundStatus === "correct" && <CheckCircle2 className="w-5 h-5 text-success" />}
                    {roundStatus === "wrong" && <XCircle className="w-5 h-5 text-danger" />}
                    {roundStatus === "typing" && <Keyboard className="w-5 h-5 text-muted" />}
                  </div>
                </div>

                {/* Status feedback */}
                {roundStatus === "correct" && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    className="px-4 py-3 rounded-xl bg-success-muted/40 text-success text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Perfect match! +{50 + currentSnippet.difficulty * 20 + (state.streak - 1) * 5} points
                  </motion.div>
                )}
                {roundStatus === "wrong" && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    className="px-4 py-3 rounded-xl bg-danger-muted/40 text-danger text-sm font-medium flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> Not quite. Check your syntax carefully.
                  </motion.div>
                )}

                {/* Explanation */}
                {showExplanation && currentSnippet && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    className="px-4 py-3 rounded-xl bg-accent-muted/30 text-xs text-accent-light space-y-1">
                    <p className="font-semibold">{currentSnippet.concept}</p>
                    <p className="text-muted-light">{currentSnippet.explanation}</p>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[10px] text-muted">
                    <span>Accuracy: <span className="font-bold text-foreground">{accuracy}%</span></span>
                    <span>WPM: <span className="font-bold text-foreground">{wpm}</span></span>
                  </div>
                  {roundStatus !== "typing" && (
                    <Button onClick={nextRound} size="sm">
                      {state.round + 1 >= TOTAL_ROUNDS ? "Finish" : "Next"} <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Live Stats Bar */}
          <div className="flex items-center justify-center gap-6 text-[10px] text-muted">
            <span>Streak: <span className={cn("font-bold", state.streak >= 3 ? "text-success" : "text-foreground")}>{state.streak}</span></span>
            <span>Best: <span className="font-bold text-warning">{state.bestStreak}</span></span>
            <span>Perfect: <span className="font-bold text-accent-light">{state.perfectRounds}</span></span>
            <span>Errors: <span className={cn("font-bold", state.mistakes > 0 ? "text-danger" : "text-foreground")}>{state.mistakes}</span></span>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
