"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import styles from "@/styles/gamified.module.css";

export default function GamifiedPage() {
  const cardsRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );

    cardsRef.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  const handlePlayAll = () => {
    window.location.href = "/game1";
  };

  const games = [
    {
      id: 1,
      title: "Bug Hunter",
      desc: "Race through a 20-question bug gauntlet. Lock in answers, protect your three lives, and climb the score ladder as instant feedback highlights the right fix.",
      pills: ["Quick-fire quizzes", "Score + lives HUD", "Instant bug callouts"],
      href: "/game1",
    },
    {
      id: 2,
      title: "Flow Slide",
      desc: "Rebuild a Python function by sliding shuffled tiles into place. Watch the move counter and timer, study the target program, and tap hints when you need a peek.",
      pills: ["3x3 sliding grid", "Live move & time HUD", "Concept feed hints"],
      href: "/game2",
    },
    {
      id: 3,
      title: "Velocity Trials",
      desc: "Answer output challenges to push your racer down a neon track. Build streaks for nitro, watch telemetry react in real time, and beat the autopilot rival to 100 meters.",
      pills: ["Streak-powered boosts", "AI rival pacing", "Telemetry + hints"],
      href: "/game3",
    },
  ];

  return (
    <main className={styles.gameLabMain}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className="tag">Designed for hackathon-level flow</p>
          <h1>Game Lab turns Python drills into cinematic mini-games.</h1>
          <p>
            Every mission blends short-form storytelling, Gemini-guided hints, and XP pacing so
            learners stay focused. Pick a game mode that matches the vibe you want today.
          </p>
          <div className={styles.heroCta}>
            <button className={styles.playAll} onClick={handlePlayAll}>Play all games</button>
            <Link href="/signup"><button className={styles.ghost}>Save progress</button></Link>
          </div>
        </div>
        <div className={styles.heroPanel} aria-label="Score preview">
          <div className={styles.orbit}>
            <span>Live XP Orbit</span>
            <strong>+480 XP</strong>
            <small>in the last 24h</small>
          </div>
          <ul className={styles.heroStats}>
            <li><span>96%</span><small>players finish level one</small></li>
            <li><span>3</span><small>dynamic mentor tones</small></li>
            <li><span>50+</span><small>mini narratives</small></li>
          </ul>
        </div>
      </section>

      <section className={styles.gamesGrid} aria-label="Featured games">
        {games.map((game, idx) => (
          <article
            key={game.id}
            className={styles.gameCard}
            ref={(el) => { cardsRef.current[idx] = el; }}
            style={{ transitionDelay: `${idx * 60}ms` }}
          >
            <div className={styles.cardHeader}>
              <p className="tag">Game {game.id}</p>
              <h2>{game.title}</h2>
            </div>
            <p>{game.desc}</p>
            <ul className={styles.cardPillRow}>
              {game.pills.map((pill) => <li key={pill}>{pill}</li>)}
            </ul>
            <Link href={game.href} className={styles.cta}>
              <span>Play</span>
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 3l8 5-8 5z" /></svg>
            </Link>
          </article>
        ))}
      </section>

      <section className={styles.experiencePanel}>
        <div>
          <p className="tag">Why Game Lab</p>
          <h2>Smooth transitions, meaningful mentoring.</h2>
          <p>
            Micro-animations guide the eye without getting in the way. Responsive cards reflow into a
            carousel on mobile. Every action is ready to play in a single tap.
          </p>
        </div>
        <div className={styles.timeline}>
          <div>
            <span>01</span>
            <h3>Adaptive pacing</h3>
            <p>Difficulty scales with your accuracy streak and feedback cadence.</p>
          </div>
          <div>
            <span>02</span>
            <h3>Seamless context</h3>
            <p>Hints remember past attempts so you never repeat yourself.</p>
          </div>
          <div>
            <span>03</span>
            <h3>Shareable wins</h3>
            <p>Export highlight reels or invite friends directly into the current mission.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
