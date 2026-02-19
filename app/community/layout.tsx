import type { Metadata } from "next";

export const metadata: Metadata = { title: "Challenge Builder" };

export default function ChallengeBuilderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
