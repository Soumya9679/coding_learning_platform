/**
 * Tests for lib/levels.ts — computeLevel, checkLevelUp, LEVELS constants
 */
import { computeLevel, checkLevelUp, LEVELS } from "@/lib/levels";

describe("LEVELS", () => {
  it("has 15 levels", () => {
    expect(LEVELS).toHaveLength(15);
  });

  it("starts at level 1 with 0 XP required", () => {
    expect(LEVELS[0].level).toBe(1);
    expect(LEVELS[0].xpRequired).toBe(0);
  });

  it("levels are in ascending order", () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].level).toBeGreaterThan(LEVELS[i - 1].level);
      expect(LEVELS[i].xpRequired).toBeGreaterThan(LEVELS[i - 1].xpRequired);
    }
  });

  it("every level has required fields", () => {
    for (const l of LEVELS) {
      expect(l.title).toBeTruthy();
      expect(l.color).toBeTruthy();
      expect(l.icon).toBeTruthy();
    }
  });
});

describe("computeLevel", () => {
  it("returns level 1 for 0 XP", () => {
    const result = computeLevel(0);
    expect(result.level).toBe(1);
    expect(result.title).toBe("Newbie");
    expect(result.progress).toBe(0);
  });

  it("returns level 2 at 100 XP", () => {
    const result = computeLevel(100);
    expect(result.level).toBe(2);
    expect(result.title).toBe("Beginner");
  });

  it("returns level 1 at 99 XP with progress close to 100", () => {
    const result = computeLevel(99);
    expect(result.level).toBe(1);
    expect(result.progress).toBe(99); // 99/100 * 100
  });

  it("returns level 15 at 50000 XP with 100% progress", () => {
    const result = computeLevel(50000);
    expect(result.level).toBe(15);
    expect(result.title).toBe("Code God");
    expect(result.progress).toBe(100);
  });

  it("returns level 15 at very high XP", () => {
    const result = computeLevel(999999);
    expect(result.level).toBe(15);
    expect(result.progress).toBe(100);
  });

  it("returns correct intermediate level", () => {
    const result = computeLevel(1500);
    expect(result.level).toBe(6);
    expect(result.title).toBe("Engineer");
  });

  it("returns xpForNext correctly", () => {
    const result = computeLevel(0);
    expect(result.xpForNext).toBe(100); // next level requires 100
  });
});

describe("checkLevelUp", () => {
  it("returns null when no level change", () => {
    expect(checkLevelUp(50, 90)).toBeNull();
  });

  it("returns new level when XP crosses threshold", () => {
    const result = checkLevelUp(90, 110);
    expect(result).not.toBeNull();
    expect(result!.level).toBe(2);
    expect(result!.title).toBe("Beginner");
  });

  it("returns the highest new level on multi-level jump", () => {
    const result = checkLevelUp(0, 1500);
    expect(result).not.toBeNull();
    expect(result!.level).toBe(6);
  });

  it("returns null when XP goes down (edge case)", () => {
    expect(checkLevelUp(200, 50)).toBeNull();
  });

  it("returns null when same XP", () => {
    expect(checkLevelUp(100, 100)).toBeNull();
  });
});
