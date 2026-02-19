"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/themeStore";

/**
 * Hydrates the theme on mount so the data-theme attribute is set
 * before the first paint avoids a flash of wrong theme.
 */
export function ThemeHydrator() {
  const hydrate = useThemeStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return null;
}
