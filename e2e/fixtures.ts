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

// The three sections of a project page; /projects has Building now only.
export type SectionTitle = "Building now" | "Up next" | "Shipped";

const SECTION_TITLES: SectionTitle[] = ["Building now", "Up next", "Shipped"];

// A section has no accessible name, so its level-2 heading is the handle. The
// heading is a role locator, which skips hidden subtrees: after a client
// navigation the previous route stays in the DOM inside a hidden Activity
// (cacheComponents), and its sections never match.
export function section(page: Page, title: SectionTitle): Locator {
  return page
    .getByRole("main")
    .locator("section")
    .filter({ has: page.getByRole("heading", { level: 2, name: title, exact: true }) });
}

// The visible rows of a section's list: run rows (Active, History) in a `ul`,
// queue rows in an `ol`.
export function sectionRows(page: Page, title: SectionTitle): Locator {
  return section(page, title)
    .locator(title === "Up next" ? "ol > li" : "ul > li")
    .filter({ visible: true });
}

export async function hasActiveRow(page: Page): Promise<boolean> {
  return (await sectionRows(page, "Building now").count()) > 0;
}

export async function hasQueuedItem(page: Page): Promise<boolean> {
  return (await sectionRows(page, "Up next").count()) > 0;
}

export async function hasHistoryRow(page: Page): Promise<boolean> {
  return (await sectionRows(page, "Shipped").count()) > 0;
}

// Every project the /projects sidebar lists, in its order.
async function projectHrefs(page: Page): Promise<string[]> {
  await page.goto("/projects");
  await waitForLive(page);
  const links = page.getByRole("navigation", { name: "Projects" }).getByRole("link");
  await expect(links.first()).toBeVisible();
  const hrefs = await links.evaluateAll((els) => els.map((el) => el.getAttribute("href") ?? ""));
  for (const href of hrefs) expect(href).toMatch(/^\/projects\/[^/]+\/[^/]+$/);
  return hrefs;
}

// A full load of a project page, settled: the three headings, the pill `live`
// and no visible skeleton left in the main pane.
async function openProject(page: Page, href: string): Promise<void> {
  await page.goto(href);
  const main = page.getByRole("main");
  for (const title of SECTION_TITLES) {
    await expect(main.getByRole("heading", { level: 2, name: title, exact: true })).toBeVisible();
  }
  await waitForLive(page);
  await expect(main.locator('[aria-busy="true"]').filter({ visible: true })).toHaveCount(0, {
    timeout: 30_000,
  });
}

// The one walk over the sidebar's projects: opens each (a `prefer` href first
// when listed) with a full load, so no hidden Activity copy of the previous
// project lingers, and returns the first href `predicate` holds on, leaving
// the page there, or null. The data is live, so no slug is hard-coded.
async function findProjectWith(
  page: Page,
  predicate: (page: Page) => Promise<boolean>,
  options: { prefer?: string } = {},
): Promise<string | null> {
  // Proves the skip path (the negative probe); not a test-data switch.
  if (process.env.E2E_FIND_NONE === "1") return null;
  const hrefs = await projectHrefs(page);
  const { prefer } = options;
  const ordered =
    prefer !== undefined && hrefs.includes(prefer)
      ? [prefer, ...hrefs.filter((href) => href !== prefer)]
      : hrefs;
  for (const href of ordered) {
    // Each project is a page load or two against `next dev`; extend the
    // budget per project so a long sidebar does not time the walk out.
    test.setTimeout(test.info().timeout + 20_000);
    await openProject(page, href);
    if (await predicate(page)) return href;
  }
  return null;
}

// findProjectWith, or the test ends as skipped with `reason` in the report,
// never as a silent pass. Every data-dependent test goes through here.
export async function requireProject(
  page: Page,
  predicate: (page: Page) => Promise<boolean>,
  reason: string,
  options: { prefer?: string } = {},
): Promise<string> {
  const href = await findProjectWith(page, predicate, options);
  test.skip(href === null, reason);
  // test.skip throws on a null href; this only narrows the type.
  if (href === null) throw new Error(reason);
  return href;
}
