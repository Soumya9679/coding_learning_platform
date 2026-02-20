import { NextRequest, NextResponse } from "next/server";
import { authenticateFromRequest } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

/**
 * Learning paths — curated sequences of challenges grouped by topic.
 * Paths are derived from challenge tags stored in Firestore.
 * GET /api/paths — returns all available learning paths with user progress.
 */

interface PathChallenge {
  id: string;
  title: string;
  difficulty: number;
  order: number;
}

interface LearningPath {
  id: string;
  name: string;
  description: string;
  color: string;
  challenges: PathChallenge[];
  total: number;
  completed: number;
  progress: number;
}

// Tag-based path definitions with display info
const PATH_META: Record<string, { description: string; color: string }> = {
  Cipher: { description: "Learn encryption, encoding, and cipher algorithms", color: "from-purple-500 to-indigo-500" },
  Lists: { description: "Master Python lists, sorting, and array manipulation", color: "from-blue-500 to-cyan-500" },
  Strings: { description: "Work with text processing and string operations", color: "from-emerald-500 to-teal-500" },
  Math: { description: "Explore mathematical algorithms and number theory", color: "from-orange-500 to-yellow-500" },
  Recursion: { description: "Conquer recursive thinking and divide-and-conquer", color: "from-red-500 to-pink-500" },
  Dictionaries: { description: "Build expertise with key-value data structures", color: "from-violet-500 to-purple-500" },
  Files: { description: "Handle file I/O and data parsing tasks", color: "from-sky-500 to-blue-500" },
  OOP: { description: "Object-oriented programming with classes and methods", color: "from-rose-500 to-red-500" },
  Algorithms: { description: "Classic algorithm challenges and problem solving", color: "from-amber-500 to-orange-500" },
};

const DEFAULT_META = { description: "A collection of coding challenges", color: "from-gray-500 to-gray-600" };

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`paths:${ip}`, { max: 30, windowSeconds: 60 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
      );
    }

    const user = authenticateFromRequest(request);

    // Fetch all active challenges
    const snap = await db.collection("challenges").where("active", "==", true).get();
    const challenges = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        title: d.title || "",
        tag: d.tag || "General",
        difficulty: d.difficulty || 1,
        order: d.order || 0,
      };
    });

    // Get user progress if authenticated
    let completedSet = new Set<string>();
    if (user) {
      const userDoc = await db.collection("users").doc(user.uid).get();
      if (userDoc.exists) {
        const completed: string[] = userDoc.data()?.completedChallenges || [];
        completedSet = new Set(completed);
      }
    }

    // Group challenges by tag to form paths
    const groups: Record<string, PathChallenge[]> = {};
    for (const c of challenges) {
      if (!groups[c.tag]) groups[c.tag] = [];
      groups[c.tag].push({ id: c.id, title: c.title, difficulty: c.difficulty, order: c.order });
    }

    // Build learning paths
    const paths: LearningPath[] = Object.entries(groups)
      .filter(([, chs]) => chs.length >= 1)
      .map(([tag, chs]) => {
        const sorted = chs.sort((a, b) => a.order - b.order);
        const completed = sorted.filter((c) => completedSet.has(c.id)).length;
        const meta = PATH_META[tag] || DEFAULT_META;
        return {
          id: tag.toLowerCase().replace(/\s+/g, "-"),
          name: tag,
          description: meta.description,
          color: meta.color,
          challenges: sorted,
          total: sorted.length,
          completed,
          progress: sorted.length > 0 ? Math.round((completed / sorted.length) * 100) : 0,
        };
      })
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({ paths });
  } catch (error) {
    console.error("Paths GET error:", error);
    return NextResponse.json({ error: "Failed to load learning paths." }, { status: 500 });
  }
}
