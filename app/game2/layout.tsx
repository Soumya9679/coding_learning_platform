import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pipeline Puzzle | PulsePy",
  description:
    "Arrange shuffled Python code lines into the correct order. 20 puzzles across 3 difficulty tiers with drag-to-sort, streaks, and hints.",
};

export default function Game2Layout({ children }: { children: React.ReactNode }) {
  return children;
}
