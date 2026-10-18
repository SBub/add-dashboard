import {
  expect,
  expectInDocumentOrder,
  expectNoHorizontalScroll,
  sidebarProjectLinks,
  test,
  workerWidget,
  type Locator,
  type Page,
} from "./fixtures";

// The changelog inside the dashboard: the sidebar lists the projects, Daily
// log, Changelog, then the worker widget; /projects/changelog lists every push
// to production newest first, each with a stats strip; Changelog is current on
// the index and every entry page; an unknown entry renders the changelog
// not-found copy. The entries are repository content, not live data.

const REPO_PULLS = "https://github.com/SBub/adw-dashboard/pull/";
const ENTRY_HREF = /^\/projects\/changelog\/(\d{4}-\d{2}-\d{2}-pr(\d+))$/;
const COUNTS = /^\d+ features?, \d+ fix(es)?, \d+ chores?$|^Branch sync$|^Revert$/;

function sidebarEntry(page: Page, name: "Daily log" | "Changelog"): Locator {
  return page.locator("aside").getByRole("link", { name, exact: true });
}

function watchMeBuild(page: Page): Locator {
  return page
    .getByRole("navigation", { name: "Sections" })
    .getByRole("link", { name: "Watch me build" });
}

// The index cards: list items holding a stats strip. Role locators skip a
// hidden Activity subtree, so a previous route's lists never count.
function entries(page: Page): Locator {
  return page.getByRole("listitem").filter({ has: page.getByTestId("changelog-stats") });
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

// The newest card's id, pull request number and stats strip.
async function newestEntry(page: Page): Promise<{ id: string; pr: number; strip: Locator }> {
  const card = entries(page).first();
  const href = await card.locator('a[href^="/projects/changelog/"]').getAttribute("href");
  const match = href?.match(ENTRY_HREF);
  if (!match?.[1] || !match[2]) throw new Error(`the newest entry has an unexpected href: ${href}`);
  return { id: match[1], pr: Number(match[2]), strip: card.getByTestId("changelog-stats") };
}

test.describe("changelog", () => {
  test("the sidebar lists the projects, Daily log, Changelog, then the widget", async ({
    page,
  }) => {
    await page.goto("/projects");
    const links = sidebarProjectLinks(page);
    await expect(links.first()).toBeVisible();
    const changelog = sidebarEntry(page, "Changelog");
    await expect(sidebarEntry(page, "Daily log")).toHaveAttribute("href", "/projects/log");
    await expect(changelog).toHaveAttribute("href", "/projects/changelog");
    await expect(workerWidget(page)).toBeVisible();
    await expectInDocumentOrder(
      [links.last(), sidebarEntry(page, "Daily log"), changelog, workerWidget(page)],
      { strictTop: true },
    );
    await expect(changelog).not.toHaveAttribute("aria-current");
  });

  test("the index lists every push to production, newest first", async ({ page }) => {
    await page.goto("/projects");
    await sidebarEntry(page, "Changelog").click();
    await expect(page).toHaveURL("/projects/changelog");
    await expect(page.getByRole("heading", { level: 1, name: "Changelog" })).toBeVisible();

    const cards = entries(page);
    await expect(cards.first()).toBeVisible();
    // CHANGELOG_ENTRIES holds 10 modules: repository content, not a live count.
    expect(await cards.count()).toBeGreaterThanOrEqual(10);
    for (const card of await cards.all()) {
      await expect(card.locator("time")).toHaveCount(1);
      await expect(card.locator('a[href^="/projects/changelog/"]')).toHaveAttribute(
        "href",
        /^\/projects\/changelog\/[^/]+$/,
      );
      await expect(card.getByTestId("changelog-stats")).toBeVisible();
      await expect(card.locator("p").last()).toHaveText(COUNTS);
    }

    const dates = await cards
      .locator("time")
      .evaluateAll((times) => times.map((time) => time.getAttribute("datetime") ?? ""));
    for (let i = 1; i < dates.length; i++) {
      expect((dates[i] ?? "") <= (dates[i - 1] ?? "")).toBe(true);
    }
    await expect(cards.getByText(/promote develop to master/i)).toHaveCount(0);

    const { pr, strip } = await newestEntry(page);
    const link = strip.getByRole("link", { name: `Production pull request #${pr}`, exact: true });
    await expect(link).toHaveText(`#${pr}`);
    await expect(link).toHaveAttribute("href", `${REPO_PULLS}${pr}`);
  });

  test("the newest strip matches its pull request on GitHub", async ({ page, request }) => {
    await page.goto("/projects/changelog");
    await expect(entries(page).first()).toBeVisible();
    const { pr, strip } = await newestEntry(page);

    // The spec's form of the journey's `gh api`: a GET of a public endpoint.
    const token = process.env.GITHUB_TOKEN;
    const response = await request.get(
      `https://api.github.com/repos/SBub/adw-dashboard/pulls/${pr}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      },
    );
    test.skip(!response.ok(), `GitHub API unavailable: ${response.status()}`);
    const pull = (await response.json()) as {
      additions: number;
      deletions: number;
      commits: number;
      changed_files: number;
      comments: number;
      review_comments: number;
    };

    const diff = strip.getByRole("img", {
      name: `${plural(pull.additions, "line", "lines")} added, ${pull.deletions} removed`,
      exact: true,
    });
    await expect(diff).toContainText(`+${pull.additions}`);
    await expect(diff).toContainText(`−${pull.deletions}`);
    await expect(strip).toContainText(plural(pull.commits, "commit", "commits"));
    await expect(strip).toContainText(plural(pull.changed_files, "file", "files"));
    await expect(strip).toContainText(
      plural(pull.comments + pull.review_comments, "comment", "comments"),
    );
  });

  test("Changelog is the current sidebar entry on the index", async ({ page }) => {
    await page.goto("/projects/changelog");
    await expect(sidebarEntry(page, "Changelog")).toHaveAttribute("aria-current", "page");
    await expect(sidebarEntry(page, "Daily log")).not.toHaveAttribute("aria-current");
    for (const link of await sidebarProjectLinks(page).all()) {
      await expect(link).not.toHaveAttribute("aria-current");
    }
    await expect(watchMeBuild(page)).toHaveAttribute("aria-current", "page");
  });

  test("the newest entry page shows the same strip and what shipped", async ({ page }) => {
    await page.goto("/projects/changelog");
    await expect(entries(page).first()).toBeVisible();
    const { id, strip } = await newestEntry(page);
    const indexStrip = await strip.innerText();
    const indexDiff = await strip.getByRole("img").getAttribute("aria-label");

    await entries(page).first().locator('a[href^="/projects/changelog/"]').click();
    await expect(page).toHaveURL(`/projects/changelog/${id}`);
    // The entry page is an article; the index's strips stay in a hidden
    // Activity subtree, so every lookup below is scoped to the visible article.
    const article = page.getByRole("article");
    await expect(article.getByRole("heading", { level: 1 })).not.toContainText(
      /promote develop to master/i,
    );
    await expect(
      page.getByText(/Production is currently broken/).filter({ visible: true }),
    ).toHaveCount(0);

    const entryStrip = article.getByTestId("changelog-stats");
    await expect(entryStrip).toBeVisible();
    expect(await entryStrip.innerText()).toBe(indexStrip);
    await expect(entryStrip.getByRole("img")).toHaveAttribute("aria-label", indexDiff ?? "");

    await expect(
      article
        .getByRole("heading", { level: 2, name: /^(Features|Fixes|Chores|Reverted)$/ })
        .first(),
    ).toBeVisible();
    await expect(
      article.getByRole("listitem").locator(`a[href^="${REPO_PULLS}"]`).first(),
    ).toBeVisible();
    await expect(sidebarEntry(page, "Changelog")).toHaveAttribute("aria-current", "page");
  });

  test("/projects/log marks Daily log, not Changelog", async ({ page }) => {
    await page.goto("/projects/log");
    await expect(sidebarEntry(page, "Daily log")).toHaveAttribute("aria-current", "page");
    await expect(sidebarEntry(page, "Changelog")).not.toHaveAttribute("aria-current");
  });

  test("an unknown entry renders the changelog not-found copy in the shell", async ({ page }) => {
    await page.goto("/projects/changelog/does-not-exist");
    await expect(page.getByText("There is no changelog entry at this address.")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Projects" })).toBeVisible();
  });

  test("at 375px neither changelog page scrolls sideways", async ({ page }) => {
    await page.goto("/projects/changelog");
    await expect(entries(page).first()).toBeVisible();
    const { id } = await newestEntry(page);

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`/projects/changelog/${id}`);
    await expect(page.getByRole("article").getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoHorizontalScroll(page);

    await page.goto("/projects/changelog");
    await expect(entries(page).first()).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});
