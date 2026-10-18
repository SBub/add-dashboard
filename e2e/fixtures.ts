import { test as base, expect, type Page } from "@playwright/test";

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
