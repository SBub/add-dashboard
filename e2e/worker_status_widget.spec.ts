import {
  expect,
  servedHtml,
  sidebarProjectLinks,
  test,
  waitForLive,
  waitForWorkerState,
  workerWidget,
  type Page,
} from "./fixtures";

// The sidebar's worker widget shows whether the ADW queue worker is alive:
// the served HTML carries the clock-free `Checking status...` snapshot next to
// the run rows, the widget reaches a known state against the live database,
// sits at the bottom of the sidebar on desktop and after the project strip on
// mobile, is on /projects/log, and is absent on / and /hire.

const WIDGET_TEXT =
  /^(Ready to build|Offline)\s*(last beat \d{2}\.\d{2}\.\d{4} \d{2}:\d{2} UTC|never seen)$/;

// The widget area: the state text's parent, the aria-live container.
function widgetArea(page: Page) {
  return workerWidget(page).locator("xpath=..");
}

// The widget is the last area of the aside (its bottom within 1px of the
// aside's bottom minus its padding) and fully inside the viewport.
async function expectAtSidebarBottom(page: Page): Promise<void> {
  const area = widgetArea(page);
  await expect(area).toHaveAttribute("aria-live", "polite");
  const geometry = await area.evaluate((el) => {
    const aside = el.closest("aside");
    if (!aside) throw new Error("the widget is not in the aside");
    const box = el.getBoundingClientRect();
    const asideBox = aside.getBoundingClientRect();
    return {
      top: box.top,
      left: box.left,
      right: box.right,
      bottom: box.bottom,
      asideInnerBottom: asideBox.bottom - parseFloat(getComputedStyle(aside).paddingBottom),
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
    };
  });
  expect(Math.abs(geometry.bottom - geometry.asideInnerBottom)).toBeLessThanOrEqual(1);
  expect(geometry.top).toBeGreaterThanOrEqual(0);
  expect(geometry.left).toBeGreaterThanOrEqual(0);
  expect(geometry.right).toBeLessThanOrEqual(geometry.innerWidth);
  expect(geometry.bottom).toBeLessThanOrEqual(geometry.innerHeight);
}

test.describe("worker status widget", () => {
  test("the served /projects HTML holds the unknown state and the run rows", async ({
    request,
  }) => {
    const html = await servedHtml(request, "/projects");
    expect(html).toContain("Checking status...");
    expect(
      /<code[^>]*>[0-9a-f]{8}<\/code>/.test(html) || html.includes("No runs in progress."),
    ).toBe(true);
  });

  test("reaches a known state at the bottom of the sidebar", async ({ page }) => {
    await page.goto("/projects");
    await waitForLive(page);
    await waitForWorkerState(page);
    const area = widgetArea(page);
    await expect(area).toHaveText(WIDGET_TEXT);
    // Never a pid or a start time; the full-text match above rules out a host name.
    await expect(area).not.toContainText("started");
    await expect(area).not.toContainText("pid");
    await expectAtSidebarBottom(page);

    const first = sidebarProjectLinks(page).first();
    const href = await first.getAttribute("href");
    if (href === null) throw new Error("the first project link has no href");
    await first.click();
    await expect(page).toHaveURL(href);
    await expect(workerWidget(page)).toBeVisible();
    await expectAtSidebarBottom(page);

    await page.setViewportSize({ width: 375, height: 667 });
    const strip = await page.getByRole("navigation", { name: "Projects" }).boundingBox();
    const widget = await widgetArea(page).boundingBox();
    if (!strip || !widget) throw new Error("the project strip or the widget has no box");
    expect(widget.y).toBeGreaterThan(strip.y + strip.height);
  });

  test("/projects/log shows the widget at the bottom of the sidebar", async ({ page }) => {
    await page.goto("/projects/log");
    await expect(workerWidget(page)).toBeVisible();
    await expectAtSidebarBottom(page);
    await waitForWorkerState(page);
  });

  test("/ and /hire have no widget", async ({ page }) => {
    await page.goto("/projects");
    await expect(workerWidget(page)).toBeVisible();
    const hidden = page
      .getByText(/^(Ready to build|Offline|Checking status\.\.\.)$/)
      .filter({ visible: true });

    await page
      .getByRole("banner")
      .getByRole("link", { name: "Sviatlana Buben, building in public" })
      .click();
    await expect(page).toHaveURL("/");
    // The dashboard's subtree stays in the document inside a hidden Activity
    // under cacheComponents; only a visible widget would count.
    await expect(hidden).toHaveCount(0);

    await page.goto("/hire");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(hidden).toHaveCount(0);
  });
});
