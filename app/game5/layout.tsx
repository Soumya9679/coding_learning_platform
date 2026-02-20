import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Code Cascade | PulsePy",
  description:
    "Python expressions rain down — type the output value to blast them! 55 expressions, endless mode, combo scoring and speed progression.",
};

export default function Game5Layout({ children }: { children: React.ReactNode }) {
  return children;
}
