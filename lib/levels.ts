/* ─── User Levels & Titles ──────────────────────────────────────────── *
 * Shared between server (API) and client (profile, navbar, etc.)
 * ──────────────────────────────────────────────────────────────────────── */

import type { UserLevel } from "./types";

export interface LevelDef {
  level: number;
  title: string;
  xpRequired: number;
  color: string;
  icon: string;
}

export const LEVELS: LevelDef[] = [
  { level: 1,  title: "Newbie",          xpRequired: 0,     color: "text-zinc-400",    icon: "Sprout" },
  { level: 2,  title: "Beginner",        xpRequired: 100,   color: "text-zinc-300",    icon: "Leaf" },
  { level: 3,  title: "Apprentice",      xpRequired: 300,   color: "text-green-400",   icon: "Code2" },
  { level: 4,  title: "Coder",           xpRequired: 600,   color: "text-emerald-400", icon: "Terminal" },
  { level: 5,  title: "Developer",       xpRequired: 1000,  color: "text-teal-400",    icon: "Braces" },
  { level: 6,  title: "Engineer",        xpRequired: 1500,  color: "text-cyan-400",    icon: "Cpu" },
  { level: 7,  title: "Specialist",      xpRequired: 2200,  color: "text-blue-400",    icon: "Zap" },
  { level: 8,  title: "Expert",          xpRequired: 3000,  color: "text-indigo-400",  icon: "Star" },
  { level: 9,  title: "Master",          xpRequired: 4000,  color: "text-violet-400",  icon: "Trophy" },
  { level: 10, title: "Grand Master",    xpRequired: 5500,  color: "text-purple-400",  icon: "Crown" },
  { level: 11, title: "Legend",          xpRequired: 7500,  color: "text-fuchsia-400", icon: "Flame" },
  { level: 12, title: "Mythic",         xpRequired: 10000, color: "text-pink-400",    icon: "Sparkles" },
  { level: 13, title: "Transcendent",   xpRequired: 15000, color: "text-rose-400",    icon: "Infinity" },
  { level: 14, title: "Immortal",       xpRequired: 25000, color: "text-amber-400",   icon: "Sun" },
  { level: 15, title: "Code God",       xpRequired: 50000, color: "text-yellow-300",  icon: "Shield" },
];

/**
 * Compute the user's level from their XP.
 */
export function computeLevel(xp: number): UserLevel {
  let current = LEVELS[0];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) {
      current = LEVELS[i];
      break;
    }
  }

  const nextLevel = LEVELS.find((l) => l.level === current.level + 1);
  const xpForNext = nextLevel ? nextLevel.xpRequired : current.xpRequired;
  const xpInLevel = xp - current.xpRequired;
  const xpRange = xpForNext - current.xpRequired;
  const progress = nextLevel ? Math.min(100, Math.round((xpInLevel / xpRange) * 100)) : 100;

  return {
    level: current.level,
    title: current.title,
    xpRequired: current.xpRequired,
    xpForNext,
    progress,
    color: current.color,
    icon: current.icon,
  };
}

/**
 * Check if user leveled up between old and new XP.
 */
export function checkLevelUp(oldXp: number, newXp: number): LevelDef | null {
  const oldLevel = computeLevel(oldXp);
  const newLevel = computeLevel(newXp);
  if (newLevel.level > oldLevel.level) {
    return LEVELS.find((l) => l.level === newLevel.level) || null;
  }
  return null;
}
