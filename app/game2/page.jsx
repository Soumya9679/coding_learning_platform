"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import styles from "@/styles/game2.module.css";

const tiles = [
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

function fisherYates(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function isSolvable(arr) {
  const nums = arr.map((v) => (v === "" ? 0 : tiles.findIndex((t) => t.id === v) + 1));
  let inversions = 0;
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] && nums[j] && nums[i] > nums[j]) inversions++;
    }
  }
  return inversions % 2 === 0;
}

function generateShuffle() {
  let arr;
  do { arr = fisherYates([...targetOrder]); } while (!isSolvable(arr));
  return arr;
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function formatTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function Game2Page() {
  const [puzzle, setPuzzle] = useState([...targetOrder]);
  const [moveCount, setMoveCount] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState("Shuffle to start");
  const [message, setMessage] = useState("Arrange the tiles to match a valid Python flow.");
  const [running, setRunning] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const timerRef = useRef(null);

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

  const moveTile = useCallback((index) => {
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
    <main className={styles.layout}>
      <div className={styles.plasma} aria-hidden="true" />

      <header className={styles.hero}>
        <p className={styles.eyebrow}>Python Flow Lab</p>
        <h1>Python Flow Slide</h1>
        <p className={styles.lede}>
          Reorder the code tiles to rebuild a working Python function.
        </p>
      </header>

      <section className={styles.grid}>
        <div className={styles.boardWrap}>
          <div className={styles.hud}>
            <div className={styles.hudCard}><span>Moves</span><strong>{moveCount}</strong></div>
            <div className={styles.hudCard}><span>Time</span><strong>{formatTime(seconds)}</strong></div>
            <div className={`${styles.hudCard} ${styles.status}`}>{status}</div>
          </div>

          <div className={styles.puzzle}>
            {puzzle.map((value, index) => {
              const tileData = tiles.find((t) => t.id === value);
              return (
                <div
                  key={index}
                  className={value === "" ? `${styles.tile} ${styles.empty}` : styles.tile}
                  title={tileData?.tip || ""}
                  onClick={() => value !== "" && moveTile(index)}
                >
                  {tileData?.text || ""}
                </div>
              );
            })}
            {showHint && (
              <div className={styles.hintOverlay}>
                {targetOrder.map((id, idx) => {
                  const t = tiles.find((t) => t.id === id);
                  return <div key={idx}>{t ? `${idx + 1}. ${t.text}` : ""}</div>;
                })}
              </div>
            )}
          </div>

          <div className={styles.controls}>
            <button className={styles.primary} onClick={handleShuffle}>Shuffle</button>
            <button className={styles.ghost} onClick={handleHint} disabled={showHint}>Show target</button>
          </div>
          <div className={styles.message}>{message}</div>
        </div>

        <div className={styles.info}>
          <div className={styles.panel}>
            <p className={styles.panelTitle}>Target Program</p>
            <pre className={styles.code}>{tiles.map((t) => t.text).join("\n")}</pre>
          </div>
          <div className={styles.panel}>
            <p className={styles.panelTitle}>Concept Feed</p>
            <ul className={styles.feed}>
              {tiles.map((t) => (
                <li key={t.id}><strong>{t.text}</strong>{t.tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
