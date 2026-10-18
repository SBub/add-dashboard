import { expect, test, waitForLive, type Page } from "./fixtures";

// While the projects side streams in, every Suspense fallback is a skeleton (a
// `role="status"` container with `aria-busy="true"` and an `aria-label`), not
// a "Loading..." line or nothing; the page does not jump when the rows arrive;
// and the skeleton blocks stand still under reduced motion. The network is
// slowed in the test browser only. Probe: a skeleton replaced by the text
// `Loading...` must fail this spec.

declare global {
  interface Window {
    __cls: number;
  }
}

// The first project the sidebar lists. Never hard-code a slug.
async function firstProjectHref(page: Page): Promise<string> {
  await page.goto("/projects");
  await waitForLive(page);
  const href = await page
    .getByRole("navigation", { name: "Projects" })
    .getByRole("link")
    .first()
    .getAttribute("href");
  expect(href).toMatch(/^\/projects\/[^/]+\/[^/]+$/);
  if (href === null) throw new Error("the first project link has no href");
  return href;
}

// The whole streamed document: the fallbacks and the hidden segments that
// replace them.
async function streamedDocument(page: Page, href: string): Promise<string> {
  const response = await page.request.get(href);
  expect(response.ok()).toBe(true);
  return response.text();
}

test.describe("projects skeleton fallbacks", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "CDP is Chromium only");

  test("the streamed document holds skeletons, not Loading text", async ({ page }) => {
    const body = await streamedDocument(page, await firstProjectHref(page));
    expect(body).toContain('aria-busy="true"');
    expect(body).toContain('aria-label="Loading runs"');
    expect(body).toContain('aria-label="Loading queue"');
    expect(
      body.includes('aria-label="Loading history"') || body.includes('aria-label="Loading pages"'),
    ).toBe(true);
    for (const text of [
      "Loading runs...",
      "Loading queue...",
      "Loading history...",
      "Loading project...",
      "Loading...",
    ]) {
      expect(body).not.toContain(text);
    }
    for (const heading of ["Building now", "Up next", "Shipped"]) {
      expect(body).toContain(`${heading}</h2>`);
    }
  });

  test("a skeleton shows under a slow network and the page does not jump", async ({ page }) => {
    test.setTimeout(120_000);
    const href = await firstProjectHref(page);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Network.enable");
    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & {
          value: number;
          hadRecentInput: boolean;
        })[]) {
          if (!entry.hadRecentInput) window.__cls += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });

    const busy = page.getByRole("status", { name: /^Loading / }).filter({ visible: true });
    try {
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 2000,
        downloadThroughput: 50_000,
        uploadThroughput: 50_000,
      });
      await page.goto(href, { waitUntil: "commit" });
      await expect(busy.first()).toBeVisible({ timeout: 30_000 });

      const main = page.getByRole("main");
      await expect(main.locator('[aria-busy="true"]').filter({ visible: true })).toHaveCount(0, {
        timeout: 60_000,
      });
      await expect(
        main
          .locator("code")
          .filter({ hasText: /^[0-9a-f]{8}$/ })
          .first()
          .or(main.getByText("No completed runs yet.", { exact: true })),
      ).toBeVisible({ timeout: 60_000 });
      expect(await page.evaluate(() => window.__cls)).toBeLessThan(0.1);

      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload({ waitUntil: "commit" });
      await expect(busy.first()).toBeVisible({ timeout: 30_000 });
    } finally {
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1,
      });
    }
  });

  test("skeleton blocks stand still under reduced motion", async ({ page }) => {
    const href = await firstProjectHref(page);
    const body = await streamedDocument(page, href);
    // Clone a skeleton block from the streamed document into the live page,
    // where none is left once the rows have arrived.
    const added = await page.evaluate((html) => {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const block = doc.querySelector('[class~="motion-safe:animate-pulse"]');
      if (!block) return false;
      const clone = document.importNode(block, true) as HTMLElement;
      clone.dataset.e2eSkeleton = "";
      document.body.append(clone);
      return true;
    }, body);
    expect(added).toBe(true);
    const clone = page.locator("[data-e2e-skeleton]");
    const animation = () => clone.evaluate((el) => getComputedStyle(el).animationName);

    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(await animation()).toBe("none");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    expect(await animation()).not.toBe("none");
    await clone.evaluate((el) => el.remove());
  });
});
