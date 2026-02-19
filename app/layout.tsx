import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PulsePy | AI-Powered Python Learning Platform",
    template: "%s | PulsePy",
  },
  description:
    "Master Python through interactive challenges, an AI-mentored IDE, and cinematic mini-games. PulsePy makes learning to code feel like play.",
  keywords: [
    "Python",
    "learning platform",
    "coding challenges",
    "AI mentor",
    "programming games",
    "IDE",
    "Pyodide",
  ],
  authors: [{ name: "PulsePy" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "PulsePy",
    title: "PulsePy | AI-Powered Python Learning Platform",
    description: "Master Python through interactive challenges, AI mentoring, and cinematic mini-games.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PulsePy | AI-Powered Python Learning Platform",
    description: "Master Python through interactive challenges, AI mentoring, and cinematic mini-games.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">
        <Navbar />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}
