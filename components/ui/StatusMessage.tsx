"use client";

import { cn } from "@/lib/utils";

interface StatusMessageProps {
  message: string;
  type: "info" | "success" | "error";
  className?: string;
}

const typeStyles = {
  info: "text-muted-light",
  success: "text-success",
  error: "text-danger",
};

export function StatusMessage({ message, type, className }: StatusMessageProps) {
  return (
    <p className={cn("text-sm mt-3 transition-colors duration-200", typeStyles[type], className)}>
      {message}
    </p>
  );
}
