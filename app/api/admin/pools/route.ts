import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { authenticateAdmin } from "@/lib/admin";
import { writeAuditLog } from "@/lib/auditLog";
import admin from "firebase-admin";

/**
 * Admin CRUD for challenge pools (daily_pool, weekly_pool, duel_pool).
 * GET:  /api/admin/pools?pool=daily_pool
 * POST: /api/admin/pools { pool, challenge }
 * PATCH: /api/admin/pools { pool, id, updates }
 * DELETE: /api/admin/pools { pool, id }
 * POST action=seed: /api/admin/pools { action: "seed" } — seeds default pools
 */

const VALID_POOLS = ["daily_pool", "weekly_pool", "duel_pool"] as const;
type PoolName = (typeof VALID_POOLS)[number];

function isValidPool(pool: string): pool is PoolName {
  return VALID_POOLS.includes(pool as PoolName);
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await authenticateAdmin(request);
    if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const pool = request.nextUrl.searchParams.get("pool") || "daily_pool";
    if (!isValidPool(pool)) {
      return NextResponse.json({ error: `Invalid pool. Use: ${VALID_POOLS.join(", ")}` }, { status: 400 });
    }

    const snap = await db.collection(pool).get();
    const challenges = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ pool, challenges, count: challenges.length });
  } catch (error) {
    console.error("Admin pools GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await authenticateAdmin(request);
    if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();

    // Seed action — populates all pools with default challenges
    if (body.action === "seed") {
      const counts = await seedDefaultPools();
      await writeAuditLog("pool.seed", adminUser, {
        targetType: "pool",
        details: { counts },
      });
      return NextResponse.json({ message: "Pools seeded", counts });
    }

    const { pool, challenge } = body;
    if (!pool || !isValidPool(pool)) {
      return NextResponse.json({ error: `Invalid pool. Use: ${VALID_POOLS.join(", ")}` }, { status: 400 });
    }
    if (!challenge?.title || !challenge?.expectedOutput) {
      return NextResponse.json({ error: "Challenge must have title and expectedOutput" }, { status: 400 });
    }

    const ref = await db.collection(pool).add({
      ...challenge,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await writeAuditLog("pool.add", adminUser, {
      targetType: "pool",
      targetId: ref.id,
      details: { pool, title: challenge.title },
    });

    return NextResponse.json({ id: ref.id, message: "Challenge added to pool" });
  } catch (error) {
    console.error("Admin pools POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminUser = await authenticateAdmin(request);
    if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { pool, id, updates } = await request.json();
    if (!pool || !isValidPool(pool) || !id || !updates) {
      return NextResponse.json({ error: "pool, id, and updates required" }, { status: 400 });
    }

    await db.collection(pool).doc(id).update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await writeAuditLog("pool.update", adminUser, {
      targetType: "pool",
      targetId: id,
      details: { pool, fields: Object.keys(updates) },
    });

    return NextResponse.json({ message: "Updated" });
  } catch (error) {
    console.error("Admin pools PATCH error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminUser = await authenticateAdmin(request);
    if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { pool, id } = await request.json();
    if (!pool || !isValidPool(pool) || !id) {
      return NextResponse.json({ error: "pool and id required" }, { status: 400 });
    }

    await db.collection(pool).doc(id).delete();

    await writeAuditLog("pool.delete", adminUser, {
      targetType: "pool",
      targetId: id,
      details: { pool },
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("Admin pools DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ─── Default Pool Seeder ────────────────────────────────────────────── */

async function seedDefaultPools() {
  const counts = { daily_pool: 0, weekly_pool: 0, duel_pool: 0 };

  const DAILY_DEFAULTS = [
    { title: "Reverse a String", description: "Write a function `reverse_str(s)` that reverses a string WITHOUT using slicing or built-in reverse. Print reverse_str('hello').", difficulty: 1, starterCode: "def reverse_str(s):\n    pass\n\nprint(reverse_str('hello'))", expectedOutput: "olleh" },
    { title: "Sum of Digits", description: "Write a function `digit_sum(n)` that returns the sum of all digits. Print digit_sum(1234).", difficulty: 1, starterCode: "def digit_sum(n):\n    pass\n\nprint(digit_sum(1234))", expectedOutput: "10" },
    { title: "Count Vowels", description: "Write a function `count_vowels(s)` that counts vowels (a,e,i,o,u) case-insensitive. Print count_vowels('Hello World').", difficulty: 1, starterCode: "def count_vowels(s):\n    pass\n\nprint(count_vowels('Hello World'))", expectedOutput: "3" },
    { title: "Fibonacci Number", description: "Write a function `fib(n)` that returns the nth Fibonacci number (0-indexed). Print fib(10).", difficulty: 2, starterCode: "def fib(n):\n    pass\n\nprint(fib(10))", expectedOutput: "55" },
    { title: "Palindrome Check", description: "Write a function `is_palindrome(s)` that returns True if the string is a palindrome (ignoring spaces/case). Print is_palindrome('Race Car').", difficulty: 1, starterCode: "def is_palindrome(s):\n    pass\n\nprint(is_palindrome('Race Car'))", expectedOutput: "True" },
    { title: "Prime Checker", description: "Write a function `is_prime(n)` that returns True if n is prime. Print is_prime(17).", difficulty: 2, starterCode: "def is_prime(n):\n    pass\n\nprint(is_prime(17))", expectedOutput: "True" },
    { title: "FizzBuzz Single", description: "Write a function `fizzbuzz(n)` that returns 'Fizz' if divisible by 3, 'Buzz' by 5, 'FizzBuzz' by both, else the number as string. Print fizzbuzz(15).", difficulty: 1, starterCode: "def fizzbuzz(n):\n    pass\n\nprint(fizzbuzz(15))", expectedOutput: "FizzBuzz" },
    { title: "List Flatten", description: "Write a function `flatten(lst)` that flattens a nested list. Print flatten([1, [2, [3, 4], 5], 6]).", difficulty: 3, starterCode: "def flatten(lst):\n    pass\n\nprint(flatten([1, [2, [3, 4], 5], 6]))", expectedOutput: "[1, 2, 3, 4, 5, 6]" },
    { title: "Caesar Cipher", description: "Write `caesar(text, shift)` that shifts each letter by `shift` positions (wrap around). Print caesar('abc', 3).", difficulty: 2, starterCode: "def caesar(text, shift):\n    pass\n\nprint(caesar('abc', 3))", expectedOutput: "def" },
    { title: "Matrix Transpose", description: "Write `transpose(matrix)` that transposes a 2D list. Print transpose([[1,2,3],[4,5,6]]).", difficulty: 2, starterCode: "def transpose(matrix):\n    pass\n\nprint(transpose([[1,2,3],[4,5,6]]))", expectedOutput: "[[1, 4], [2, 5], [3, 6]]" },
    { title: "Word Frequency", description: "Write `word_freq(s)` that returns a dict of word frequencies. Print word_freq('the cat sat on the mat').", difficulty: 2, starterCode: "def word_freq(s):\n    pass\n\nprint(word_freq('the cat sat on the mat'))", expectedOutput: "{'the': 2, 'cat': 1, 'sat': 1, 'on': 1, 'mat': 1}" },
    { title: "Remove Duplicates", description: "Write `remove_dupes(lst)` that removes duplicates preserving order. Print remove_dupes([3,1,2,3,2,4]).", difficulty: 1, starterCode: "def remove_dupes(lst):\n    pass\n\nprint(remove_dupes([3,1,2,3,2,4]))", expectedOutput: "[3, 1, 2, 4]" },
    { title: "Binary to Decimal", description: "Write `bin_to_dec(b)` that converts a binary string to decimal WITHOUT int(). Print bin_to_dec('1101').", difficulty: 2, starterCode: "def bin_to_dec(b):\n    pass\n\nprint(bin_to_dec('1101'))", expectedOutput: "13" },
    { title: "Anagram Check", description: "Write `is_anagram(a, b)` that returns True if two words are anagrams (case-insensitive). Print is_anagram('Listen', 'Silent').", difficulty: 1, starterCode: "def is_anagram(a, b):\n    pass\n\nprint(is_anagram('Listen', 'Silent'))", expectedOutput: "True" },
  ];

  const WEEKLY_DEFAULTS = [
    { title: "Merge Sort", description: "Implement merge sort from scratch. Print merge_sort([38,27,43,3,9,82,10]).", difficulty: 3, starterCode: "def merge_sort(lst):\n    pass\n\nprint(merge_sort([38,27,43,3,9,82,10]))", expectedOutput: "[3, 9, 10, 27, 38, 43, 82]" },
    { title: "Binary Search Tree", description: "Implement a BST with insert and inorder traversal. Insert [5,3,7,1,4,6,8], print inorder.", difficulty: 3, starterCode: "class BST:\n    pass\n\ntree = BST()\nfor v in [5,3,7,1,4,6,8]:\n    tree.insert(v)\nprint(tree.inorder())", expectedOutput: "[1, 3, 4, 5, 6, 7, 8]" },
    { title: "LRU Cache", description: "Implement an LRU Cache with get(key) and put(key, value) with capacity 2.", difficulty: 3, starterCode: "class LRUCache:\n    def __init__(self, capacity):\n        pass\n    def get(self, key):\n        pass\n    def put(self, key, value):\n        pass\n\nc = LRUCache(2)\nc.put(1, 1)\nc.put(2, 2)\nprint(c.get(1))\nc.put(3, 3)\nprint(c.get(2))\nprint(c.get(3))", expectedOutput: "1\n-1\n3" },
    { title: "Graph BFS", description: "Implement BFS on an adjacency list graph. Print BFS starting from node 'A'.", difficulty: 3, starterCode: "def bfs(graph, start):\n    pass\n\ngraph = {'A': ['B','C'], 'B': ['D'], 'C': ['D','E'], 'D': [], 'E': []}\nprint(bfs(graph, 'A'))", expectedOutput: "['A', 'B', 'C', 'D', 'E']" },
  ];

  const DUEL_DEFAULTS = [
    { title: "Sum of Two Numbers", description: "Write a function `add(a, b)` that returns the sum. Print add(3, 5).", difficulty: 1, starterCode: "def add(a, b):\n    pass\n\nprint(add(3, 5))", expectedOutput: "8" },
    { title: "Reverse a String", description: "Write a function `reverse_str(s)` that returns the reversed string. Print reverse_str('hello').", difficulty: 1, starterCode: "def reverse_str(s):\n    pass\n\nprint(reverse_str('hello'))", expectedOutput: "olleh" },
    { title: "FizzBuzz Single", description: "Write a function `fizzbuzz(n)`. Print fizzbuzz(15).", difficulty: 2, starterCode: "def fizzbuzz(n):\n    pass\n\nprint(fizzbuzz(15))", expectedOutput: "FizzBuzz" },
    { title: "Count Vowels", description: "Write `count_vowels(s)`. Print count_vowels('Hello World').", difficulty: 2, starterCode: "def count_vowels(s):\n    pass\n\nprint(count_vowels('Hello World'))", expectedOutput: "3" },
    { title: "Fibonacci Number", description: "Write `fib(n)` returning nth Fibonacci (0-indexed). Print fib(10).", difficulty: 3, starterCode: "def fib(n):\n    pass\n\nprint(fib(10))", expectedOutput: "55" },
    { title: "Palindrome Check", description: "Write `is_palindrome(s)` (ignore case/spaces). Print is_palindrome('Race Car').", difficulty: 2, starterCode: "def is_palindrome(s):\n    pass\n\nprint(is_palindrome('Race Car'))", expectedOutput: "True" },
    { title: "Max of List", description: "Write `find_max(lst)` WITHOUT using max(). Print find_max([3,7,2,9,1]).", difficulty: 2, starterCode: "def find_max(lst):\n    pass\n\nprint(find_max([3, 7, 2, 9, 1]))", expectedOutput: "9" },
    { title: "Prime Check", description: "Write `is_prime(n)`. Print is_prime(17).", difficulty: 3, starterCode: "def is_prime(n):\n    pass\n\nprint(is_prime(17))", expectedOutput: "True" },
  ];

  // Seed each pool (skip if already has data)
  for (const [poolName, defaults] of [
    ["daily_pool", DAILY_DEFAULTS],
    ["weekly_pool", WEEKLY_DEFAULTS],
    ["duel_pool", DUEL_DEFAULTS],
  ] as const) {
    const existing = await db.collection(poolName).limit(1).get();
    if (!existing.empty) {
      counts[poolName] = -1; // already seeded
      continue;
    }
    const batch = db.batch();
    for (const c of defaults) {
      const ref = db.collection(poolName).doc();
      batch.set(ref, { ...c, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    }
    await batch.commit();
    counts[poolName] = defaults.length;
  }

  return counts;
}
