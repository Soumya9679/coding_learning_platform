"use client";

import { useState, useCallback } from "react";
import styles from "@/styles/game1.module.css";

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
  const [selected, setSelected] = useState(null);
  const [gameOver, setGameOver] = useState(false);

  const checkAnswer = useCallback((idx) => {
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
      setFeedback(`❌ Wrong. Correct answer: ${q.options[q.answer]}`);
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
      setFeedback(`🏆 You finished all levels! Final score: ${score + (selected === questions[current].answer ? 10 : 0)}.`);
      setGameOver(true);
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
  };

  const q = questions[current];
  const pct = ((current + 1) / questions.length) * 100;

  return (
    <main className={styles.gameShell}>
      <div className={styles.bgGlow} aria-hidden="true" />
      <div className={styles.bgGrid} aria-hidden="true" />

      <header className={styles.topbar}>
        <div className={styles.title}>
          <span className={styles.emoji}>🐍</span>
          <div>
            <p className={styles.eyebrow}>Python Quest</p>
            <h1>Bug Hunter</h1>
          </div>
        </div>
        <div className={styles.metrics}>
          <div className={styles.pill}>Score <strong>{score}</strong></div>
          <div className={styles.pill}>Lives <strong>{lives}</strong></div>
          <div className={styles.pill}>Level <strong>{current + 1}</strong></div>
        </div>
      </header>

      <section className={styles.card}>
        <div className={styles.progressWrap}>
          <div className={styles.track}><span className={styles.bar} style={{ width: `${pct}%` }} /></div>
          <p className={styles.progressText}>Question {current + 1} of {questions.length}</p>
        </div>

        <div className={styles.questionBox}>
          <p className={styles.question}>{q.q}</p>
        </div>

        <div className={styles.options}>
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              className={`${answered && idx === q.answer ? styles.correct : ""} ${answered && idx === selected && idx !== q.answer ? styles.wrong : ""}`}
              disabled={answered}
              onClick={() => checkAnswer(idx)}
            >
              {opt}
            </button>
          ))}
        </div>

        <div className={styles.feedback}>{feedback}</div>

        <div className={styles.actions}>
          <button className={styles.ghost} onClick={resetGame}>Restart</button>
          <button className={styles.primary} disabled={!answered || gameOver} onClick={nextQuestion}>
            Next Level ➜
          </button>
        </div>
      </section>
    </main>
  );
}
