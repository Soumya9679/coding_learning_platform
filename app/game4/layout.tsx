import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Memory Matrix | PulsePy",
  description:
    "Match Python concepts to their code counterparts in a memory card game. Three difficulty levels with increasing grid sizes.",
};

export default function Game4Layout({ children }: { children: React.ReactNode }) {
  return children;
}
