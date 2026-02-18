"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Button, Badge, Card, AnimatedSection } from "@/components/ui";
import { Puzzle, Shuffle, Eye, Clock, Move } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tile {
  id: string;
  text: string;
  tip: string;
}

const tiles: Tile[] = [
  { id: "comment", text: "# Sum the numbers", tip: "Comments start with # and explain intent." },
  { id: "sample", text: "sample = [3, 4, 5]", tip: "Square brackets build list literals." },
  { id: "def", text: "def total(nums):", tip: "Functions start with def and end with a colon." },
  { id: "acc", text: "    acc = 0", tip: "Initialize accumulators before loops." },
  { id: "loop", text: "    for n in nums:", tip: "for iterates directly over items in a list." },
  { id: "add", text: "        acc += n", tip: "+= mutates the accumulator in-place." },
  { id: "ret", text: "    return acc", tip: "return hands back the computed value." },
  { id: "call", text: "print(total(sample))", tip: "Functions are called with parentheses." },
];

const targetOrder = [...tiles.map((t) => t.id), ""];

function fisherYates(list: string[]): string[] {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function isSolvable(arr: string[]): boolean {
  const nums = arr.map((v) => (v === "" ? 0 : tiles.findIndex((t) => t.id === v) + 1));
  let inversions = 0;
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] && nums[j] && nums[i] > nums[j]) inversions++;
    }
  }
  return inversions % 2 === 0;
}

function generateShuffle(): string[] {
  let arr: string[];
  do { arr = fisherYates([...targetOrder]); } while (!isSolvable(arr));
  return arr;
}

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function formatTime(s: number): string {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function Game2Page() {
  const [puzzle, setPuzzle] = useState<string[]>([...targetOrder]);
  const [moveCount, setMoveCount] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState("Shuffle to start");
  const [message, setMessage] = useState("Arrange the tiles to match a valid Python flow.");
  const [running, setRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const handleShuffle = useCallback(() => {
    setPuzzle(generateShuffle());
    setMoveCount(0);
    setSeconds(0);
    setRunning(true);
    setMessage("Slide tiles to restore the Python flow.");
    setStatus("Race in progress");
    stopTimer();
    startTimer();
  }, [startTimer, stopTimer]);

  const moveTile = useCallback((index: number) => {
    if (!running) return;
    setPuzzle((prev) => {
      const emptyIndex = prev.indexOf("");
      const [erow, ecol] = [Math.floor(emptyIndex / 3), emptyIndex % 3];
      const [trow, tcol] = [Math.floor(index / 3), index % 3];
      if (Math.abs(erow - trow) + Math.abs(ecol - tcol) !== 1) return prev;

      const next = [...prev];
      [next[index], next[emptyIndex]] = [next[emptyIndex], next[index]];
      setMoveCount((m) => m + 1);

      if (arraysEqual(next, targetOrder)) {
        setMessage("🏁 Clean run! The code is in the right order.");
        setStatus("Flow verified");
        setRunning(false);
        stopTimer();
      }
      return next;
    });
  }, [running, stopTimer]);

  const handleHint = useCallback(() => {
    setShowHint(true);
    setTimeout(() => setShowHint(false), 2200);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-radial from-accent/8 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 relative space-y-8">
        {/* Header */}
        <AnimatedSection>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center">
                <Puzzle className="w-5 h-5 text-accent-light" />
              </div>
              <div>
                <p className="text-xs text-muted font-mono">Python Flow Lab</p>
                <h1 className="text-xl font-bold">Flow Slide</h1>
              </div>
            </div>
            <p className="text-muted">Reorder the code tiles to rebuild a working Python function.</p>
          </div>
        </AnimatedSection>

        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          {/* Puzzle Area */}
          <div className="space-y-6">
            {/* HUD */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="neutral"><Move className="w-3 h-3 mr-1" /> Moves: {moveCount}</Badge>
              <Badge variant="neutral"><Clock className="w-3 h-3 mr-1" /> {formatTime(seconds)}</Badge>
              <Badge variant={status === "Flow verified" ? "success" : "accent"}>{status}</Badge>
            </div>

            {/* Puzzle Grid */}
            <div className="relative">
              <div className="grid grid-cols-3 gap-2">
                {puzzle.map((value, index) => {
                  const tileData = tiles.find((t) => t.id === value);
                  return (
                    <motion.div
                      key={index}
                      layout
                      className={cn(
                        "h-20 rounded-xl flex items-center justify-center text-xs font-mono cursor-pointer select-none transition-colors",
                        value === ""
                          ? "bg-bg-elevated/30 border border-dashed border-border"
                          : "bg-bg-card border border-border hover:border-accent/40 hover:bg-bg-hover"
                      )}
                      title={tileData?.tip}
                      onClick={() => value !== "" && moveTile(index)}
                      whileHover={value !== "" ? { scale: 1.02 } : {}}
                      whileTap={value !== "" ? { scale: 0.98 } : {}}
                    >
                      <span className="px-2 text-center leading-tight">
                        {tileData?.text || ""}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {showHint && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-bg/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-4 space-y-1"
                >
                  {targetOrder.map((id, idx) => {
                    const t = tiles.find((t) => t.id === id);
                    return <div key={idx} className="text-xs font-mono text-muted-light">{t ? `${idx + 1}. ${t.text}` : ""}</div>;
                  })}
                </motion.div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <Button onClick={handleShuffle}>
                <Shuffle className="w-4 h-4" />
                Shuffle
              </Button>
              <Button variant="ghost" onClick={handleHint} disabled={showHint}>
                <Eye className="w-4 h-4" />
                Show target
              </Button>
            </div>

            <p className="text-sm text-muted">{message}</p>
          </div>

          {/* Side panels */}
          <div className="space-y-6">
            <Card className="space-y-3">
              <h3 className="text-sm font-semibold">Target Program</h3>
              <pre className="text-xs font-mono text-muted-light bg-bg-elevated p-3 rounded-lg overflow-x-auto">
                {tiles.map((t) => t.text).join("\n")}
              </pre>
            </Card>

            <Card className="space-y-3">
              <h3 className="text-sm font-semibold">Concept Feed</h3>
              <ul className="space-y-2">
                {tiles.map((t) => (
                  <li key={t.id} className="text-xs space-y-0.5">
                    <span className="font-mono text-accent-light">{t.text}</span>
                    <p className="text-muted">{t.tip}</p>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
