import { expect, openFirstProject, test, waitForLive, type Locator, type Page } from "./fixtures";

// The root header marks the current section: the brand on /, Watch me build on
// /projects, /projects/log and a project page, Work with me on /hire, and none
// of them on a route outside all three.

function headerLinks(page: Page): { brand: Locator; watch: Locator; hire: Locator } {
  const banner = page.getByRole("banner");
  return {
    brand: banner.getByRole("link", { name: /^Sviatlana Buben/ }),
    watch: page
      .getByRole("navigation", { name: "Sections" })
      .getByRole("link", { name: "Watch me build" }),
    hire: banner.getByRole("link", { name: "Work with me" }),
  };
}

test.describe("header section active", () => {
  test("/ marks the brand only", async ({ page }) => {
    await page.goto("/");
    const { brand, watch } = headerLinks(page);
    await expect(brand).toHaveAccessibleName("Sviatlana Buben, building in public");
    await expect(brand).toHaveAttribute("href", "/");
    await expect(brand).toHaveAttribute("aria-current", "page");
    await expect(watch).toHaveAttribute("href", "/projects");
    await expect(watch).not.toHaveAttribute("aria-current");
  });

  for (const path of ["/projects/log", "/projects"]) {
    test(`${path} marks Watch me build only`, async ({ page }) => {
      await page.goto(path);
      const { brand, watch } = headerLinks(page);
      await expect(watch).toHaveAttribute("aria-current", "page");
      await expect(brand).not.toHaveAttribute("aria-current");
      // The dashboard routes carry the connection pill.
      await waitForLive(page);
    });
  }

  test("a project page marks Watch me build", async ({ page }) => {
    const href = await openFirstProject(page);
    expect(href).toMatch(/^\/projects\/[^/]+\/[^/]+$/);
    await expect(page).toHaveURL(href);
    await expect(headerLinks(page).watch).toHaveAttribute("aria-current", "page");
  });

  for (const path of ["/projectsx", "/watch", "/watchx"]) {
    test(`${path} renders not-found and marks no link`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: "Not found" })).toBeVisible();
      const { brand, watch, hire } = headerLinks(page);
      await expect(brand).not.toHaveAttribute("aria-current");
      await expect(watch).not.toHaveAttribute("aria-current");
      await expect(hire).not.toHaveAttribute("aria-current");
    });
  }

  test("/hire marks Work with me only", async ({ page }) => {
    await page.goto("/hire");
    const { brand, watch, hire } = headerLinks(page);
    await expect(hire).toHaveAttribute("href", "/hire");
    await expect(hire).toHaveAttribute("aria-current", "page");
    await expect(brand).not.toHaveAttribute("aria-current");
    await expect(watch).not.toHaveAttribute("aria-current");
  });
});
