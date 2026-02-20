"use client";

import { Button } from "@/components/ui";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function CommunityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="text-center space-y-4 max-w-md">
        <AlertTriangle className="w-12 h-12 text-warning mx-auto" />
        <h2 className="text-xl font-bold text-primary">Community Error</h2>
        <p className="text-secondary text-sm">
          Failed to load community content.
        </p>
        {process.env.NODE_ENV === "development" && error.message && (
          <p className="text-xs text-muted font-mono break-all">{error.message}</p>
        )}
        <Button onClick={reset} className="gap-2">
          <RotateCcw className="w-4 h-4" /> Retry
        </Button>
      </div>
    </div>
  );
}
