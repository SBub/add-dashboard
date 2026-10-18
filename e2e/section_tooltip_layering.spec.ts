import {
  expect,
  hasQueuedItem,
  openFirstProject,
  requireProject,
  section,
  test,
  type Page,
} from "./fixtures";

// A section heading's info tooltip (Up next, Building now, Shipped) opens on
// hover and on keyboard focus and is the topmost layer while open: the Queue
// rail's `next` pill and ordinal markers never paint over it.

const TOOLTIPS = [
  { title: "Up next", id: "section-up-next-detail" },
  { title: "Building now", id: "section-building-now-detail" },
  { title: "Shipped", id: "section-shipped-detail" },
] as const;

// elementFromPoint at the tooltip surface's centre, and at the centre of its
// overlap with the queue's `next` marker when they overlap, lands inside it.
async function assertTopmost(page: Page, detailId: string): Promise<void> {
  const hits = await page.evaluate((id) => {
    const tooltip = document.getElementById(id);
    const surface = tooltip?.firstElementChild;
    if (!tooltip || !surface) throw new Error(`#${id} has no surface`);
    const inside = (x: number, y: number) => {
      const el = document.elementFromPoint(x, y);
      return el !== null && tooltip.contains(el);
    };
    const r = surface.getBoundingClientRect();
    const result = { centre: inside(r.left + r.width / 2, r.top + r.height / 2), overlap: true };
    const marker = Array.from(document.querySelectorAll("main ol > li span")).find(
      (s) => s.children.length === 0 && s.textContent?.trim() === "next",
    );
    if (marker) {
      const m = marker.getBoundingClientRect();
      const left = Math.max(r.left, m.left);
      const right = Math.min(r.right, m.right);
      const top = Math.max(r.top, m.top);
      const bottom = Math.min(r.bottom, m.bottom);
      if (left < right && top < bottom)
        result.overlap = inside((left + right) / 2, (top + bottom) / 2);
    }
    return result;
  }, detailId);
  expect(hits).toEqual({ centre: true, overlap: true });
}

// Open, the tooltip leaves `sr-only` (a 1px box) for its full width.
async function expectOpen(page: Page, id: string, open: boolean): Promise<void> {
  const tooltip = page.locator(`[id="${id}"]`);
  const width = () => tooltip.evaluate((el) => el.getBoundingClientRect().width);
  if (open) {
    await expect(tooltip).toBeVisible();
    await expect.poll(width).toBeGreaterThan(100);
  } else {
    await expect.poll(width).toBeLessThanOrEqual(1);
  }
}

async function checkTooltips(page: Page): Promise<void> {
  for (const { title, id } of TOOLTIPS) {
    const button = page.getByRole("button", { name: `About ${title}` });
    await button.evaluate((el) => el.scrollIntoView({ block: "center" }));

    await button.hover();
    await expectOpen(page, id, true);
    await assertTopmost(page, id);

    // Keyboard: step off the button and Tab back onto it.
    await page.mouse.move(0, 0);
    await button.focus();
    await page.keyboard.press("Shift+Tab");
    await expect(button).not.toBeFocused();
    await expectOpen(page, id, false);
    await page.keyboard.press("Tab");
    await expect(button).toBeFocused();
    await expectOpen(page, id, true);
    await assertTopmost(page, id);
    await button.blur();
  }
}

test.describe("section tooltip layering", () => {
  test("tooltips sit above the queue rail", async ({ page }) => {
    await requireProject(page, hasQueuedItem, "no project has a queued item");
    // The overlap check is only meaningful with the `next` marker on the page.
    await expect(section(page, "Up next").getByText("next", { exact: true })).toBeVisible();
    await checkTooltips(page);
  });

  test("tooltips open on hover and focus", async ({ page }) => {
    // A full load: after the client navigation /projects stays in a hidden
    // Activity whose Building now tooltip carries the same id.
    await page.goto(await openFirstProject(page));
    for (const { title } of TOOLTIPS) {
      await expect(
        page.getByRole("main").getByRole("heading", { level: 2, name: title, exact: true }),
      ).toBeVisible();
    }
    await expect(
      page.getByRole("main").locator('[aria-busy="true"]').filter({ visible: true }),
    ).toHaveCount(0, { timeout: 30_000 });
    await checkTooltips(page);
  });
});
