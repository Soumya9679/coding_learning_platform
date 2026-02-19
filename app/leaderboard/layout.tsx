import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Leaderboard",
  description: "See how you rank among PulsePy coders. Track achievements, streaks, and climb the global rankings.",
};
export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
