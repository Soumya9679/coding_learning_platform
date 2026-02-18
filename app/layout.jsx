import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "PulsePy | Playful Python IDE",
  description: "AI-powered Python learning platform with a browser IDE, challenge grading, and Gemini-powered mentor hints.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
