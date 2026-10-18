import {
  SCHEMES,
  expect,
  expectNoHorizontalOverflow,
  floatingHirePlacement,
  scrollToBottom,
  test,
  type Locator,
  type Page,
} from "./fixtures";

// The root header at every width from 320px: one 57px row, the one Work with
// me link (floating bottom-right 16px above the radio below 640, in the header
// from 640, hidden on /hire below 640), the tagline from 1024, and no
// horizontal overflow, in light and dark. Reads only.

const VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 640, height: 800 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1920, height: 1080 },
];
const PAGES = ["/", "/projects/log", "/writing", "/writing/my-moat"];
const TAGLINE = "Built with ADW, my AI developer workflow";

function header(page: Page): Locator {
  return page.locator("body > header");
}

function hireLink(page: Page): Locator {
  return page.getByRole("link", { name: "Work with me" });
}

async function expectInside(inner: Locator, outer: Locator): Promise<void> {
  const innerBox = await inner.boundingBox();
  const outerBox = await outer.boundingBox();
  if (!innerBox || !outerBox) throw new Error("the link or the header has no box");
  expect(innerBox.x).toBeGreaterThanOrEqual(outerBox.x);
  expect(innerBox.y).toBeGreaterThanOrEqual(outerBox.y);
  expect(innerBox.x + innerBox.width).toBeLessThanOrEqual(outerBox.x + outerBox.width);
  expect(innerBox.y + innerBox.height).toBeLessThanOrEqual(outerBox.y + outerBox.height);
}

// Linux Chromium keeps a 15px `scrollbar-gutter: stable` gutter (macOS and
// phones overlay the scrollbar), so a 320px window lays the page out in 305px.
// Below 640 widen the window by the gutter so the page gets the phone's width,
// as it does on a phone. Media queries still see a width below 640.
async function fitPhoneWidth(page: Page, viewport: { width: number; height: number }) {
  if (viewport.width >= 640) return;
  const gutter = await page.evaluate(
    () => window.innerWidth - document.documentElement.getBoundingClientRect().width,
  );
  if (gutter > 0) {
    await page.setViewportSize({ width: viewport.width + gutter, height: viewport.height });
  }
}

// Checks every page shares, /hire included.
async function expectHeaderRow(page: Page, width: number): Promise<void> {
  const height = await header(page).evaluate((el) => el.getBoundingClientRect().height);
  expect(Math.abs(height - 57), `header height ${height}`).toBeLessThanOrEqual(1);

  const tagline = page.getByText(TAGLINE, { exact: true });
  if (width < 1024) {
    await expect(tagline).toBeHidden();
    expect(await tagline.evaluate((el) => getComputedStyle(el).display)).toBe("none");
  } else {
    await expect(tagline).toBeVisible();
  }
  await expectNoHorizontalOverflow(page);
}

test.describe("header at every width", () => {
  for (const colorScheme of SCHEMES) {
    for (const viewport of VIEWPORTS) {
      test(`${colorScheme} ${viewport.width}x${viewport.height}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme });
        await page.setViewportSize(viewport);

        for (const path of PAGES) {
          await test.step(path, async () => {
            await page.goto(path);
            await fitPhoneWidth(page, viewport);
            const link = hireLink(page);
            await expect(page.locator('a[href="/hire"]')).toHaveCount(1);
            await expect(link).toHaveCount(1);
            await expect(page.locator('a[href="/hire"]')).toHaveAccessibleName("Work with me");
            await expect(link).toBeVisible();

            if (viewport.width < 640) {
              const radio = page.getByRole("region", { name: "NTS Slow Focus radio" });
              await expect(radio).toBeVisible();
              const radioHeight = await radio.evaluate((el) => el.getBoundingClientRect().height);
              const placement = await floatingHirePlacement(link);
              const detail = JSON.stringify(placement);
              expect(placement.position).toBe("fixed");
              const inViewport = await link.evaluate((el) => {
                const rect = el.getBoundingClientRect();
                const root = document.documentElement;
                return (
                  rect.left >= 0 &&
                  rect.top >= 0 &&
                  rect.right <= root.getBoundingClientRect().width &&
                  rect.bottom <= root.clientHeight
                );
              });
              expect(inViewport, detail).toBe(true);
              expect(Math.abs(placement.right - 16), detail).toBeLessThanOrEqual(2);
              expect(Math.abs(placement.bottom - (radioHeight + 16)), detail).toBeLessThanOrEqual(
                2,
              );
              expect(placement.height, detail).toBeGreaterThanOrEqual(44);

              await scrollToBottom(page);
              const clears = await page.evaluate(() => {
                const end = document.querySelector("main")?.lastElementChild;
                const hire = document.querySelector('a[href="/hire"]');
                if (!end || !hire) return null;
                return {
                  end: end.getBoundingClientRect().bottom,
                  link: hire.getBoundingClientRect().top,
                };
              });
              if (!clears) throw new Error("main has no last child or the link is missing");
              expect(clears.end, "the end of main clears the link").toBeLessThanOrEqual(
                clears.link,
              );
            } else {
              await expectInside(link, header(page));
              expect(await link.evaluate((el) => getComputedStyle(el).position)).not.toBe("fixed");
            }

            await expectHeaderRow(page, viewport.width);
          });
        }

        await test.step("/hire", async () => {
          await page.goto("/hire");
          await fitPhoneWidth(page, viewport);
          await expectHeaderRow(page, viewport.width);
        });
      });
    }
  }

  test("/hire hides the link at 390", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/hire");
    const link = page.locator('a[href="/hire"]');
    await expect(link).toBeHidden();
    expect(await link.evaluate((el) => getComputedStyle(el).display)).toBe("none");
  });

  test("/hire marks the link current in the header at 1024", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/hire");
    const link = hireLink(page);
    await expect(link).toBeVisible();
    // Retries: the active state can stream in after the shell.
    await expect(link).toHaveAttribute("aria-current", "page");
    await expectInside(link, header(page));
  });
});
