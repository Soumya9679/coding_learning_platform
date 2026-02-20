import type { Metadata, Viewport } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import { ThemeHydrator } from "@/components/ThemeHydrator";
import { PWARegister } from "@/components/PWARegister";
import { ToastProvider } from "@/components/ToastProvider";
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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PulsePy",
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`} data-theme="dark">
      <body className="antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
        >
          Skip to main content
        </a>
        <ThemeHydrator />
        <PWARegister />
        <Navbar />
        <ToastProvider />
        <main id="main-content" tabIndex={-1} className="pt-16">{children}</main>
      </body>
    </html>
  );
}
