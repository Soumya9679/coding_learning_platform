"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/themeStore";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggle, hydrate } = useThemeStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg text-muted hover:text-white hover:bg-white/5 transition-all"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
}
