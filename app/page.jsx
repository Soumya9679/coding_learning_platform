import styles from "@/styles/dashboard.module.css";
import Link from "next/link";

export const metadata = {
  title: "PulsePy | Playful Python IDE",
};

export default function HomePage() {
  return (
    <>
      <div className="cosmic-gradient" aria-hidden="true" />
      <main>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className="tag">AI mentor &bull; Level-based Python quests</p>
            <h1>Write your first Python spells with a hype squad mentor.</h1>
            <p>
              Solve micro challenges, collect XP, and let Gemini-powered hints cheer you
              on when things glitch. No spoilers, just smart nudges.
            </p>
            <div className={styles.statRow}>
              <div>
                <span className={styles.stat}>14</span>
                <small>micro-concepts per world</small>
              </div>
              <div>
                <span className={styles.stat}>92%</span>
                <small>students finish their first quest</small>
              </div>
              <div>
                <span className={styles.stat}>Gemini</span>
                <small>mentor tier enabled for all</small>
              </div>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={`${styles.floatingCard} ${styles.challenge}`} aria-label="challenge preview">
              <p>Quest 03 &middot; Loops</p>
              <h3>Make the neon bot wave 5 times.</h3>
              <div className={styles.progress}>
                <div className={styles.bar}></div>
              </div>
              <span>+120 XP if you debug without hints</span>
            </div>
            <div className={`${styles.floatingCard} ${styles.mentor}`} aria-label="mentor response">
              <h4>Gemini Mentor</h4>
              <p>
                &ldquo;Your loop runs 4 times because <code>range(4)</code> stops early. Try{" "}
                <code>range(5)</code> so Byte waves with every finger.&rdquo;
              </p>
            </div>
            <div className={`${styles.floatingCard} ${styles.streak}`} aria-label="streak badge">
              <p>Streak: 7 days</p>
              <h3>Orbit status: Glowing</h3>
            </div>
          </div>
        </section>

        <section className={styles.splitPanel}>
          <div>
            <p className="tag">Challenge lane</p>
            <h2>Fast missions, single concepts.</h2>
            <p>
              Choose from curated skill tracks. Each prompt is short, playful, and built to
              test exactly one idea so wins feel instant.
            </p>
            <Link className="text-link" href="/challenges">Explore the challenge map &rarr;</Link>
          </div>
          <div className={styles.panelGrid}>
            <article>
              <h3>Snappy briefs</h3>
              <p>Readable prompts that feel like texts from a mentor friend.</p>
            </article>
            <article>
              <h3>Hint streaks</h3>
              <p>Hints level up from emoji clues to structured plans.</p>
            </article>
            <article>
              <h3>Confetti moments</h3>
              <p>Micro celebrations land every time you submit.</p>
            </article>
          </div>
        </section>

        <section className={styles.idePanel}>
          <div className={styles.idePreview}>
            <div className={styles.ideHeader}>
              <span className={`${styles.dot} ${styles.red}`}></span>
              <span className={`${styles.dot} ${styles.amber}`}></span>
              <span className={`${styles.dot} ${styles.green}`}></span>
              <p>Pulse IDE &middot; live Python</p>
            </div>
            <div className={styles.ideBody}>
              <pre>{`for vibe in range(3):\n    print("PulsePy >>>", vibe)`}</pre>
            </div>
            <div className={styles.mentorToast}>
              <p>
                Gemini: &ldquo;Looks good! Want to try <code>range(1, 4)</code> to show off offsets?&rdquo;
              </p>
            </div>
          </div>
          <div className={styles.ideCopy}>
            <p className="tag">Gemini-mentored IDE</p>
            <h2>A VS Code vibe built for first wins.</h2>
            <ul>
              <li>Monaco editor core with realtime linting.</li>
              <li>Fireside error messages instead of scary stack traces.</li>
              <li>Gemified XP rings on every successful run.</li>
            </ul>
            <Link className="text-link" href="/ide">Open the IDE-only view &rarr;</Link>
          </div>
        </section>

        <section className={styles.gamifyPanel}>
          <div className={styles.levelStack}>
            <div className={`${styles.levelCard} ${styles.active}`}>
              <p>World 01</p>
              <h3>Print Party</h3>
              <span>Unlocked &#10003;</span>
            </div>
            <div className={styles.levelCard}>
              <p>World 02</p>
              <h3>Variable Runway</h3>
              <span>Next at 600 XP</span>
            </div>
            <div className={styles.levelCard}>
              <p>World 03</p>
              <h3>Loop Galaxy</h3>
              <span>Boss quest ready</span>
            </div>
          </div>
          <div className={styles.gamifyCopy}>
            <p className="tag">Game loops</p>
            <h2>XP ladders, avatar energy, squad boards.</h2>
            <p>
              Stay motivated with collectible mentors, vibe-based leaderboards, and co-op
              modes coming soon.
            </p>
            <Link className="text-link" href="/gamified">Tour the Game Lab &rarr;</Link>
          </div>
        </section>
      </main>
    </>
  );
}
