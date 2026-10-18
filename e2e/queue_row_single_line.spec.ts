import {
  expect,
  hasQueuedItem,
  openFirstProject,
  requireProject,
  section,
  sectionRows,
  test,
} from "./fixtures";

// Each Queue row is one row (issue number, title, the `queued` pill, the title
// may wrap) with no `label:` chip, no wait and no start hint, and the rail
// markers read `next`, then the ordinals.

test.describe("queue row single line", () => {
  test("Up next shows the queue or the empty panel", async ({ page }) => {
    await openFirstProject(page);
    const upNext = section(page, "Up next");
    await expect(
      page.getByRole("main").getByRole("heading", { level: 2, name: "Up next", exact: true }),
    ).toBeVisible();
    await expect(
      sectionRows(page, "Up next")
        .first()
        .or(upNext.getByText("Nothing queued.", { exact: true })),
    ).toBeVisible();
  });

  test("queue rows are single, marked rows", async ({ page }) => {
    await requireProject(page, hasQueuedItem, "no project has a queued item");
    const rows = sectionRows(page, "Up next");
    const count = await rows.count();

    // The gutter is the li's first div; it holds the marker.
    const marker = (i: number) => rows.nth(i).locator("xpath=./div").first();
    await expect(marker(0)).toHaveText("next");
    if (count > 1) await expect(marker(1)).toHaveText("2");
    if (count > 2) await expect(marker(2)).toHaveText("3");

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      await expect(row).toContainText(/#\d+/);
      await expect(row.getByText("queued", { exact: true })).toBeVisible();
      // The forbidden words are row chrome, so the issue title is left out: a
      // live title can hold them ("awaiting" contains "waiting").
      const chrome = await row.evaluate((li) => {
        const clone = li.cloneNode(true) as HTMLElement;
        const title = clone.querySelector(":scope > div:last-of-type a")?.nextElementSibling;
        if (title?.tagName === "SPAN" && title.children.length === 0) title.remove();
        return clone.textContent ?? "";
      });
      for (const text of ["label:", "waiting", "starts ", "manual", "Removing the label"]) {
        expect(chrome, chrome).not.toContain(text);
      }
      // The lower-case pill is expected; a capitalised `Queued` is not.
      expect(chrome, chrome).not.toMatch(/Queued/);
    }

    const g = await rows.first().evaluate((li) => {
      const card = li.querySelector(":scope > div:last-of-type");
      const link = card?.querySelector("a");
      if (!card || !link) throw new Error("the queue row has no card or issue link");
      const next = link.nextElementSibling;
      const title = next?.tagName === "SPAN" && next.children.length === 0 ? next : null;
      const pill = Array.from(card.querySelectorAll("span")).find(
        (s) => s.textContent?.trim() === "queued",
      );
      if (!pill) throw new Error("the queue row has no pill");
      const style = getComputedStyle(card);
      const pillRect = pill.getBoundingClientRect();
      return {
        pillTop: pillRect.top,
        pillRight: pillRect.right,
        refTop: (title ?? link).getBoundingClientRect().top,
        contentRight:
          card.getBoundingClientRect().right -
          parseFloat(style.borderRightWidth) -
          parseFloat(style.paddingRight),
      };
    });
    expect(Math.abs(g.pillTop - g.refTop)).toBeLessThanOrEqual(2);
    expect(Math.abs(g.pillRight - g.contentRight)).toBeLessThanOrEqual(2);
  });
});
