import { test as base, expect, type Locator, type Page } from "@playwright/test";

// The suite's shared `test` and helpers. Every spec imports from here, never
// from @playwright/test directly, so the /hire guard below is always on.

export { expect };
export type { Locator, Page } from "@playwright/test";

// The callback is named `run`, not `use`: react-hooks/rules-of-hooks flags a
// call to a function named `use` outside a component.
export const test = base.extend<{ hireGuard: void }>({
  hireGuard: [
    async ({ context }, run) => {
      // A second line of defence, not a licence: a valid submit would email
      // hire@issebya.com. Every POST to /hire is aborted, whether the action
      // posts through fetch (hydrated) or as a native form POST, on every page
      // and popup in the context. fallback() lets a spec's own route still run.
      await context.route(
        (url) => url.pathname === "/hire",
        (route) => (route.request().method() === "POST" ? route.abort() : route.fallback()),
      );
      await run();
    },
    { auto: true },
  ],
});

// Waits for the sidebar's connection pill to read `live`. The pill is a
// `status` whose whole text is the state; other `status` elements exist
// (skeletons, the today card's error), so it is found by its text.
export async function waitForLive(page: Page): Promise<void> {
  const pill = page.getByRole("status").filter({ hasText: /^(connecting|live|reconnecting)$/ });
  await expect(pill).toHaveText("live", { timeout: 15_000 });
}

// Opens the first project the /projects sidebar lists and returns its href.
// Never hard-code a slug: the public projects change.
export async function openFirstProject(page: Page): Promise<string> {
  await page.goto("/projects");
  const link = page.getByRole("navigation", { name: "Projects" }).getByRole("link").first();
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  expect(href).toMatch(/^\/projects\/[^/]+\/[^/]+$/);
  if (href === null) throw new Error("the first project link has no href");
  await link.click();
  await expect(page).toHaveURL(href);
  return href;
}

// The two colour schemes the chrome specs emulate.
export const SCHEMES = ["light", "dark"] as const;

// Scrolls the window to the end of the page once its height has settled.
export async function scrollToBottom(page: Page): Promise<void> {
  // Content that loads after the first scroll (the /projects/log feed) grows
  // the page, so scroll again until the height holds for 20 frames (~300ms),
  // giving up after 5s so a page that never settles fails on its assertion.
  await page.evaluate(async () => {
    const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    const deadline = performance.now() + 5000;
    let height = -1;
    let steady = 0;
    while (steady < 20 && performance.now() < deadline) {
      const next = document.documentElement.scrollHeight;
      window.scrollTo(0, next);
      await frame();
      steady = next === height ? steady + 1 : 0;
      height = next;
    }
  });
}

// Nothing scrolls sideways. Measured against the root's client width, not
// innerWidth, so the Linux scrollbar gutter cannot make it flaky.
export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, "the page scrolls horizontally").toBeLessThanOrEqual(clientWidth);
}

// Where the Work with me link sits. Measured from the root box, not the window:
// `scrollbar-gutter: stable` keeps a 15px gutter on Linux Chromium (none on
// macOS), and the fixed link sits 16px inside it on both.
export function floatingHirePlacement(link: Locator): Promise<{
  position: string;
  right: number;
  bottom: number;
  top: number;
  height: number;
}> {
  return link.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const root = document.documentElement.getBoundingClientRect();
    return {
      position: getComputedStyle(el).position,
      right: root.width - rect.right,
      bottom: document.documentElement.clientHeight - rect.bottom,
      top: rect.top,
      height: rect.height,
    };
  });
}
