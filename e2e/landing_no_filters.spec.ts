import { expect, expectInDocumentOrder, expectNotFound, test, type Page } from "./fixtures";

// The daily log at /projects/log has no Project or Window filter: the heading,
// the intro and the day cards for all projects over the fixed 30-day window.
// It ignores ?days and ?project, and the old /summary and /watch addresses
// render the not-found page with no redirect.

const INTRO = "What my AI developer workflow shipped each day, and what it cost.";

// The report as both loads in this spec must show it.
async function expectReport(page: Page): Promise<void> {
  const heading = page.getByRole("heading", { level: 1, name: "Daily log" });
  const intro = page.getByText(INTRO, { exact: true });
  await expect(heading).toBeVisible();
  await expect(intro).toBeVisible();
  await expectInDocumentOrder([heading, intro], { strictTop: true });

  await expect(page.getByText(/Times are UTC/)).toHaveCount(0);
  const today = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { level: 2, name: /^Today,/ }) });
  await expect(today).toBeVisible();
  // "published metrics" may appear inside a day card, never as a note above them.
  const notes = await page
    .locator("main p", { hasText: "published metrics" })
    .evaluateAll((paragraphs) => paragraphs.filter((p) => !p.closest("article")).length);
  expect(notes).toBe(0);

  const main = page.getByRole("main");
  await expect(main.getByRole("combobox")).toHaveCount(0);
  await expect(main.getByRole("button", { name: "Apply" })).toHaveCount(0);
  await expect(page.locator("main form")).toHaveCount(0);

  const past = page
    .getByRole("article")
    .filter({ hasNot: page.getByRole("heading", { level: 2, name: /^Today,/ }) });
  await expect(
    past.first().or(page.getByText("No finished runs in the previous 30 days.")),
  ).toBeVisible();
  test.skip((await past.count()) === 0, "no past day in the 30-day window");

  const windowLine = page.getByText(/, all projects$/);
  await expect(windowLine).toBeVisible();
  await expect(windowLine).toContainText("30 days");
  await expectInDocumentOrder([today, past.first()], { strictTop: true });
  const table = past.first().getByRole("table");
  await expect(table).toBeVisible();
  await expect(table.getByRole("columnheader").first()).toHaveText("Project");
  // The Project column is plain text: no link in its cells.
  await expect(table.locator("tbody tr > td:first-child a")).toHaveCount(0);
}

test.describe("landing without filters", () => {
  test("/projects/log shows the report with no filters", async ({ page }) => {
    await page.goto("/projects/log");
    await expectReport(page);
  });

  test("/projects/log ignores ?days and ?project", async ({ page }) => {
    await page.goto("/projects/log?days=7&project=x");
    // Both islands have streamed in before the error checks.
    await expect(page.getByRole("heading", { level: 2, name: /^Today,/ })).toBeVisible();
    await expect(
      page
        .getByRole("article")
        .nth(1)
        .or(page.getByText("No finished runs in the previous 30 days.")),
    ).toBeVisible();
    await expect(page.getByText("Could not load.")).toHaveCount(0);
    await expect(page.getByText(/No public project named/)).toHaveCount(0);
    await expectReport(page);
  });

  for (const path of ["/summary?days=7", "/watch"]) {
    test(`${path} renders not-found with no redirect`, async ({ page }) => {
      await expectNotFound(page, path);
      await expect(page.getByRole("heading", { level: 1, name: "Daily log" })).toHaveCount(0);
    });
  }
});
