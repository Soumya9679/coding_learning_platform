import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Progress Dashboard — PulsePy",
  description: "Track your coding journey, streaks, achievements, and XP growth.",
};

export default function ProgressLayout({ children }: { children: React.ReactNode }) {
  return children;
}
