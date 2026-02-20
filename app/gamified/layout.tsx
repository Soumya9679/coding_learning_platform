import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gamified Learning | PulsePy",
  description:
    "Learn Python through 5 interactive arcade-style games: Syntax Sniper, Pipeline Puzzle, Velocity Trials, Memory Matrix, and Code Cascade.",
};

export default function GamifiedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
