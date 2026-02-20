/**
 * Auth utility tests — pure function unit tests.
 */
import {
  isValidEmail,
  isStrongPassword,
  getPasswordErrors,
  sanitizeText,
  signSessionToken,
  verifySessionToken,
  buildSessionPayload,
} from "@/lib/auth";

describe("isValidEmail", () => {
  it("accepts valid emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("test.user+tag@domain.co.uk")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
    expect(isValidEmail("@domain.com")).toBe(false);
    expect(isValidEmail("user domain.com")).toBe(false);
    expect(isValidEmail("user@@domain.com")).toBe(false);
  });
});

describe("isStrongPassword", () => {
  it("accepts strong passwords", () => {
    expect(isStrongPassword("Test1234!")).toBe(true);
    expect(isStrongPassword("P@ssw0rd123")).toBe(true);
  });

  it("rejects weak passwords", () => {
    expect(isStrongPassword("short")).toBe(false);
    expect(isStrongPassword("alllowercase1!")).toBe(false);
    expect(isStrongPassword("ALLUPPERCASE1!")).toBe(false);
    expect(isStrongPassword("NoNumbers!!")).toBe(false);
    expect(isStrongPassword("NoSpecial1a")).toBe(false);
    expect(isStrongPassword("12345678")).toBe(false);
  });
});

describe("getPasswordErrors", () => {
  it("returns empty array for strong password", () => {
    expect(getPasswordErrors("Test1234!")).toEqual([]);
  });

  it("returns all errors for empty string", () => {
    const errors = getPasswordErrors("");
    expect(errors).toContain("At least 8 characters");
    expect(errors).toContain("One lowercase letter");
    expect(errors).toContain("One uppercase letter");
    expect(errors).toContain("One number");
    expect(errors).toContain("One special character");
  });

  it("returns specific missing requirements", () => {
    const errors = getPasswordErrors("abcdefgh");
    expect(errors).not.toContain("At least 8 characters");
    expect(errors).not.toContain("One lowercase letter");
    expect(errors).toContain("One uppercase letter");
    expect(errors).toContain("One number");
    expect(errors).toContain("One special character");
  });
});

describe("sanitizeText", () => {
  it("strips HTML tags", () => {
    expect(sanitizeText("<script>alert('xss')</script>Hello")).toBe("alert('xss')Hello");
    expect(sanitizeText("<b>Bold</b> text")).toBe("Bold text");
    expect(sanitizeText("No tags here")).toBe("No tags here");
  });

  it("strips control characters", () => {
    expect(sanitizeText("hello\x00world")).toBe("helloworld");
    expect(sanitizeText("test\x0Bvalue")).toBe("testvalue");
  });

  it("trims whitespace", () => {
    expect(sanitizeText("  hello  ")).toBe("hello");
  });

  it("truncates to maxLength", () => {
    expect(sanitizeText("abcdefghij", 5)).toBe("abcde");
    expect(sanitizeText("short", 100)).toBe("short");
  });

  it("handles empty strings", () => {
    expect(sanitizeText("")).toBe("");
  });
});

describe("signSessionToken / verifySessionToken", () => {
  const payload = {
    uid: "test-uid-123",
    username: "testuser",
    fullName: "Test User",
    email: "test@example.com",
  };

  it("round-trips a valid token", () => {
    const token = signSessionToken(payload);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // JWT format

    const decoded = verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded!.uid).toBe(payload.uid);
    expect(decoded!.username).toBe(payload.username);
    expect(decoded!.fullName).toBe(payload.fullName);
    expect(decoded!.email).toBe(payload.email);
  });

  it("returns null for invalid token", () => {
    expect(verifySessionToken("invalid.token.here")).toBeNull();
    expect(verifySessionToken("")).toBeNull();
  });

  it("returns null for tampered token", () => {
    const token = signSessionToken(payload);
    const tampered = token.slice(0, -5) + "XXXXX";
    expect(verifySessionToken(tampered)).toBeNull();
  });
});

describe("buildSessionPayload", () => {
  it("builds correct payload from profile", () => {
    const profile = {
      username: "alice",
      fullName: "Alice Smith",
      email: "alice@example.com",
    };

    const payload = buildSessionPayload("uid-1", profile);
    expect(payload).toEqual({
      uid: "uid-1",
      username: "alice",
      fullName: "Alice Smith",
      email: "alice@example.com",
    });
  });

  it("handles missing fields gracefully", () => {
    const payload = buildSessionPayload("uid-2", {});
    expect(payload.uid).toBe("uid-2");
    expect(payload.username).toBe("");
    expect(payload.fullName).toBe("");
    expect(payload.email).toBe("");
  });
});
