"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Badge, Card } from "@/components/ui";
import { AuthGuard } from "@/components/AuthGuard";
import { applyAuthHeaders } from "@/lib/session";
import {
  Gauge, Lightbulb, ChevronRight, RotateCcw, Flame, Zap, Trophy,
  Timer, Target, Shield, Rocket
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

interface Question {
  concept: string;
  snippet: string;
  prompt: string;
  options: string[];
  answer: number;
  tip: string;
  difficulty: number;
}

const questionBank: Question[] = [
  { difficulty: 1, concept: "Stride slicing", snippet: "grid = [9, 7, 5, 3, 1]\nprint(grid[0:5:2])", prompt: "Select the exact output.", options: ["[9, 5, 1]", "[7, 3]", "[9, 7, 5]", "[5, 3, 1]"], answer: 0, tip: "A step of 2 hops every other element." },
  { difficulty: 1, concept: "Negative slicing", snippet: "word = 'velocity'\nprint(word[-4:-1])", prompt: "What hits stdout?", options: ["cit", "oci", "loc", "ity"], answer: 0, tip: "Slices stop just before the end index." },
  { difficulty: 1, concept: "String multiply", snippet: "pulse = 'py ' * 3\nprint(pulse.strip())", prompt: "What is printed?", options: ["py py py", "pypypy", "py  py  py", "Error"], answer: 0, tip: "String * n repeats the string n times. strip() removes trailing spaces." },
  { difficulty: 1, concept: "Type conversion", snippet: "x = '42'\ny = int(x) + 8\nprint(y)", prompt: "What gets printed?", options: ["50", "428", "Error", "None"], answer: 0, tip: "int() converts a string to integer before arithmetic." },
  { difficulty: 1, concept: "List length", snippet: "data = [[1, 2], [3], [4, 5, 6]]\nprint(len(data))", prompt: "What is the output?", options: ["3", "6", "2", "Error"], answer: 0, tip: "len() counts top-level elements, not nested ones." },
  { difficulty: 1, concept: "Boolean logic", snippet: "print(bool('') or bool(0) or bool([None]))", prompt: "What is printed?", options: ["True", "False", "None", "Error"], answer: 0, tip: "A list with one element (even None) is truthy." },
  { difficulty: 1, concept: "Range basics", snippet: "total = 0\nfor n in range(3, 15, 4):\n    total += n\nprint(total)", prompt: "Pick the correct total.", options: ["21", "18", "24", "27"], answer: 0, tip: "range(3, 15, 4) emits 3, 7, 11." },
  { difficulty: 2, concept: "Star unpack", snippet: "a, *mid, z = [2, 4, 6, 8, 10]\nprint(sum(mid))", prompt: "Choose the printed sum.", options: ["18", "14", "12", "24"], answer: 0, tip: "mid collects everything between the first and last items." },
  { difficulty: 2, concept: "Dict comprehension", snippet: "laps = {'neo': 68, 'aya': 64, 'raj': 70}\ntrimmed = {k: v-60 for k, v in laps.items() if v > 65}\nprint(sum(trimmed.values()))", prompt: "What total do we see?", options: ["18", "20", "13", "8"], answer: 0, tip: "Only entries over 65 survive the filter." },
  { difficulty: 2, concept: "Filtered reverse", snippet: "pulse = [3, 4, 5, 6]\nrhythm = [x for x in pulse if x % 2 == 0]\nprint(rhythm[::-1])", prompt: "What prints?", options: ["[6, 4]", "[4, 6]", "[3, 5]", "[6]"], answer: 0, tip: "Filter even numbers, then reverse the list." },
  { difficulty: 2, concept: "Set uniqueness", snippet: "codes = {c.lower() for c in 'PyPy33!'}\nprint(len(codes))", prompt: "Select the length.", options: ["4", "5", "3", "6"], answer: 0, tip: "Duplicates vanish regardless of case." },
  { difficulty: 2, concept: "F-string formatting", snippet: "gap = 3/8\nprint(f\"{gap:.3f}\")", prompt: "Choose the exact string.", options: ["0.375", "0.38", "0.37", "0.3"], answer: 0, tip: ".3f keeps three decimals." },
  { difficulty: 2, concept: "Enumerate start", snippet: "calls = ['box', 'lift', 'deploy']\nfor idx, word in enumerate(calls, start=5):\n    if idx == 6:\n        print(word.upper())", prompt: "Which line is emitted?", options: ["LIFT", "BOX", "DEPLOY", "Nothing prints"], answer: 0, tip: "Starting at 5 makes the second word index 6." },
  { difficulty: 2, concept: "Generator sum", snippet: "boost = sum(n for n in range(5) if n % 2)\nprint(boost)", prompt: "Select the output.", options: ["4", "6", "8", "9"], answer: 0, tip: "Only 1 and 3 make it into the sum." },
  { difficulty: 2, concept: "Lambda + map", snippet: "nums = [1, 2, 3, 4]\nresult = list(map(lambda x: x**2, nums))\nprint(result[2])", prompt: "What is printed?", options: ["9", "4", "16", "3"], answer: 0, tip: "map applies the lambda to each element. Index 2 is the third item." },
  { difficulty: 2, concept: "String methods", snippet: "msg = '  Hello, World!  '\nresult = msg.strip().split(',')\nprint(len(result))", prompt: "What is the length?", options: ["2", "1", "3", "Error"], answer: 0, tip: "strip() removes spaces, split(',') splits on comma into parts." },
  { difficulty: 3, concept: "Mutable defaults", snippet: "def queue(batch=[]):\n    batch.append(len(batch))\n    return batch\n\nfirst = queue()\nsecond = queue()\nprint(second)", prompt: "What is printed?", options: ["[0, 1]", "[0]", "[1, 2]", "[0, 1, 2]"], answer: 0, tip: "Default lists persist between calls." },
  { difficulty: 3, concept: "Zip + min", snippet: "drivers = ['Asha', 'Liam', 'Mina']\nsectors = [31.2, 30.8, 32.1]\nboard = dict(zip(drivers, sectors))\nfast = min(board, key=board.get)\nprint(fast)", prompt: "Who tops the board?", options: ["Liam", "Asha", "Mina", "Raises KeyError"], answer: 0, tip: "min with key compares the mapped values." },
  { difficulty: 3, concept: "any vs all", snippet: "flags = [True, False, True]\nprint(any(flags) and not all(flags))", prompt: "Choose the boolean result.", options: ["True", "False", "None", "Raises TypeError"], answer: 0, tip: "At least one True but not every value is True." },
  { difficulty: 3, concept: "Sorting tuples", snippet: "laps = [(71, 'Kai'), (69, 'Noor'), (69, 'Ivy')]\nleader = sorted(laps)[0][1]\nprint(leader)", prompt: "Who leads?", options: ["Ivy", "Noor", "Kai", "(69, 'Ivy')"], answer: 0, tip: "Tuples sort by time then driver name." },
  { difficulty: 3, concept: "Dict get fallback", snippet: "telemetry = {'temp': 92}\nprint(telemetry.get('boost') or 27)", prompt: "What prints?", options: ["27", "None", "KeyError", "92"], answer: 0, tip: "Missing key yields None which triggers the fallback." },
  { difficulty: 3, concept: "Closure trap", snippet: "funcs = [lambda: i for i in range(3)]\nprint([f() for f in funcs])", prompt: "What is the output?", options: ["[2, 2, 2]", "[0, 1, 2]", "[1, 2, 3]", "Error"], answer: 0, tip: "Closures capture the variable reference, not the value. i ends at 2." },
  { difficulty: 3, concept: "Walrus operator", snippet: "data = [1, 2, 3, 4, 5]\nif (n := len(data)) > 3:\n    print(f'Big: {n}')\nelse:\n    print(f'Small: {n}')", prompt: "What is printed?", options: ["Big: 5", "Small: 5", "Big: 3", "Error"], answer: 0, tip: "The walrus operator := assigns and evaluates in one expression." },
  { difficulty: 3, concept: "Unpacking nested", snippet: "matrix = [[1, 2], [3, 4]]\n[(a, b), (c, d)] = matrix\nprint(a + d)", prompt: "What is the result?", options: ["5", "4", "6", "Error"], answer: 0, tip: "Nested unpacking assigns a=1, b=2, c=3, d=4." },
  { difficulty: 3, concept: "Iterator exhaustion", snippet: "gen = (x for x in [1, 2, 3])\nprint(sum(gen))\nprint(sum(gen))", prompt: "What does the second print show?", options: ["0", "6", "Error", "None"], answer: 0, tip: "Generators are exhausted after one pass. Second sum gets nothing = 0." },
];

function shuffle<T>(list: T[]): T[] {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface ShuffledOption { text: string; isCorrect: boolean; }

const TRACK_LENGTH = 100;
const LAPS = 3;
const rivalConfig = { baseVelocity: 0.45, accel: 0.015, maxVelocity: 1.3, interval: 900 };

interface GameState {
  deck: Question[];
  index: number;
  distance: number;
  rivalDistance: number;
  streak: number;
  bestStreak: number;
  penalties: number;
  finished: boolean;
  readyNext: boolean;
  speed: number;
  result: "win" | "loss" | null;
  rivalVelocity: number;
  lap: number;
  questionsAnswered: number;
  correctAnswers: number;
  turboActive: boolean;
  shieldActive: boolean;
  turboCount: number;
  shieldCount: number;
  combo: number;
  totalXPGained: number;
}

function createInitialState(): GameState {
  const easy = shuffle(questionBank.filter(q => q.difficulty === 1));
  const med = shuffle(questionBank.filter(q => q.difficulty === 2));
  const hard = shuffle(questionBank.filter(q => q.difficulty === 3));
  const deck = [...easy.slice(0, 5), ...med.slice(0, 5), ...hard.slice(0, 5)];
  return {
    deck, index: 0, distance: 0, rivalDistance: 0, streak: 0, bestStreak: 0,
    penalties: 0, finished: false, readyNext: false, speed: 80,
    result: null, rivalVelocity: rivalConfig.baseVelocity,
    lap: 1, questionsAnswered: 0, correctAnswers: 0,
    turboActive: false, shieldActive: false, turboCount: 1, shieldCount: 1,
    combo: 0, totalXPGained: 0,
  };
}

export default function Game3Page() {
  const [state, setState] = useState<GameState>(createInitialState);
  const [banner, setBanner] = useState("Systems online \u2014 answer to accelerate");
  const [hintText, setHintText] = useState("");
  const [telemetry, setTelemetry] = useState<Array<{ msg: string; type: string }>>([{ msg: "All systems nominal. Ready to race.", type: "info" }]);
  const [shuffledOptions, setShuffledOptions] = useState<ShuffledOption[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const rivalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const xpAwarded = useRef(false);

  const pushTelemetry = useCallback((msg: string, type = "info") => {
    setTelemetry((prev) => [{ msg, type }, ...prev].slice(0, 8));
  }, []);

  const renderOptions = useCallback((question: Question) => {
    const bag: ShuffledOption[] = question.options.map((text, idx) => ({ text, isCorrect: idx === question.answer }));
    setShuffledOptions(shuffle(bag));
  }, []);

  useEffect(() => {
    if (state.finished) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state.finished]);

  useEffect(() => {
    if (state.deck.length > 0) renderOptions(state.deck[state.index]);
  }, [state.index, state.deck, renderOptions]);

  useEffect(() => {
    if (state.finished) return;
    rivalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.finished) return prev;
        const jitter = 0.85 + Math.random() * 0.3;
        const slow = prev.turboActive ? 0.5 : 1;
        const newRivalDist = Math.min(TRACK_LENGTH, prev.rivalDistance + prev.rivalVelocity * jitter * slow);
        const newVel = Math.min(rivalConfig.maxVelocity, prev.rivalVelocity + rivalConfig.accel);
        const rivalWon = newRivalDist >= TRACK_LENGTH;
        if (rivalWon) setBanner("Rival crossed the finish line!");
        return {
          ...prev, rivalDistance: newRivalDist, rivalVelocity: newVel,
          finished: rivalWon || prev.finished, readyNext: rivalWon || prev.readyNext,
          result: rivalWon ? "loss" : prev.result,
        };
      });
    }, rivalConfig.interval);
    return () => { if (rivalRef.current) clearInterval(rivalRef.current); };
  }, [state.finished]);

  const handleAnswer = useCallback((option: ShuffledOption) => {
    if (state.readyNext || state.finished) return;
    setState((prev) => {
      const question = prev.deck[prev.index];
      const isCorrect = option.isCorrect;
      const turboMul = prev.turboActive ? 1.8 : 1;
      const qa = prev.questionsAnswered + 1;

      if (isCorrect) {
        const streakBonus = Math.min(prev.streak * 3, 15);
        const diffBonus = question.difficulty * 4;
        const boost = (10 + streakBonus + diffBonus) * turboMul;
        const newDist = Math.min(TRACK_LENGTH, prev.distance + boost);
        const won = newDist >= TRACK_LENGTH;
        const ns = prev.streak + 1;
        const nc = prev.combo + 1;
        const xpG = 10 + (nc >= 3 ? 5 : 0);
        let newLap = prev.lap;
        const lapT = (prev.lap / LAPS) * TRACK_LENGTH;
        if (newDist >= lapT && prev.distance < lapT && !won) newLap = Math.min(LAPS, prev.lap + 1);
        let nt = prev.turboCount;
        let nsh = prev.shieldCount;
        if (ns === 3) nt = Math.min(3, nt + 1);
        if (ns === 5) nsh = Math.min(3, nsh + 1);
        if (won) { setBanner("\uD83C\uDFC1 FINISH! You won the race!"); pushTelemetry(`Race complete! ${prev.correctAnswers + 1}/${qa} correct.`, "success"); }
        else { const msgs = ["Clean answer. Boost engaged.", "Perfect execution!", "Rival is eating dust.", "Streak building! Keep it up.", `${question.concept} mastered.`]; setBanner(msgs[Math.floor(Math.random() * msgs.length)]); pushTelemetry(`+${Math.round(boost)}m | ${question.concept} \u2713`, "success"); }
        return {
          ...prev, distance: newDist, streak: ns, bestStreak: Math.max(prev.bestStreak, ns),
          speed: Math.min(260, prev.speed + 15), rivalDistance: Math.max(0, prev.rivalDistance - (ns >= 3 ? 3 : 1)),
          readyNext: true, finished: won, result: won ? "win" : prev.result, lap: newLap,
          questionsAnswered: qa, correctAnswers: prev.correctAnswers + 1, turboActive: false,
          combo: nc, turboCount: nt, shieldCount: nsh, totalXPGained: prev.totalXPGained + xpG,
        };
      } else {
        const shieldSaves = prev.shieldActive;
        const penalty = shieldSaves ? 0 : 8;
        setBanner(shieldSaves ? "Shield absorbed the hit!" : "Wrong answer. Grip lost.");
        pushTelemetry(shieldSaves ? "Shield activated! No penalty." : `-${penalty}m | ${question.concept}`, shieldSaves ? "info" : "fail");
        return {
          ...prev, distance: Math.max(0, prev.distance - penalty), streak: 0,
          penalties: prev.penalties + (shieldSaves ? 0 : 1), speed: Math.max(60, prev.speed - (shieldSaves ? 0 : 20)),
          readyNext: true, shieldActive: false, turboActive: false, combo: 0, questionsAnswered: qa,
        };
      }
    });
  }, [state.readyNext, state.finished, pushTelemetry]);

  const handleNext = useCallback(() => {
    if (state.finished) {
      if (!xpAwarded.current && state.result === "win") { xpAwarded.current = true; awardGameXP("game3", state.penalties === 0); }
      setShowResults(true);
      return;
    }
    if (!state.readyNext) return;
    setState((prev) => {
      let ni = prev.index + 1;
      let deck = prev.deck;
      if (ni >= deck.length) { deck = shuffle([...questionBank]); ni = 0; }
      return { ...prev, index: ni, deck, readyNext: false };
    });
    setHintText("");
  }, [state.finished, state.readyNext, state.result, state.penalties]);

  const handleRestart = useCallback(() => {
    setState(createInitialState()); setBanner("Systems online \u2014 answer to accelerate");
    setHintText(""); setTelemetry([{ msg: "All systems nominal. Ready to race.", type: "info" }]);
    setShowResults(false); setElapsed(0); xpAwarded.current = false;
  }, []);

  const handleTurbo = useCallback(() => {
    if (state.turboCount <= 0 || state.finished) return;
    setState(p => ({ ...p, turboActive: true, turboCount: p.turboCount - 1 }));
    pushTelemetry("\uD83D\uDE80 TURBO! Next correct = 1.8x boost!", "success");
  }, [state.turboCount, state.finished, pushTelemetry]);

  const handleShield = useCallback(() => {
    if (state.shieldCount <= 0 || state.finished) return;
    setState(p => ({ ...p, shieldActive: true, shieldCount: p.shieldCount - 1 }));
    pushTelemetry("\uD83D\uDEE1\uFE0F SHIELD! Next wrong = no penalty!", "info");
  }, [state.shieldCount, state.finished, pushTelemetry]);

  const handleHint = useCallback(() => {
    setHintText(state.deck[state.index].tip);
    pushTelemetry("Hint: " + state.deck[state.index].tip);
  }, [state.deck, state.index, pushTelemetry]);

  const question = state.deck[state.index];
  const leading = state.distance >= state.rivalDistance;
  const speedPct = ((Math.max(60, Math.min(260, state.speed)) - 60) / 200) * 100;
  const accPct = state.questionsAnswered > 0 ? Math.round((state.correctAnswers / state.questionsAnswered) * 100) : 0;
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  if (showResults) {
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
                  className={cn("w-20 h-20 rounded-full mx-auto flex items-center justify-center", state.result === "win" ? "bg-success-muted" : "bg-danger-muted")}>
                  {state.result === "win" ? <Trophy className="w-10 h-10 text-success" /> : <Target className="w-10 h-10 text-danger" />}
                </motion.div>
                <h2 className="text-2xl font-bold">{state.result === "win" ? "Race Won!" : "Race Lost"}</h2>
                <p className="text-muted">{state.result === "win" ? "You outpaced the AI rival. Legendary driving." : "The rival crossed first. Sharpen your Python and try again."}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[{ label: "Accuracy", value: `${accPct}%` }, { label: "Best Streak", value: `${state.bestStreak}` }, { label: "Time", value: fmt(elapsed) }, { label: "Penalties", value: `${state.penalties}` }, { label: "Top Speed", value: `${state.speed} km/h` }, { label: "XP Earned", value: `+${state.totalXPGained}` }].map(s => (
                  <div key={s.label} className="bg-bg-elevated rounded-xl p-3 text-center">
                    <p className="text-xs text-muted">{s.label}</p>
                    <p className="text-lg font-bold">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button onClick={handleRestart} className="flex-1"><RotateCcw className="w-4 h-4" /> Race Again</Button>
                <Button variant="secondary" onClick={() => window.location.href = "/gamified"} className="flex-1">Game Lab</Button>
              </div>
            </div>
          </motion.div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen relative overflow-hidden">
        <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-radial from-success/6 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 relative space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <motion.div animate={{ rotate: state.turboActive ? [0, 360] : 0 }} transition={{ duration: 1, repeat: state.turboActive ? Infinity : 0, ease: "linear" }}
                className="w-11 h-11 rounded-xl bg-gradient-to-br from-success/20 to-accent/20 flex items-center justify-center">
                <Gauge className="w-6 h-6 text-success" />
              </motion.div>
              <div>
                <p className="text-[10px] text-muted font-mono uppercase tracking-wider">Concept Racing League</p>
                <h1 className="text-xl font-bold">Velocity Trials</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="neutral"><Timer className="w-3 h-3 mr-1" />{fmt(elapsed)}</Badge>
              <Badge variant={state.streak >= 3 ? "success" : "neutral"}><Flame className="w-3 h-3 mr-1" />{state.streak}x</Badge>
              <Badge variant={state.penalties > 0 ? "danger" : "neutral"}>{state.penalties} penalty</Badge>
            </div>
          </div>

          {/* Banner */}
          <AnimatePresence mode="wait">
            <motion.div key={banner} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className={cn("px-4 py-2.5 rounded-xl text-sm font-medium text-center",
                banner.includes("\uD83C\uDFC1") ? "bg-success-muted/60 text-success" :
                banner.includes("Wrong") || banner.includes("Rival") ? "bg-danger-muted/50 text-danger" :
                banner.includes("Shield") ? "bg-accent-muted/50 text-accent-light" :
                "bg-bg-elevated text-muted-light"
              )}>
              {banner}
            </motion.div>
          </AnimatePresence>

          <div className="grid lg:grid-cols-[1fr_320px] gap-5">
            <div className="space-y-5">
              {/* Race Track */}
              <Card className="space-y-4 !p-5">
                <div className="flex items-center justify-between text-[10px] text-muted font-mono uppercase tracking-wider">
                  <span>Start</span><span>Lap {state.lap}/{LAPS}</span><span>Finish</span>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-accent-light w-12">YOU</span>
                    <div className="flex-1 h-9 bg-bg-elevated rounded-full relative overflow-hidden">
                      <motion.div className={cn("h-full rounded-full", state.turboActive ? "bg-gradient-to-r from-warning via-accent-hot to-accent" : "bg-gradient-to-r from-accent to-accent-hot")}
                        animate={{ width: `${Math.max(2, state.distance)}%` }} transition={{ duration: 0.4, ease: "easeOut" }} />
                      <motion.div className="absolute top-1/2 -translate-y-1/2 text-lg" animate={{ left: `${Math.max(1, state.distance - 3)}%` }} transition={{ duration: 0.4 }}>
                        🏎️
                      </motion.div>
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold">{Math.round(state.distance)}m</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-danger w-12">RIVAL</span>
                    <div className="flex-1 h-9 bg-bg-elevated rounded-full relative overflow-hidden">
                      <motion.div className="h-full bg-gradient-to-r from-danger/60 to-danger rounded-full"
                        animate={{ width: `${Math.max(2, state.rivalDistance)}%` }} transition={{ duration: 0.4 }} />
                      <motion.div className="absolute top-1/2 -translate-y-1/2 text-lg" animate={{ left: `${Math.max(1, state.rivalDistance - 3)}%` }} transition={{ duration: 0.4 }}>
                        🤖
                      </motion.div>
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold">{Math.round(state.rivalDistance)}m</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold",
                    state.finished && state.result === "win" ? "bg-success-muted text-success" :
                    state.finished && state.result === "loss" ? "bg-danger-muted text-danger" :
                    leading ? "bg-success-muted/50 text-success" : "bg-warning-muted text-warning"
                  )}>
                    {state.finished ? (state.result === "win" ? "\uD83C\uDFC6 WINNER" : "\uD83D\uDC80 DEFEAT") : leading ? "\u25B2 Leading" : "\u25BC Chasing"}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted">Speed</span>
                      <div className="w-20 h-2 bg-bg-elevated rounded-full overflow-hidden">
                        <motion.div className="h-full bg-gradient-to-r from-success to-warning rounded-full" animate={{ width: `${speedPct}%` }} transition={{ duration: 0.3 }} />
                      </div>
                      <span className="text-[10px] font-mono font-bold">{Math.round(state.speed)}</span>
                    </div>
                    <div className="text-[10px]"><span className="text-muted">Acc: </span><span className="font-bold">{accPct}%</span></div>
                  </div>
                </div>
              </Card>

              {/* Power-ups */}
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={handleTurbo} disabled={state.turboCount <= 0 || state.turboActive || state.finished}
                  className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border",
                    state.turboCount > 0 && !state.turboActive ? "border-warning/40 bg-warning/10 text-warning hover:bg-warning/20 cursor-pointer" : "border-border bg-bg-elevated text-muted cursor-not-allowed opacity-50")}>
                  <Rocket className="w-3.5 h-3.5" /> Turbo ({state.turboCount})
                </button>
                <button onClick={handleShield} disabled={state.shieldCount <= 0 || state.shieldActive || state.finished}
                  className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border",
                    state.shieldCount > 0 && !state.shieldActive ? "border-accent/40 bg-accent/10 text-accent-light hover:bg-accent/20 cursor-pointer" : "border-border bg-bg-elevated text-muted cursor-not-allowed opacity-50")}>
                  <Shield className="w-3.5 h-3.5" /> Shield ({state.shieldCount})
                </button>
                {state.turboActive && <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-[10px] font-bold text-warning">\u26A1 TURBO ACTIVE — 1.8x next boost</motion.span>}
                {state.shieldActive && <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-[10px] font-bold text-accent-light">\uD83D\uDEE1\uFE0F SHIELD ACTIVE — protected</motion.span>}
              </div>

              {/* Question */}
              <AnimatePresence mode="wait">
                <motion.div key={state.index} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                  <Card className="space-y-4 !p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="accent">{question.concept}</Badge>
                        <Badge variant={question.difficulty === 1 ? "success" : question.difficulty === 2 ? "neutral" : "danger"}>
                          {"\u2605".repeat(question.difficulty)}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted font-mono">Q{String(state.index + 1).padStart(2, "0")}</span>
                    </div>
                    <pre className="p-4 bg-bg-elevated rounded-xl text-sm font-mono text-muted-light overflow-x-auto leading-relaxed"><code>{question.snippet}</code></pre>
                    <p className="text-sm font-medium">{question.prompt}</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {shuffledOptions.map((opt, idx) => (
                        <motion.button key={idx} whileHover={!state.readyNext ? { scale: 1.02 } : {}} whileTap={!state.readyNext ? { scale: 0.98 } : {}}
                          className={cn("px-4 py-3 rounded-xl border text-sm font-mono text-left transition-all",
                            !state.readyNext && "border-border hover:border-accent/40 hover:bg-accent-muted/30 cursor-pointer",
                            state.readyNext && opt.isCorrect && "border-success/50 bg-success-muted text-success",
                            state.readyNext && !opt.isCorrect && "border-border opacity-30", "disabled:cursor-default")}
                          disabled={state.readyNext} onClick={() => handleAnswer(opt)}>
                          {opt.text}
                        </motion.button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <Button variant="ghost" size="sm" onClick={handleHint} disabled={state.readyNext}><Lightbulb className="w-4 h-4" /> Hint</Button>
                      <Button disabled={!state.readyNext} onClick={handleNext}>
                        {state.finished ? <>View Results <Trophy className="w-4 h-4" /></> : <>Next <ChevronRight className="w-4 h-4" /></>}
                      </Button>
                    </div>
                    {hintText && (
                      <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-accent-light bg-accent-muted/30 px-3 py-2 rounded-lg">
                        \uD83D\uDCA1 {hintText}
                      </motion.p>
                    )}
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              <Card className="!p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-accent-light" />Race Stats</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[{ label: "Correct", value: state.correctAnswers, color: "text-success" }, { label: "Answered", value: state.questionsAnswered, color: "text-muted-light" }, { label: "Best Streak", value: state.bestStreak, color: "text-warning" }, { label: "Combo", value: `${state.combo}x`, color: state.combo >= 3 ? "text-accent-light" : "text-muted-light" }].map(s => (
                    <div key={s.label} className="bg-bg-elevated rounded-lg p-2.5 text-center">
                      <p className="text-[10px] text-muted">{s.label}</p>
                      <p className={cn("text-base font-bold", s.color)}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="!p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-accent-light" />Telemetry</h3>
                <ul className="space-y-1.5">
                  {telemetry.map((entry, i) => (
                    <motion.li key={i + entry.msg} initial={i === 0 ? { opacity: 0, x: -10 } : {}} animate={{ opacity: 1, x: 0 }}
                      className={cn("text-[11px] px-2.5 py-1.5 rounded-lg",
                        entry.type === "success" && "bg-success-muted/50 text-success",
                        entry.type === "fail" && "bg-danger-muted/50 text-danger",
                        entry.type === "info" && "bg-bg-elevated text-muted-light")}>
                      {entry.msg}
                    </motion.li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
