"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui";
import { applyAuthHeaders } from "@/lib/session";
import {
  Zap,
  RotateCcw,
  Trophy,
  Timer,
  Star,
  Heart,
  Brain,
  CheckCircle,
  Flame,
  Play,
  Shield,
  AlertTriangle,
  Target,
  ChevronDown,
  X,
  Sparkles,
} from "lucide-react";

/* ─── types ─── */
interface FallingExpr {
  id: number;
  expression: string;
  answer: string;
  y: number;          // 0..100  (percent from top)
  speed: number;      // percent per tick
  destroyed: boolean;
  column: number;     // 0..2
  difficulty: "easy" | "medium" | "hard";
  concept: string;
}

type Phase = "menu" | "playing" | "results";

/* ─── Expression bank ─── */
interface ExprDef {
  expression: string;
  answer: string;
  difficulty: "easy" | "medium" | "hard";
  concept: string;
}

const EXPRESSIONS: ExprDef[] = [
  // ── EASY ──
  { expression: "3 + 7", answer: "10", difficulty: "easy", concept: "arithmetic" },
  { expression: "15 - 8", answer: "7", difficulty: "easy", concept: "arithmetic" },
  { expression: "4 * 6", answer: "24", difficulty: "easy", concept: "arithmetic" },
  { expression: "20 // 3", answer: "6", difficulty: "easy", concept: "floor div" },
  { expression: "10 % 3", answer: "1", difficulty: "easy", concept: "modulo" },
  { expression: "2 ** 4", answer: "16", difficulty: "easy", concept: "exponent" },
  { expression: "len('hello')", answer: "5", difficulty: "easy", concept: "len()" },
  { expression: "len([1,2,3])", answer: "3", difficulty: "easy", concept: "len()" },
  { expression: "max(3, 7, 2)", answer: "7", difficulty: "easy", concept: "max()" },
  { expression: "min(5, 1, 9)", answer: "1", difficulty: "easy", concept: "min()" },
  { expression: "abs(-8)", answer: "8", difficulty: "easy", concept: "abs()" },
  { expression: "int(3.9)", answer: "3", difficulty: "easy", concept: "int()" },
  { expression: "str(42)", answer: "42", difficulty: "easy", concept: "str()" },
  { expression: "bool(0)", answer: "False", difficulty: "easy", concept: "bool()" },
  { expression: "bool(1)", answer: "True", difficulty: "easy", concept: "bool()" },
  { expression: "bool('')", answer: "False", difficulty: "easy", concept: "bool()" },
  { expression: "type(3).__name__", answer: "int", difficulty: "easy", concept: "type()" },
  { expression: "9 // 2", answer: "4", difficulty: "easy", concept: "floor div" },
  { expression: "2 ** 0", answer: "1", difficulty: "easy", concept: "exponent" },
  { expression: "'hi' * 2", answer: "hihi", difficulty: "easy", concept: "str repeat" },

  // ── MEDIUM ──
  { expression: "sum([1,2,3,4])", answer: "10", difficulty: "medium", concept: "sum()" },
  { expression: "'python'[0:3]", answer: "pyt", difficulty: "medium", concept: "slicing" },
  { expression: "'hello'.upper()", answer: "HELLO", difficulty: "medium", concept: "upper()" },
  { expression: "'WORLD'.lower()", answer: "world", difficulty: "medium", concept: "lower()" },
  { expression: "' hi '.strip()", answer: "hi", difficulty: "medium", concept: "strip()" },
  { expression: "'a,b,c'.split(',')", answer: "['a', 'b', 'c']", difficulty: "medium", concept: "split()" },
  { expression: "'-'.join(['a','b'])", answer: "a-b", difficulty: "medium", concept: "join()" },
  { expression: "sorted([3,1,2])", answer: "[1, 2, 3]", difficulty: "medium", concept: "sorted()" },
  { expression: "list(range(4))", answer: "[0, 1, 2, 3]", difficulty: "medium", concept: "range()" },
  { expression: "[x**2 for x in range(4)]", answer: "[0, 1, 4, 9]", difficulty: "medium", concept: "comprehension" },
  { expression: "'abc'.find('b')", answer: "1", difficulty: "medium", concept: "find()" },
  { expression: "'hello'.count('l')", answer: "2", difficulty: "medium", concept: "count()" },
  { expression: "'abc'.replace('b','x')", answer: "axc", difficulty: "medium", concept: "replace()" },
  { expression: "round(3.7)", answer: "4", difficulty: "medium", concept: "round()" },
  { expression: "list(reversed([1,2,3]))", answer: "[3, 2, 1]", difficulty: "medium", concept: "reversed()" },
  { expression: "'hello'[-1]", answer: "o", difficulty: "medium", concept: "negative index" },
  { expression: "divmod(10, 3)", answer: "(3, 1)", difficulty: "medium", concept: "divmod()" },
  { expression: "pow(2, 3, 5)", answer: "3", difficulty: "medium", concept: "pow()" },
  { expression: "all([True, True])", answer: "True", difficulty: "medium", concept: "all()" },
  { expression: "any([False, True])", answer: "True", difficulty: "medium", concept: "any()" },

  // ── HARD ──
  { expression: "[x for x in range(6) if x%2==0]", answer: "[0, 2, 4]", difficulty: "hard", concept: "filtered comp" },
  { expression: "dict(zip('ab',[1,2]))", answer: "{'a': 1, 'b': 2}", difficulty: "hard", concept: "zip+dict" },
  { expression: "list(map(str,[1,2,3]))", answer: "['1', '2', '3']", difficulty: "hard", concept: "map()" },
  { expression: "list(filter(None,[0,1,'',2]))", answer: "[1, 2]", difficulty: "hard", concept: "filter()" },
  { expression: "sum(range(1,6))", answer: "15", difficulty: "hard", concept: "sum+range" },
  { expression: "len(set([1,1,2,2,3]))", answer: "3", difficulty: "hard", concept: "set dedup" },
  { expression: "{1,2} & {2,3}", answer: "{2}", difficulty: "hard", concept: "set intersect" },
  { expression: "{1,2} | {2,3}", answer: "{1, 2, 3}", difficulty: "hard", concept: "set union" },
  { expression: "(lambda x: x*2)(5)", answer: "10", difficulty: "hard", concept: "lambda" },
  { expression: "eval('2+3*4')", answer: "14", difficulty: "hard", concept: "eval()" },
  { expression: "bin(10)", answer: "0b1010", difficulty: "hard", concept: "bin()" },
  { expression: "hex(255)", answer: "0xff", difficulty: "hard", concept: "hex()" },
  { expression: "chr(65)", answer: "A", difficulty: "hard", concept: "chr()" },
  { expression: "ord('Z')", answer: "90", difficulty: "hard", concept: "ord()" },
  { expression: "'abc'[::-1]", answer: "cba", difficulty: "hard", concept: "reverse slice" },
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

function normalizeAnswer(s: string): string {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
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
const diffBorder: Record<string, string> = { easy: "border-emerald-500/40", medium: "border-amber-500/40", hard: "border-red-500/40" };
const diffGlow: Record<string, string> = { easy: "shadow-emerald-500/20", medium: "shadow-amber-500/20", hard: "shadow-red-500/20" };

export default function Game5Page() {
  return (
    <AuthGuard>
      <CodeCascadeGame />
    </AuthGuard>
  );
}

function CodeCascadeGame() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [exprs, setExprs] = useState<FallingExpr[]>([]);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [destroyed, setDestroyed] = useState(0);
  const [missed, setMissed] = useState(0);
  const [timer, setTimer] = useState(0);
  const [wave, setWave] = useState(1);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [flashEffect, setFlashEffect] = useState<{ id: number; text: string; color: string } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const nextIdRef = useRef(0);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tickRef = useRef<NodeJS.Timeout | null>(null);
  const exprPoolRef = useRef<ExprDef[]>([]);
  const poolIdxRef = useRef(0);
  const gameActiveRef = useRef(false);

  /* refs that mirror state for the tick loop */
  const exprsRef = useRef<FallingExpr[]>([]);
  const livesRef = useRef(5);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const bestComboRef = useRef(0);
  const destroyedRef = useRef(0);
  const missedRef = useRef(0);

  const TICK_MS = 80;
  const BASE_SPEED = 0.35;
  const SPEED_GROWTH = 0.04;
  const BASE_SPAWN_MS = 3200;
  const MIN_SPAWN_MS = 1200;

  /* spawn an expression */
  const spawnExpr = useCallback(() => {
    if (!gameActiveRef.current) return;
    const pool = exprPoolRef.current;
    if (pool.length === 0) return;
    const def = pool[poolIdxRef.current % pool.length];
    poolIdxRef.current++;

    // pick column (avoid collisions with topmost expr in same column)
    const occupiedCols = exprsRef.current.filter(e => !e.destroyed && e.y < 30).map(e => e.column);
    const availCols = [0, 1, 2].filter(c => !occupiedCols.includes(c));
    const col = availCols.length > 0 ? availCols[Math.floor(Math.random() * availCols.length)] : Math.floor(Math.random() * 3);

    const waveMultiplier = 1 + (Math.floor(destroyedRef.current / 5)) * SPEED_GROWTH;
    const diffMultiplier = def.difficulty === "hard" ? 0.8 : def.difficulty === "medium" ? 0.9 : 1.0;

    const expr: FallingExpr = {
      id: nextIdRef.current++,
      expression: def.expression,
      answer: def.answer,
      y: -8,
      speed: BASE_SPEED * waveMultiplier * diffMultiplier,
      destroyed: false,
      column: col,
      difficulty: def.difficulty,
      concept: def.concept,
    };
    exprsRef.current = [...exprsRef.current, expr];
    setExprs([...exprsRef.current]);
  }, []);

  /* game tick — move expressions down */
  const tick = useCallback(() => {
    if (!gameActiveRef.current) return;
    let newLives = livesRef.current;
    let newMissed = missedRef.current;

    const updated = exprsRef.current
      .map(e => {
        if (e.destroyed) return e;
        const newY = e.y + e.speed;
        if (newY >= 100) {
          newLives--;
          newMissed++;
          comboRef.current = 0;
          return { ...e, y: newY, destroyed: true };
        }
        return { ...e, y: newY };
      })
      .filter(e => !(e.destroyed && e.y > 110));

    exprsRef.current = updated;
    livesRef.current = newLives;
    missedRef.current = newMissed;
    setExprs([...updated]);
    setLives(newLives);
    setMissed(newMissed);
    setCombo(comboRef.current);

    if (newLives <= 0) endGame();
  }, []);

  /* start game */
  const startGame = () => {
    const pool = shuffle(EXPRESSIONS);
    exprPoolRef.current = pool;
    poolIdxRef.current = 0;
    nextIdRef.current = 0;
    exprsRef.current = [];
    livesRef.current = 5;
    scoreRef.current = 0;
    comboRef.current = 0;
    bestComboRef.current = 0;
    destroyedRef.current = 0;
    missedRef.current = 0;
    gameActiveRef.current = true;

    setExprs([]);
    setInput("");
    setScore(0);
    setLives(5);
    setCombo(0);
    setBestCombo(0);
    setDestroyed(0);
    setMissed(0);
    setTimer(0);
    setWave(1);
    setXpAwarded(false);
    setFlashEffect(null);
    setPhase("playing");

    setTimeout(() => inputRef.current?.focus(), 100);

    // spawn timer
    const scheduleSpawn = () => {
      if (!gameActiveRef.current) return;
      const waveNum = Math.floor(destroyedRef.current / 5) + 1;
      const delay = Math.max(MIN_SPAWN_MS, BASE_SPAWN_MS - waveNum * 150);
      spawnTimerRef.current = setTimeout(() => {
        spawnExpr();
        scheduleSpawn();
      }, delay);
    };
    spawnExpr();
    scheduleSpawn();

    // tick loop
    tickRef.current = setInterval(tick, TICK_MS);
  };

  /* timer */
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  /* cleanup */
  useEffect(() => {
    return () => {
      gameActiveRef.current = false;
      if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  /* end game */
  const endGame = useCallback(async () => {
    gameActiveRef.current = false;
    if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    if (tickRef.current) clearInterval(tickRef.current);

    setPhase("results");
    setBestCombo(bestComboRef.current);
    setScore(scoreRef.current);
    setDestroyed(destroyedRef.current);
    setMissed(missedRef.current);
    const perfect = missedRef.current === 0 && destroyedRef.current >= 15;
    await awardGameXP("game5", perfect);
    setXpAwarded(true);
  }, []);

  /* check input */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !gameActiveRef.current) return;

    const userAnswer = normalizeAnswer(input);

    // find the lowest (highest y) expression matching the answer
    const match = exprsRef.current
      .filter(ex => !ex.destroyed)
      .sort((a, b) => b.y - a.y)
      .find(ex => normalizeAnswer(ex.answer) === userAnswer);

    if (match) {
      // Destroy it!
      const points = match.difficulty === "hard" ? 30 : match.difficulty === "medium" ? 20 : 10;
      const comboBonus = comboRef.current >= 5 ? 15 : comboRef.current >= 3 ? 8 : 0;
      const urgencyBonus = match.y >= 70 ? 10 : 0;
      const totalPts = points + comboBonus + urgencyBonus;

      scoreRef.current += totalPts;
      comboRef.current++;
      if (comboRef.current > bestComboRef.current) bestComboRef.current = comboRef.current;
      destroyedRef.current++;

      setScore(scoreRef.current);
      setCombo(comboRef.current);
      setBestCombo(bestComboRef.current);
      setDestroyed(destroyedRef.current);
      setWave(Math.floor(destroyedRef.current / 5) + 1);

      exprsRef.current = exprsRef.current.map(e =>
        e.id === match.id ? { ...e, destroyed: true } : e
      );
      setExprs([...exprsRef.current]);

      const colors = { easy: "text-emerald-400", medium: "text-amber-400", hard: "text-red-400" };
      setFlashEffect({ id: match.id, text: `+${totalPts}`, color: colors[match.difficulty] });
      setTimeout(() => setFlashEffect(null), 800);
    }

    setInput("");
  };

  const accuracy = destroyed + missed > 0 ? Math.round((destroyed / (destroyed + missed)) * 100) : 0;
  const rank = destroyed >= 25 ? "S" : destroyed >= 20 ? "A" : destroyed >= 15 ? "B" : destroyed >= 10 ? "C" : "D";
  const rankColor: Record<string, string> = { S: "text-yellow-400", A: "text-emerald-400", B: "text-blue-400", C: "text-amber-400", D: "text-red-400" };
  const rankTitle: Record<string, string> = { S: "Cascade King", A: "Expression Ace", B: "Python Blaster", C: "Type Fighter", D: "Keep Typing!" };

  /* ─── MENU ─── */
  if (phase === "menu") {
    return (
      <div className="min-h-screen bg-[#0a0a14] text-white flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg w-full text-center space-y-8">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto w-28 h-28 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-violet-600/20 border border-fuchsia-500/30 flex items-center justify-center relative overflow-hidden"
          >
            <Zap className="w-14 h-14 text-fuchsia-400" />
            <motion.div
              animate={{ y: [-20, 120] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0 }}
              className="absolute text-fuchsia-400/30 text-xs font-mono left-2"
            >3+4</motion.div>
            <motion.div
              animate={{ y: [-20, 120] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear", delay: 0.7 }}
              className="absolute text-violet-400/30 text-xs font-mono right-2"
            >len()</motion.div>
          </motion.div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
              Code Cascade
            </h1>
            <p className="text-gray-400 mt-2 text-lg">Type Fast, Think Faster</p>
          </div>
          <div className="space-y-3 text-left bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-fuchsia-400 flex items-center gap-2">
              <Zap className="w-5 h-5" /> How to Play
            </h3>
            <ul className="text-gray-300 space-y-2 text-sm">
              <li className="flex items-start gap-2"><span className="text-fuchsia-400 font-bold mt-0.5">⬇️</span> Python expressions fall from the top</li>
              <li className="flex items-start gap-2"><span className="text-fuchsia-400 font-bold mt-0.5">⌨️</span> Type the output value to destroy them</li>
              <li className="flex items-start gap-2"><span className="text-fuchsia-400 font-bold mt-0.5">💀</span> If an expression reaches the bottom, you lose a life</li>
              <li className="flex items-start gap-2"><span className="text-fuchsia-400 font-bold mt-0.5">🔥</span> Build combos for bonus points</li>
              <li className="flex items-start gap-2"><span className="text-fuchsia-400 font-bold mt-0.5">⚡</span> Speed increases as you progress!</li>
            </ul>
          </div>
          <div className="flex gap-3 text-sm text-gray-500 justify-center">
            <span className="px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400">55 Expressions</span>
            <span className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400">Endless Mode</span>
            <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">5 Lives</span>
          </div>
          <Button onClick={startGame} className="w-full !bg-gradient-to-r !from-fuchsia-600 !to-violet-600 hover:!from-fuchsia-500 hover:!to-violet-500 !text-lg !py-3">
            <Zap className="w-5 h-5 mr-2" /> Start Cascade
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
              { label: "Destroyed", value: destroyed.toString(), icon: Target, color: "text-emerald-400" },
              { label: "Score", value: score.toString(), icon: Star, color: "text-purple-400" },
              { label: "Accuracy", value: `${accuracy}%`, icon: Brain, color: "text-cyan-400" },
              { label: "Best Combo", value: `${bestCombo}🔥`, icon: Flame, color: "text-amber-400" },
              { label: "Wave", value: wave.toString(), icon: Sparkles, color: "text-fuchsia-400" },
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
              {xpAwarded ? (destroyed >= 15 && missed === 0 ? "🏆 +100 XP (Perfect Run!)" : "⭐ +50 XP earned") : "Calculating XP..."}
            </p>
          </motion.div>
          <div className="flex gap-3">
            <Button onClick={startGame} className="flex-1 !bg-gradient-to-r !from-fuchsia-600 !to-violet-600">
              <RotateCcw className="w-4 h-4 mr-2" /> Play Again
            </Button>
            <Button onClick={() => setPhase("menu")} variant="secondary" className="flex-1">
              🏠 Menu
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ─── PLAYING ─── */
  const activeExprs = exprs.filter(e => !e.destroyed);
  const colWidth = 33.33;

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white flex flex-col overflow-hidden" onClick={() => inputRef.current?.focus()}>
      {/* HUD */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-white/5 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-purple-400" /> <span className="font-bold text-purple-400">{score}</span>
          </span>
          <span className="text-sm text-gray-400 flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-emerald-400" /> <span className="font-bold text-emerald-400">{destroyed}</span>
          </span>
          {combo >= 2 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-sm font-bold text-amber-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> {combo}
            </motion.span>
          )}
        </div>
        <span className="text-xs px-2 py-1 bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-400 rounded-full">
          Wave {wave}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 flex items-center gap-1">
            <Timer className="w-3.5 h-3.5" /> {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
          </span>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Heart key={i} className={`w-4 h-4 transition-all ${i < lives ? "text-red-400 fill-red-400" : "text-gray-700"}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Game area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Column guides */}
        <div className="absolute inset-0 flex pointer-events-none">
          <div className="flex-1 border-r border-white/3" />
          <div className="flex-1 border-r border-white/3" />
          <div className="flex-1" />
        </div>

        {/* Danger zone at bottom */}
        <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-red-900/20 to-transparent border-t border-red-500/10 z-0" />

        {/* Falling expressions */}
        <AnimatePresence>
          {exprs.map(expr => (
            expr.destroyed ? (
              <motion.div
                key={expr.id}
                initial={{ opacity: 1, scale: 1 }}
                animate={{ opacity: 0, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute flex items-center justify-center pointer-events-none"
                style={{
                  top: `${expr.y}%`,
                  left: `${expr.column * colWidth + colWidth / 2}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <Sparkles className="w-8 h-8 text-fuchsia-400" />
              </motion.div>
            ) : (
              <motion.div
                key={expr.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`absolute px-3 py-1.5 rounded-lg border ${diffBorder[expr.difficulty]} bg-[#12121e] shadow-lg ${diffGlow[expr.difficulty]} pointer-events-none`}
                style={{
                  top: `${expr.y}%`,
                  left: `${expr.column * colWidth + colWidth / 2}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <p className={`text-xs font-mono font-bold whitespace-nowrap ${diffColor[expr.difficulty]}`}>
                  {expr.expression}
                </p>
                <p className="text-[9px] text-gray-600 text-center">{expr.concept}</p>
              </motion.div>
            )
          ))}
        </AnimatePresence>

        {/* Score flash */}
        <AnimatePresence>
          {flashEffect && (
            <motion.div
              key={flashEffect.id}
              initial={{ opacity: 1, y: 0, scale: 0.8 }}
              animate={{ opacity: 0, y: -40, scale: 1.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 text-2xl font-black ${flashEffect.color} pointer-events-none`}
            >
              {flashEffect.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input area */}
      <div className="shrink-0 p-3 bg-black/60 border-t border-white/10 z-10">
        <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type the output value..."
            autoComplete="off"
            autoFocus
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder:text-gray-600 focus:border-fuchsia-500/50 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/30 transition"
          />
          <Button type="submit" className="!bg-gradient-to-r !from-fuchsia-600 !to-violet-600 !px-6">
            <Zap className="w-4 h-4" />
          </Button>
        </form>
        {/* Active expressions helper text */}
        <p className="text-center text-[10px] text-gray-600 mt-1">
          {activeExprs.length} expression{activeExprs.length !== 1 ? "s" : ""} falling — type the answer to blast them!
        </p>
      </div>
    </div>
  );
}
