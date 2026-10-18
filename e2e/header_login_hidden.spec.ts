import { expect, test } from "./fixtures";

// The header carries no Login or Logout control here. The button is gated by
// the PostHog flag `login`; PostHog never initialises under
// navigator.webdriver, so the flag reads undefined in this suite.

const LOGIN = /^(Login|Logout)$/;

test.describe("header login hidden", () => {
  for (const path of ["/", "/projects", "/writing", "/hire"]) {
    test(`${path} has no Login or Logout in the header`, async ({ page }) => {
      await page.goto(path);
      const banner = page.getByRole("banner");
      const hire = banner.getByRole("link", { name: "Work with me" });
      await expect(hire).toHaveAttribute("href", "/hire");
      await expect(banner.getByRole("button", { name: LOGIN })).toHaveCount(0);
      await expect(banner.getByRole("link", { name: LOGIN })).toHaveCount(0);

      if (path === "/") {
        const headerBox = await page.locator("body > header").boundingBox();
        const hireBox = await hire.boundingBox();
        if (!headerBox || !hireBox) throw new Error("header or link has no box");
        expect(hireBox.x).toBeGreaterThanOrEqual(headerBox.x);
        expect(hireBox.y).toBeGreaterThanOrEqual(headerBox.y);
        expect(hireBox.x + hireBox.width).toBeLessThanOrEqual(headerBox.x + headerBox.width);
        expect(hireBox.y + hireBox.height).toBeLessThanOrEqual(headerBox.y + headerBox.height);
      }
    });
  }

  test("at 375px / has no Login or Logout anywhere", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Work with me" })).toHaveAttribute("href", "/hire");
    await expect(page.getByRole("button", { name: LOGIN })).toHaveCount(0);
    await expect(page.getByRole("link", { name: LOGIN })).toHaveCount(0);
  });
});
