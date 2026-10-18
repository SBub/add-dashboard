import { expect, servedHtml, test, type Page, type Request } from "./fixtures";

// The daily log shows today's figures in their own card above the past days,
// the card is in the served HTML, and its Refresh button refetches only
// today's rows from Supabase in the browser: no request to the app, no
// navigation, the past days untouched. No Supabase response is mocked: the
// claim is which requests are made.

const TODAY_READS = ["daily_summary", "daily_model_summary", "daily_phase_summary"] as const;

function todayCard(page: Page) {
  return page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { level: 2, name: /^Today,/ }) });
}

function pastCards(page: Page) {
  return page
    .getByRole("article")
    .filter({ hasNot: page.getByRole("heading", { level: 2, name: /^Today,/ }) });
}

// The day after `day` (`YYYY-MM-DD`), in UTC, from the attribute alone.
function nextDay(day: string): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
}

async function todayDate(page: Page): Promise<string> {
  const day = await todayCard(page)
    .getByRole("heading", { level: 2 })
    .locator("time")
    .getAttribute("datetime");
  if (day === null) throw new Error("the today heading has no date");
  return day;
}

test.describe("landing today refresh", () => {
  test("the today card sits above the past days, a day after the window", async ({ page }) => {
    await page.goto("/projects/log");
    await expect(page.getByRole("heading", { level: 1, name: "Daily log" })).toBeVisible();
    const today = todayCard(page);
    await expect(today).toBeVisible();
    await expect(today.getByRole("button", { name: "Refresh", exact: true })).toBeVisible();
    const empty = page.getByText("No finished runs in the previous 30 days.");
    await expect(pastCards(page).first().or(empty)).toBeVisible();

    const windowLine = page.getByText(/, all projects$/);
    if ((await windowLine.count()) > 0) {
      const end = await windowLine.locator("time").getAttribute("datetime");
      if (end === null) throw new Error("the window line has no end date");
      expect(await todayDate(page)).toBe(nextDay(end));
    }
  });

  test("the served HTML holds the today card", async ({ request }) => {
    const html = await servedHtml(request, "/projects/log");
    expect(html).toContain("Today,");
    expect(html).toContain("Refresh");
  });

  test("Refresh reads only today's rows from Supabase", async ({ page }) => {
    await page.goto("/projects/log");
    const button = todayCard(page).getByRole("button", { name: "Refresh", exact: true });
    await expect(button).toBeEnabled();
    const empty = page.getByText("No finished runs in the previous 30 days.");
    await expect(pastCards(page).first().or(empty)).toBeVisible();
    const firstPast =
      (await pastCards(page).count()) > 0
        ? await pastCards(page).first().getByRole("heading", { level: 2 }).innerText()
        : null;
    const today = await todayDate(page);
    const appOrigin = new URL(page.url()).origin;

    const recorded: Request[] = [];
    page.on("request", (request) => recorded.push(request));
    const responses = TODAY_READS.map((table) =>
      page.waitForResponse((response) => new URL(response.url()).pathname === `/rest/v1/${table}`),
    );
    await button.click();
    await Promise.all(responses);
    await expect(button).toBeEnabled();
    await expect(button).toHaveText("Refresh");

    const urls = recorded.map((request) => ({
      method: request.method(),
      url: new URL(request.url()),
    }));
    // No document, no _rsc request, no server action POST.
    expect(urls.filter(({ url }) => url.origin === appOrigin).map(({ url }) => url.href)).toEqual(
      [],
    );
    const firstRest = urls.find(({ url }) => url.pathname.startsWith("/rest/v1/"));
    if (!firstRest) throw new Error("Refresh made no Supabase REST request");
    const supabase = urls.filter(({ url }) => url.origin === firstRest.url.origin);
    const rest = (table: string) =>
      supabase.filter(({ url }) => url.pathname === `/rest/v1/${table}`);

    for (const table of TODAY_READS) {
      const reads = rest(table);
      expect(reads, table).toHaveLength(1);
      expect(reads[0]?.method).toBe("GET");
      expect(reads[0]?.url.searchParams.get("day")).toBe(`eq.${today}`);
    }
    const projects = rest("projects");
    expect(projects.length).toBeLessThanOrEqual(1);
    for (const read of projects) expect(read.method).toBe("GET");
    // The worker widget polls adw.workers every 30 s on its own, so a GET to
    // workers may land in this window; it is not caused by the click.
    const known = new Set([...TODAY_READS, "projects"].map((table) => `/rest/v1/${table}`));
    const others = supabase.filter(({ url }) => !known.has(url.pathname));
    for (const other of others) {
      expect(`${other.method} ${other.url.pathname}`).toBe("GET /rest/v1/workers");
    }

    const url = new URL(page.url());
    expect(url.pathname + url.search).toBe("/projects/log");
    await expect(page.getByText(/Refresh failed/)).toHaveCount(0);
    if (firstPast !== null) {
      await expect(pastCards(page).first().getByRole("heading", { level: 2 })).toHaveText(
        firstPast,
      );
    }
  });
});
