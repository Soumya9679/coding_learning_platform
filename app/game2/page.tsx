"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui";
import { applyAuthHeaders } from "@/lib/session";
import {
  Layers,
  RotateCcw,
  Trophy,
  Timer,
  Zap,
  Star,
  Brain,
  CheckCircle,
  XCircle,
  ArrowRight,
  Play,
  GripVertical,
  Eye,
  Flame,
  ArrowDown,
  ArrowUp,
  Sparkles,
  Code2,
} from "lucide-react";

/* ─── types ─── */
interface Puzzle {
  id: number;
  difficulty: "easy" | "medium" | "hard";
  title: string;
  description: string;
  expectedOutput: string;
  lines: string[];          // correct order
  concept: string;
  explanation: string;
}

interface LineItem {
  id: string;
  text: string;
  originalIndex: number;
}

type Phase = "menu" | "playing" | "checking" | "results";

/* ─── 20 puzzles ─── */
const PUZZLES: Puzzle[] = [
  // ── EASY (7) ── (3-4 lines)
  {
    id: 1, difficulty: "easy", title: "Hello Loop",
    description: "Print numbers 0 through 2",
    expectedOutput: "0\n1\n2",
    lines: ["for i in range(3):", "    print(i)"],
    concept: "for loop + range", explanation: "range(3) generates 0, 1, 2. The for loop prints each."
  },
  {
    id: 2, difficulty: "easy", title: "Simple Function",
    description: "Define and call a greeting function",
    expectedOutput: "Hello, Alice!",
    lines: ["def greet(name):", "    return f'Hello, {name}!'", "print(greet('Alice'))"],
    concept: "Functions + f-strings", explanation: "def creates a function. f-strings embed variables in curly braces."
  },
  {
    id: 3, difficulty: "easy", title: "List Builder",
    description: "Create a list and add items",
    expectedOutput: "[1, 2, 3, 4]",
    lines: ["nums = [1, 2, 3]", "nums.append(4)", "print(nums)"],
    concept: "Lists + append", explanation: "append() adds a single element to the end of a list."
  },
  {
    id: 4, difficulty: "easy", title: "Conditional Check",
    description: "Check if a number is positive",
    expectedOutput: "positive",
    lines: ["x = 10", "if x > 0:", "    print('positive')"],
    concept: "if statement", explanation: "The condition x > 0 evaluates to True, so the indented block runs."
  },
  {
    id: 5, difficulty: "easy", title: "String Slice",
    description: "Extract and print a substring",
    expectedOutput: "Pyth",
    lines: ["word = 'Python'", "result = word[0:4]", "print(result)"],
    concept: "String slicing", explanation: "word[0:4] extracts characters at indices 0, 1, 2, 3."
  },
  {
    id: 6, difficulty: "easy", title: "Sum It Up",
    description: "Calculate sum of a list",
    expectedOutput: "15",
    lines: ["numbers = [1, 2, 3, 4, 5]", "total = sum(numbers)", "print(total)"],
    concept: "sum() built-in", explanation: "sum() adds all elements in an iterable. 1+2+3+4+5 = 15."
  },
  {
    id: 7, difficulty: "easy", title: "Type Conversion",
    description: "Convert and combine types",
    expectedOutput: "I am 25 years old",
    lines: ["age = 25", "msg = 'I am ' + str(age) + ' years old'", "print(msg)"],
    concept: "str() conversion", explanation: "str() converts an integer to string so it can be concatenated with +."
  },

  // ── MEDIUM (7) ── (4-5 lines)
  {
    id: 8, difficulty: "medium", title: "Dict Builder",
    description: "Build a dictionary from two lists",
    expectedOutput: "{'a': 1, 'b': 2, 'c': 3}",
    lines: ["keys = ['a', 'b', 'c']", "vals = [1, 2, 3]", "d = dict(zip(keys, vals))", "print(d)"],
    concept: "zip() + dict()", explanation: "zip() pairs elements from both lists. dict() converts those pairs."
  },
  {
    id: 9, difficulty: "medium", title: "List Comprehension",
    description: "Create squares of even numbers",
    expectedOutput: "[4, 16, 36]",
    lines: ["nums = [1, 2, 3, 4, 5, 6]", "squares = [x**2 for x in nums if x % 2 == 0]", "print(squares)"],
    concept: "Filtered comprehension", explanation: "List comprehension with 'if' filters even numbers, then squares them."
  },
  {
    id: 10, difficulty: "medium", title: "Exception Handler",
    description: "Safely handle division",
    expectedOutput: "Cannot divide by zero!\nDone",
    lines: ["try:", "    result = 10 / 0", "except ZeroDivisionError:", "    print('Cannot divide by zero!')", "print('Done')"],
    concept: "try/except", explanation: "try/except catches errors. The except block runs when ZeroDivisionError occurs."
  },
  {
    id: 11, difficulty: "medium", title: "Counter",
    description: "Count character frequency",
    expectedOutput: "{'h': 1, 'e': 1, 'l': 2, 'o': 1}",
    lines: ["word = 'hello'", "freq = {}", "for ch in word:", "    freq[ch] = freq.get(ch, 0) + 1", "print(freq)"],
    concept: "dict.get() counting", explanation: "get(ch, 0) returns existing count or default 0, then adds 1."
  },
  {
    id: 12, difficulty: "medium", title: "File Lines",
    description: "Process lines with strip",
    expectedOutput: "['hello', 'world']",
    lines: ["raw = ['  hello  \\n', '  world  \\n']", "clean = []", "for line in raw:", "    clean.append(line.strip())", "print(clean)"],
    concept: "str.strip()", explanation: "strip() removes leading/trailing whitespace and newlines."
  },
  {
    id: 13, difficulty: "medium", title: "Unpacking Magic",
    description: "Swap variables without temp",
    expectedOutput: "5 3",
    lines: ["a = 3", "b = 5", "a, b = b, a", "print(a, b)"],
    concept: "Tuple unpacking swap", explanation: "Python can swap variables in one line using tuple unpacking."
  },
  {
    id: 14, difficulty: "medium", title: "Map & Filter",
    description: "Double only positive numbers",
    expectedOutput: "[2, 4, 6]",
    lines: ["nums = [-1, 1, -2, 2, 3]", "pos = filter(lambda x: x > 0, nums)", "doubled = map(lambda x: x * 2, pos)", "print(list(doubled))"],
    concept: "filter() + map()", explanation: "filter() keeps positives, map() doubles them. list() materializes."
  },

  // ── HARD (6) ── (5-7 lines)
  {
    id: 15, difficulty: "hard", title: "Fibonacci Generator",
    description: "Generate first 6 Fibonacci numbers",
    expectedOutput: "[1, 1, 2, 3, 5, 8]",
    lines: ["def fib(n):", "    a, b = 0, 1", "    result = []", "    for _ in range(n):", "        a, b = b, a + b", "        result.append(a)", "    return result", "print(fib(6))"],
    concept: "Tuple unpacking + generators", explanation: "Each iteration updates a,b simultaneously. a becomes old b, b becomes old a+b."
  },
  {
    id: 16, difficulty: "hard", title: "Decorator Pattern",
    description: "Create a simple decorator",
    expectedOutput: "Before\nHello!\nAfter",
    lines: ["def wrapper(func):", "    def inner():", "        print('Before')", "        func()", "        print('After')", "    return inner", "@wrapper", "def say_hello():", "    print('Hello!')", "say_hello()"],
    concept: "Decorators", explanation: "@wrapper replaces say_hello with inner(). inner() adds behavior around the original."
  },
  {
    id: 17, difficulty: "hard", title: "Class Hierarchy",
    description: "Basic inheritance",
    expectedOutput: "Woof!\nBuddy says Woof!",
    lines: ["class Animal:", "    def __init__(self, name):", "        self.name = name", "class Dog(Animal):", "    def speak(self):", "        return 'Woof!'", "dog = Dog('Buddy')", "print(dog.speak())", "print(f'{dog.name} says {dog.speak()}')"],
    concept: "Inheritance", explanation: "Dog inherits __init__ from Animal. Dog adds its own speak method."
  },
  {
    id: 18, difficulty: "hard", title: "Context Manager",
    description: "Custom context manager",
    expectedOutput: "Entering\nInside\nExiting",
    lines: ["class MyCtx:", "    def __enter__(self):", "        print('Entering')", "        return self", "    def __exit__(self, *args):", "        print('Exiting')", "with MyCtx():", "    print('Inside')"],
    concept: "Context managers", explanation: "__enter__ runs on 'with', __exit__ runs when the block ends."
  },
  {
    id: 19, difficulty: "hard", title: "Recursive Flatten",
    description: "Flatten a nested list",
    expectedOutput: "[1, 2, 3, 4, 5]",
    lines: ["def flatten(lst):", "    result = []", "    for item in lst:", "        if isinstance(item, list):", "            result.extend(flatten(item))", "        else:", "            result.append(item)", "    return result", "print(flatten([1, [2, 3], [4, [5]]]))"],
    concept: "Recursion", explanation: "flatten() calls itself on sublists. extend() adds all elements from the recursive call."
  },
  {
    id: 20, difficulty: "hard", title: "Lambda Sort",
    description: "Sort by custom key",
    expectedOutput: "[('Bob', 20), ('Alice', 25), ('Charlie', 30)]",
    lines: ["people = [('Alice', 25), ('Bob', 20), ('Charlie', 30)]", "people.sort(key=lambda p: p[1])", "print(people)"],
    concept: "Custom sorting", explanation: "key=lambda p: p[1] tells sort() to compare by the second element (age)."
  },
];

/* ─── helpers ─── */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleLines(lines: string[]): LineItem[] {
  const items = lines.map((text, i) => ({ id: `line-${i}`, text, originalIndex: i }));
  // Keep shuffling until order differs from original
  let shuffled = shuffle(items);
  let attempts = 0;
  while (shuffled.every((item, i) => item.originalIndex === i) && attempts < 10) {
    shuffled = shuffle(items);
    attempts++;
  }
  return shuffled;
}

function pickPuzzles(): Puzzle[] {
  const easy = PUZZLES.filter((p) => p.difficulty === "easy");
  const med = PUZZLES.filter((p) => p.difficulty === "medium");
  const hard = PUZZLES.filter((p) => p.difficulty === "hard");
  return [...shuffle(easy).slice(0, 3), ...shuffle(med).slice(0, 3), ...shuffle(hard).slice(0, 2)]; // 8 puzzles
}

async function awardGameXP(gameId: string, perfect: boolean) {
  try {
    const res = await fetch("/api/leaderboard/xp", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await applyAuthHeaders()) },
      body: JSON.stringify({ gameId, action: perfect ? "game_perfect" : "game_complete" }),
    });
    return res.ok;
  } catch { return false; }
}

const diffColor: Record<string, string> = { easy: "text-emerald-400", medium: "text-amber-400", hard: "text-red-400" };
const diffBg: Record<string, string> = { easy: "bg-emerald-500/20 border-emerald-500/30", medium: "bg-amber-500/20 border-amber-500/30", hard: "bg-red-500/20 border-red-500/30" };

export default function Game2Page() {
  return (
    <AuthGuard>
      <PipelinePuzzleGame />
    </AuthGuard>
  );
}

function PipelinePuzzleGame() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [puzzIdx, setPuzzIdx] = useState(0);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const [results, setResults] = useState<("perfect" | "partial" | "wrong")[]>([]);
  const [checkResult, setCheckResult] = useState<null | "perfect" | "partial" | "wrong">(null);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);

  const current = puzzles[puzzIdx] as Puzzle | undefined;

  /* timer */
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const startGame = () => {
    const picked = pickPuzzles();
    setPuzzles(picked);
    setPuzzIdx(0);
    setLineItems(shuffleLines(picked[0].lines));
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setTimer(0);
    setResults([]);
    setCheckResult(null);
    setXpAwarded(false);
    setShowHint(false);
    setHintsUsed(0);
    setPhase("playing");
  };

  const moveItem = (fromIdx: number, direction: "up" | "down") => {
    if (checkResult) return;
    const toIdx = direction === "up" ? fromIdx - 1 : fromIdx + 1;
    if (toIdx < 0 || toIdx >= lineItems.length) return;
    const newItems = [...lineItems];
    [newItems[fromIdx], newItems[toIdx]] = [newItems[toIdx], newItems[fromIdx]];
    setLineItems(newItems);
  };

  const checkOrder = () => {
    if (!current || checkResult) return;
    const isCorrect = lineItems.every((item, i) => item.originalIndex === i);

    // Count how many lines are in the right position
    const correctPositions = lineItems.filter((item, i) => item.originalIndex === i).length;
    const ratio = correctPositions / lineItems.length;

    let result: "perfect" | "partial" | "wrong";
    if (isCorrect) {
      result = "perfect";
      const diffBonus = current.difficulty === "hard" ? 40 : current.difficulty === "medium" ? 25 : 15;
      const streakBonus = streak >= 3 ? 20 : streak >= 2 ? 10 : 0;
      const hintPenalty = showHint ? -10 : 0;
      setScore((s) => s + diffBonus + streakBonus + hintPenalty);
      setStreak((s) => s + 1);
      setBestStreak((b) => Math.max(b, streak + 1));
      setCorrectCount((c) => c + 1);
    } else if (ratio >= 0.5) {
      result = "partial";
      setScore((s) => s + 5);
      setStreak(0);
    } else {
      result = "wrong";
      setStreak(0);
    }

    setCheckResult(result);
    setResults((r) => [...r, result]);
  };

  const useHint = () => {
    if (showHint || checkResult || !current) return;
    setShowHint(true);
    setHintsUsed((h) => h + 1);
  };

  const nextPuzzle = () => {
    if (puzzIdx + 1 >= puzzles.length) {
      finishGame();
    } else {
      const nextIdx = puzzIdx + 1;
      setPuzzIdx(nextIdx);
      setLineItems(shuffleLines(puzzles[nextIdx].lines));
      setCheckResult(null);
      setShowHint(false);
    }
  };

  const finishGame = async () => {
    setPhase("results");
    const perfect = correctCount === puzzles.length && hintsUsed === 0;
    await awardGameXP("game2", perfect);
    setXpAwarded(true);
  };

  const accuracy = puzzles.length > 0 ? Math.round((correctCount / puzzles.length) * 100) : 0;
  const rank = accuracy >= 90 ? "S" : accuracy >= 75 ? "A" : accuracy >= 60 ? "B" : accuracy >= 40 ? "C" : "D";
  const rankColor: Record<string, string> = { S: "text-yellow-400", A: "text-emerald-400", B: "text-blue-400", C: "text-amber-400", D: "text-red-400" };
  const rankTitle: Record<string, string> = { S: "Pipeline Master", A: "Flow Architect", B: "Code Arranger", C: "Puzzle Solver", D: "Keep Practicing" };

  /* ─── MENU ─── */
  if (phase === "menu") {
    return (
      <div className="min-h-screen bg-[#0a0a14] text-white flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg w-full text-center space-y-8">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto w-28 h-28 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center"
          >
            <Layers className="w-14 h-14 text-cyan-400" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Pipeline Puzzle
            </h1>
            <p className="text-gray-400 mt-2 text-lg">Arrange Code, Build Programs</p>
          </div>
          <div className="space-y-3 text-left bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
              <Layers className="w-5 h-5" /> How to Play
            </h3>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li className="flex items-start gap-2"><span className="text-cyan-400 font-bold mt-0.5">📋</span> Code lines are shuffled — reorder them!</li>
              <li className="flex items-start gap-2"><span className="text-cyan-400 font-bold mt-0.5">↕️</span> Use arrow buttons to move lines up/down</li>
              <li className="flex items-start gap-2"><span className="text-cyan-400 font-bold mt-0.5">🎯</span> Match the expected output shown</li>
              <li className="flex items-start gap-2"><span className="text-cyan-400 font-bold mt-0.5">⚡</span> Faster solves + streaks = more points</li>
              <li className="flex items-start gap-2"><span className="text-cyan-400 font-bold mt-0.5">💡</span> Use hints to see the expected output</li>
            </ul>
          </div>
          <div className="flex gap-3 text-sm text-gray-500 justify-center">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">3 Easy</span>
            <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">3 Medium</span>
            <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">2 Hard</span>
          </div>
          <Button onClick={startGame} className="w-full !bg-gradient-to-r !from-cyan-600 !to-blue-600 hover:!from-cyan-500 hover:!to-blue-500 !text-lg !py-3">
            <Layers className="w-5 h-5 mr-2" /> Start Building
          </Button>
        </motion.div>
      </div>
    );
  }

  /* ─── RESULTS ─── */
  if (phase === "results") {
    return (
      <div className="min-h-screen bg-[#0a0a14] text-white flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg w-full space-y-6">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className={`text-8xl font-black ${rankColor[rank]} drop-shadow-lg`}
            >
              {rank}
            </motion.div>
            <p className="text-gray-400 mt-1">{rankTitle[rank]}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Solved", value: `${correctCount}/${puzzles.length}`, icon: CheckCircle, color: "text-emerald-400" },
              { label: "Accuracy", value: `${accuracy}%`, icon: Brain, color: "text-cyan-400" },
              { label: "Best Streak", value: `${bestStreak}🔥`, icon: Flame, color: "text-amber-400" },
              { label: "Score", value: score.toString(), icon: Star, color: "text-purple-400" },
              { label: "Time", value: `${Math.floor(timer / 60)}m ${timer % 60}s`, icon: Timer, color: "text-blue-400" },
              { label: "Hints Used", value: hintsUsed.toString(), icon: Eye, color: "text-yellow-400" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center gap-3"
              >
                <stat.icon className={`w-5 h-5 ${stat.color} shrink-0`} />
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className={`font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
          {/* Puzzle results board */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-xs text-gray-500 mb-2">Pipeline Results</p>
            <div className="flex gap-1.5 flex-wrap">
              {results.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold ${
                    r === "perfect" ? "bg-emerald-500/30 text-emerald-400"
                    : r === "partial" ? "bg-amber-500/30 text-amber-400"
                    : "bg-red-500/30 text-red-400"
                  }`}
                >
                  {r === "perfect" ? "✓" : r === "partial" ? "~" : "✗"}
                </motion.div>
              ))}
            </div>
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-center">
            <p className="text-sm text-gray-500">
              {xpAwarded ? (accuracy === 100 && hintsUsed === 0 ? "🏆 +100 XP (Perfect Pipeline!)" : "⭐ +50 XP earned") : "Calculating XP..."}
            </p>
          </motion.div>
          <div className="flex gap-3">
            <Button onClick={startGame} className="flex-1 !bg-gradient-to-r !from-cyan-600 !to-blue-600">
              <RotateCcw className="w-4 h-4 mr-2" /> Play Again
            </Button>
            <Button onClick={() => window.location.href = "/gamified"} variant="secondary" className="flex-1">
              Game Lab
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ─── PLAYING ─── */
  if (!current) return null;
  const progress = ((puzzIdx + 1) / puzzles.length) * 100;

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-gray-400">
              Puzzle <span className="text-white font-bold">{puzzIdx + 1}</span>/{puzzles.length}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${diffBg[current.difficulty]} ${diffColor[current.difficulty]}`}>
              {current.difficulty}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {streak >= 2 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-sm font-bold text-amber-400">
                {streak}🔥
              </motion.span>
            )}
            <span className="text-sm text-gray-400 flex items-center gap-1">
              <Timer className="w-3.5 h-3.5" /> {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
            </span>
            <span className="text-sm font-bold text-purple-400">{score} pts</span>
          </div>
        </div>

        {/* Progress */}
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" animate={{ width: `${progress}%` }} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="space-y-4"
          >
            {/* Task description */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-xl p-5 border border-cyan-500/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-cyan-300">{current.title}</h3>
                <span className="text-xs text-gray-500">{current.concept}</span>
              </div>
              <p className="text-sm text-gray-300">{current.description}</p>
            </div>

            {/* Expected output hint */}
            {!showHint && !checkResult && (
              <motion.button
                onClick={useHint}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full text-left text-xs px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400/80 hover:bg-yellow-500/15 transition flex items-center gap-2"
              >
                <Eye className="w-3.5 h-3.5" /> Show expected output (-10 pts)
              </motion.button>
            )}
            {showHint && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="px-4 py-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-xs text-yellow-400 mb-1 font-medium">Expected Output:</p>
                <pre className="font-mono text-xs text-yellow-300/80 whitespace-pre-wrap">{current.expectedOutput}</pre>
              </motion.div>
            )}

            {/* Sortable code lines */}
            <div className="space-y-1.5">
              <p className="text-xs text-gray-500 flex items-center gap-1"><Code2 className="w-3 h-3" /> Arrange these lines in the correct order:</p>
              {lineItems.map((item, idx) => {
                let lineBg = "bg-white/5 border-white/10";
                let lineIcon = <GripVertical className="w-4 h-4 text-gray-600" />;

                if (checkResult) {
                  if (item.originalIndex === idx) {
                    lineBg = "bg-emerald-500/15 border-emerald-500/30";
                    lineIcon = <CheckCircle className="w-4 h-4 text-emerald-400" />;
                  } else {
                    lineBg = "bg-red-500/15 border-red-500/30";
                    lineIcon = <XCircle className="w-4 h-4 text-red-400" />;
                  }
                }

                return (
                  <motion.div
                    key={item.id}
                    layout
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${lineBg} group`}
                  >
                    {lineIcon}
                    <span className="text-xs text-gray-500 font-mono w-5 shrink-0">{idx + 1}</span>
                    <pre className="font-mono text-sm text-gray-200 flex-1 whitespace-pre-wrap">{item.text}</pre>
                    {!checkResult && (
                      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => moveItem(idx, "up")}
                          disabled={idx === 0}
                          className="p-0.5 rounded hover:bg-white/10 disabled:opacity-20 transition"
                        >
                          <ArrowUp className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                        <button
                          onClick={() => moveItem(idx, "down")}
                          disabled={idx === lineItems.length - 1}
                          className="p-0.5 rounded hover:bg-white/10 disabled:opacity-20 transition"
                        >
                          <ArrowDown className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Check / feedback */}
            {!checkResult ? (
              <Button onClick={checkOrder} className="w-full !bg-gradient-to-r !from-cyan-600 !to-blue-600">
                <CheckCircle className="w-4 h-4 mr-2" /> Check Order
              </Button>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                {checkResult === "perfect" ? (
                  <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                    <p className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Perfect! Pipeline complete! 🎉
                      {streak >= 3 && <span className="text-xs text-amber-400 animate-pulse">+streak bonus!</span>}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{current.explanation}</p>
                  </div>
                ) : checkResult === "partial" ? (
                  <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                    <p className="text-sm font-bold text-amber-400 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Close! Some lines are in the right spot.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{current.explanation}</p>
                  </div>
                ) : (
                  <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                    <p className="text-sm font-bold text-red-400 flex items-center gap-2">
                      <XCircle className="w-4 h-4" /> Not quite — check the correct order above.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{current.explanation}</p>
                  </div>
                )}
                {/* Show correct order if wrong */}
                {checkResult !== "perfect" && (
                  <div className="bg-white/3 rounded-xl p-3 border border-white/5">
                    <p className="text-xs text-gray-500 mb-2">Correct order:</p>
                    {current.lines.map((line, i) => (
                      <div key={i} className="flex items-center gap-2 px-2 py-1">
                        <span className="text-xs text-emerald-400 font-mono w-5">{i + 1}</span>
                        <pre className="font-mono text-xs text-emerald-300/80 whitespace-pre-wrap">{line}</pre>
                      </div>
                    ))}
                  </div>
                )}
                <Button onClick={nextPuzzle} className="w-full !bg-gradient-to-r !from-cyan-600 !to-blue-600">
                  {puzzIdx + 1 >= puzzles.length ? (
                    <><Trophy className="w-4 h-4 mr-2" /> View Results</>
                  ) : (
                    <><ArrowRight className="w-4 h-4 mr-2" /> Next Puzzle</>
                  )}
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex gap-1.5 justify-center pt-2">
          {Array.from({ length: puzzles.length }, (_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-sm ${
                i < results.length
                  ? results[i] === "perfect" ? "bg-emerald-500" : results[i] === "partial" ? "bg-amber-500" : "bg-red-500"
                  : i === puzzIdx ? "bg-cyan-500 animate-pulse" : "bg-white/10"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
