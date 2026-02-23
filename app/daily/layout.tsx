import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Challenges – PulsePy",
  description: "Tackle daily and weekly coding challenges for bonus XP",
};

export default function DailyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
