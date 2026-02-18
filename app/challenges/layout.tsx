import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Coding Challenges",
  description: "Test your Python skills with 10 curated coding challenges. Write functions, run tests, and get instant feedback.",
};
export default function ChallengesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
