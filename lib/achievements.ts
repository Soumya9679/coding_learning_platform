/* ─── Server-Side Achievement Engine ─────────────────────────────────── *
 * Evaluates and persists achievement unlocks in Firestore.
 * Fires notifications on new unlocks.
 * ──────────────────────────────────────────────────────────────────────── */

import { db } from "./firebase";
import admin from "firebase-admin";

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: "challenge" | "xp" | "streak" | "game" | "social" | "rank" | "special";
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  check: (stats: AchievementStats) => boolean;
}

export interface AchievementStats {
  xp: number;
  challengesCompleted: number;
  gamesPlayed: number;
  streak: number;
  rank: number;
  duelsWon: number;
  duelsPlayed: number;
  commentsPosted: number;
  followersCount: number;
  daysActive: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // ─── XP ──────────────────────────────
  { id: "first_xp",      title: "First Spark",      description: "Earn your first XP",           icon: "Zap",      color: "warning",    category: "xp",        rarity: "common",    check: (s) => s.xp > 0 },
  { id: "xp_100",        title: "Getting Started",   description: "Earn 100 XP",                  icon: "Zap",      color: "success",    category: "xp",        rarity: "common",    check: (s) => s.xp >= 100 },
  { id: "xp_500",        title: "XP Hunter",         description: "Earn 500 XP",                  icon: "Star",     color: "accent",     category: "xp",        rarity: "uncommon",  check: (s) => s.xp >= 500 },
  { id: "xp_1000",       title: "XP Master",         description: "Earn 1,000 XP",                icon: "Star",     color: "accent",     category: "xp",        rarity: "rare",      check: (s) => s.xp >= 1000 },
  { id: "xp_5000",       title: "XP Legend",          description: "Earn 5,000 XP",                icon: "Crown",    color: "accent-hot", category: "xp",        rarity: "epic",      check: (s) => s.xp >= 5000 },
  { id: "xp_10000",      title: "XP Deity",           description: "Earn 10,000 XP",               icon: "Sun",      color: "warning",    category: "xp",        rarity: "legendary", check: (s) => s.xp >= 10000 },

  // ─── Challenges ──────────────────────
  { id: "first_solve",   title: "First Solve",       description: "Complete your first challenge", icon: "Code2",    color: "success",    category: "challenge", rarity: "common",    check: (s) => s.challengesCompleted >= 1 },
  { id: "coder",         title: "Coder",             description: "Complete 3 challenges",         icon: "Code2",    color: "success",    category: "challenge", rarity: "common",    check: (s) => s.challengesCompleted >= 3 },
  { id: "sharp",         title: "Sharpshooter",      description: "Complete 5 challenges",         icon: "Target",   color: "accent",     category: "challenge", rarity: "uncommon",  check: (s) => s.challengesCompleted >= 5 },
  { id: "champion",      title: "Champion",          description: "Complete 10 challenges",        icon: "Trophy",   color: "warning",    category: "challenge", rarity: "rare",      check: (s) => s.challengesCompleted >= 10 },
  { id: "elite",         title: "Elite Coder",       description: "Complete 20 challenges",        icon: "Crown",    color: "accent-hot", category: "challenge", rarity: "epic",      check: (s) => s.challengesCompleted >= 20 },
  { id: "grandmaster",   title: "Grand Master",      description: "Complete 50 challenges",        icon: "Shield",   color: "warning",    category: "challenge", rarity: "legendary", check: (s) => s.challengesCompleted >= 50 },

  // ─── Streaks ─────────────────────────
  { id: "streak_3",      title: "Warming Up",        description: "3-day streak",                  icon: "Flame",    color: "warning",    category: "streak",    rarity: "common",    check: (s) => s.streak >= 3 },
  { id: "streak_7",      title: "On Fire",           description: "7-day streak",                  icon: "Flame",    color: "accent-hot", category: "streak",    rarity: "uncommon",  check: (s) => s.streak >= 7 },
  { id: "streak_14",     title: "Blazing",           description: "14-day streak",                 icon: "Flame",    color: "accent-hot", category: "streak",    rarity: "rare",      check: (s) => s.streak >= 14 },
  { id: "streak_30",     title: "Unstoppable",       description: "30-day streak",                 icon: "Flame",    color: "danger",     category: "streak",    rarity: "epic",      check: (s) => s.streak >= 30 },
  { id: "streak_100",    title: "Eternal Flame",     description: "100-day streak",                icon: "Sun",      color: "warning",    category: "streak",    rarity: "legendary", check: (s) => s.streak >= 100 },

  // ─── Games ───────────────────────────
  { id: "first_game",    title: "Player One",        description: "Play your first game",          icon: "Gamepad2", color: "accent-light", category: "game",   rarity: "common",    check: (s) => s.gamesPlayed >= 1 },
  { id: "gamer",         title: "Gamer",             description: "Play 5 games",                  icon: "Gamepad2", color: "accent",     category: "game",      rarity: "uncommon",  check: (s) => s.gamesPlayed >= 5 },
  { id: "arcade_king",   title: "Arcade King",       description: "Play 20 games",                 icon: "Gamepad2", color: "accent-hot", category: "game",      rarity: "rare",      check: (s) => s.gamesPlayed >= 20 },

  // ─── Duels ───────────────────────────
  { id: "first_duel",    title: "Challenger",        description: "Win your first duel",           icon: "Swords",   color: "accent",     category: "social",    rarity: "common",    check: (s) => s.duelsWon >= 1 },
  { id: "duelist",       title: "Duelist",           description: "Win 5 duels",                   icon: "Swords",   color: "accent-hot", category: "social",    rarity: "uncommon",  check: (s) => s.duelsWon >= 5 },
  { id: "gladiator",     title: "Gladiator",         description: "Win 20 duels",                  icon: "Shield",   color: "warning",    category: "social",    rarity: "epic",      check: (s) => s.duelsWon >= 20 },

  // ─── Rank ────────────────────────────
  { id: "top10",         title: "Top 10",            description: "Reach top 10 on leaderboard",   icon: "TrendingUp", color: "accent",   category: "rank",      rarity: "rare",      check: (s) => s.rank > 0 && s.rank <= 10 },
  { id: "top3",          title: "Podium",            description: "Reach top 3 on leaderboard",    icon: "Medal",    color: "warning",    category: "rank",      rarity: "epic",      check: (s) => s.rank > 0 && s.rank <= 3 },
  { id: "number1",       title: "#1",                description: "Become #1 on leaderboard",      icon: "Crown",    color: "warning",    category: "rank",      rarity: "legendary", check: (s) => s.rank === 1 },

  // ─── Special ─────────────────────────
  { id: "days_30",       title: "Veteran",           description: "Active for 30+ days",           icon: "Calendar", color: "accent",     category: "special",   rarity: "rare",      check: (s) => s.daysActive >= 30 },
  { id: "days_100",      title: "Centurion",         description: "Active for 100+ days",          icon: "Calendar", color: "warning",    category: "special",   rarity: "legendary", check: (s) => s.daysActive >= 100 },
];

/**
 * Evaluate achievements for a user and persist newly unlocked ones.
 * Returns array of newly unlocked achievement IDs.
 */
export async function evaluateAchievements(
  uid: string,
  stats: AchievementStats
): Promise<AchievementDef[]> {
  // Get existing unlocks
  const userRef = db.collection("users").doc(uid);
  const userDoc = await userRef.get();
  const existingUnlocks: string[] = userDoc.data()?.unlockedAchievements || [];

  const newUnlocks: AchievementDef[] = [];

  for (const ach of ACHIEVEMENTS) {
    if (existingUnlocks.includes(ach.id)) continue; // already unlocked
    if (ach.check(stats)) {
      newUnlocks.push(ach);
    }
  }

  if (newUnlocks.length === 0) return [];

  // Persist unlocks
  const newIds = newUnlocks.map((a) => a.id);
  await userRef.update({
    unlockedAchievements: admin.firestore.FieldValue.arrayUnion(...newIds),
  });

  // Create notifications for each new unlock
  const batch = db.batch();
  for (const ach of newUnlocks) {
    const notifRef = db.collection("users").doc(uid).collection("notifications").doc();
    batch.set(notifRef, {
      type: "achievement_unlock",
      title: "Achievement Unlocked!",
      message: `${ach.title} — ${ach.description}`,
      icon: ach.icon,
      color: ach.color,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();

  return newUnlocks;
}

/**
 * Get all achievements with unlock status for a user.
 */
export function getAchievementsWithStatus(
  unlockedIds: string[]
): Array<AchievementDef & { unlocked: boolean; unlockedAt?: string }> {
  return ACHIEVEMENTS.map((ach) => ({
    ...ach,
    unlocked: unlockedIds.includes(ach.id),
    check: ach.check, // keep function for client-side re-check
  }));
}

/**
 * Count rarity distribution of unlocked achievements.
 */
export function getAchievementRarityStats(unlockedIds: string[]) {
  const total = ACHIEVEMENTS.length;
  const unlocked = unlockedIds.length;
  const byRarity = {
    common: { total: 0, unlocked: 0 },
    uncommon: { total: 0, unlocked: 0 },
    rare: { total: 0, unlocked: 0 },
    epic: { total: 0, unlocked: 0 },
    legendary: { total: 0, unlocked: 0 },
  };

  for (const ach of ACHIEVEMENTS) {
    byRarity[ach.rarity].total++;
    if (unlockedIds.includes(ach.id)) {
      byRarity[ach.rarity].unlocked++;
    }
  }

  return { total, unlocked, byRarity };
}
