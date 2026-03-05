/**
 * @jest-environment node
 */

// Mock Upstash modules to avoid ESM transform issues in Jest
jest.mock("@upstash/redis", () => ({ Redis: jest.fn() }));
jest.mock("@upstash/ratelimit", () => ({
  Ratelimit: Object.assign(jest.fn(), { slidingWindow: jest.fn() }),
}));

import { checkRateLimit, checkRateLimitAsync, getClientIp } from "@/lib/rateLimit";

describe("checkRateLimit (sync / in-memory)", () => {
  it("allows requests under the limit", () => {
    const key = `test-allow-${Date.now()}`;
    const result = checkRateLimit(key, { max: 5, windowSeconds: 60 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks requests over the limit", () => {
    const key = `test-block-${Date.now()}`;
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, { max: 3, windowSeconds: 60 });
    }
    const result = checkRateLimit(key, { max: 3, windowSeconds: 60 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks remaining correctly", () => {
    const key = `test-remaining-${Date.now()}`;
    const r1 = checkRateLimit(key, { max: 5, windowSeconds: 60 });
    expect(r1.remaining).toBe(4);
    const r2 = checkRateLimit(key, { max: 5, windowSeconds: 60 });
    expect(r2.remaining).toBe(3);
  });
});

describe("checkRateLimitAsync (fallback to in-memory without Redis)", () => {
  it("allows requests under the limit", async () => {
    const key = `async-allow-${Date.now()}`;
    const result = await checkRateLimitAsync(key, { max: 5, windowSeconds: 60 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks requests over the limit", async () => {
    const key = `async-block-${Date.now()}`;
    for (let i = 0; i < 3; i++) {
      await checkRateLimitAsync(key, { max: 3, windowSeconds: 60 });
    }
    const result = await checkRateLimitAsync(key, { max: 3, windowSeconds: 60 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
});

describe("getClientIp", () => {
  it("extracts from x-forwarded-for", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const req = new Request("http://localhost", {
      headers: { "x-real-ip": "10.0.0.1" },
    });
    expect(getClientIp(req)).toBe("10.0.0.1");
  });

  it('returns "unknown" when no headers', () => {
    const req = new Request("http://localhost");
    expect(getClientIp(req)).toBe("unknown");
  });
});
