"use client";

import { motion } from "framer-motion";
import { Zap, Code2, Trophy, Users, Gamepad2, Brain } from "lucide-react";

const FEATURES = [
  { icon: Code2, label: "Browser-Based IDE", detail: "Code anywhere, anytime" },
  { icon: Trophy, label: "Coding Challenges", detail: "100+ skill-building problems" },
  { icon: Gamepad2, label: "Python Games", detail: "Learn by playing" },
  { icon: Brain, label: "AI-Powered Help", detail: "Smart hints & explanations" },
];

const STATS = [
  { value: "10K+", label: "Active Learners" },
  { value: "100+", label: "Challenges" },
  { value: "5", label: "Python Games" },
];

const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 1, x: 0 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
};

export default function AuthBrandingPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-10 xl:p-14">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-bg-card to-accent-hot/10" />
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-accent/15 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent-hot/10 rounded-full blur-3xl" />

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col h-full justify-between"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Top: Logo & tagline */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent to-accent-hot flex items-center justify-center shadow-glow">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">PulsePy</span>
          </div>
          <h2 className="text-3xl xl:text-4xl font-bold leading-tight mb-3">
            Master Python
            <br />
            <span className="gradient-text">the fun way.</span>
          </h2>
          <p className="text-muted text-sm leading-relaxed max-w-xs">
            Interactive challenges, browser-based coding, and AI-powered
            guidance — all in one platform.
          </p>
        </motion.div>

        {/* Middle: Feature cards */}
        <motion.div
          className="grid grid-cols-2 gap-3 my-8"
          variants={containerVariants}
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.label}
              variants={itemVariants}
              className="group flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/6 hover:border-accent/30 hover:bg-white/8 transition-all duration-300"
            >
              <div className="mt-0.5 w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center shrink-0 group-hover:bg-accent/25 transition-colors">
                <f.icon className="w-4 h-4 text-accent-light" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">{f.label}</p>
                <p className="text-xs text-muted mt-0.5">{f.detail}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom: Stats + trust */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-6 mb-4">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-xl font-bold gradient-text">{s.value}</p>
                <p className="text-xs text-muted">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-accent-light" />
              Trusted by learners worldwide
            </span>
            <span>🔒 256-bit encrypted</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
