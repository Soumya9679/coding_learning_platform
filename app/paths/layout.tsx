import type { Metadata } from "next";

export const metadata: Metadata = { title: "Learning Paths" };

export default function PathsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
