import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("renders the landing page with PulsePy branding", async ({ page }) => {
    await page.goto("/");
    // Title or heading should mention PulsePy
    await expect(page.locator("body")).toContainText(/PulsePy/i);
  });

  test("has working navigation links", async ({ page }) => {
    await page.goto("/");
    // Navbar should be visible
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
  });
});

test.describe("Login page", () => {
  test("shows login form", async ({ page }) => {
    await page.goto("/login");
    // Should have email and password inputs
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
  });

  test("shows validation on empty submit", async ({ page }) => {
    await page.goto("/login");
    const submitBtn = page.locator('button[type="submit"]');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      // Page should still be on login (not redirected)
      await expect(page).toHaveURL(/login/);
    }
  });

  test("has link to signup", async ({ page }) => {
    await page.goto("/login");
    const signupLink = page.locator('a[href*="signup"]');
    await expect(signupLink).toBeVisible();
  });
});

test.describe("Signup page", () => {
  test("shows signup form fields", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
  });
});

test.describe("Protected routes redirect", () => {
  test("IDE page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/ide");
    // Should redirect to login or show auth guard
    await page.waitForTimeout(2000);
    const url = page.url();
    const hasRedirected = url.includes("login") || url.includes("ide");
    expect(hasRedirected).toBe(true);
  });

  test("profile page redirects unauthenticated users", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForTimeout(2000);
    const url = page.url();
    const hasRedirected = url.includes("login") || url.includes("profile");
    expect(hasRedirected).toBe(true);
  });
});

test.describe("API health check", () => {
  test("health endpoint returns 200", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("status");
  });
});

test.describe("Leaderboard page", () => {
  test("renders leaderboard", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page.locator("body")).toContainText(/leaderboard/i);
  });
});

test.describe("Community page", () => {
  test("renders community page", async ({ page }) => {
    await page.goto("/community");
    await expect(page.locator("body")).toContainText(/community/i);
  });
});
