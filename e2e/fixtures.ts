import {
  test as base,
  expect,
  type APIRequestContext,
  type Locator,
  type Page,
} from "@playwright/test";

// The suite's shared `test` and helpers. Every spec imports from here, never
// from @playwright/test directly, so the /hire guard below is always on.

export { expect };
export type { Locator, Page, Request } from "@playwright/test";

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
  const link = sidebarProjectLinks(page).first();
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  expect(href).toMatch(/^\/projects\/[^/]+\/[^/]+$/);
  if (href === null) throw new Error("the first project link has no href");
  await link.click();
  await expect(page).toHaveURL(href);
  return href;
}

// The project links in the sidebar's Projects navigation.
export function sidebarProjectLinks(page: Page): Locator {
  return page.getByRole("navigation", { name: "Projects" }).getByRole("link");
}

// The sidebar worker widget's state text. It reads `Checking status...` until
// its first poll lands, so a spec never hard-codes a live state.
export function workerWidget(page: Page): Locator {
  return page.locator("aside").getByText(/^(Ready to build|Offline|Checking status\.\.\.)$/);
}

// Waits for the worker widget to leave `Checking status...` for a live state,
// either one: whether the worker runs depends on the operator's machine.
export async function waitForWorkerState(page: Page): Promise<void> {
  await expect(workerWidget(page)).toHaveText(/^(Ready to build|Offline)$/, { timeout: 30_000 });
}

// Loads `path` and expects the root not-found page at that address, with no
// redirect.
export async function expectNotFound(page: Page, path: string): Promise<void> {
  await page.goto(path);
  const url = new URL(page.url());
  expect(url.pathname + url.search).toBe(path);
  await expect(page.getByRole("heading", { name: "Not found" })).toBeVisible();
  await expect(page.getByText("There is nothing at this address.")).toBeVisible();
}

// Expects the elements in document order, each one's top below the previous
// one's (strictly, or at least level with it where a row can wrap).
export async function expectInDocumentOrder(
  locators: Locator[],
  { strictTop }: { strictTop: boolean },
): Promise<void> {
  const [first] = locators;
  if (!first) throw new Error("no locators to order");
  const handles = await Promise.all(
    locators.map(async (locator) => {
      await expect(locator).toBeAttached();
      return locator.elementHandle();
    }),
  );
  const steps = await first.page().evaluate((elements) => {
    const present = elements.filter((el) => el !== null);
    return present.slice(1).map((el, i) => {
      const previous = present[i];
      if (!previous) throw new Error("no previous element");
      return {
        follows: (previous.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
        top: el.getBoundingClientRect().top,
        previousTop: previous.getBoundingClientRect().top,
      };
    });
  }, handles);
  expect(steps).toHaveLength(locators.length - 1);
  for (const step of steps) {
    expect(step.follows).toBe(true);
    if (strictTop) expect(step.top).toBeGreaterThan(step.previousTop);
    else expect(step.top).toBeGreaterThanOrEqual(step.previousTop);
  }
}

// Expects the page not to scroll sideways.
export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
}

// The HTML the app serves for `path`, before any client code runs. The
// request fixture uses baseURL, so this reads the app only.
export async function servedHtml(request: APIRequestContext, path: string): Promise<string> {
  const response = await request.get(path);
  expect(response.ok()).toBe(true);
  return response.text();
}
