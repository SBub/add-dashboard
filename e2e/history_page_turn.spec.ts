import { expect, requireProject, section, sectionRows, test, type Page } from "./fixtures";

// Turning a History page with Older runs and Newer runs keeps the window's
// scroll position, dims the list (`aria-busy="true"`) while the navigation is
// pending and lands on the arrow's URL with new rows. The RSC requests are
// delayed in the test browser only, so the pending state is observable.
// Probe: removing `aria-busy={isPending}` from HistoryResults must fail this.

const DELAY_MS = 1500;

function pages(page: Page) {
  const nav = page.getByRole("navigation", { name: "History pages" });
  return {
    nav,
    indicator: nav.getByText(/^\d+ of \d+$/),
    newer: nav.getByRole("link", { name: "Newer runs" }),
    older: nav.getByRole("link", { name: "Older runs" }),
  };
}

async function hasTwoHistoryPages(page: Page): Promise<boolean> {
  const { indicator } = pages(page);
  if ((await indicator.count()) === 0) return false;
  const match = /^1 of (\d+)$/.exec(((await indicator.textContent()) ?? "").trim());
  return match !== null && Number(match[1]) > 1;
}

test.describe("history page turn", () => {
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: "ignoreErrors" });
  });

  test("the arrows turn the page in place and dim the list while pending", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await requireProject(page, hasTwoHistoryPages, "no project has more than one History page", {
      prefer: "/projects/SBub/adw-dashboard",
    });
    const { indicator, newer, older } = pages(page);
    const total = /of (\d+)$/.exec(((await indicator.textContent()) ?? "").trim())?.[1];
    if (total === undefined) throw new Error("the History indicator has no page count");

    const shipped = section(page, "Shipped");
    // The list wrapper (HistoryResults), not a skeleton's role=status.
    const wrapper = shipped.locator("div[aria-busy]:not([role])");
    const firstRow = sectionRows(page, "Shipped").first();
    const scrollY = await shipped
      .getByRole("heading", { level: 2, name: "Shipped", exact: true })
      .evaluate((h) => {
        h.scrollIntoView({ block: "start" });
        return window.scrollY;
      });
    expect(scrollY).toBeGreaterThan(0);
    const firstText = await firstRow.textContent();
    const olderHref = await older.getAttribute("href");
    if (olderHref === null) throw new Error("Older runs has no href");
    const currentScroll = () => page.evaluate(() => window.scrollY);
    const resolve = (href: string) => new URL(href, page.url()).href;

    // Delay every RSC request; fallback() keeps the fixture's /hire guard on.
    await page.route("**/*", async (route) => {
      const request = route.request();
      const isRsc =
        request.headers()["rsc"] !== undefined || new URL(request.url()).searchParams.has("_rsc");
      if (isRsc) await new Promise((done) => setTimeout(done, DELAY_MS));
      await route.fallback();
    });

    await older.click();
    await expect(wrapper).toHaveAttribute("aria-busy", "true", { timeout: DELAY_MS });
    await expect(indicator).toHaveText(`2 of ${total}`, { timeout: 15_000 });
    expect(page.url()).toBe(resolve(olderHref));
    expect(page.url()).toContain("?after=");
    await expect.poll(() => firstRow.textContent()).not.toBe(firstText);
    expect(Math.abs((await currentScroll()) - scrollY)).toBeLessThanOrEqual(1);
    await expect(wrapper).toHaveAttribute("aria-busy", "false");

    const newerHref = await newer.getAttribute("href");
    if (newerHref === null) throw new Error("Newer runs has no href");
    await newer.click();
    await expect(wrapper).toHaveAttribute("aria-busy", "true", { timeout: DELAY_MS });
    await expect(indicator).toHaveText(`1 of ${total}`, { timeout: 15_000 });
    expect(page.url()).toBe(resolve(newerHref));
    expect(page.url()).not.toContain("after=");
    expect(page.url()).not.toContain("before=");
    await expect.poll(() => firstRow.textContent()).toBe(firstText);
    expect(Math.abs((await currentScroll()) - scrollY)).toBeLessThanOrEqual(1);
    await expect(wrapper).toHaveAttribute("aria-busy", "false");

    // Real links, so middle-click and open in a new tab use the href.
    for (const arrow of [newer, older]) {
      if ((await arrow.count()) === 0) continue;
      expect(await arrow.evaluate((el) => el.tagName)).toBe("A");
      await expect(arrow).toHaveAttribute("href", /.+/);
    }
  });
});
