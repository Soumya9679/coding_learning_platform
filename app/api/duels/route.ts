import { NextRequest, NextResponse } from "next/server";
import { db, admin } from "@/lib/firebase";
import { authenticateFromRequest } from "@/lib/auth";

const FieldValue = admin.firestore.FieldValue;

// Duel document shape (Firestore: duels collection)
// {
//   challengeTitle, challengeDescription, expectedOutput, starterCode, difficulty,
//   creatorId, creatorUsername,
//   opponentId?, opponentUsername?,
//   status: "waiting" | "active" | "finished" | "cancelled",
//   creatorCode?, opponentCode?,
//   creatorOutput?, opponentOutput?,
//   creatorPassed?: boolean, opponentPassed?: boolean,
//   creatorFinishedAt?, opponentFinishedAt?,
//   winnerId?, winnerUsername?,
//   timeLimit: number (seconds),
//   startedAt?, finishedAt?, createdAt,
// }

const DUEL_CHALLENGES = [
  {
    title: "Sum of Two Numbers",
    description: "Write a function `add(a, b)` that returns the sum of two numbers. Then print add(3, 5).",
    expectedOutput: "8",
    starterCode: "def add(a, b):\n    # your code here\n    pass\n\nprint(add(3, 5))",
    difficulty: 1,
  },
  {
    title: "Reverse a String",
    description: "Write a function `reverse_str(s)` that returns the reversed string. Print reverse_str('hello').",
    expectedOutput: "olleh",
    starterCode: "def reverse_str(s):\n    # your code here\n    pass\n\nprint(reverse_str('hello'))",
    difficulty: 1,
  },
  {
    title: "FizzBuzz Single",
    description: "Write a function `fizzbuzz(n)` that returns 'Fizz' if n is divisible by 3, 'Buzz' if divisible by 5, 'FizzBuzz' if both, else the number as string. Print fizzbuzz(15).",
    expectedOutput: "FizzBuzz",
    starterCode: "def fizzbuzz(n):\n    # your code here\n    pass\n\nprint(fizzbuzz(15))",
    difficulty: 2,
  },
  {
    title: "Count Vowels",
    description: "Write a function `count_vowels(s)` that returns the number of vowels (a,e,i,o,u case-insensitive). Print count_vowels('Hello World').",
    expectedOutput: "3",
    starterCode: "def count_vowels(s):\n    # your code here\n    pass\n\nprint(count_vowels('Hello World'))",
    difficulty: 2,
  },
  {
    title: "Fibonacci Number",
    description: "Write a function `fib(n)` returning the nth Fibonacci number (0-indexed, fib(0)=0, fib(1)=1). Print fib(10).",
    expectedOutput: "55",
    starterCode: "def fib(n):\n    # your code here\n    pass\n\nprint(fib(10))",
    difficulty: 3,
  },
  {
    title: "Palindrome Check",
    description: "Write a function `is_palindrome(s)` that returns True if the string is a palindrome (ignoring case and spaces). Print is_palindrome('Race Car').",
    expectedOutput: "True",
    starterCode: "def is_palindrome(s):\n    # your code here\n    pass\n\nprint(is_palindrome('Race Car'))",
    difficulty: 2,
  },
  {
    title: "Max of List",
    description: "Write a function `find_max(lst)` that returns the maximum element WITHOUT using the built-in max(). Print find_max([3,7,2,9,1]).",
    expectedOutput: "9",
    starterCode: "def find_max(lst):\n    # your code here\n    pass\n\nprint(find_max([3, 7, 2, 9, 1]))",
    difficulty: 2,
  },
  {
    title: "Prime Check",
    description: "Write a function `is_prime(n)` that returns True if n is prime. Print is_prime(17).",
    expectedOutput: "True",
    starterCode: "def is_prime(n):\n    # your code here\n    pass\n\nprint(is_prime(17))",
    difficulty: 3,
  },
];

// GET /api/duels — list duels (waiting or user's active/recent)
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = authenticateFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const mode = request.nextUrl.searchParams.get("mode") || "lobby"; // lobby | mine | duel
    const duelId = request.nextUrl.searchParams.get("id");

    // Fetch single duel by ID
    if (mode === "duel" && duelId) {
      const doc = await db.collection("duels").doc(duelId).get();
      if (!doc.exists) return NextResponse.json({ error: "Duel not found" }, { status: 404 });
      const d = doc.data()!;
      // Only participants can see code
      const isParticipant = d.creatorId === session.uid || d.opponentId === session.uid;
      return NextResponse.json({
        duel: {
          id: doc.id,
          challengeTitle: d.challengeTitle,
          challengeDescription: d.challengeDescription,
          expectedOutput: d.expectedOutput,
          starterCode: d.starterCode,
          difficulty: d.difficulty,
          creatorId: d.creatorId,
          creatorUsername: d.creatorUsername,
          opponentId: d.opponentId || null,
          opponentUsername: d.opponentUsername || null,
          status: d.status,
          timeLimit: d.timeLimit || 300,
          creatorPassed: d.creatorPassed || false,
          opponentPassed: d.opponentPassed || false,
          creatorFinishedAt: d.creatorFinishedAt?.toDate?.()?.toISOString() || null,
          opponentFinishedAt: d.opponentFinishedAt?.toDate?.()?.toISOString() || null,
          winnerId: d.winnerId || null,
          winnerUsername: d.winnerUsername || null,
          startedAt: d.startedAt?.toDate?.()?.toISOString() || null,
          finishedAt: d.finishedAt?.toDate?.()?.toISOString() || null,
          createdAt: d.createdAt?.toDate?.()?.toISOString() || "",
          // Only show own code or opponent code after finished
          myCode: isParticipant
            ? (d.creatorId === session.uid ? d.creatorCode : d.opponentCode) || ""
            : "",
          opponentCode: d.status === "finished" && isParticipant
            ? (d.creatorId === session.uid ? d.opponentCode : d.creatorCode) || ""
            : "",
        },
      });
    }

    // Lobby — waiting duels from other users
    if (mode === "lobby") {
      const snap = await db.collection("duels")
        .where("status", "==", "waiting")
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();
      const duels = snap.docs
        .filter((doc) => doc.data().creatorId !== session.uid) // exclude own duels
        .map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            challengeTitle: d.challengeTitle,
            difficulty: d.difficulty,
            creatorUsername: d.creatorUsername,
            timeLimit: d.timeLimit || 300,
            createdAt: d.createdAt?.toDate?.()?.toISOString() || "",
          };
        });
      return NextResponse.json({ duels });
    }

    // Mine — user's recent duels
    const creatorSnap = await db.collection("duels")
      .where("creatorId", "==", session.uid)
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();
    const opponentSnap = await db.collection("duels")
      .where("opponentId", "==", session.uid)
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    const allDocs = [...creatorSnap.docs, ...opponentSnap.docs];
    allDocs.sort((a, b) => (b.data().createdAt?.toMillis?.() || 0) - (a.data().createdAt?.toMillis?.() || 0));

    const duels = allDocs.slice(0, 15).map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        challengeTitle: d.challengeTitle,
        difficulty: d.difficulty,
        creatorUsername: d.creatorUsername,
        opponentUsername: d.opponentUsername || null,
        status: d.status,
        winnerId: d.winnerId || null,
        winnerUsername: d.winnerUsername || null,
        timeLimit: d.timeLimit || 300,
        createdAt: d.createdAt?.toDate?.()?.toISOString() || "",
      };
    });

    return NextResponse.json({ duels });
  } catch (error) {
    console.error("Duels GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/duels — create, join, submit, or cancel a duel
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = authenticateFromRequest(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { action } = body; // create | join | submit | cancel

    if (action === "create") {
      // Check user doesn't already have a waiting duel
      const existing = await db.collection("duels")
        .where("creatorId", "==", session.uid)
        .where("status", "==", "waiting")
        .limit(1)
        .get();
      if (!existing.empty) {
        return NextResponse.json({ error: "You already have a duel waiting. Cancel it first." }, { status: 409 });
      }

      // Pick a random challenge
      const challenge = DUEL_CHALLENGES[Math.floor(Math.random() * DUEL_CHALLENGES.length)];
      const timeLimit = body.timeLimit || 300; // default 5 minutes

      const ref = await db.collection("duels").add({
        ...challenge,
        challengeTitle: challenge.title,
        challengeDescription: challenge.description,
        creatorId: session.uid,
        creatorUsername: session.username,
        status: "waiting",
        timeLimit: Math.min(Math.max(timeLimit, 60), 600), // 1-10 minutes
        createdAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ duelId: ref.id, message: "Duel created! Waiting for opponent..." });
    }

    if (action === "join") {
      const { duelId } = body;
      if (!duelId) return NextResponse.json({ error: "duelId required" }, { status: 400 });

      const ref = db.collection("duels").doc(duelId);
      const doc = await ref.get();
      if (!doc.exists) return NextResponse.json({ error: "Duel not found" }, { status: 404 });

      const d = doc.data()!;
      if (d.status !== "waiting") return NextResponse.json({ error: "Duel is no longer available" }, { status: 409 });
      if (d.creatorId === session.uid) return NextResponse.json({ error: "You cannot join your own duel" }, { status: 400 });

      await ref.update({
        opponentId: session.uid,
        opponentUsername: session.username,
        status: "active",
        startedAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ message: "Joined! Duel is now active." });
    }

    if (action === "submit") {
      const { duelId, code, output, passed } = body;
      if (!duelId) return NextResponse.json({ error: "duelId required" }, { status: 400 });

      const ref = db.collection("duels").doc(duelId);
      const doc = await ref.get();
      if (!doc.exists) return NextResponse.json({ error: "Duel not found" }, { status: 404 });

      const d = doc.data()!;
      if (d.status !== "active") return NextResponse.json({ error: "Duel is not active" }, { status: 409 });

      const isCreator = d.creatorId === session.uid;
      const isOpponent = d.opponentId === session.uid;
      if (!isCreator && !isOpponent) return NextResponse.json({ error: "Not a participant" }, { status: 403 });

      const updateData: Record<string, unknown> = {};
      if (isCreator) {
        updateData.creatorCode = code || "";
        updateData.creatorOutput = output || "";
        updateData.creatorPassed = !!passed;
        updateData.creatorFinishedAt = FieldValue.serverTimestamp();
      } else {
        updateData.opponentCode = code || "";
        updateData.opponentOutput = output || "";
        updateData.opponentPassed = !!passed;
        updateData.opponentFinishedAt = FieldValue.serverTimestamp();
      }

      // Check if both have submitted
      const otherFinished = isCreator ? !!d.opponentFinishedAt : !!d.creatorFinishedAt;
      const otherPassed = isCreator ? !!d.opponentPassed : !!d.creatorPassed;
      const myPassed = !!passed;

      if (otherFinished) {
        // Both done — determine winner
        updateData.status = "finished";
        updateData.finishedAt = FieldValue.serverTimestamp();

        if (myPassed && !otherPassed) {
          updateData.winnerId = session.uid;
          updateData.winnerUsername = session.username;
        } else if (!myPassed && otherPassed) {
          updateData.winnerId = isCreator ? d.opponentId : d.creatorId;
          updateData.winnerUsername = isCreator ? d.opponentUsername : d.creatorUsername;
        } else if (myPassed && otherPassed) {
          // Both passed — first to finish wins (the other already finished, so they win on time)
          updateData.winnerId = isCreator ? d.opponentId : d.creatorId;
          updateData.winnerUsername = isCreator ? d.opponentUsername : d.creatorUsername;
        }
        // else both failed — no winner

        // Award XP to winner
        if (updateData.winnerId) {
          await db.collection("users").doc(updateData.winnerId as string).update({
            xp: admin.firestore.FieldValue.increment(50),
          });
        }
      }

      await ref.update(updateData);

      return NextResponse.json({
        message: otherFinished ? "Duel finished!" : "Submitted! Waiting for opponent...",
        finished: otherFinished,
      });
    }

    if (action === "cancel") {
      const { duelId } = body;
      if (!duelId) return NextResponse.json({ error: "duelId required" }, { status: 400 });

      const ref = db.collection("duels").doc(duelId);
      const doc = await ref.get();
      if (!doc.exists) return NextResponse.json({ error: "Duel not found" }, { status: 404 });

      const d = doc.data()!;
      if (d.creatorId !== session.uid) return NextResponse.json({ error: "Only creator can cancel" }, { status: 403 });
      if (d.status !== "waiting") return NextResponse.json({ error: "Can only cancel waiting duels" }, { status: 409 });

      await ref.update({ status: "cancelled" });
      return NextResponse.json({ message: "Duel cancelled" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Duels POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
