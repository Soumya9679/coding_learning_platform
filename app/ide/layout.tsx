import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Python IDE",
  description: "Write, run, and debug Python in your browser with AI-powered mentoring. No setup required.",
};
export default function IdeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
