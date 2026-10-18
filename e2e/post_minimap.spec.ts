import {
  expect,
  expectNoHorizontalOverflow,
  scrollToBottom,
  test,
  type Locator,
  type Page,
} from "./fixtures";

// The post minimap from 1280px: a narrow sticky strip in the right gutter,
// outside the article, hidden from assistive tech and inert, holding only
// shapes measured from the real post and a frame that follows the viewport.
// None below 1280 and none on other pages. Runs in Chromium and in WebKit (the
// old zoom-based minimap broke only in WebKit), with the same assertions in
// both. The posts are committed content, so their slugs may be named here.

const POST = "/writing/feature-flags";

interface Box {
  top: number;
  bottom: number;
}

function box(locator: Locator): Promise<Box> {
  return locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom };
  });
}

interface Snapshot {
  frame: Box;
  strip: Box;
  inner: Box;
}

async function snapshot(page: Page): Promise<Snapshot> {
  return {
    frame: await box(page.locator("[data-minimap-frame]")),
    strip: await box(page.locator("[data-minimap]")),
    inner: await box(page.locator("[data-minimap] .relative").first()),
  };
}

// Reads the frame and the strip once the frame has stopped moving: it is
// moved on the next animation frame after a scroll.
async function settled(page: Page): Promise<Snapshot> {
  let last = "";
  await expect
    .poll(async () => {
      const now = JSON.stringify(await snapshot(page));
      const still = now === last;
      last = now;
      return still;
    })
    .toBe(true);
  return JSON.parse(last) as Snapshot;
}

test.describe("post minimap", () => {
  test("at 1440x900 the strip is a sticky, inert map of the whole post", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(POST);
    const strip = page.locator("[data-minimap]");
    const article = page.locator("article");
    await expect(strip).toBeAttached();
    // The strip is drawn by the client after it measures the article.
    await expect(strip.locator("[data-minimap-shape]")).not.toHaveCount(0);
    await expect(strip).toHaveAttribute("aria-hidden", "true");
    await expect(strip).toHaveAttribute("inert");
    expect(await strip.evaluate((el) => el.closest("article") === null)).toBe(true);

    const geometry = await strip.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const articleBox = document.querySelector("article")?.getBoundingClientRect();
      const header = document.querySelector("body > header")?.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top,
        articleRight: articleBox?.right ?? Number.NaN,
        headerBottom: header?.bottom ?? Number.NaN,
        innerHeight,
      };
    });
    const detail = JSON.stringify(geometry);
    expect(geometry.width, detail).toBeGreaterThan(0);
    expect(geometry.left, detail).toBeGreaterThan(geometry.articleRight);
    expect(geometry.top, detail).toBeGreaterThanOrEqual(geometry.headerBottom);
    expect(geometry.width, detail).toBeLessThanOrEqual(140);
    expect(geometry.height, detail).toBeLessThanOrEqual(0.7 * geometry.innerHeight + 1);

    await expect(strip.locator("a, img, h1, h2, h3, nav")).toHaveCount(0);
    const contents = await strip.evaluate((el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const zooms = [el, ...el.querySelectorAll("*")]
        .map((node) => (getComputedStyle(node) as CSSStyleDeclaration & { zoom?: string }).zoom)
        .filter((zoom) => zoom !== undefined && zoom !== "" && zoom !== "1" && zoom !== "normal");
      return { text: walker.nextNode() !== null, zooms };
    });
    expect(contents.text, "the strip holds a text node").toBe(false);
    expect(contents.zooms, "an element in the strip is zoomed").toEqual([]);

    const images = await article.locator("img").count();
    expect(images).toBeGreaterThan(0);
    await expect(strip.locator('[data-minimap-shape="image"]')).toHaveCount(images);
    await expect(strip.locator('[data-minimap-shape="heading"]')).not.toHaveCount(0);
    await expect(strip.locator('[data-minimap-shape="text"]')).not.toHaveCount(0);

    const start = await settled(page);
    const lowest = await strip.evaluate((el) =>
      Math.max(
        ...[...el.querySelectorAll("[data-minimap-shape]")].map(
          (s) => s.getBoundingClientRect().bottom,
        ),
      ),
    );
    expect(lowest, "the whole post fits in the strip").toBeLessThanOrEqual(start.inner.bottom + 1);
    expect(Math.abs(start.frame.top - start.inner.top), JSON.stringify(start)).toBeLessThanOrEqual(
      1,
    );

    await scrollToBottom(page);
    const end = await settled(page);
    const endDetail = JSON.stringify(end);
    expect(end.strip.top, endDetail).toBeGreaterThanOrEqual(geometry.headerBottom);
    expect(end.strip.bottom, endDetail).toBeLessThanOrEqual(geometry.innerHeight);
    expect(Math.abs(end.frame.bottom - end.inner.bottom), endDetail).toBeLessThanOrEqual(1);

    await page.evaluate(() =>
      window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) / 2),
    );
    const middle = await settled(page);
    const middleDetail = JSON.stringify({ start, middle, end });
    expect(middle.frame.top, middleDetail).toBeGreaterThan(start.frame.top);
    expect(middle.frame.top, middleDetail).toBeLessThan(end.frame.top);
    expect(Math.abs(middle.strip.top - geometry.top), middleDetail).toBeLessThanOrEqual(1);

    await expect(page.locator("h1")).toHaveCount(1);
    await page.goto("/writing/my-moat");
    await expect(page.locator("article").getByRole("link").last()).toHaveText(
      "Watch me build live",
    );
  });

  for (const viewport of [
    { width: 1279, height: 800 },
    { width: 1024, height: 768 },
    { width: 390, height: 844 },
  ]) {
    test(`below 1280 no minimap is displayed at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      for (const path of [POST, "/writing/my-moat"]) {
        await test.step(path, async () => {
          await page.goto(path);
          await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
          const strip = page.locator("[data-minimap]");
          await expect(strip).toHaveCount(1);
          expect(await strip.evaluate((el) => el.getBoundingClientRect().width)).toBe(0);
          await expect(strip.locator("[data-minimap-shape]")).toHaveCount(0);
          await expectNoHorizontalOverflow(page);
        });
      }
    });
  }

  test("/writing has no minimap", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/writing");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("[data-minimap]")).toHaveCount(0);
  });
});
