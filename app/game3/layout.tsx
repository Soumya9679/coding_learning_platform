import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Velocity Trials | PulsePy",
  description:
    "Race your car against an AI rival by answering Python output questions. Earn Turbo boosts, survive 3 laps, and cross the finish line.",
};

export default function Game3Layout({ children }: { children: React.ReactNode }) {
  return children;
}
