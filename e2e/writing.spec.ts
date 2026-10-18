import { expect, test } from "./fixtures";

// The blog: the /writing list and the committed post /writing/my-moat (content
// in src/content/posts/, not live data, so its slug may be named here).

const TITLE = "My moat as a Product Engineer";

test.describe("writing", () => {
  test("/writing lists the post with its date and tag", async ({ page }) => {
    await page.goto("/writing");
    await expect(page.getByRole("heading", { level: 1, name: "Writing" })).toBeVisible();
    const link = page.getByRole("link", { name: TITLE });
    await expect(link).toHaveAttribute("href", "/writing/my-moat");
    const item = page.getByRole("listitem").filter({ has: link });
    await expect(item.getByText("For product teams")).toBeVisible();
    await expect(item.locator("time")).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}/);

    const sections = page.getByRole("navigation", { name: "Sections" });
    await expect(sections.getByRole("link", { name: "Writing" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(sections.getByRole("link", { name: "Watch me build" })).not.toHaveAttribute(
      "aria-current",
    );
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Projects" })).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toHaveCount(0);
  });

  test("the post opens on its own page under a breadcrumb", async ({ page }) => {
    await page.goto("/writing");
    await page.getByRole("link", { name: TITLE }).click();
    await expect(page).toHaveURL("/writing/my-moat");
    await expect(page.getByRole("heading", { level: 1, name: TITLE })).toBeVisible();
    const writing = page.getByRole("navigation", { name: "Sections" }).getByRole("link", {
      name: "Writing",
    });
    await expect(writing).toHaveAttribute("aria-current", "page");

    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb).toBeVisible();
    const precedes = await page.evaluate(() => {
      const nav = document.querySelector('nav[aria-label="Breadcrumb"]');
      const h1 = document.querySelector("article h1");
      if (!nav || !h1) return false;
      return (nav.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    });
    expect(precedes).toBe(true);
    await expect(breadcrumb.getByRole("link", { name: "Writing" })).toHaveAttribute(
      "href",
      "/writing",
    );
    await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText(TITLE);
    await expect(breadcrumb.getByText("/", { exact: true })).toHaveAttribute("aria-hidden", "true");

    await breadcrumb.getByRole("link", { name: "Writing" }).click();
    await expect(page).toHaveURL("/writing");
    await expect(page.getByRole("heading", { level: 1, name: "Writing" })).toBeVisible();
  });

  test("the post ends on its own link to /projects and carries Open Graph tags", async ({
    page,
  }) => {
    await page.goto("/writing/my-moat");
    const article = page.getByRole("article");
    const last = article.getByRole("link").last();
    await expect(last).toHaveText("Watch me build live");
    await expect(last).toHaveAttribute("href", "/projects");
    await expect(article.getByRole("link", { name: "Work with me" })).toHaveCount(0);

    await expect(page.locator('head meta[property="og:title"]')).toHaveAttribute("content", TITLE);
    await expect(page.locator('head meta[property="og:image"]')).toHaveAttribute("content", /.+/);
  });

  test("neither page scrolls horizontally at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const scrollWidth = () => page.evaluate(() => document.documentElement.scrollWidth);

    await page.goto("/writing");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await scrollWidth()).toBeLessThanOrEqual(390);

    await page.goto("/writing/my-moat");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await scrollWidth()).toBeLessThanOrEqual(390);
    const current = page
      .getByRole("navigation", { name: "Breadcrumb" })
      .locator('[aria-current="page"]');
    expect(await current.evaluate((el) => getComputedStyle(el).whiteSpace)).toBe("nowrap");
  });
});
