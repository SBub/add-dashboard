import { expect, type Page, test } from "./fixtures";

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

// The post page's right gutter, on the long post /writing/cleaning-automation
// (9 h2, about 40 h3), committed content, so its slug may be named here.
test.describe("post gutter", () => {
  const LONG_POST = "/writing/cleaning-automation";

  async function openLongPost(page: Page) {
    await page.goto(LONG_POST);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }

  test("On this page lists h2 and h3 and marks the heading an h3 link reaches", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openLongPost(page);
    const toc = page.getByRole("navigation", { name: "On this page" });
    const h2Count = await page.locator("article h2[id]").count();
    const h3Count = await page.locator("article h3[id]").count();
    expect(h3Count).toBeGreaterThan(0);
    await expect(toc.getByRole("link")).toHaveCount(h2Count + h3Count);

    // The nav scrolls inside itself; the page does not move with it.
    const box = await toc.evaluate((el) => ({
      overflowY: getComputedStyle(el).overflowY,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));
    expect(box.overflowY).toBe("auto");
    expect(box.scrollHeight).toBeGreaterThan(box.clientHeight);

    const id = await page.locator("article h3[id]").nth(5).getAttribute("id");
    if (id === null) throw new Error("the sixth h3 has no id");
    const link = toc.locator(`a[href="#${id}"]`);
    await link.click();
    await expect.poll(() => new URL(page.url()).hash).toBe(`#${id}`);
    await expect(link).toHaveAttribute("aria-current", "location");
    await expect(toc.locator('[aria-current="location"]')).toHaveCount(1);
    // The marked entry is in view inside the nav's own scroll box.
    const inView = await link.evaluate((el) => {
      const nav = el.closest("nav");
      if (!nav) return false;
      const a = el.getBoundingClientRect();
      const n = nav.getBoundingClientRect();
      return a.top >= n.top && a.bottom <= n.bottom;
    });
    expect(inView).toBe(true);

    const top = await page.locator(`#${id}`).evaluate((el) => el.getBoundingClientRect().top);
    const header = await page.evaluate(
      () => document.querySelector("header")?.getBoundingClientRect().bottom ?? 0,
    );
    expect(top).toBeGreaterThanOrEqual(header);
    expect(top).toBeLessThanOrEqual(96);
  });

  test("the minimap sits right of the list, tops aligned, and nothing overflows", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openLongPost(page);
    const toc = page.getByRole("navigation", { name: "On this page" });
    await expect(toc).toBeVisible();
    const minimap = page.locator("[data-minimap]");
    const t = await toc.boundingBox();
    const m = await minimap.boundingBox();
    if (!t || !m) throw new Error("the table of contents or the minimap has no box");
    expect(m.x).toBeGreaterThanOrEqual(t.x + t.width);
    expect(Math.abs(m.y - t.y)).toBeLessThanOrEqual(4);

    for (const width of [1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const sizes = await page.evaluate(() => {
        const root = document.documentElement;
        const strip = document.querySelector("[data-minimap]");
        return {
          clientWidth: root.clientWidth,
          scrollWidth: root.scrollWidth,
          stripRight: strip?.getBoundingClientRect().right ?? Infinity,
        };
      });
      expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.clientWidth);
      expect(sizes.stripRight).toBeLessThanOrEqual(sizes.clientWidth);
    }
  });
  test("the list's last entry and the minimap end above the radio bar", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openLongPost(page);
    const toc = page.getByRole("navigation", { name: "On this page" });
    await expect(toc).toBeVisible();
    await expect(page.locator("[data-minimap-frame]")).toBeVisible();
    // The page and the nav both scrolled to their ends.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await toc.evaluate((el) => (el.scrollTop = el.scrollHeight));
    await expect
      .poll(() => toc.evaluate((el) => el.scrollTop + el.clientHeight >= el.scrollHeight - 1))
      .toBe(true);
    const bottoms = await page.evaluate(() => {
      const nav = document.querySelector('nav[aria-label="On this page"]');
      const last = nav?.querySelector("li:last-child a");
      const strip = document.querySelector("[data-minimap] > div");
      const bar = document.querySelector('[role="region"][aria-label$="radio"]');
      return {
        nav: nav?.getBoundingClientRect().bottom ?? Infinity,
        last: last?.getBoundingClientRect().bottom ?? Infinity,
        strip: strip?.getBoundingClientRect().bottom ?? Infinity,
        bar: bar?.getBoundingClientRect().top ?? -Infinity,
      };
    });
    expect(bottoms.last).toBeLessThanOrEqual(bottoms.nav);
    expect(bottoms.nav).toBeLessThan(bottoms.bar);
    expect(bottoms.strip).toBeLessThan(bottoms.bar);
  });

  test("a use-case post carries the Use case breakdown badge, on the list and the post", async ({
    page,
  }) => {
    await openLongPost(page);
    const badge = page.locator('[data-post-kind="use-case"]');
    await expect(badge).toHaveText("Use case breakdown");
    await page.goto("/writing");
    const item = page.getByRole("listitem").filter({ has: page.locator(`a[href="${LONG_POST}"]`) });
    await expect(item.locator('[data-post-kind="use-case"]')).toHaveText("Use case breakdown");
    const moat = page
      .getByRole("listitem")
      .filter({ has: page.getByRole("link", { name: TITLE }) });
    await expect(moat.locator("[data-post-kind]")).toHaveCount(0);
  });
});
