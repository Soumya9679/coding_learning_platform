import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Syntax Sniper | PulsePy",
  description:
    "Type Python snippets with precision under a 90-second clock. Character-by-character highlighting, WPM tracking, and accuracy grading.",
};

export default function Game1Layout({ children }: { children: React.ReactNode }) {
  return children;
}
