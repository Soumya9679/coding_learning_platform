"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  email?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_MAP = {
  xs: { container: "w-6 h-6 text-[10px]", px: 24 },
  sm: { container: "w-8 h-8 text-xs", px: 32 },
  md: { container: "w-10 h-10 text-sm", px: 40 },
  lg: { container: "w-16 h-16 text-xl", px: 64 },
  xl: { container: "w-20 h-20 text-3xl", px: 80 },
};

/**
 * Compute MD5 hex digest of a string using SubtleCrypto (SHA-256).
 * Gravatar officially uses MD5, but since SubtleCrypto doesn't expose MD5,
 * we use a deterministic hash to build a Gravatar-compatible "identicon" URL.
 * Users who want their real Gravatar can link their email on gravatar.com.
 */
async function hashEmail(email: string): Promise<string> {
  const trimmed = email.trim().toLowerCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(trimmed);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Take first 16 bytes (32 hex chars) to match MD5 length
  return hashArray
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function UserAvatar({ email, name, size = "md", className }: UserAvatarProps) {
  const [gravatarUrl, setGravatarUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const sizeConfig = SIZE_MAP[size];
  const initial = (name || "U").charAt(0).toUpperCase();

  useEffect(() => {
    if (!email) return;
    let cancelled = false;
    hashEmail(email).then((hash) => {
      if (!cancelled) {
        // d=404 means return 404 if no Gravatar → triggers our fallback
        // d=identicon would show a geometric pattern
        setGravatarUrl(
          `https://www.gravatar.com/avatar/${hash}?s=${sizeConfig.px * 2}&d=identicon`
        );
      }
    });
    return () => { cancelled = true; };
  }, [email, sizeConfig.px]);

  const showImg = gravatarUrl && !imgError;

  return (
    <div
      className={cn(
        "rounded-xl bg-gradient-to-br from-accent to-accent-hot flex items-center justify-center font-bold text-white overflow-hidden flex-shrink-0",
        sizeConfig.container,
        className
      )}
    >
      {showImg ? (
        <img
          src={gravatarUrl}
          alt={name || "User avatar"}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
