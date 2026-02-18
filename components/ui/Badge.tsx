"use client";

import { cn } from "@/lib/utils";

type BadgeVariant = "accent" | "success" | "danger" | "warning" | "neutral";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  accent: "bg-accent-muted text-accent-light border-accent/20",
  success: "bg-success-muted text-success border-success/20",
  danger: "bg-danger-muted text-danger border-danger/20",
  warning: "bg-warning-muted text-warning border-warning/20",
  neutral: "bg-white/5 text-muted-light border-white/10",
};

export function Badge({ children, variant = "accent", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide border",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
