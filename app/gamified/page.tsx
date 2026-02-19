"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedSection, StaggerContainer, StaggerItem, Badge, Button } from "@/components/ui";
import { AuthGuard } from "@/components/AuthGuard";
import {
  Crosshair,
  Search,
  Gauge,
  Play,
  ArrowRight,
  Sparkles,
  Zap,
  Trophy,
  Flame,
  Timer,
  Brain,
  Target,
  Keyboard,
  Eye,
  Car,
  Shield,
  Star,
  Grid3X3,
  Bug,
  Wrench,
  Heart,
  Layers,
  GripVertical,
  Code2,
} from "lucide-react";

const games = [
  {
    id: 1,
    title: "Syntax Sniper",
    tagline: "Type. Learn. Master.",
    desc: "Type Python snippets with precision under a 90-second clock. Character-by-character highlighting shows your accuracy in real-time. Build combos, climb difficulty tiers, and learn what every snippet does.",
    pills: ["30 Python Snippets", "WPM Tracking", "Accuracy Grading", "Concept Explanations"],
    features: [
      { icon: Keyboard, text: "Character-by-character feedback" },
      { icon: Timer, text: "90-second pressure rounds" },
      { icon: Target, text: "S/A/B/C/D letter grades" },
    ],
    icon: Crosshair,
    gradient: "from-red-500 to-orange-500",
    glow: "shadow-red-500/20",
    bg: "from-red-500/10 to-orange-500/5",
    accent: "text-red-400",
    borderAccent: "border-red-500/20 hover:border-red-500/40",
    href: "/game1",
  },
  {
    id: 2,
    title: "Pipeline Puzzle",
    tagline: "Arrange. Build. Execute.",
    desc: "Shuffled Python code lines — drag them into the correct order to produce the expected output. 20 puzzles across 3 difficulty tiers. Use hints, build streaks, and learn program flow.",
    pills: ["20 Puzzles", "Drag-to-Sort", "Streak Bonuses", "Hint System"],
    features: [
      { icon: Layers, text: "Drag & reorder code lines" },
      { icon: Brain, text: "8 puzzles per session" },
      { icon: Eye, text: "Output hints when stuck" },
    ],
    icon: Layers,
    gradient: "from-cyan-500 to-blue-500",
    glow: "shadow-cyan-500/20",
    bg: "from-cyan-500/10 to-blue-500/5",
    accent: "text-cyan-400",
    borderAccent: "border-cyan-500/20 hover:border-cyan-500/40",
    href: "/game2",
  },
  {
    id: 3,
    title: "Velocity Trials",
    tagline: "Race. Outrun. Dominate.",
    desc: "Race your car against an AI rival by answering Python output questions. Earn Turbo boosts and Shields through streaks. Survive 3 laps of escalating difficulty to cross the finish line.",
    pills: ["25 Questions", "Turbo & Shield Powerups", "3-Lap System", "AI Rival"],
    features: [
      { icon: Car, text: "Head-to-head AI racing" },
      { icon: Zap, text: "Streak-earned powerups" },
      { icon: Shield, text: "Shield absorbs wrong answers" },
    ],
    icon: Gauge,
    gradient: "from-emerald-500 to-teal-500",
    glow: "shadow-emerald-500/20",
    bg: "from-emerald-500/10 to-teal-500/5",
    accent: "text-emerald-400",
    borderAccent: "border-emerald-500/20 hover:border-emerald-500/40",
    href: "/game3",
  },
  {
    id: 4,
    title: "Memory Matrix",
    tagline: "Memorize. Match. Master.",
    desc: "Cards flash briefly — memorize their positions! Match Python concepts to their code counterparts. Three difficulty levels with increasing grid sizes.",
    pills: ["24 Concept Pairs", "3 Grid Sizes", "Peek System", "Efficiency Scoring"],
    features: [
      { icon: Grid3X3, text: "Concept ↔ Code card matching" },
      { icon: Eye, text: "Brief peek then memory recall" },
      { icon: Brain, text: "Efficiency-based ranking" },
    ],
    icon: Grid3X3,
    gradient: "from-pink-500 to-violet-500",
    glow: "shadow-pink-500/20",
    bg: "from-pink-500/10 to-violet-500/5",
    accent: "text-pink-400",
    borderAccent: "border-pink-500/20 hover:border-pink-500/40",
    href: "/game4",
  },
  {
    id: 5,
    title: "Code Cascade",
    tagline: "Type Fast. Think Faster.",
    desc: "Python expressions rain down — type the output value to blast them before they hit the bottom! 55 expressions, endless mode, combo scoring. Speed increases as you progress.",
    pills: ["55 Expressions", "Action Typing", "Combo System", "Endless Mode"],
    features: [
      { icon: Zap, text: "Falling expressions — type to destroy" },
      { icon: Heart, text: "5-life survival system" },
      { icon: Flame, text: "Combo & wave progression" },
    ],
    icon: Zap,
    gradient: "from-fuchsia-500 to-violet-500",
    glow: "shadow-fuchsia-500/20",
    bg: "from-fuchsia-500/10 to-violet-500/5",
    accent: "text-fuchsia-400",
    borderAccent: "border-fuchsia-500/20 hover:border-fuchsia-500/40",
    href: "/game5",
  },
];

const whyItems = [
  {
    num: "01",
    title: "Learn by doing",
    desc: "Every game reinforces Python concepts through active recall — typing, deducing, and predicting output.",
    icon: Brain,
  },
  {
    num: "02",
    title: "Adaptive difficulty",
    desc: "Games serve easy → medium → hard content. Streak bonuses and timers scale the challenge naturally.",
    icon: Target,
  },
  {
    num: "03",
    title: "XP & Leaderboard",
    desc: "Every completed game earns XP. Perfect runs earn double. Climb the leaderboard and flex your rank.",
    icon: Trophy,
  },
  {
    num: "04",
    title: "Instant explanations",
    desc: "After each round, see exactly why the answer is correct. Concepts stick because you understand them.",
    icon: Sparkles,
  },
];

export default function GamifiedPage() {
  const [hoveredGame, setHoveredGame] = useState<number | null>(null);

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
                    5 games. 130+ challenges. Endless Python mastery.
                  </Badge>
                  <h1 className="text-display font-bold text-balance">
                    Game Lab turns Python drills into{" "}
                    <span className="gradient-text">unforgettable experiences.</span>
                  </h1>
                  <p className="text-lg text-muted leading-relaxed max-w-xl">
                    Type code against the clock, arrange shuffled programs, race
                    an AI rival, match concepts from memory, and blast falling expressions — all
                    while learning Python concepts that stick. Every game awards XP.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Link href="/game1">
                      <Button size="lg">
                        <Play className="w-4 h-4" />
                        Start Playing
                      </Button>
                    </Link>
                    <Link href="/leaderboard">
                      <Button variant="secondary" size="lg">
                        <Trophy className="w-4 h-4" />
                        Leaderboard
                      </Button>
                    </Link>
                  </div>
                </div>
              </AnimatedSection>

              {/* Animated game showcase */}
              <AnimatedSection delay={0.2} direction="left">
                <div className="glass-card p-8 space-y-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
                  <div className="relative space-y-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-accent-muted flex items-center justify-center">
                        <Flame className="w-5 h-5 text-accent-light" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Game Lab Stats</p>
                        <p className="text-2xl font-bold gradient-text">5 Games</p>
                      </div>
                    </div>
                    {/* Mini game previews */}
                    {games.map((game, i) => {
                      const Icon = game.icon;
                      return (
                        <motion.div
                          key={game.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + i * 0.15 }}
                          className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${game.bg} border ${game.borderAccent} transition-all`}
                        >
                          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${game.gradient} flex items-center justify-center shrink-0`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{game.title}</p>
                            <p className="text-xs text-muted truncate">{game.tagline}</p>
                          </div>
                          <ArrowRight className={`w-4 h-4 ${game.accent} shrink-0`} />
                        </motion.div>
                      );
                    })}
                  </div>
                  <div className="relative grid grid-cols-3 gap-4 pt-4 border-t border-border">
                    <div className="text-center">
                      <p className="text-2xl font-bold">139</p>
                      <p className="text-xs text-muted">questions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">3</p>
                      <p className="text-xs text-muted">difficulty tiers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">XP</p>
                      <p className="text-xs text-muted">every game</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* Games Showcase */}
        <section className="relative py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <AnimatedSection className="text-center space-y-3">
              <h2 className="text-heading font-bold">
                Choose your <span className="gradient-text">arena</span>
              </h2>
              <p className="text-muted max-w-2xl mx-auto">
                Each game targets different Python skills. Play all five for the most complete learning experience.
              </p>
            </AnimatedSection>

            <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => {
                const Icon = game.icon;
                const isHovered = hoveredGame === game.id;

                return (
                  <StaggerItem key={game.id}>
                    <Link href={game.href}>
                      <motion.div
                        onHoverStart={() => setHoveredGame(game.id)}
                        onHoverEnd={() => setHoveredGame(null)}
                        whileHover={{ y: -8, scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className={`glass-card-hover h-full flex flex-col relative overflow-hidden group border ${game.borderAccent} transition-colors duration-300`}
                      >
                        {/* Glow effect on hover */}
                        <AnimatePresence>
                          {isHovered && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className={`absolute inset-0 bg-gradient-to-br ${game.bg} pointer-events-none`}
                            />
                          )}
                        </AnimatePresence>

                        <div className="relative p-6 space-y-5 flex-1 flex flex-col">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <motion.div
                              animate={isHovered ? { rotate: [0, -10, 10, 0], scale: 1.1 } : { rotate: 0, scale: 1 }}
                              transition={{ duration: 0.5 }}
                              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.gradient} flex items-center justify-center shadow-lg ${game.glow}`}
                            >
                              <Icon className="w-7 h-7 text-white" />
                            </motion.div>
                            <Badge variant="neutral">Game {game.id}</Badge>
                          </div>

                          {/* Title & desc */}
                          <div className="space-y-1">
                            <h2 className="text-2xl font-bold">{game.title}</h2>
                            <p className={`text-sm font-medium ${game.accent}`}>{game.tagline}</p>
                          </div>
                          <p className="text-sm text-muted flex-1 leading-relaxed">{game.desc}</p>

                          {/* Features */}
                          <div className="space-y-2">
                            {game.features.map((feat, i) => {
                              const FeatIcon = feat.icon;
                              return (
                                <div key={i} className="flex items-center gap-2 text-xs text-muted-light">
                                  <FeatIcon className={`w-3.5 h-3.5 ${game.accent} shrink-0`} />
                                  {feat.text}
                                </div>
                              );
                            })}
                          </div>

                          {/* Pills */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            {game.pills.map((p) => (
                              <span key={p} className="px-2.5 py-1 bg-bg-elevated rounded-lg text-xs text-muted-light">
                                {p}
                              </span>
                            ))}
                          </div>

                          {/* Play button */}
                          <motion.div
                            className={`flex items-center gap-2 ${game.accent} text-sm font-semibold pt-2`}
                            animate={isHovered ? { x: 4 } : { x: 0 }}
                          >
                            <Play className="w-4 h-4" />
                            Play Now
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
                          </motion.div>
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
                    Games that actually{" "}
                    <span className="gradient-text">teach Python.</span>
                  </h2>
                  <p className="text-muted leading-relaxed">
                    Every game is built around proven learning principles: active recall,
                    spaced repetition through difficulty tiers, and immediate feedback with
                    concept explanations. These aren&apos;t toy demos — they&apos;re real learning tools.
                  </p>
                </div>
              </AnimatedSection>

              <StaggerContainer className="space-y-4">
                {whyItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <StaggerItem key={item.num}>
                      <motion.div
                        whileHover={{ x: 6, scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="glass-card p-5 flex gap-4 group cursor-default"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-3xl font-bold text-accent/30 font-mono">{item.num}</span>
                          <div className="w-9 h-9 rounded-lg bg-accent-muted flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-accent-light" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1 group-hover:text-accent-light transition-colors">{item.title}</h3>
                          <p className="text-sm text-muted">{item.desc}</p>
                        </div>
                      </motion.div>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <div className="glass-card p-10 text-center space-y-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-accent-hot/5 to-accent/5 pointer-events-none" />
                <div className="relative space-y-5">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-16 h-16 rounded-2xl bg-accent-muted flex items-center justify-center mx-auto"
                  >
                    <Star className="w-8 h-8 text-accent-light" />
                  </motion.div>
                  <h2 className="text-2xl font-bold">
                    Ready to earn some <span className="gradient-text">XP</span>?
                  </h2>
                  <p className="text-muted max-w-md mx-auto">
                    Jump into any game and start learning Python through play. Your progress
                    is saved and every game earns XP toward the leaderboard.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link href="/game1">
                      <Button size="lg">
                        <Crosshair className="w-4 h-4" />
                        Syntax Sniper
                      </Button>
                    </Link>
                    <Link href="/game2">
                      <Button variant="secondary" size="lg">
                        <Search className="w-4 h-4" />
                        Code Breaker
                      </Button>
                    </Link>
                    <Link href="/game3">
                      <Button variant="secondary" size="lg">
                        <Gauge className="w-4 h-4" />
                        Velocity Trials
                      </Button>
                    </Link>
                    <Link href="/game4">
                      <Button variant="secondary" size="lg">
                        <Grid3X3 className="w-4 h-4" />
                        Memory Matrix
                      </Button>
                    </Link>
                    <Link href="/game5">
                      <Button variant="secondary" size="lg">
                        <Bug className="w-4 h-4" />
                        Debug Duel
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>
      </div>
    </AuthGuard>
  );
}
