import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  
  // Session replay (client-side only)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Environment
  environment: process.env.NODE_ENV || "development",
  
  // Only init if DSN is configured
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Filter out noisy errors
  ignoreErrors: [
    "ResizeObserver loop",
    "Network request failed",
    "Loading chunk",
    "ChunkLoadError",
    "Pyodide script loading timed out",
  ],
});
