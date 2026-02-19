import { checkRateLimit } from "@/lib/rateLimit";

describe("checkRateLimit", () => {
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
