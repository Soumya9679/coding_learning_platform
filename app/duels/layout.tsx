import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coding Duels — PulsePy",
  description: "Challenge other coders to real-time Python coding duels",
};

export default function DuelsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
