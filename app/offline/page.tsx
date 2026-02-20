import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline | PulsePy",
};

export default function OfflinePage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-8">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-6xl">📡</div>
        <h1 className="text-2xl font-bold text-primary">You&apos;re Offline</h1>
        <p className="text-secondary text-sm">
          It looks like you&apos;ve lost your internet connection. Some features
          may be unavailable until you&apos;re back online.
        </p>
        <p className="text-xs text-muted">
          Cached pages and your code drafts are still accessible.
        </p>
      </div>
    </div>
  );
}
