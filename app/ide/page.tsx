"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Badge, Card } from "@/components/ui";
import { AuthGuard } from "@/components/AuthGuard";
import { applyAuthHeaders } from "@/lib/session";
import { 
  Play, 
  Lightbulb, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  ListChecks, 
  ChevronDown, 
  Clock, 
  Zap, 
  Trophy,
  Sparkles,
  Code2,
  FlaskConical,
  Keyboard,
  RotateCcw
} from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// All 10 challenges with full details
const challenges = [
  {
    id: "1",
    tag: "Beginner",
    difficulty: 1,
    title: "Even or Odd",
    description: "Write a function that determines if a number is even or odd.",
    criteria: "Return 'Even' for even numbers and 'Odd' for odd numbers.",
    mentorInstructions: "Guide them to use the modulo operator (%). Never give the full answer.",
    rubric: "Function even_or_odd(n) must return 'Even' or 'Odd' string based on input.",
    steps: [
      "Define a function called `even_or_odd` that takes one parameter",
      "Use the modulo operator `%` to check divisibility by 2",
      "Return 'Even' if divisible, 'Odd' otherwise",
    ],
    starterCode: `def even_or_odd(n):\n    # Your code here\n    pass`,
    expectedOutput: "Function returns 'Even' or 'Odd'",
    retryHelp: "Remember: n % 2 equals 0 for even numbers.",
  },
  {
    id: "2",
    tag: "Beginner",
    difficulty: 1,
    title: "Prime Number",
    description: "Check if a given number is a prime number.",
    criteria: "Return True for prime numbers, False otherwise. 1 is not prime.",
    mentorInstructions: "Explain prime numbers simply. Suggest checking divisibility up to sqrt(n).",
    rubric: "Function is_prime(n) must return boolean for primality check.",
    steps: [
      "Define `is_prime` function with one parameter",
      "Handle edge cases: numbers less than 2 are not prime",
      "Check if any number from 2 to n-1 divides n evenly",
    ],
    starterCode: `def is_prime(n):\n    # Your code here\n    pass`,
    expectedOutput: "Function returns True or False",
    retryHelp: "A prime number is only divisible by 1 and itself. Check from 2 upwards.",
  },
  {
    id: "3",
    tag: "Beginner",
    difficulty: 1,
    title: "Factorial",
    description: "Calculate the factorial of a non-negative integer.",
    criteria: "factorial(5) should return 120. factorial(0) returns 1.",
    mentorInstructions: "Explain factorial as n * (n-1) * ... * 1. Can use loop or recursion.",
    rubric: "Function factorial(n) must return correct factorial value.",
    steps: [
      "Define `factorial` function",
      "Handle base case: factorial of 0 is 1",
      "Multiply all numbers from 1 to n",
    ],
    starterCode: `def factorial(n):\n    # Your code here\n    pass`,
    expectedOutput: "Function returns factorial value",
    retryHelp: "5! = 5 × 4 × 3 × 2 × 1 = 120. Start with result = 1 and multiply.",
  },
  {
    id: "4",
    tag: "Intermediate",
    difficulty: 2,
    title: "Fibonacci Series",
    description: "Generate the first n numbers of the Fibonacci sequence.",
    criteria: "Return a list of Fibonacci numbers. fibonacci(5) returns [0, 1, 1, 2, 3].",
    mentorInstructions: "Each number is the sum of the two preceding ones. Guide through the pattern.",
    rubric: "Function fibonacci(n) must return list of first n Fibonacci numbers.",
    steps: [
      "Define `fibonacci` function that takes count n",
      "Handle edge case: empty list for n=0",
      "Build the sequence where each number is sum of previous two",
    ],
    starterCode: `def fibonacci(n):\n    # Your code here\n    pass`,
    expectedOutput: "Function returns list like [0, 1, 1, 2, 3]",
    retryHelp: "Fibonacci: 0, 1, 1, 2, 3, 5... Each is sum of previous two.",
  },
  {
    id: "5",
    tag: "Beginner",
    difficulty: 1,
    title: "Reverse a String",
    description: "Reverse the characters in a given string.",
    criteria: "reverse_string('hello') should return 'olleh'.",
    mentorInstructions: "Show slicing or loop approaches. Python has elegant solutions.",
    rubric: "Function reverse_string(s) must return the reversed string.",
    steps: [
      "Define `reverse_string` function",
      "Use Python slicing [::-1] or a loop",
      "Return the reversed result",
    ],
    starterCode: `def reverse_string(s):\n    # Your code here\n    pass`,
    expectedOutput: "Function returns reversed string",
    retryHelp: "In Python, s[::-1] reverses a string elegantly!",
  },
  {
    id: "6",
    tag: "Intermediate",
    difficulty: 2,
    title: "Palindrome Check",
    description: "Check if a string reads the same forwards and backwards (ignore case/spaces).",
    criteria: "is_palindrome('racecar') returns True. Handle mixed case and spaces.",
    mentorInstructions: "Guide them to clean the string first (lowercase, remove spaces).",
    rubric: "Function is_palindrome(s) must handle case-insensitive palindrome check.",
    steps: [
      "Define `is_palindrome` function",
      "Clean the string: lowercase and remove spaces",
      "Compare cleaned string with its reverse",
    ],
    starterCode: `def is_palindrome(s):\n    # Your code here\n    pass`,
    expectedOutput: "Function returns True or False",
    retryHelp: "First normalize: s.lower().replace(' ', ''). Then compare with reverse.",
  },
  {
    id: "7",
    tag: "Beginner",
    difficulty: 1,
    title: "Sum of Digits",
    description: "Calculate the sum of all digits in a number.",
    criteria: "sum_of_digits(123) returns 6. Handle negative numbers by using absolute value.",
    mentorInstructions: "Can convert to string and iterate, or use modulo math.",
    rubric: "Function sum_of_digits(n) must return sum of absolute value digits.",
    steps: [
      "Define `sum_of_digits` function",
      "Handle negative numbers with abs()",
      "Extract and sum each digit",
    ],
    starterCode: `def sum_of_digits(n):\n    # Your code here\n    pass`,
    expectedOutput: "Function returns digit sum",
    retryHelp: "Try: sum(int(d) for d in str(abs(n)))",
  },
  {
    id: "8",
    tag: "Beginner",
    difficulty: 1,
    title: "Largest in List",
    description: "Find the largest number in a list.",
    criteria: "largest_in_list([3, 1, 4, 1, 5]) returns 5.",
    mentorInstructions: "Can use max() or iterate manually. Both are valid learning.",
    rubric: "Function largest_in_list(lst) must return the maximum value.",
    steps: [
      "Define `largest_in_list` function",
      "Use Python's max() function or track largest manually",
      "Return the largest value",
    ],
    starterCode: `def largest_in_list(lst):\n    # Your code here\n    pass`,
    expectedOutput: "Function returns largest number",
    retryHelp: "Python has a built-in max() function, or loop and compare!",
  },
  {
    id: "9",
    tag: "Beginner",
    difficulty: 1,
    title: "Count Vowels",
    description: "Count the number of vowels (a, e, i, o, u) in a string.",
    criteria: "count_vowels('hello') returns 2. Case insensitive.",
    mentorInstructions: "Iterate through string, check membership in vowel set.",
    rubric: "Function count_vowels(s) must return vowel count (case insensitive).",
    steps: [
      "Define `count_vowels` function",
      "Create a set or string of vowels 'aeiouAEIOU'",
      "Count how many characters are vowels",
    ],
    starterCode: `def count_vowels(s):\n    # Your code here\n    pass`,
    expectedOutput: "Function returns vowel count",
    retryHelp: "vowels = 'aeiouAEIOU'. Count chars in s that are in vowels.",
  },
  {
    id: "10",
    tag: "Advanced",
    difficulty: 3,
    title: "Armstrong Number",
    description: "Check if a number is an Armstrong number (sum of digits^n = number, where n is digit count).",
    criteria: "is_armstrong(153) returns True because 1³ + 5³ + 3³ = 153.",
    mentorInstructions: "Explain Armstrong numbers. Guide through digit extraction and power calculation.",
    rubric: "Function is_armstrong(n) must correctly identify Armstrong numbers.",
    steps: [
      "Define `is_armstrong` function",
      "Count the number of digits",
      "Sum each digit raised to the power of digit count",
      "Compare sum with original number",
    ],
    starterCode: `def is_armstrong(n):\n    # Your code here\n    pass`,
    expectedOutput: "Function returns True or False",
    retryHelp: "153 is Armstrong: 1³+5³+3³=153. Get digits, count them, sum powers.",
  },
];

type OutputStatus = "idle" | "success" | "error" | "info";
type OutputTab = "output" | "tests";

interface TestResult {
  index: number;
  passed: boolean;
  value?: unknown;
  expected?: unknown;
  error?: string;
}

interface PyodideRuntime {
  pyodide: unknown;
  runner: (code: string) => { toJs: (opts: { dict_converter: typeof Object.fromEntries }) => { stdout: string; stderr: string; error: string }; destroy: () => void };
}

export default function IdePage() {
  const [selectedChallengeId, setSelectedChallengeId] = useState("1");
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set());
  
  const challenge = challenges.find(c => c.id === selectedChallengeId) || challenges[0];
  
  const [code, setCode] = useState(challenge.starterCode);
  const [output, setOutput] = useState("Run your code to see output here.");
  const [feedback, setFeedback] = useState("Feedback will appear right after each run.");
  const [outputStatus, setOutputStatus] = useState<OutputStatus>("idle");
  const [outputTab, setOutputTab] = useState<OutputTab>("output");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [mentorHint, setMentorHint] = useState("Run your code first, then request a hint if you still feel stuck.");
  const [mentorTone, setMentorTone] = useState("Status: idle");
  const [running, setRunning] = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const pyodideRef = useRef<PyodideRuntime | null>(null);
  const lastErrorRef = useRef("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setElapsedTime(t => t + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  // Reset when challenge changes
  useEffect(() => {
    setCode(challenge.starterCode);
    setOutput("Run your code to see output here.");
    setFeedback("Feedback will appear right after each run.");
    setOutputStatus("idle");
    setTestResults([]);
    setMentorHint("Run your code first, then request a hint if you still feel stuck.");
    setMentorTone("Status: idle");
    setElapsedTime(0);
    setTimerActive(false);
    lastErrorRef.current = "";
  }, [selectedChallengeId, challenge.starterCode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runCode();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "h") {
        e.preventDefault();
        requestHint();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [code, output]);

  useEffect(() => {
    let cancelled = false;
    async function loadPyodide() {
      try {
        if (!(window as unknown as Record<string, unknown>).loadPyodide) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }
        const load = (window as unknown as Record<string, unknown>).loadPyodide as (opts: { indexURL: string }) => Promise<unknown>;
        const pyodide: Record<string, unknown> = await load({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/" }) as Record<string, unknown>;
        const runPythonAsync = pyodide.runPythonAsync as (code: string) => Promise<unknown>;
        await runPythonAsync(`
from io import StringIO
import sys, traceback

def pulse_run(source: str):
    stdout = sys.stdout
    stderr = sys.stderr
    out = StringIO()
    err = StringIO()
    result = {"stdout": "", "stderr": "", "error": ""}
    sys.stdout = out
    sys.stderr = err
    try:
        exec(source, {})
    except Exception as exc:
        result["error"] = f"{exc.__class__.__name__}: {exc}"
        err.write(traceback.format_exc())
    finally:
        result["stdout"] = out.getvalue()
        result["stderr"] = err.getvalue()
        sys.stdout = stdout
        sys.stderr = stderr
    return result
`);
        if (!cancelled) {
          const globals = pyodide.globals as { get: (name: string) => unknown };
          pyodideRef.current = {
            pyodide,
            runner: globals.get("pulse_run") as PyodideRuntime["runner"],
          };
        }
      } catch (error) {
        console.error("Pyodide failed to initialize", error);
      }
    }
    loadPyodide();
    return () => { cancelled = true; };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const runCode = useCallback(async () => {
    if (!timerActive) setTimerActive(true);
    
    if (!code.trim()) {
      setOutput("");
      setFeedback("Type your solution before running.");
      setOutputStatus("error");
      return;
    }

    setRunning(true);
    setFeedback("Running code…");
    setOutputStatus("info");

    const runtime = pyodideRef.current;
    if (!runtime) {
      setFeedback("Python runtime is still loading. Please try again in a moment.");
      setOutputStatus("info");
      setRunning(false);
      return;
    }

    try {
      const proxy = runtime.runner(code);
      const result = proxy.toJs({ dict_converter: Object.fromEntries });
      proxy.destroy();

      if (result.error) {
        setOutput(result.stdout || result.stderr);
        setFeedback(`${result.error}. Check your syntax and try again.`);
        setOutputStatus("error");
        lastErrorRef.current = result.error;
        setTestResults([{ index: 1, passed: false, error: result.error }]);
      } else {
        setOutput(result.stdout || "(no output captured)");
        
        // Simulate test results for visual feedback
        const hasOutput = (result.stdout || "").trim().length > 0;
        if (hasOutput) {
          setFeedback("Code ran successfully! Submit to check against test cases.");
          setOutputStatus("success");
          // Award XP if not already completed
          if (!completedChallenges.has(challenge.id)) {
            fetch("/api/leaderboard/xp", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json", ...applyAuthHeaders() },
              body: JSON.stringify({ action: "challenge_complete", challengeId: challenge.id }),
            }).catch(() => {});
          }
          setCompletedChallenges(prev => new Set([...prev, challenge.id]));
          setTestResults([
            { index: 1, passed: true, value: "Code executed", expected: "No errors" },
          ]);
          lastErrorRef.current = "";
        } else {
          setFeedback(`Your code ran but produced no output. ${challenge.retryHelp}`);
          setOutputStatus("error");
          setTestResults([{ index: 1, passed: false, error: "No output produced" }]);
          lastErrorRef.current = "No output";
        }
      }
    } catch {
      setOutput("");
      setFeedback("Unexpected error. Refresh the page and try again.");
      setOutputStatus("error");
      lastErrorRef.current = "Runtime failure";
    } finally {
      setRunning(false);
    }
  }, [code, challenge.id, challenge.retryHelp, timerActive]);

  const requestHint = useCallback(async () => {
    setHintLoading(true);
    setMentorHint("Thinking through your code…");
    setMentorTone("Status: contacting mentor");

    try {
      const res = await fetch("/api/mentorHint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          code,
          challengeTitle: challenge.title,
          description: challenge.description,
          rubric: challenge.rubric,
          mentorInstructions: challenge.mentorInstructions,
          stdout: output,
          stderr: lastErrorRef.current,
          expectedOutput: challenge.expectedOutput,
        }),
      });

      const data = await res.json();
      setMentorHint(data?.hint || "Keep iterating—focus on the logic step by step.");
      setMentorTone(`Tone: ${data?.tone ?? "spark"}`);
    } catch {
      setMentorHint("Mentor had a hiccup. Re-run your code and try again in a bit.");
      setMentorTone("Status: retry later");
    } finally {
      setHintLoading(false);
    }
  }, [code, output, challenge]);

  const resetChallenge = () => {
    setCode(challenge.starterCode);
    setOutput("Run your code to see output here.");
    setFeedback("Feedback will appear right after each run.");
    setOutputStatus("idle");
    setTestResults([]);
    setElapsedTime(0);
    setTimerActive(false);
  };

  const statusConfig = {
    idle: { label: "Ready", color: "text-muted", icon: Terminal },
    success: { label: "Passed", color: "text-success", icon: CheckCircle2 },
    error: { label: "Failed", color: "text-danger", icon: XCircle },
    info: { label: "Running…", color: "text-warning", icon: Terminal },
  };
  const st = statusConfig[outputStatus];
  const StatusIcon = st.icon;

  const difficultyColors = {
    1: "text-success",
    2: "text-warning",
    3: "text-danger",
  };

  const difficultyLabels = {
    1: "Easy",
    2: "Medium",
    3: "Hard",
  };

  const progressPercent = (completedChallenges.size / challenges.length) * 100;

  return (
    <AuthGuard>
    <div className="h-[calc(100vh-64px)] overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-accent/5 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 relative h-full flex flex-col">
        {/* Top Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex-shrink-0"
        >
          <div className="glass-card p-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium">Progress</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-48 h-2 bg-bg-elevated rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-accent to-accent-hot"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="text-xs text-muted">{completedChallenges.size}/{challenges.length}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted" />
                <span className="font-mono text-muted">{formatTime(elapsedTime)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <Keyboard className="w-4 h-4" />
                <span>Ctrl+Enter to run</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[320px_1fr] gap-4 flex-1 min-h-0">
          {/* Left Sidebar - Challenge Panel */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-3 min-h-0"
          >
            {/* Challenge Selector */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setSelectorOpen(!selectorOpen)}
                className="w-full glass-card p-3 flex items-center justify-between hover:border-accent/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-hot flex items-center justify-center">
                    <Code2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Challenge {challenge.id}</span>
                      {completedChallenges.has(challenge.id) && (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      )}
                    </div>
                    <span className="text-xs text-muted">{challenge.title}</span>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-muted transition-transform ${selectorOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {selectorOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 glass-card p-2 z-50 max-h-80 overflow-y-auto"
                  >
                    {challenges.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedChallengeId(c.id);
                          setSelectorOpen(false);
                        }}
                        className={`w-full p-3 rounded-lg flex items-center justify-between hover:bg-bg-elevated transition-colors ${
                          c.id === selectedChallengeId ? "bg-bg-elevated border border-accent/20" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-bg-elevated flex items-center justify-center text-xs font-mono">
                            {c.id}
                          </span>
                          <div className="text-left">
                            <span className="text-sm">{c.title}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-xs ${difficultyColors[c.difficulty as keyof typeof difficultyColors]}`}>
                                {difficultyLabels[c.difficulty as keyof typeof difficultyLabels]}
                              </span>
                            </div>
                          </div>
                        </div>
                        {completedChallenges.has(c.id) && (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Challenge Details Card - Scrollable */}
            <Card className="flex-1 min-h-0 overflow-y-auto space-y-3 scrollbar-thin">
              <div className="flex items-center gap-2">
                <Badge variant="accent">{challenge.tag}</Badge>
                <Badge className={difficultyColors[challenge.difficulty as keyof typeof difficultyColors]}>
                  {difficultyLabels[challenge.difficulty as keyof typeof difficultyLabels]}
                </Badge>
              </div>
              
              <h1 className="text-lg font-bold gradient-text">{challenge.title}</h1>
              <p className="text-xs text-muted leading-relaxed">{challenge.description}</p>

              <div className="space-y-1.5 bg-bg-elevated/50 p-3 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  Success criteria
                </div>
                <p className="text-xs text-muted">{challenge.criteria}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <ListChecks className="w-3.5 h-3.5 text-accent-light" />
                  Steps to solve
                </div>
                <ol className="space-y-1.5">
                  {challenge.steps.map((step, i) => (
                    <li key={i} className="flex gap-2 text-xs text-muted p-1.5 rounded-md bg-bg-elevated/30">
                      <span className="text-accent font-mono font-bold text-[10px]">{String(i + 1).padStart(2, "0")}</span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </Card>
          </motion.aside>

          {/* Main Workspace */}
          <div className="flex flex-col gap-3 min-h-0">
            {/* Editor Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex-shrink-0"
            >
              <Card className="space-y-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/3 to-transparent pointer-events-none" />
                
                {/* Editor Header - File Tab Style */}
                <div className="flex items-center justify-between relative">
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-2 px-4 py-2 bg-bg-elevated rounded-t-lg border-b-2 border-accent">
                      <Code2 className="w-4 h-4 text-accent" />
                      <span className="text-sm font-medium">solution.py</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={resetChallenge}>
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </Button>
                    <Button onClick={runCode} loading={running} className="relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-accent to-accent-hot opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Play className="w-4 h-4 relative" />
                      <span className="relative">{running ? "Running…" : "Run Code"}</span>
                      <Zap className="w-3 h-3 ml-1 relative" />
                    </Button>
                  </div>
                </div>

                {/* Monaco Editor */}
                <div className="rounded-lg overflow-hidden border border-border shadow-inner">
                  <MonacoEditor
                    height="180px"
                    language="python"
                    theme="vs-dark"
                    value={code}
                    onChange={(v) => setCode(v || "")}
                    options={{
                      minimap: { enabled: false },
                      automaticLayout: true,
                      fontSize: 13,
                      fontFamily: "var(--font-mono), JetBrains Mono, monospace",
                      padding: { top: 8, bottom: 8 },
                      lineNumbers: "on",
                      renderLineHighlight: "all",
                      scrollBeyondLastLine: false,
                      smoothScrolling: true,
                      cursorBlinking: "smooth",
                      cursorSmoothCaretAnimation: "on",
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted">
                  <span>Python 3.11 via Pyodide</span>
                  <span>Press Ctrl+H for AI hint</span>
                </div>
              </Card>
            </motion.div>

            {/* Output and Mentor Panels */}
            <div className="grid md:grid-cols-2 gap-3 flex-1 min-h-0">
              {/* Output Panel with Tabs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="min-h-0"
              >
                <Card className="h-full flex flex-col space-y-2 overflow-hidden">
                  {/* Tabs */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 p-1 bg-bg-elevated rounded-lg">
                      <button
                        onClick={() => setOutputTab("output")}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          outputTab === "output" 
                            ? "bg-accent text-white" 
                            : "text-muted hover:text-white"
                        }`}
                      >
                        <Terminal className="w-3 h-3 inline mr-1.5" />
                        Output
                      </button>
                      <button
                        onClick={() => setOutputTab("tests")}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          outputTab === "tests" 
                            ? "bg-accent text-white" 
                            : "text-muted hover:text-white"
                        }`}
                      >
                        <FlaskConical className="w-3 h-3 inline mr-1.5" />
                        Tests
                      </button>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${st.color}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {st.label}
                    </div>
                  </div>

                  {/* Tab Content */}
                  <AnimatePresence mode="wait">
                    {outputTab === "output" ? (
                      <motion.div
                        key="output"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <pre className="p-3 bg-bg-elevated rounded-lg text-xs font-mono h-[80px] overflow-auto text-muted-light border border-border/50">
                          {output}
                        </pre>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="tests"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {testResults.length === 0 ? (
                          <div className="p-3 bg-bg-elevated rounded-lg text-xs text-muted text-center h-[80px] flex items-center justify-center">
                            Run your code to see test results
                          </div>
                        ) : (
                          <div className="space-y-1.5 p-2 bg-bg-elevated rounded-lg h-[80px] overflow-auto">
                            {testResults.map((test) => (
                              <div
                                key={test.index}
                                className={`flex items-center gap-2 p-2 rounded-md border ${
                                  test.passed 
                                    ? "bg-success-muted border-success/20" 
                                    : "bg-danger-muted border-danger/20"
                                }`}
                              >
                                {test.passed ? (
                                  <CheckCircle2 className="w-3 h-3 text-success" />
                                ) : (
                                  <XCircle className="w-3 h-3 text-danger" />
                                )}
                                <div className="flex-1 text-[10px]">
                                  <span className="font-medium">Test {test.index}</span>
                                  {test.error && <span className="text-muted ml-1">{test.error}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <p className="text-xs text-muted flex-shrink-0">{feedback}</p>
                </Card>
              </motion.div>

              {/* AI Mentor Panel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="min-h-0"
              >
                <Card className="h-full flex flex-col space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-radial from-accent/10 to-transparent pointer-events-none" />
                  
                  <div className="flex items-center justify-between relative flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-accent to-accent-hot flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-xs">AI Mentor</h2>
                        <span className="text-[10px] text-muted">Gemini</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={requestHint} loading={hintLoading}>
                      <Lightbulb className="w-3 h-3" />
                      {hintLoading ? "..." : "Hint"}
                    </Button>
                  </div>

                  <div className="p-3 bg-gradient-to-br from-accent-muted/40 to-accent-muted/20 rounded-lg border border-accent/10 relative flex-1 overflow-auto">
                    <div className="absolute top-2 right-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    </div>
                    <p className="text-xs leading-relaxed pr-3">{mentorHint}</p>
                    <div className="flex items-center gap-2 pt-2 mt-2 border-t border-accent/10">
                      <span className="text-[10px] text-muted font-mono">{mentorTone}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
