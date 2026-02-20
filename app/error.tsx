"use client";

import { Button } from "@/components/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-[#0a0a0f] text-white min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <h2 className="text-2xl font-bold">Something went wrong</h2>
          <p className="text-[#8b8ba3]">An unexpected error occurred.</p>
          {process.env.NODE_ENV === "development" && error.message && (
            <p className="text-xs text-[#8b8ba3]/60 font-mono break-all">{error.message}</p>
          )}
          <Button onClick={reset}>Try Again</Button>
        </div>
      </body>
    </html>
  );
}
