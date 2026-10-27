import {
  expect,
  openFirstProject,
  scrollToBottom,
  sidebarProjectLinks,
  test,
  waitForLive,
  waitForSkeletonsGone,
  workerWidget,
  type Locator,
  type Page,
} from "./fixtures";

// The root header stays pinned to the top of the viewport while the document
// scrolls under it, on /projects/log and a project page, at 1280px and 375px:
// the brand and the Sections navigation stay visible, the header is opaque, a
// section tooltip draws over it, the desktop sidebar sticks below it with its
// last item reachable, and back restores the window scroll position.

interface Box {
  top: number;
  right: number;
  bottom: number;
  left: number;
  height: number;
}

function brand(page: Page, name: string): Locator {
  return page.getByRole("banner").getByRole("link", { name, exact: true });
}

function sectionLink(page: Page, name: string): Locator {
  return page.getByRole("navigation", { name: "Sections" }).getByRole("link", { name });
}

// The header's box, the window's scroll position, and for each link whether
// the element at its centre is the link or inside it (nothing covers it).
async function measure(
  page: Page,
  links: Locator[],
): Promise<{ header: Box; scrollY: number; hits: boolean[] }> {
  const handles = await Promise.all(links.map((link) => link.elementHandle()));
  return page.evaluate((elements) => {
    const header = document.querySelector("body > header");
    if (!header) throw new Error("no root header");
    const { top, right, bottom, left, height } = header.getBoundingClientRect();
    const hits = elements.map((el) => {
      if (!el) return false;
      const box = el.getBoundingClientRect();
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      return hit !== null && el.contains(hit);
    });
    return { header: { top, right, bottom, left, height }, scrollY: window.scrollY, hits };
  }, handles);
}

// The header pinned at top 0 with every link hit-tested visible.
async function expectPinned(page: Page, links: Locator[]): Promise<Box> {
  const { header, scrollY, hits } = await measure(page, links);
  expect(scrollY).toBeGreaterThan(0);
  expect(header.top).toBe(0);
  expect(hits).toEqual(links.map(() => true));
  return header;
}

// The header paints the body's colour, is not transparent, and content does
// not show through near its right edge.
async function expectOpaque(page: Page): Promise<void> {
  const paint = await page.evaluate(() => {
    const header = document.querySelector("body > header");
    if (!header) throw new Error("no root header");
    const box = header.getBoundingClientRect();
    const hit = document.elementFromPoint(box.right - 8, box.top + box.height / 2);
    return {
      header: getComputedStyle(header).backgroundColor,
      body: getComputedStyle(document.body).backgroundColor,
      inside: hit !== null && header.contains(hit),
    };
  });
  expect(paint.header).toBe(paint.body);
  expect(paint.header).not.toBe("rgba(0, 0, 0, 0)");
  expect(paint.inside).toBe(true);
}

async function boxOf(locator: Locator): Promise<{ x: number; y: number; w: number; h: number }> {
  const box = await locator.boundingBox();
  if (!box) throw new Error("element has no box");
  return { x: box.x, y: box.y, w: box.width, h: box.height };
}

function expectInside(
  inner: { x: number; y: number; w: number; h: number },
  outer: { x: number; y: number; w: number; h: number },
): void {
  expect(inner.x).toBeGreaterThanOrEqual(outer.x - 0.5);
  expect(inner.y).toBeGreaterThanOrEqual(outer.y - 0.5);
  expect(inner.x + inner.w).toBeLessThanOrEqual(outer.x + outer.w + 0.5);
  expect(inner.y + inner.h).toBeLessThanOrEqual(outer.y + outer.h + 0.5);
}

async function viewportBox(page: Page): Promise<{ x: number; y: number; w: number; h: number }> {
  const { w, h } = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
  return { x: 0, y: 0, w, h };
}

test.describe("sticky header", () => {
  test("pins the header at 1280px, layers the tooltip and keeps the sidebar in view", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/projects/log");
    await expect(page.getByRole("heading", { level: 2, name: /^Today,/ })).toBeVisible();
    const desktopLinks = [
      brand(page, "Sviatlana Buben, building in public"),
      sectionLink(page, "Watch me build"),
    ];

    await scrollToBottom(page);
    await expectPinned(page, desktopLinks);
    await expectOpaque(page);

    // A client navigation from the scrolled log, so back returns to it.
    await waitForLive(page);
    const first = sidebarProjectLinks(page).first();
    const href = await first.getAttribute("href");
    if (href === null) throw new Error("the first project link has no href");
    await first.click();
    await expect(page).toHaveURL(href);
    // The shell's skeleton holds its own copy of the Building now heading
    // until the Active island streams in and replaces it; hovering that copy
    // loses the tooltip mid-test ("element has no box").
    await waitForSkeletonsGone(page);

    // Role locators skip the previous route's hidden Activity subtree, so this
    // is the project page's button, not the overview's.
    const about = page.getByRole("button", { name: "About Building now" });
    await page.evaluate(() => window.scrollTo(0, 0));
    await about.hover();
    const tooltip = about.locator("xpath=..").getByRole("tooltip");
    await expect(tooltip).toHaveAttribute("id", "section-building-now-detail");
    // The tooltip is sr-only (a 1px box) until hovered, so open means wide.
    await expect.poll(async () => (await boxOf(tooltip)).w).toBeGreaterThan(100);

    for (let attempt = 0; attempt < 5; attempt++) {
      const { header } = await measure(page, []);
      const button = await boxOf(about);
      const gap = button.y - header.bottom;
      if (gap >= 0 && gap <= 8) break;
      await page.evaluate((dy) => window.scrollBy(0, dy), gap - 4);
    }
    const { header } = await measure(page, []);
    const button = await boxOf(about);
    expect(button.y - header.bottom).toBeGreaterThanOrEqual(0);
    expect(button.y - header.bottom).toBeLessThanOrEqual(8);
    await about.hover();
    await expect.poll(async () => (await boxOf(tooltip)).w).toBeGreaterThan(100);

    const tip = await boxOf(tooltip);
    const overlap = {
      left: Math.max(tip.x, header.left),
      right: Math.min(tip.x + tip.w, header.right),
      top: Math.max(tip.y, header.top),
      bottom: Math.min(tip.y + tip.h, header.bottom),
    };
    const intersects = overlap.left < overlap.right && overlap.top < overlap.bottom;
    const point = intersects
      ? { x: (overlap.left + overlap.right) / 2, y: (overlap.top + overlap.bottom) / 2 }
      : { x: tip.x + tip.w / 2, y: tip.y + tip.h / 2 };
    expect(
      await tooltip.evaluate((el, { x, y }) => {
        const hit = document.elementFromPoint(x, y);
        return hit !== null && el.contains(hit);
      }, point),
    ).toBe(true);

    // Leave the tooltip before scrolling: with the pointer still on it, a
    // short scroll keeps its bridge under the pointer, so it stays open and,
    // being the top layer, covers the header links the next check hit-tests.
    // (0, 0) is the header's empty left padding at 1280px.
    await page.mouse.move(0, 0);
    await expect.poll(async () => (await boxOf(tooltip)).w).toBeLessThanOrEqual(1);

    await scrollToBottom(page);
    const pinned = await expectPinned(page, desktopLinks);
    const aside = page.locator("aside");
    const asideBox = await boxOf(aside);
    const viewport = await viewportBox(page);
    expect(Math.abs(asideBox.y - (pinned.height + 24))).toBeLessThanOrEqual(1);
    expect(asideBox.y + asideBox.h).toBeLessThanOrEqual(viewport.h);

    await aside.evaluate((el) => {
      const list = [...el.children].find((child) => getComputedStyle(child).overflowY === "auto");
      if (!list) throw new Error("the sidebar has no scroll container");
      list.scrollTop = list.scrollHeight;
    });
    const last = await boxOf(sidebarProjectLinks(page).last());
    expectInside(last, asideBox);
    expectInside(last, viewport);
    const widget = await boxOf(workerWidget(page));
    expectInside(widget, asideBox);
    expectInside(widget, viewport);

    await page.goBack();
    await expect(page).toHaveURL("/projects/log");
    await expect
      .poll(() =>
        page.evaluate(
          () => window.scrollY >= document.documentElement.scrollHeight - window.innerHeight - 2,
        ),
      )
      .toBe(true);
    await page.goForward();
    await expect(page).toHaveURL(href);
  });

  test("pins the one-row header at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/projects/log");
    await expect(page.getByRole("heading", { level: 2, name: /^Today,/ })).toBeVisible();
    // Below `sm` the brand reads only "Sviatlana Buben".
    const phoneBrand = brand(page, "Sviatlana Buben");
    const watch = sectionLink(page, "Watch me build");
    const writing = sectionLink(page, "Writing");

    await scrollToBottom(page);
    const header = await expectPinned(page, [phoneBrand, watch]);
    await expectOpaque(page);
    expect(Math.abs(header.height - 57)).toBeLessThanOrEqual(1);
    const headerBox = await boxOf(page.locator("body > header"));
    for (const link of [phoneBrand, watch, writing]) {
      expectInside(await boxOf(link), headerBox);
    }

    await openFirstProject(page);
    await scrollToBottom(page);
    await expectPinned(page, [phoneBrand, watch]);
    await expectOpaque(page);
  });
});
