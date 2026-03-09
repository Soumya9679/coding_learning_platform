import "@testing-library/jest-dom";

// jsdom environment may remove native Web APIs that next/server needs.
// Re-assign from Node.js builtins if missing.
/* eslint-disable @typescript-eslint/no-require-imports */
if (typeof globalThis.Request === "undefined") {
  try {
    const undici = require("undici");
    Object.assign(globalThis, {
      Request: undici.Request,
      Response: undici.Response,
      Headers: undici.Headers,
      fetch: undici.fetch,
    });
  } catch {
    // Node 18+ has these as globals already; noop
  }
}
