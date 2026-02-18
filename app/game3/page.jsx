"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import styles from "@/styles/game3.module.css";

const questionBank = [
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

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const rivalConfig = { baseVelocity: 0.55, accel: 0.02, maxVelocity: 1.45, interval: 800 };

export default function Game3Page() {
  const [state, setState] = useState(() => ({
    deck: shuffle([...questionBank]),
    index: 0, distance: 0, rivalDistance: 0, streak: 0, penalties: 0,
    finished: false, readyNext: false, speed: 80, result: null,
    rivalVelocity: rivalConfig.baseVelocity,
  }));
  const [banner, setBanner] = useState("Systems nominal");
  const [hintText, setHintText] = useState("");
  const [telemetry, setTelemetry] = useState(["Diagnostics loaded. Launch when ready."]);
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const rivalRef = useRef(null);

  const pushTelemetry = useCallback((msg, type = "info") => {
    setTelemetry((prev) => [{ msg, type }, ...prev].slice(0, 5));
  }, []);

  const renderOptions = useCallback((question) => {
    const bag = question.options.map((text, idx) => ({ text, isCorrect: idx === question.answer }));
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
    return () => clearInterval(rivalRef.current);
  }, [state.finished, pushTelemetry]);

  const handleAnswer = useCallback((option) => {
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
        if (won) pushTelemetry("Finish line crossed in style.", "success");
        return {
          ...prev,
          distance: newDist,
          streak: prev.streak + 1,
          speed: Math.min(220, prev.speed + 18),
          rivalDistance: Math.max(0, prev.rivalDistance - 2),
          readyNext: true,
          finished: won,
          result: won ? "win" : prev.result,
        };
      } else {
        setBanner("Incorrect call. Grip lost.");
        pushTelemetry(`-8m drag | ${question.concept}`, "fail");
        return {
          ...prev,
          distance: Math.max(0, prev.distance - 8),
          streak: 0,
          penalties: prev.penalties + 1,
          speed: Math.max(60, prev.speed - 20),
          readyNext: true,
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
      setTelemetry(["Diagnostics loaded. Launch when ready."]);
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
    <main className={styles.arena}>
      <div className={styles.plasma} aria-hidden="true" />

      <header className={styles.hero}>
        <p className={styles.eyebrow}>Concept Racing League</p>
        <h1>Python Velocity Trials</h1>
        <p className={styles.subtitle}>Push your racer by answering Python output questions.</p>
      </header>

      <section className={styles.statusPanel}>
        <div className={styles.statCard}><span>Lap</span><strong>{String(lap).padStart(2, "0")}</strong><small>Every 25m of progress</small></div>
        <div className={styles.statCard}><span>Streak</span><strong>{state.streak}</strong><small>Chain correct answers</small></div>
        <div className={styles.statCard}><span>Penalties</span><strong>{state.penalties}</strong><small>Wrong answers slow you</small></div>
        <div className={`${styles.statCard} ${styles.statusCard}`}><span>Status</span><strong>{banner}</strong><small>Reach 100m to win</small></div>
      </section>

      <section className={styles.raceGrid}>
        <div className={styles.leftStack}>
          <section className={styles.trackWrapper}>
            <div className={styles.finishFlag}>Finish</div>
            <div className={styles.track}>
              <div className={styles.trackLines} />
              <div className={styles.progress} style={{ width: `${state.distance}%` }} />
              <div className={`${styles.car} ${styles.player}`} style={{ "--car-x": `${state.distance}%` }}>
                <div className={styles.carBody} /><div className={styles.carGlow} />
              </div>
              <div className={`${styles.car} ${styles.rival}`} style={{ "--car-x": `${state.rivalDistance}%` }}>
                <div className={styles.carBody} /><div className={styles.carGlow} />
              </div>
            </div>
          </section>

          <section className={styles.raceMeta}>
            <div className={styles.leaderboard}>
              <p className={styles.metaTitle}>Track Leaders</p>
              <div className={styles.leaderRow}><div><span className={styles.label}>Python Racer</span><p className={styles.tagSmall}>You</p></div><strong>{Math.round(state.distance)}m</strong></div>
              <div className={`${styles.leaderRow} ${styles.rivalRow}`}><div><span className={styles.label}>Autopilot Rival</span><p className={styles.tagSmall}>AI Pace Car</p></div><strong>{Math.round(state.rivalDistance)}m</strong></div>
              <div className={styles.positionCallout} style={{
                background: state.finished && state.result === "win" ? "rgba(53,255,177,0.15)" : state.finished && state.result === "loss" ? "rgba(255,77,109,0.15)" : leading ? "rgba(53,255,177,0.12)" : "rgba(255,191,63,0.15)",
                borderColor: state.finished && state.result === "win" ? "rgba(53,255,177,0.6)" : state.finished && state.result === "loss" ? "rgba(255,77,109,0.6)" : leading ? "rgba(53,255,177,0.4)" : "rgba(255,191,63,0.45)",
              }}>
                {state.finished ? (state.result === "win" ? "P1 · Lap complete" : "P2 · Rework strategy") : leading ? "Leading the pack" : "Chasing the rival"}
              </div>
            </div>
            <div className={styles.speedPanel}>
              <p className={styles.metaTitle}>Speed Gauge</p>
              <div className={styles.speedMeter}><div className={styles.speedFill} style={{ width: `${speedPct}%` }} /></div>
              <p className={styles.speedValue}>{Math.round(state.speed)} km/h</p>
            </div>
          </section>
        </div>

        <div className={styles.questionColumn}>
          <section className={styles.questionCard}>
            <div className={styles.questionHead}>
              <span className={styles.conceptPill}>{question.concept}</span>
              <p className={styles.questionCount}>Challenge {String(state.index + 1).padStart(2, "0")}</p>
            </div>
            <pre className={styles.codeDisplay}><code>{question.snippet}</code></pre>
            <p className={styles.prompt}>{question.prompt}</p>
            <div className={styles.options}>
              {shuffledOptions.map((opt, idx) => (
                <button
                  key={idx}
                  className={`${state.readyNext && opt.isCorrect ? styles.correct : ""} ${state.readyNext && !opt.isCorrect && idx === shuffledOptions.indexOf(opt) ? "" : ""}`}
                  disabled={state.readyNext}
                  onClick={() => handleAnswer(opt)}
                >
                  {opt.text}
                </button>
              ))}
            </div>
            <div className={styles.cardActions}>
              <button className={styles.ghostBtn} onClick={handleHint} disabled={state.readyNext}>Show hint</button>
              <button className={styles.primaryBtn} disabled={!state.readyNext} onClick={handleNext}>
                {state.finished ? "Restart race" : "Next challenge"}
              </button>
            </div>
            {hintText && <p className={styles.hint}>{hintText}</p>}
          </section>
        </div>
      </section>

      <section className={styles.telemetry}>
        <h3>Telemetry Feed</h3>
        <ul>
          {telemetry.map((entry, i) => (
            <li key={i} className={typeof entry === "object" ? styles[entry.type] : ""}>
              {typeof entry === "object" ? entry.msg : entry}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
