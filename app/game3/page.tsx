"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Button, Badge, Card, AnimatedSection } from "@/components/ui";
import { AuthGuard } from "@/components/AuthGuard";
import { Gauge, Lightbulb, ArrowRight, RotateCcw, Flame, Zap, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  concept: string;
  snippet: string;
  prompt: string;
  options: string[];
  answer: number;
  tip: string;
}

const questionBank: Question[] = [
  { concept: "Stride slicing", snippet: "grid = [9, 7, 5, 3, 1]\nprint(grid[0:5:2])", prompt: "Select the exact output.", options: ["[9, 5, 1]", "[7, 3]", "[9, 7, 5]", "[5, 3, 1]"], answer: 0, tip: "A step of 2 hops every other element." },
  { concept: "Negative slicing", snippet: "word = 'velocity'\nprint(word[-4:-1])", prompt: "What hits stdout?", options: ["cit", "oci", "loc", "ity"], answer: 0, tip: "Slices stop just before the end index." },
  { concept: "Star unpack", snippet: "a, *mid, z = [2, 4, 6, 8, 10]\nprint(sum(mid))", prompt: "Choose the printed sum.", options: ["12", "14", "18", "24"], answer: 2, tip: "mid collects everything between the first and last items." },
  { concept: "Dict comprehension", snippet: "laps = {'neo': 68, 'aya': 64, 'raj': 70}\ntrimmed = {k: v-60 for k, v in laps.items() if v > 65}\nprint(sum(trimmed.values()))", prompt: "What total do we see?", options: ["18", "20", "13", "8"], answer: 0, tip: "Only entries over 65 survive the filter." },
  { concept: "Range stepping", snippet: "total = 0\nfor n in range(3, 15, 4):\n    total += n\nprint(total)", prompt: "Pick the correct total.", options: ["18", "21", "24", "27"], answer: 1, tip: "range(3, 15, 4) emits 3, 7, 11." },
  { concept: "Filtered reverse", snippet: "pulse = [3, 4, 5, 6]\nrhythm = [x for x in pulse if x % 2 == 0]\nprint(rhythm[::-1])", prompt: "What prints?", options: ["[4, 6]", "[6, 4]", "[3, 5]", "[6]"], answer: 1, tip: "Filter even numbers, then reverse the list." },
  { concept: "Set uniqueness", snippet: "codes = {c.lower() for c in 'PyPy33!'}\nprint(len(codes))", prompt: "Select the length.", options: ["4", "5", "3", "6"], answer: 0, tip: "Duplicates vanish regardless of case." },
  { concept: "Formatting", snippet: 'gap = 3/8\nprint(f"{gap:.3f}")', prompt: "Choose the exact string.", options: ["0.375", "0.38", "0.37", "0.3"], answer: 0, tip: ".3f keeps three decimals." },
  { concept: "Mutable defaults", snippet: "def queue(batch=[]):\n    batch.append(len(batch))\n    return batch\n\nfirst = queue()\nsecond = queue()\nprint(second)", prompt: "What is printed?", options: ["[0, 1]", "[0]", "[1, 2]", "[0, 1, 2]"], answer: 0, tip: "Default lists persist between calls." },
  { concept: "Zip + min", snippet: "drivers = ['Asha', 'Liam', 'Mina']\nsectors = [31.2, 30.8, 32.1]\nboard = dict(zip(drivers, sectors))\nfast = min(board, key=board.get)\nprint(fast)", prompt: "Who tops the board?", options: ["Liam", "Asha", "Mina", "Raises KeyError"], answer: 0, tip: "min with key compares the mapped values." },
  { concept: "Enumerate start", snippet: "calls = ['box', 'lift', 'deploy']\nfor idx, word in enumerate(calls, start=5):\n    if idx == 6:\n        print(word.upper())", prompt: "Which line is emitted?", options: ["LIFT", "BOX", "DEPLOY", "Nothing prints"], answer: 0, tip: "Starting at 5 makes the second word index 6." },
  { concept: "Generator sum", snippet: "boost = sum(n for n in range(5) if n % 2)\nprint(boost)", prompt: "Select the output.", options: ["4", "6", "8", "9"], answer: 0, tip: "Only 1 and 3 make it into the sum." },
  { concept: "any vs all", snippet: "flags = [True, False, True]\nprint(any(flags) and not all(flags))", prompt: "Choose the boolean result.", options: ["True", "False", "None", "Raises TypeError"], answer: 0, tip: "At least one True but not every value is True." },
  { concept: "Sorting tuples", snippet: "laps = [(71, 'Kai'), (69, 'Noor'), (69, 'Ivy')]\nleader = sorted(laps)[0][1]\nprint(leader)", prompt: "Who leads?", options: ["Ivy", "Noor", "Kai", "(69, 'Ivy')"], answer: 0, tip: "Tuples sort by time then driver name." },
  { concept: "Dict get fallback", snippet: "telemetry = {'temp': 92}\nprint(telemetry.get('boost') or 27)", prompt: "What prints?", options: ["27", "None", "KeyError", "92"], answer: 0, tip: "Missing key yields None which triggers the fallback." },
];

function shuffle<T>(list: T[]): T[] {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface ShuffledOption {
  text: string;
  isCorrect: boolean;
}

const rivalConfig = { baseVelocity: 0.55, accel: 0.02, maxVelocity: 1.45, interval: 800 };

interface GameState {
  deck: Question[];
  index: number;
  distance: number;
  rivalDistance: number;
  streak: number;
  penalties: number;
  finished: boolean;
  readyNext: boolean;
  speed: number;
  result: "win" | "loss" | null;
  rivalVelocity: number;
}

export default function Game3Page() {
  const [state, setState] = useState<GameState>(() => ({
    deck: shuffle([...questionBank]),
    index: 0, distance: 0, rivalDistance: 0, streak: 0, penalties: 0,
    finished: false, readyNext: false, speed: 80, result: null,
    rivalVelocity: rivalConfig.baseVelocity,
  }));
  const [banner, setBanner] = useState("Systems nominal");
  const [hintText, setHintText] = useState("");
  const [telemetry, setTelemetry] = useState<Array<string | { msg: string; type: string }>>(["Diagnostics loaded."]);
  const [shuffledOptions, setShuffledOptions] = useState<ShuffledOption[]>([]);
  const rivalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pushTelemetry = useCallback((msg: string, type = "info") => {
    setTelemetry((prev) => [{ msg, type }, ...prev].slice(0, 5));
  }, []);

  const renderOptions = useCallback((question: Question) => {
    const bag: ShuffledOption[] = question.options.map((text, idx) => ({ text, isCorrect: idx === question.answer }));
    setShuffledOptions(shuffle(bag));
  }, []);

  useEffect(() => {
    if (state.deck.length > 0) renderOptions(state.deck[state.index]);
  }, [state.index, state.deck, renderOptions]);

  useEffect(() => {
    if (state.finished) return;
    rivalRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.finished) return prev;
        const jitter = 0.85 + Math.random() * 0.3;
        const newRivalDist = Math.min(100, prev.rivalDistance + prev.rivalVelocity * jitter);
        const newVel = Math.min(rivalConfig.maxVelocity, prev.rivalVelocity + rivalConfig.accel);
        const rivalWon = newRivalDist >= 100;
        if (rivalWon) {
          setBanner("Rival claimed the podium.");
          pushTelemetry("Autopilot rival hit finish first.", "fail");
        }
        return {
          ...prev,
          rivalDistance: newRivalDist,
          rivalVelocity: newVel,
          finished: rivalWon || prev.finished,
          readyNext: rivalWon || prev.readyNext,
          result: rivalWon ? "loss" : prev.result,
        };
      });
    }, rivalConfig.interval);
    return () => { if (rivalRef.current) clearInterval(rivalRef.current); };
  }, [state.finished, pushTelemetry]);

  const handleAnswer = useCallback((option: ShuffledOption) => {
    if (state.readyNext || state.finished) return;

    setState((prev) => {
      const question = prev.deck[prev.index];
      const isCorrect = option.isCorrect;

      if (isCorrect) {
        const boost = 12 + Math.min(prev.streak * 2, 8);
        const newDist = Math.min(100, prev.distance + boost);
        const won = newDist >= 100;
        setBanner(won ? "🏁 Velocity achieved!" : "Perfect exit. Boost engaged.");
        pushTelemetry(`+${boost}m | ${question.concept} mastered`, "success");
        return {
          ...prev, distance: newDist, streak: prev.streak + 1,
          speed: Math.min(220, prev.speed + 18),
          rivalDistance: Math.max(0, prev.rivalDistance - 2),
          readyNext: true, finished: won, result: won ? "win" : prev.result,
        };
      } else {
        setBanner("Incorrect call. Grip lost.");
        pushTelemetry(`-8m drag | ${question.concept}`, "fail");
        return {
          ...prev, distance: Math.max(0, prev.distance - 8),
          streak: 0, penalties: prev.penalties + 1,
          speed: Math.max(60, prev.speed - 20), readyNext: true,
        };
      }
    });
  }, [state.readyNext, state.finished, pushTelemetry]);

  const handleNext = useCallback(() => {
    if (state.finished) {
      setState({
        deck: shuffle([...questionBank]),
        index: 0, distance: 0, rivalDistance: 0, streak: 0, penalties: 0,
        finished: false, readyNext: false, speed: 80, result: null,
        rivalVelocity: rivalConfig.baseVelocity,
      });
      setBanner("Systems nominal");
      setHintText("");
      setTelemetry(["Diagnostics loaded."]);
      return;
    }
    if (!state.readyNext) return;

    setState((prev) => {
      let nextIndex = prev.index + 1;
      let deck = prev.deck;
      if (nextIndex >= deck.length) {
        deck = shuffle([...questionBank]);
        nextIndex = 0;
      }
      return { ...prev, index: nextIndex, deck, readyNext: false };
    });
    setHintText("");
  }, [state.finished, state.readyNext]);

  const handleHint = useCallback(() => {
    setHintText(state.deck[state.index].tip);
    pushTelemetry("Hint deployed: " + state.deck[state.index].tip);
  }, [state.deck, state.index, pushTelemetry]);

  const question = state.deck[state.index];
  const lap = Math.min(Math.floor(state.distance / 25) + 1, 4);
  const leading = state.distance >= state.rivalDistance;
  const speedPct = ((Math.max(60, Math.min(220, state.speed)) - 60) / 160) * 100;

  return (
    <AuthGuard>
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-success/8 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 relative space-y-6">
        {/* Header */}
        <AnimatedSection>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success-muted flex items-center justify-center">
              <Gauge className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted font-mono">Concept Racing League</p>
              <h1 className="text-xl font-bold">Velocity Trials</h1>
            </div>
          </div>
        </AnimatedSection>

        {/* Status Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="neutral">Lap <span className="font-bold ml-1">{String(lap).padStart(2, "0")}</span></Badge>
          <Badge variant={state.streak > 0 ? "success" : "neutral"}>
            <Flame className="w-3 h-3 mr-1" />
            Streak: {state.streak}
          </Badge>
          <Badge variant={state.penalties > 0 ? "danger" : "neutral"}>Penalties: {state.penalties}</Badge>
          <Badge variant="accent">{banner}</Badge>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-6">
            {/* Race Track */}
            <Card className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Start</span>
                <span className="text-muted">Finish</span>
              </div>

              {/* Player track */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-accent-light w-16">You</span>
                  <div className="flex-1 h-8 bg-bg-elevated rounded-full relative overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-accent to-accent-hot rounded-full"
                      animate={{ width: `${state.distance}%` }}
                      transition={{ duration: 0.3 }}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-mono">{Math.round(state.distance)}m</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-danger w-16">Rival</span>
                  <div className="flex-1 h-8 bg-bg-elevated rounded-full relative overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-danger/60 to-danger rounded-full"
                      animate={{ width: `${state.rivalDistance}%` }}
                      transition={{ duration: 0.3 }}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-mono">{Math.round(state.rivalDistance)}m</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium",
                  state.finished && state.result === "win" ? "bg-success-muted text-success" :
                  state.finished && state.result === "loss" ? "bg-danger-muted text-danger" :
                  leading ? "bg-success-muted/50 text-success" : "bg-warning-muted text-warning"
                )}>
                  {state.finished ? (state.result === "win" ? "P1 · Lap complete" : "P2 · Rework strategy") : leading ? "Leading" : "Chasing"}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">Speed</span>
                  <div className="w-24 h-2 bg-bg-elevated rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-success to-warning rounded-full transition-all" style={{ width: `${speedPct}%` }} />
                  </div>
                  <span className="text-xs font-mono">{Math.round(state.speed)} km/h</span>
                </div>
              </div>
            </Card>

            {/* Question */}
            <motion.div key={state.index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="space-y-5">
                <div className="flex items-center justify-between">
                  <Badge variant="accent">{question.concept}</Badge>
                  <span className="text-xs text-muted font-mono">Challenge {String(state.index + 1).padStart(2, "0")}</span>
                </div>

                <pre className="p-4 bg-bg-elevated rounded-xl text-sm font-mono text-muted-light overflow-x-auto">
                  <code>{question.snippet}</code>
                </pre>

                <p className="text-sm font-medium">{question.prompt}</p>

                <div className="grid grid-cols-2 gap-3">
                  {shuffledOptions.map((opt, idx) => (
                    <button
                      key={idx}
                      className={cn(
                        "px-4 py-3 rounded-xl border text-sm font-mono text-left transition-all",
                        !state.readyNext && "border-border hover:border-accent/40 hover:bg-accent-muted/30 cursor-pointer",
                        state.readyNext && opt.isCorrect && "border-success/50 bg-success-muted text-success",
                        state.readyNext && !opt.isCorrect && "border-border opacity-40",
                        "disabled:cursor-default"
                      )}
                      disabled={state.readyNext}
                      onClick={() => handleAnswer(opt)}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={handleHint} disabled={state.readyNext}>
                    <Lightbulb className="w-4 h-4" />
                    Show hint
                  </Button>
                  <Button disabled={!state.readyNext} onClick={handleNext}>
                    {state.finished ? (
                      <><RotateCcw className="w-4 h-4" /> Restart race</>
                    ) : (
                      <>Next challenge <ArrowRight className="w-4 h-4" /></>
                    )}
                  </Button>
                </div>

                {hintText && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-accent-light bg-accent-muted/30 px-3 py-2 rounded-lg"
                  >
                    {hintText}
                  </motion.p>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Telemetry Sidebar */}
          <div className="space-y-6">
            <Card className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent-light" />
                Telemetry Feed
              </h3>
              <ul className="space-y-2">
                {telemetry.map((entry, i) => (
                  <li key={i} className={cn(
                    "text-xs px-3 py-2 rounded-lg",
                    typeof entry === "object" && entry.type === "success" && "bg-success-muted/50 text-success",
                    typeof entry === "object" && entry.type === "fail" && "bg-danger-muted/50 text-danger",
                    (typeof entry === "string" || (typeof entry === "object" && entry.type === "info")) && "bg-bg-elevated text-muted-light"
                  )}>
                    {typeof entry === "object" ? entry.msg : entry}
                  </li>
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
