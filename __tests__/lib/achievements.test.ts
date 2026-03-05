/**
 * Tests for lib/achievements.ts — ACHIEVEMENTS constant definitions
 * (The evaluateAchievements function requires Firestore, so we test the pure logic only)
 */
import { ACHIEVEMENTS, type AchievementStats } from "@/lib/achievements";

const zeroStats: AchievementStats = {
  xp: 0,
  challengesCompleted: 0,
  gamesPlayed: 0,
  streak: 0,
  rank: 0,
  duelsWon: 0,
  duelsPlayed: 0,
  commentsPosted: 0,
  followersCount: 0,
  daysActive: 0,
};

describe("ACHIEVEMENTS", () => {
  it("has at least 25 achievements", () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(25);
  });

  it("all achievements have unique IDs", () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("all achievements have required fields", () => {
    for (const a of ACHIEVEMENTS) {
      expect(a.id).toBeTruthy();
      expect(a.title).toBeTruthy();
      expect(a.description).toBeTruthy();
      expect(a.icon).toBeTruthy();
      expect(a.color).toBeTruthy();
      expect(["challenge", "xp", "streak", "game", "social", "rank", "special"]).toContain(a.category);
      expect(["common", "uncommon", "rare", "epic", "legendary"]).toContain(a.rarity);
      expect(typeof a.check).toBe("function");
    }
  });

  it("all checks return false for zero stats", () => {
    // "first_xp" needs xp > 0, so all should fail with zero stats
    const results = ACHIEVEMENTS.map((a) => ({ id: a.id, passes: a.check(zeroStats) }));
    for (const r of results) {
      expect(r.passes).toBe(false);
    }
  });
});

describe("Achievement check functions", () => {
  it("first_xp triggers at 1 XP", () => {
    const a = ACHIEVEMENTS.find((a) => a.id === "first_xp")!;
    expect(a.check({ ...zeroStats, xp: 1 })).toBe(true);
    expect(a.check({ ...zeroStats, xp: 0 })).toBe(false);
  });

  it("xp_1000 triggers at exactly 1000 XP", () => {
    const a = ACHIEVEMENTS.find((a) => a.id === "xp_1000")!;
    expect(a.check({ ...zeroStats, xp: 1000 })).toBe(true);
    expect(a.check({ ...zeroStats, xp: 999 })).toBe(false);
  });

  it("first_solve triggers at 1 challenge", () => {
    const a = ACHIEVEMENTS.find((a) => a.id === "first_solve")!;
    expect(a.check({ ...zeroStats, challengesCompleted: 1 })).toBe(true);
    expect(a.check({ ...zeroStats, challengesCompleted: 0 })).toBe(false);
  });

  it("streak_7 triggers at 7-day streak", () => {
    const a = ACHIEVEMENTS.find((a) => a.id === "streak_7")!;
    expect(a.check({ ...zeroStats, streak: 7 })).toBe(true);
    expect(a.check({ ...zeroStats, streak: 6 })).toBe(false);
  });

  it("first_game triggers at 1 game played", () => {
    const a = ACHIEVEMENTS.find((a) => a.id === "first_game")!;
    expect(a.check({ ...zeroStats, gamesPlayed: 1 })).toBe(true);
  });

  it("xp_10000 (legendary) triggers at 10000 XP", () => {
    const a = ACHIEVEMENTS.find((a) => a.id === "xp_10000")!;
    expect(a.check({ ...zeroStats, xp: 10000 })).toBe(true);
    expect(a.rarity).toBe("legendary");
  });

  it("grandmaster triggers at 50 challenges", () => {
    const a = ACHIEVEMENTS.find((a) => a.id === "grandmaster")!;
    expect(a.check({ ...zeroStats, challengesCompleted: 50 })).toBe(true);
    expect(a.check({ ...zeroStats, challengesCompleted: 49 })).toBe(false);
  });
});
