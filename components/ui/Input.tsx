"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-muted-light">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full px-4 py-3 bg-bg-elevated border border-border rounded-xl text-white placeholder:text-muted/60",
            "focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40",
            "transition-all duration-200 text-sm",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-danger/50 focus:ring-danger/40",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
