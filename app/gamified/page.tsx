"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AnimatedSection, StaggerContainer, StaggerItem, Badge, Button } from "@/components/ui";
import { AuthGuard } from "@/components/AuthGuard";
import { Gamepad2, Bug, Puzzle, Gauge, Play, ArrowRight, Sparkles, Zap, Users, Star } from "lucide-react";

const games = [
  {
    id: 1,
    title: "Bug Hunter",
    desc: "Race through a 20-question bug gauntlet. Lock in answers, protect your three lives, and climb the score ladder.",
    pills: ["Quick-fire quizzes", "Score + lives HUD", "Instant bug callouts"],
    icon: Bug,
    gradient: "from-danger/20 to-danger/5",
    href: "/game1",
  },
  {
    id: 2,
    title: "Flow Slide",
    desc: "Rebuild a Python function by sliding shuffled tiles into place. Watch the move counter and timer as you work.",
    pills: ["3×3 sliding grid", "Live move & time HUD", "Concept feed hints"],
    icon: Puzzle,
    gradient: "from-accent/20 to-accent/5",
    href: "/game2",
  },
  {
    id: 3,
    title: "Velocity Trials",
    desc: "Answer output challenges to push your racer down a neon track. Build streaks for nitro and beat the AI rival.",
    pills: ["Streak-powered boosts", "AI rival pacing", "Telemetry + hints"],
    icon: Gauge,
    gradient: "from-success/20 to-success/5",
    href: "/game3",
  },
];

const whyItems = [
  { num: "01", title: "Adaptive pacing", desc: "Difficulty scales with your accuracy streak and feedback cadence." },
  { num: "02", title: "Seamless context", desc: "Hints remember past attempts so you never repeat yourself." },
  { num: "03", title: "Shareable wins", desc: "Export highlight reels or invite friends into the current mission." },
];

export default function GamifiedPage() {
  return (
    <AuthGuard>
    <div className="min-h-screen overflow-hidden">
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-accent/8 via-transparent to-transparent pointer-events-none" />

      {/* Hero */}
      <section className="relative py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <div className="space-y-6">
                <Badge variant="accent">
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Designed for hackathon-level flow
                </Badge>
                <h1 className="text-display font-bold text-balance">
                  Game Lab turns Python drills into{" "}
                  <span className="gradient-text">cinematic mini-games.</span>
                </h1>
                <p className="text-lg text-muted leading-relaxed max-w-xl">
                  Every mission blends short-form storytelling, Gemini-guided hints,
                  and XP pacing so learners stay focused. Pick a game that matches
                  your vibe today.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/game1">
                    <Button size="lg">
                      <Play className="w-4 h-4" />
                      Play all games
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button variant="secondary" size="lg">Save progress</Button>
                  </Link>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2} direction="left">
              <div className="glass-card p-8 space-y-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
                <div className="relative space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-muted flex items-center justify-center">
                      <Zap className="w-5 h-5 text-accent-light" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Live XP Orbit</p>
                      <p className="text-2xl font-bold gradient-text">+480 XP</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted">in the last 24 hours</p>
                </div>
                <div className="relative grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-2xl font-bold">96%</p>
                    <p className="text-xs text-muted">finish level 1</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">3</p>
                    <p className="text-xs text-muted">mentor tones</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">50+</p>
                    <p className="text-xs text-muted">narratives</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Games Grid */}
      <section className="relative py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StaggerContainer className="grid md:grid-cols-3 gap-6">
            {games.map((game) => {
              const Icon = game.icon;
              return (
                <StaggerItem key={game.id}>
                  <Link href={game.href}>
                    <motion.div
                      whileHover={{ y: -4, scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                      className="glass-card-hover h-full flex flex-col p-6 space-y-4 group"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.gradient} flex items-center justify-center`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <Badge variant="neutral">Game {game.id}</Badge>
                        <h2 className="text-xl font-bold">{game.title}</h2>
                      </div>
                      <p className="text-sm text-muted flex-1">{game.desc}</p>
                      <div className="flex flex-wrap gap-2">
                        {game.pills.map((p) => (
                          <span key={p} className="px-2.5 py-1 bg-bg-elevated rounded-lg text-xs text-muted-light">
                            {p}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-accent-light text-sm font-medium pt-2 group-hover:gap-3 transition-all">
                        <Play className="w-4 h-4" />
                        Play
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </motion.div>
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* Why Game Lab */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <AnimatedSection>
              <div className="space-y-4">
                <Badge variant="accent">Why Game Lab</Badge>
                <h2 className="text-heading font-bold">
                  Smooth transitions,{" "}
                  <span className="gradient-text">meaningful mentoring.</span>
                </h2>
                <p className="text-muted leading-relaxed">
                  Micro-animations guide the eye without getting in the way.
                  Responsive cards reflow on mobile. Every action plays in a single tap.
                </p>
              </div>
            </AnimatedSection>

            <StaggerContainer className="space-y-4">
              {whyItems.map((item) => (
                <StaggerItem key={item.num}>
                  <div className="glass-card p-5 flex gap-4">
                    <span className="text-3xl font-bold text-accent/30 font-mono">{item.num}</span>
                    <div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted">{item.desc}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </section>
    </div>
    </AuthGuard>
  );
}
