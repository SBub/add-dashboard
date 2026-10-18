import { expect, section, sectionRows, test, waitForLive, type Page } from "./fixtures";

// /projects lists every active run grouped by project, and the sidebar's
// running and failed counts and a project page's Building now section show
// the same runs, because all three read one shared Active entry. The search
// here is the overview itself, not the sidebar walk.

interface Counts {
  running: number;
  failed: number;
}

// The running and failed counts of a sidebar entry, read from the count
// spans' titles (`<n> running`, `<n> failed`).
async function sidebarCounts(page: Page, href: string): Promise<Counts> {
  const titles = await page
    .getByRole("navigation", { name: "Projects" })
    .locator(`a[href="${href}"] [title]`)
    .evaluateAll((els) => els.map((el) => el.getAttribute("title") ?? ""));
  const read = (pattern: RegExp) => {
    const match = titles.map((t) => pattern.exec(t)).find((m) => m !== null);
    if (!match) throw new Error(`the sidebar entry ${href} has no ${pattern.source} count`);
    return Number(match[1]);
  };
  return { running: read(/^(\d+) running$/), failed: read(/^(\d+) failed$/) };
}

async function sidebarHrefs(page: Page): Promise<string[]> {
  return page
    .getByRole("navigation", { name: "Projects" })
    .getByRole("link")
    .evaluateAll((els) => els.map((el) => el.getAttribute("href") ?? ""));
}

interface Group {
  name: string;
  href: string;
  adwIds: string[];
  counts: Counts;
}

// Each overview group: its heading link, its rows' adw_ids in order and the
// number of rows per status pill.
async function overviewGroups(page: Page): Promise<Group[]> {
  return section(page, "Building now")
    .locator("section")
    .filter({ visible: true })
    .evaluateAll((sections) =>
      sections.map((s) => {
        const link = s.querySelector("h3 a");
        const statuses: string[] = [];
        const adwIds: string[] = [];
        for (const li of Array.from(s.querySelectorAll("li"))) {
          adwIds.push(li.querySelector(":scope > div > div > code")?.textContent ?? "");
          statuses.push(
            li.querySelector(":scope > div:first-child > div:last-child")?.textContent?.trim() ??
              "",
          );
        }
        return {
          name: link?.textContent?.trim() ?? "",
          href: link?.getAttribute("href") ?? "",
          adwIds,
          counts: {
            running: statuses.filter((t) => t === "running").length,
            failed: statuses.filter((t) => t === "failed").length,
          },
        };
      }),
    );
}

async function openOverview(page: Page): Promise<void> {
  await page.goto("/projects");
  await waitForLive(page);
  await expect(
    page.getByRole("main").getByRole("heading", { level: 2, name: "Building now", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("main").locator('[aria-busy="true"]').filter({ visible: true }),
  ).toHaveCount(0, { timeout: 30_000 });
}

function emptyPanel(page: Page) {
  return section(page, "Building now").getByText("No runs in progress.", { exact: true });
}

test.describe("active runs shared entry", () => {
  test("the overview has a Building now heading and groups or the empty panel", async ({
    page,
  }) => {
    await openOverview(page);
    const group = section(page, "Building now").getByRole("heading", { level: 3 }).first();
    await expect(group.or(emptyPanel(page))).toBeVisible();
    if (await group.isVisible()) await expect(group.getByRole("link")).toBeVisible();
  });

  test("an empty overview means zero counts everywhere", async ({ page }) => {
    await openOverview(page);
    test.skip(!(await emptyPanel(page).isVisible()), "the overview has active runs");
    for (const href of await sidebarHrefs(page)) {
      expect(await sidebarCounts(page, href)).toEqual({ running: 0, failed: 0 });
    }
  });

  test("counts and the project page agree with the overview", async ({ page }) => {
    await openOverview(page);
    test.skip(await emptyPanel(page).isVisible(), "no active run on /projects");
    const groups = await overviewGroups(page);
    expect(groups.length).toBeGreaterThan(0);

    // For every project: its sidebar counts are its overview rows per status.
    for (const href of await sidebarHrefs(page)) {
      const group = groups.find((g) => g.href === href);
      expect(await sidebarCounts(page, href)).toEqual(group?.counts ?? { running: 0, failed: 0 });
    }

    const first = groups[0];
    if (first === undefined) throw new Error("the overview has no group");
    expect(first.adwIds.length).toBeGreaterThan(0);
    await section(page, "Building now")
      .getByRole("heading", { level: 3 })
      .first()
      .getByRole("link")
      .click();
    await expect(page).toHaveURL(first.href);
    await expect(
      page.getByRole("heading", { level: 1, name: first.name, exact: true }),
    ).toBeVisible();
    await waitForLive(page);

    // /projects now sits in a hidden Activity; sectionRows reads only the
    // visible project page.
    const rows = sectionRows(page, "Building now");
    await expect(rows).toHaveCount(first.adwIds.length);
    const ids = await rows.evaluateAll((lis) =>
      lis.map((li) => li.querySelector(":scope > div > div > code")?.textContent ?? ""),
    );
    expect(ids).toEqual(first.adwIds);
    expect(await sidebarCounts(page, first.href)).toEqual(first.counts);
  });
});
