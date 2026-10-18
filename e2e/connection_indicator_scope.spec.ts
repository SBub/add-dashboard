import { expect, expectNotFound, openFirstProject, test, waitForLive } from "./fixtures";

// The Realtime connection pill exists only on the dashboard routes, where the
// channel is opened: /projects, /projects/log and the project pages. / and
// /hire show none, the pill reaches live again after a round trip through /,
// and the old /summary and /watch addresses render the not-found page.

const PILL_TEXT = /^(connecting|live|reconnecting)$/;

test.describe("connection indicator scope", () => {
  test("/ has no pill and no sidebar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Sviatlana Buben" })).toBeVisible();
    await expect(page.getByText("Product Engineer, AI Consultant")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Projects" })).toHaveCount(0);
    await expect(page.getByRole("status")).toHaveCount(0);
  });

  test("/projects carries the sidebar and a live pill", async ({ page }) => {
    await page.goto("/projects");
    await expect(page).toHaveURL("/projects");
    await expect(page.getByRole("navigation", { name: "Projects" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Building now" })).toBeVisible();
    await waitForLive(page);
  });

  test("the pill is live again after a round trip through /", async ({ page }) => {
    const href = await openFirstProject(page);
    await expect(page).toHaveURL(href);
    await waitForLive(page);

    await page
      .getByRole("banner")
      .getByRole("link", { name: "Sviatlana Buben, building in public" })
      .click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { level: 1, name: "Sviatlana Buben" })).toBeVisible();
    await expect(page.getByRole("status")).toHaveCount(0);
    // The previous route's pill is kept in a hidden Activity subtree under
    // cacheComponents, where it reads `connecting`; it is not rendered and does
    // not count, so only a visible match would.
    await expect(page.getByText(PILL_TEXT).filter({ visible: true })).toHaveCount(0);

    await page.goBack();
    await expect(page).toHaveURL(href);
    await waitForLive(page);
    await expect(
      page.getByRole("navigation", { name: "Sections" }).getByRole("link", { name: "Summary" }),
    ).toHaveCount(0);
  });

  test("/projects/log carries the sidebar and a live pill", async ({ page }) => {
    await page.goto("/projects/log");
    await expect(page.getByRole("heading", { level: 1, name: "Daily log" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Projects" })).toBeVisible();
    await waitForLive(page);
  });

  for (const path of ["/summary?days=7", "/watch"]) {
    test(`${path} renders not-found with no redirect`, async ({ page }) => {
      await expectNotFound(page, path);
    });
  }

  test("/hire has no pill and no sidebar", async ({ page }) => {
    await page.goto("/hire");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Projects" })).toHaveCount(0);
  });
});
