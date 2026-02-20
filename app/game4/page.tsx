"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui";
import { applyAuthHeaders } from "@/lib/session";
import {
  Grid3X3,
  RotateCcw,
  Trophy,
  Timer,
  Zap,
  Star,
  Brain,
  Eye,
  Sparkles,
  Play,
  CheckCircle,
  Flame,
} from "lucide-react";

/* ─── types ─── */
interface MemoryCard {
  id: number;
  pairId: number;
  content: string;
  type: "concept" | "code";
  flipped: boolean;
  matched: boolean;
}

interface MemoryPair {
  concept: string;
  code: string;
  category: string;
}

type Phase = "menu" | "playing" | "results";
type Difficulty = "easy" | "medium" | "hard";

/* ─── 24 pairs across categories ─── */
const ALL_PAIRS: MemoryPair[] = [
  // Basics
  { concept: "Print to console", code: "print('hello')", category: "Basics" },
  { concept: "Variable assignment", code: "x = 42", category: "Basics" },
  { concept: "String concatenation", code: "'a' + 'b'  →  'ab'", category: "Basics" },
  { concept: "Type conversion", code: "int('5')  →  5", category: "Basics" },
  { concept: "String length", code: "len('hi')  →  2", category: "Basics" },
  { concept: "Modulo operator", code: "7 % 3  →  1", category: "Basics" },
  { concept: "Floor division", code: "7 // 2  →  3", category: "Basics" },
  { concept: "Exponentiation", code: "2 ** 8  →  256", category: "Basics" },

  // Data Structures
  { concept: "Create a list", code: "nums = [1, 2, 3]", category: "Data" },
  { concept: "Dictionary access", code: "d['key']", category: "Data" },
  { concept: "Tuple unpacking", code: "a, b = (1, 2)", category: "Data" },
  { concept: "Set union", code: "{1,2} | {2,3}  →  {1,2,3}", category: "Data" },
  { concept: "List append", code: "lst.append(4)", category: "Data" },
  { concept: "Dict comprehension", code: "{k:v for k,v in items}", category: "Data" },
  { concept: "Slice reversal", code: "s[::-1]", category: "Data" },
  { concept: "List comprehension", code: "[x**2 for x in range(5)]", category: "Data" },

  // Control Flow
  { concept: "For loop", code: "for i in range(10):", category: "Flow" },
  { concept: "While loop", code: "while x > 0:", category: "Flow" },
  { concept: "If-else shorthand", code: "y = 'a' if x else 'b'", category: "Flow" },
  { concept: "Try-except block", code: "try: ... except: ...", category: "Flow" },
  { concept: "Lambda function", code: "f = lambda x: x * 2", category: "Flow" },
  { concept: "Function definition", code: "def greet(name):", category: "Flow" },
  { concept: "Return statement", code: "return result", category: "Flow" },
  { concept: "Import module", code: "import math", category: "Flow" },
];

/* ─── config per difficulty ─── */
const DIFFICULTY_CONFIG: Record<Difficulty, { pairs: number; cols: number; peekTime: number; label: string }> = {
  easy: { pairs: 6, cols: 4, peekTime: 3, label: "6 Pairs  •  4×3 Grid" },
  medium: { pairs: 8, cols: 4, peekTime: 2.5, label: "8 Pairs  •  4×4 Grid" },
  hard: { pairs: 10, cols: 5, peekTime: 2, label: "10 Pairs  •  5×4 Grid" },
};

/* ─── helpers ─── */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildCards(difficulty: Difficulty): MemoryCard[] {
  const config = DIFFICULTY_CONFIG[difficulty];
  const selected = shuffle(ALL_PAIRS).slice(0, config.pairs);
  const cards: MemoryCard[] = [];
  selected.forEach((pair, idx) => {
    cards.push({ id: idx * 2, pairId: idx, content: pair.concept, type: "concept", flipped: false, matched: false });
    cards.push({ id: idx * 2 + 1, pairId: idx, content: pair.code, type: "code", flipped: false, matched: false });
  });
  return shuffle(cards);
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

export default function Game4Page() {
  return (
    <AuthGuard>
      <MemoryMatrixGame />
    </AuthGuard>
  );
}

function MemoryMatrixGame() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [matchCount, setMatchCount] = useState(0);
  const [moves, setMoves] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timer, setTimer] = useState(0);
  const [peeking, setPeeking] = useState(true);
  const [score, setScore] = useState(0);
  const [xpAwarded, setXpAwarded] = useState(false);
  const lockRef = useRef(false);

  const config = DIFFICULTY_CONFIG[difficulty];
  const totalPairs = config.pairs;

  /* timer */
  useEffect(() => {
    if (phase !== "playing" || peeking) return;
    const id = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [phase, peeking]);

  /* peek phase: show all cards briefly then flip them */
  useEffect(() => {
    if (phase !== "playing" || !peeking) return;
    const id = setTimeout(() => setPeeking(false), config.peekTime * 1000);
    return () => clearTimeout(id);
  }, [phase, peeking, config.peekTime]);

  /* check for match when 2 cards flipped */
  useEffect(() => {
    if (flippedIds.length !== 2) return;
    lockRef.current = true;
    const [a, b] = flippedIds;
    const cardA = cards.find((c) => c.id === a)!;
    const cardB = cards.find((c) => c.id === b)!;
    const isMatch = cardA.pairId === cardB.pairId;

    setTimeout(() => {
      if (isMatch) {
        setCards((prev) => prev.map((c) => (c.id === a || c.id === b ? { ...c, matched: true } : c)));
        setMatchCount((m) => m + 1);
        setStreak((s) => s + 1);
        setBestStreak((b) => Math.max(b, streak + 1));
        const streakBonus = streak >= 3 ? 20 : streak >= 2 ? 10 : 0;
        setScore((s) => s + 50 + streakBonus);
      } else {
        setStreak(0);
      }
      setFlippedIds([]);
      lockRef.current = false;
    }, isMatch ? 500 : 900);
  }, [flippedIds]);

  /* win check */
  useEffect(() => {
    if (phase === "playing" && !peeking && matchCount === totalPairs && matchCount > 0) {
      finishGame();
    }
  }, [matchCount, phase, peeking, totalPairs]);

  const startGame = () => {
    const newCards = buildCards(difficulty);
    setCards(newCards);
    setFlippedIds([]);
    setMatchCount(0);
    setMoves(0);
    setStreak(0);
    setBestStreak(0);
    setTimer(0);
    setPeeking(true);
    setScore(0);
    setXpAwarded(false);
    lockRef.current = false;
    setPhase("playing");
  };

  const flipCard = (id: number) => {
    if (lockRef.current || peeking) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.matched || flippedIds.includes(id) || flippedIds.length >= 2) return;
    setFlippedIds((prev) => [...prev, id]);
    if (flippedIds.length === 0) setMoves((m) => m + 1);
  };

  const finishGame = async () => {
    setPhase("results");
    const perfect = moves <= totalPairs + 2;
    await awardGameXP("game4", perfect);
    setXpAwarded(true);
  };

  const efficiency = moves > 0 ? Math.round((totalPairs / moves) * 100) : 0;
  const rank = efficiency >= 90 ? "S" : efficiency >= 70 ? "A" : efficiency >= 50 ? "B" : efficiency >= 35 ? "C" : "D";
  const rankColor: Record<string, string> = { S: "text-yellow-400", A: "text-emerald-400", B: "text-blue-400", C: "text-amber-400", D: "text-red-400" };
  const rankTitle: Record<string, string> = { S: "Photographic Memory", A: "Sharp Mind", B: "Pattern Seeker", C: "Learning Fast", D: "Keep Practicing" };

  /* ─── MENU ─── */
  if (phase === "menu") {
    return (
      <div className="min-h-screen bg-[#0a0a14] text-white flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg w-full text-center space-y-8">
          <motion.div
            animate={{ scale: [1, 1.05, 1], rotate: [0, 3, -3, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto w-28 h-28 rounded-2xl bg-gradient-to-br from-pink-500/20 to-violet-600/20 border border-pink-500/30 flex items-center justify-center"
          >
            <Grid3X3 className="w-14 h-14 text-pink-400" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">
              Memory Matrix
            </h1>
            <p className="text-gray-400 mt-2 text-lg">Match Python Concepts to Code</p>
          </div>
          <div className="space-y-3 text-left bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-pink-400 flex items-center gap-2">
              <Eye className="w-5 h-5" /> How to Play
            </h3>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li className="flex items-start gap-2"><span className="text-pink-400 font-bold mt-0.5">👁️</span> Cards briefly peek — memorize positions!</li>
              <li className="flex items-start gap-2"><span className="text-pink-400 font-bold mt-0.5">🧠</span> Match Python concepts with their code</li>
              <li className="flex items-start gap-2"><span className="text-pink-400 font-bold mt-0.5">⚡</span> Build streaks for bonus points</li>
              <li className="flex items-start gap-2"><span className="text-pink-400 font-bold mt-0.5">🏆</span> Fewer moves = better rank</li>
            </ul>
          </div>
          {/* Difficulty selector */}
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Select Difficulty</p>
            <div className="flex gap-2 justify-center">
              {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    difficulty === d
                      ? d === "easy"
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                        : d === "medium"
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                        : "bg-red-500/20 border-red-500/50 text-red-400"
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                  <span className="block text-xs opacity-60 mt-0.5">{DIFFICULTY_CONFIG[d].label}</span>
                </button>
              ))}
            </div>
          </div>
          <Button onClick={startGame} className="w-full !bg-gradient-to-r !from-pink-600 !to-violet-600 hover:!from-pink-500 hover:!to-violet-500 !text-lg !py-3">
            <Grid3X3 className="w-5 h-5 mr-2" /> Start Matching
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
              { label: "Matches", value: `${matchCount}/${totalPairs}`, icon: CheckCircle, color: "text-emerald-400" },
              { label: "Moves", value: moves.toString(), icon: Brain, color: "text-cyan-400" },
              { label: "Efficiency", value: `${efficiency}%`, icon: Zap, color: "text-amber-400" },
              { label: "Best Streak", value: `${bestStreak}🔥`, icon: Flame, color: "text-orange-400" },
              { label: "Score", value: score.toString(), icon: Star, color: "text-purple-400" },
              { label: "Time", value: `${Math.floor(timer / 60)}m ${timer % 60}s`, icon: Timer, color: "text-blue-400" },
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-center">
            <p className="text-sm text-gray-500">
              {xpAwarded ? (efficiency >= 90 ? "🏆 +100 XP (Perfect Memory!)" : "⭐ +50 XP earned") : "Calculating XP..."}
            </p>
          </motion.div>
          <div className="flex gap-3">
            <Button onClick={startGame} className="flex-1 !bg-gradient-to-r !from-pink-600 !to-violet-600">
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
  const cols = config.cols;

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between" aria-live="polite" role="status">
          <div className="flex items-center gap-3">
            <Grid3X3 className="w-5 h-5 text-pink-400" />
            <span className="text-sm text-gray-400">
              Matched <span className="text-white font-bold">{matchCount}</span> / {totalPairs}
            </span>
            {streak >= 2 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-sm font-bold text-amber-400">
                {streak}🔥
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 flex items-center gap-1">
              <Brain className="w-3.5 h-3.5" /> {moves} moves
            </span>
            <span className="text-sm text-gray-400 flex items-center gap-1">
              <Timer className="w-3.5 h-3.5" /> {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
            </span>
            <span className="text-sm font-bold text-purple-400">{score} pts</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-pink-500 to-violet-500 rounded-full"
            animate={{ width: `${(matchCount / totalPairs) * 100}%` }}
          />
        </div>

        {/* Peek banner */}
        <AnimatePresence>
          {peeking && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center py-2 px-4 bg-pink-500/20 rounded-xl border border-pink-500/30"
            >
              <p className="text-sm text-pink-300 flex items-center justify-center gap-2">
                <Eye className="w-4 h-4 animate-pulse" />
                Memorize the cards! Flipping in {config.peekTime}s...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card grid */}
        <div
          className="grid gap-2.5 mx-auto"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: cols === 5 ? "500px" : "420px" }}
        >
          {cards.map((card) => {
            const isFlipped = peeking || card.matched || flippedIds.includes(card.id);
            const isConcept = card.type === "concept";

            return (
              <motion.button
                key={card.id}
                onClick={() => flipCard(card.id)}
                whileHover={!isFlipped && !peeking ? { scale: 1.05 } : {}}
                whileTap={!isFlipped && !peeking ? { scale: 0.95 } : {}}
                className="relative aspect-[3/4] perspective-500"
                disabled={card.matched}
              >
                <motion.div
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 25 }}
                  className="relative w-full h-full"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Back (hidden) */}
                  <div
                    className={`absolute inset-0 rounded-xl border ${
                      card.matched
                        ? "bg-emerald-500/20 border-emerald-500/30"
                        : "bg-gradient-to-br from-pink-500/10 to-violet-500/10 border-pink-500/20 hover:border-pink-500/40"
                    } flex items-center justify-center transition-colors backface-hidden`}
                  >
                    {card.matched ? (
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <Sparkles className="w-6 h-6 text-pink-400/50" />
                    )}
                  </div>

                  {/* Front (shown when flipped) */}
                  <div
                    className={`absolute inset-0 rounded-xl border p-2 flex items-center justify-center backface-hidden ${
                      card.matched
                        ? "bg-emerald-500/20 border-emerald-500/30"
                        : isConcept
                        ? "bg-gradient-to-br from-violet-500/20 to-purple-600/10 border-violet-500/30"
                        : "bg-gradient-to-br from-cyan-500/20 to-blue-600/10 border-cyan-500/30"
                    }`}
                    style={{ transform: "rotateY(180deg)" }}
                  >
                    <div className="text-center">
                      <p className={`text-xs font-bold mb-1 ${isConcept ? "text-violet-400" : "text-cyan-400"}`}>
                        {isConcept ? "CONCEPT" : "CODE"}
                      </p>
                      <p className={`text-xs leading-tight ${isConcept ? "text-gray-200" : "font-mono text-gray-200"}`}>
                        {card.content}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
