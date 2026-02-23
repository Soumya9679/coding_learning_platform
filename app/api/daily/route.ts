import { NextRequest, NextResponse } from "next/server";
import { authenticateFromRequest } from "@/lib/auth";
import { db } from "@/lib/firebase";
import admin from "firebase-admin";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { evaluateAchievements } from "@/lib/achievements";
import { checkLevelUp } from "@/lib/levels";

/* ─── Daily & Weekly Challenge Pools ─────────────────────────────────── *
 * Deterministic selection based on date — same challenge for all users.
 * ──────────────────────────────────────────────────────────────────────── */

interface ChallengeTemplate {
  title: string;
  description: string;
  difficulty: number;
  starterCode: string;
  expectedOutput: string;
}

const DAILY_POOL: ChallengeTemplate[] = [
  {
    title: "Reverse a String",
    description: "Write a function `reverse_str(s)` that reverses a string WITHOUT using slicing or built-in reverse. Print reverse_str('hello').",
    difficulty: 1,
    starterCode: "def reverse_str(s):\n    # your code here\n    pass\n\nprint(reverse_str('hello'))",
    expectedOutput: "olleh",
  },
  {
    title: "Sum of Digits",
    description: "Write a function `digit_sum(n)` that returns the sum of all digits. Print digit_sum(1234).",
    difficulty: 1,
    starterCode: "def digit_sum(n):\n    # your code here\n    pass\n\nprint(digit_sum(1234))",
    expectedOutput: "10",
  },
  {
    title: "Count Vowels",
    description: "Write a function `count_vowels(s)` that counts vowels (a,e,i,o,u) case-insensitive. Print count_vowels('Hello World').",
    difficulty: 1,
    starterCode: "def count_vowels(s):\n    # your code here\n    pass\n\nprint(count_vowels('Hello World'))",
    expectedOutput: "3",
  },
  {
    title: "Fibonacci Number",
    description: "Write a function `fib(n)` that returns the nth Fibonacci number (0-indexed). Print fib(10).",
    difficulty: 2,
    starterCode: "def fib(n):\n    # your code here\n    pass\n\nprint(fib(10))",
    expectedOutput: "55",
  },
  {
    title: "Palindrome Check",
    description: "Write a function `is_palindrome(s)` that returns True if the string is a palindrome (ignoring spaces/case). Print is_palindrome('Race Car').",
    difficulty: 1,
    starterCode: "def is_palindrome(s):\n    # your code here\n    pass\n\nprint(is_palindrome('Race Car'))",
    expectedOutput: "True",
  },
  {
    title: "Prime Checker",
    description: "Write a function `is_prime(n)` that returns True if n is prime. Print is_prime(17).",
    difficulty: 2,
    starterCode: "def is_prime(n):\n    # your code here\n    pass\n\nprint(is_prime(17))",
    expectedOutput: "True",
  },
  {
    title: "FizzBuzz Single",
    description: "Write a function `fizzbuzz(n)` that returns 'Fizz' if divisible by 3, 'Buzz' by 5, 'FizzBuzz' by both, else the number as string. Print fizzbuzz(15).",
    difficulty: 1,
    starterCode: "def fizzbuzz(n):\n    # your code here\n    pass\n\nprint(fizzbuzz(15))",
    expectedOutput: "FizzBuzz",
  },
  {
    title: "List Flatten",
    description: "Write a function `flatten(lst)` that flattens a nested list. Print flatten([1, [2, [3, 4], 5], 6]).",
    difficulty: 3,
    starterCode: "def flatten(lst):\n    # your code here\n    pass\n\nprint(flatten([1, [2, [3, 4], 5], 6]))",
    expectedOutput: "[1, 2, 3, 4, 5, 6]",
  },
  {
    title: "Caesar Cipher",
    description: "Write `caesar(text, shift)` that shifts each letter by `shift` positions (wrap around). Print caesar('abc', 3).",
    difficulty: 2,
    starterCode: "def caesar(text, shift):\n    # your code here\n    pass\n\nprint(caesar('abc', 3))",
    expectedOutput: "def",
  },
  {
    title: "Matrix Transpose",
    description: "Write `transpose(matrix)` that transposes a 2D list. Print transpose([[1,2,3],[4,5,6]]).",
    difficulty: 2,
    starterCode: "def transpose(matrix):\n    # your code here\n    pass\n\nprint(transpose([[1,2,3],[4,5,6]]))",
    expectedOutput: "[[1, 4], [2, 5], [3, 6]]",
  },
  {
    title: "Word Frequency",
    description: "Write `word_freq(s)` that returns a dict of word frequencies. Print word_freq('the cat sat on the mat').",
    difficulty: 2,
    starterCode: "def word_freq(s):\n    # your code here\n    pass\n\nprint(word_freq('the cat sat on the mat'))",
    expectedOutput: "{'the': 2, 'cat': 1, 'sat': 1, 'on': 1, 'mat': 1}",
  },
  {
    title: "Remove Duplicates",
    description: "Write `remove_dupes(lst)` that removes duplicates preserving order. Print remove_dupes([3,1,2,3,2,4]).",
    difficulty: 1,
    starterCode: "def remove_dupes(lst):\n    # your code here\n    pass\n\nprint(remove_dupes([3,1,2,3,2,4]))",
    expectedOutput: "[3, 1, 2, 4]",
  },
  {
    title: "Binary to Decimal",
    description: "Write `bin_to_dec(b)` that converts a binary string to decimal WITHOUT int(). Print bin_to_dec('1101').",
    difficulty: 2,
    starterCode: "def bin_to_dec(b):\n    # your code here\n    pass\n\nprint(bin_to_dec('1101'))",
    expectedOutput: "13",
  },
  {
    title: "Anagram Check",
    description: "Write `is_anagram(a, b)` that returns True if two words are anagrams (case-insensitive). Print is_anagram('Listen', 'Silent').",
    difficulty: 1,
    starterCode: "def is_anagram(a, b):\n    # your code here\n    pass\n\nprint(is_anagram('Listen', 'Silent'))",
    expectedOutput: "True",
  },
];

const WEEKLY_POOL: ChallengeTemplate[] = [
  {
    title: "Merge Sort",
    description: "Implement merge sort from scratch. Print merge_sort([38,27,43,3,9,82,10]).",
    difficulty: 3,
    starterCode: "def merge_sort(lst):\n    # your code here\n    pass\n\nprint(merge_sort([38,27,43,3,9,82,10]))",
    expectedOutput: "[3, 9, 10, 27, 38, 43, 82]",
  },
  {
    title: "Binary Search Tree",
    description: "Implement a BST with insert and inorder traversal. Insert [5,3,7,1,4,6,8], print inorder.",
    difficulty: 3,
    starterCode: "class BST:\n    # your code here\n    pass\n\ntree = BST()\nfor v in [5,3,7,1,4,6,8]:\n    tree.insert(v)\nprint(tree.inorder())",
    expectedOutput: "[1, 3, 4, 5, 6, 7, 8]",
  },
  {
    title: "LRU Cache",
    description: "Implement an LRU Cache with get(key) and put(key, value) with capacity 2.",
    difficulty: 3,
    starterCode: "class LRUCache:\n    def __init__(self, capacity):\n        pass\n    def get(self, key):\n        pass\n    def put(self, key, value):\n        pass\n\nc = LRUCache(2)\nc.put(1, 1)\nc.put(2, 2)\nprint(c.get(1))\nc.put(3, 3)\nprint(c.get(2))\nprint(c.get(3))",
    expectedOutput: "1\n-1\n3",
  },
  {
    title: "Graph BFS",
    description: "Implement BFS on an adjacency list graph. Print BFS starting from node 'A'.",
    difficulty: 3,
    starterCode: "def bfs(graph, start):\n    # your code here\n    pass\n\ngraph = {'A': ['B','C'], 'B': ['D'], 'C': ['D','E'], 'D': [], 'E': []}\nprint(bfs(graph, 'A'))",
    expectedOutput: "['A', 'B', 'C', 'D', 'E']",
  },
];

/* ─── Helper: deterministic challenge selection from date ─────────────── */

function getDailyChallenge(dateStr: string): ChallengeTemplate & { id: string } {
  // Simple hash from date string
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % DAILY_POOL.length;
  return { ...DAILY_POOL[index], id: `daily_${dateStr}` };
}

function getWeeklyChallenge(weekStr: string): ChallengeTemplate & { id: string } {
  let hash = 0;
  for (let i = 0; i < weekStr.length; i++) {
    hash = (hash * 31 + weekStr.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % WEEKLY_POOL.length;
  return { ...WEEKLY_POOL[index], id: `weekly_${weekStr}` };
}

function getWeekString(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
  return monday.toISOString().split("T")[0];
}

/**
 * GET /api/daily — get today's daily + this week's weekly challenge.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`daily:${ip}`, { max: 30, windowSeconds: 60 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const user = authenticateFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const weekStr = getWeekString(now);

    const daily = getDailyChallenge(today);
    const weekly = getWeeklyChallenge(weekStr);

    // Tomorrow midnight for daily expiry
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // Next Monday for weekly expiry
    const nextMonday = new Date(now);
    const dayOfWeek = nextMonday.getDay();
    nextMonday.setDate(nextMonday.getDate() + ((8 - dayOfWeek) % 7 || 7));
    nextMonday.setHours(0, 0, 0, 0);

    // Check if user completed today's daily & this week's weekly
    const [dailyComp, weeklyComp, dailyCount, weeklyCount] = await Promise.all([
      db.collection("daily_completions").doc(`${user.uid}_${daily.id}`).get(),
      db.collection("daily_completions").doc(`${user.uid}_${weekly.id}`).get(),
      db.collection("daily_completions").where("challengeId", "==", daily.id).count().get(),
      db.collection("daily_completions").where("challengeId", "==", weekly.id).count().get(),
    ]);

    return NextResponse.json({
      daily: {
        id: daily.id,
        challengeId: daily.id,
        title: daily.title,
        description: daily.description,
        difficulty: daily.difficulty,
        starterCode: daily.starterCode,
        expectedOutput: daily.expectedOutput,
        type: "daily" as const,
        xpMultiplier: 2,
        activeDate: today,
        expiresAt: tomorrow.toISOString(),
        completedBy: dailyCount.data().count || 0,
        completed: dailyComp.exists,
      },
      weekly: {
        id: weekly.id,
        challengeId: weekly.id,
        title: weekly.title,
        description: weekly.description,
        difficulty: weekly.difficulty,
        starterCode: weekly.starterCode,
        expectedOutput: weekly.expectedOutput,
        type: "weekly" as const,
        xpMultiplier: 3,
        activeDate: weekStr,
        expiresAt: nextMonday.toISOString(),
        completedBy: weeklyCount.data().count || 0,
        completed: weeklyComp.exists,
      },
    });
  } catch (error) {
    console.error("Daily GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/daily — submit code for a daily/weekly challenge.
 * Body: { challengeId: string, code: string, output: string }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`daily-submit:${ip}`, { max: 20, windowSeconds: 60 });
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many submissions." }, { status: 429 });
    }

    const user = authenticateFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { challengeId, code, output } = body || {};

    if (!challengeId || !code) {
      return NextResponse.json({ error: "Missing challengeId or code" }, { status: 400 });
    }

    // Determine which challenge this is
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const weekStr = getWeekString(now);
    const daily = getDailyChallenge(today);
    const weekly = getWeeklyChallenge(weekStr);

    let challenge: (ChallengeTemplate & { id: string }) | null = null;
    let type: "daily" | "weekly" = "daily";
    let xpMultiplier = 2;

    if (challengeId === daily.id) {
      challenge = daily;
      type = "daily";
      xpMultiplier = 2;
    } else if (challengeId === weekly.id) {
      challenge = weekly;
      type = "weekly";
      xpMultiplier = 3;
    } else {
      return NextResponse.json({ error: "Invalid or expired challenge" }, { status: 400 });
    }

    // Check if already completed
    const completionId = `${user.uid}_${challengeId}`;
    const existing = await db.collection("daily_completions").doc(completionId).get();
    if (existing.exists) {
      return NextResponse.json({ error: "Already completed", passed: true, alreadyDone: true }, { status: 200 });
    }

    // Check output
    const trimmedOutput = (output || "").trim();
    const expected = challenge.expectedOutput.trim();
    const passed = trimmedOutput === expected;

    if (!passed) {
      return NextResponse.json({
        passed: false,
        expected,
        got: trimmedOutput,
        message: "Output doesn't match. Try again!",
      });
    }

    // Award XP
    const baseXp = challenge.difficulty <= 1 ? 50 : challenge.difficulty === 2 ? 75 : 100;
    const xpAwarded = baseXp * xpMultiplier;

    const userRef = db.collection("users").doc(user.uid);
    const userDoc = await userRef.get();
    const oldXp = userDoc.data()?.xp || 0;

    await userRef.update({
      xp: admin.firestore.FieldValue.increment(xpAwarded),
      [`${type}Completed`]: admin.firestore.FieldValue.increment(1),
    });

    // Record completion
    await db.collection("daily_completions").doc(completionId).set({
      uid: user.uid,
      challengeId,
      type,
      code,
      xpAwarded,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Check level up
    const newXp = oldXp + xpAwarded;
    const levelUp = checkLevelUp(oldXp, newXp);
    if (levelUp) {
      await db.collection("users").doc(user.uid).collection("notifications").add({
        type: "level_up",
        title: "Level Up!",
        message: `You reached Level ${levelUp.level} — ${levelUp.title}!`,
        icon: levelUp.icon,
        color: levelUp.color.replace("text-", ""),
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Evaluate achievements
    const userData = userDoc.data() || {};
    await evaluateAchievements(user.uid, {
      xp: newXp,
      challengesCompleted: userData.challengesCompleted || 0,
      gamesPlayed: userData.gamesPlayed || 0,
      streak: userData.streak || 0,
      rank: 0,
      duelsWon: userData.duelsWon || 0,
      duelsPlayed: userData.duelsPlayed || 0,
      commentsPosted: 0,
      followersCount: 0,
      daysActive: userData.daysActive || 0,
    });

    // Create daily challenge notification
    await db.collection("users").doc(user.uid).collection("notifications").add({
      type: "daily_challenge",
      title: type === "daily" ? "Daily Challenge Complete!" : "Weekly Challenge Complete!",
      message: `+${xpAwarded} XP (${xpMultiplier}x bonus) for "${challenge.title}"`,
      icon: type === "daily" ? "CalendarCheck" : "Trophy",
      color: "success",
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      passed: true,
      xpAwarded,
      xpMultiplier,
      levelUp: levelUp ? { level: levelUp.level, title: levelUp.title } : null,
      message: `+${xpAwarded} XP! (${xpMultiplier}x ${type} bonus)`,
    });
  } catch (error) {
    console.error("Daily POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
