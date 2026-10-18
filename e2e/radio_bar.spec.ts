import { readFileSync } from "node:fs";
import path from "node:path";
import {
  SCHEMES,
  expect,
  expectNoHorizontalOverflow,
  floatingHirePlacement,
  scrollToBottom,
  test,
  waitForLive,
  type Locator,
  type Page,
} from "./fixtures";

// The NTS Slow Focus footer: on every route with its credit link, fixed to the
// bottom at every width and scroll position, no live label and no red, a
// rounded box matching Work with me, never covering the end of a page or the
// floating link, silent on load, play and stop, the same <audio> across
// client-side navigation, and a polite error cleared by a retry.
//
// The stream URL is routed in the test browser only: to the committed silent
// fixture (play, navigation, stop) or to abort() (the error). Nothing is
// requested from the real stream, so NTS being down never fails the suite.
// The fixture is three minutes of silence, longer than the navigation test,
// regenerated with:
//   ffmpeg -f lavfi -i anullsrc=r=48000:cl=mono -t 180 -c:a libopus -b:a 6k e2e/assets/silence.ogg

declare global {
  interface Window {
    __radio?: HTMLAudioElement | null;
  }
}

const STREAM = "**/stream-mixtape-geo.ntslive.net/**";
const SILENCE = readFileSync(path.join(__dirname, "assets", "silence.ogg"));
const PAGE_URL = "https://www.nts.live/infinite-mixtapes/slow-focus";
const TITLE = "NTS · SLOW FOCUS";
const ERROR = "Can't reach NTS right now";

const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
  { width: 320, height: 568 },
];
const PAGES = ["/", "/projects/log", "/writing", "/writing/my-moat"];

function radio(page: Page): Locator {
  return page.getByRole("region", { name: "NTS Slow Focus radio" });
}

function audioState(page: Page): Promise<{ paused: boolean; hasSrc: boolean } | null> {
  return page.evaluate(() => {
    const audio = document.querySelector("audio");
    return audio ? { paused: audio.paused, hasSrc: audio.hasAttribute("src") } : null;
  });
}

function paused(page: Page): Promise<boolean | undefined> {
  return page.evaluate(() => document.querySelector("audio")?.paused);
}

// The bar is pinned: fixed, flush with the bottom of the root box, full width.
async function expectPinned(bar: Locator): Promise<void> {
  const pin = await bar.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const root = document.documentElement;
    return {
      position: getComputedStyle(el).position,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
      clientHeight: root.clientHeight,
      clientWidth: root.clientWidth,
    };
  });
  const detail = JSON.stringify(pin);
  expect(pin.position, detail).toBe("fixed");
  expect(Math.abs(pin.bottom - pin.clientHeight), detail).toBeLessThanOrEqual(1);
  expect(pin.left, detail).toBe(0);
  expect(Math.abs(pin.width - pin.clientWidth), detail).toBeLessThanOrEqual(1);
}

test.describe("radio bar", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(STREAM, (route) =>
      route.fulfill({ status: 200, contentType: "audio/ogg", body: SILENCE }),
    );
  });

  for (const colorScheme of SCHEMES) {
    for (const viewport of VIEWPORTS) {
      test(`layout ${colorScheme} ${viewport.width}x${viewport.height}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme });
        await page.setViewportSize(viewport);

        for (const route of PAGES) {
          await test.step(route, async () => {
            await page.goto(route);
            const bar = radio(page);
            await expect(bar).toBeVisible();
            await expect(bar).toContainText(TITLE);
            const credit = bar.getByRole("link");
            await expect(credit).toHaveAttribute("href", PAGE_URL);
            await expect(credit).toHaveAttribute("target", "_blank");

            await expectPinned(bar);

            expect(await bar.textContent()).not.toMatch(/live/i);
            const red = await bar.evaluate((el) =>
              [el, ...el.querySelectorAll("*")]
                .map((node) => getComputedStyle(node).backgroundColor)
                .filter((colour) => {
                  const m = colour.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                  if (!m) return false;
                  const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])];
                  return r > 150 && g < 100 && b < 100;
                }),
            );
            expect(red, "nothing in the bar is red").toEqual([]);

            const radius = await bar
              .getByRole("button")
              .evaluate((el) =>
                el.parentElement ? getComputedStyle(el.parentElement).borderRadius : "",
              );
            expect(radius).not.toBe("");
            expect(radius).not.toBe("0px");
            if (viewport.width === 1024) {
              const hireRadius = await page
                .getByRole("link", { name: "Work with me" })
                .evaluate((el) => getComputedStyle(el).borderRadius);
              expect(radius).toBe(hireRadius);
            }

            const hire = page.getByRole("link", { name: "Work with me" });
            if (viewport.width < 640) {
              const barTop = await bar.evaluate((el) => el.getBoundingClientRect().top);
              const placement = await floatingHirePlacement(hire);
              expect(
                placement.top + placement.height,
                "the floating link sits at least 8px above the bar",
              ).toBeLessThanOrEqual(barTop - 8);
            }

            await scrollToBottom(page);
            await expectPinned(bar);
            const ends = await page.evaluate(() => {
              const end = document.querySelector("main")?.lastElementChild;
              const region = document.querySelector(
                '[role="region"][aria-label="NTS Slow Focus radio"]',
              );
              const header = document.querySelector("body > header");
              const link = document.querySelector('a[href="/hire"]');
              if (!end || !region || !header || !link) return null;
              return {
                end: end.getBoundingClientRect().bottom,
                bar: region.getBoundingClientRect().top,
                header: header.getBoundingClientRect().top,
                link: link.getBoundingClientRect().top,
              };
            });
            if (!ends) throw new Error("main, the bar, the header or the link is missing");
            expect(ends.end, "the end of the page is above the footer").toBeLessThanOrEqual(
              ends.bar + 1,
            );
            expect(ends.header, "the header stays pinned at the top").toBe(0);
            if (viewport.width < 640) {
              expect(ends.end, "the end of main clears the floating link").toBeLessThanOrEqual(
                ends.link,
              );
            }
          });
        }
      });
    }
  }

  test("the sidebar ends above the bar at 1024", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/projects/log");
    const bar = radio(page);
    await expect(bar).toBeVisible();
    await scrollToBottom(page);
    const barTop = await bar.evaluate((el) => el.getBoundingClientRect().top);
    const asideBottom = await page
      .locator("aside")
      .evaluate((el) => el.getBoundingClientRect().bottom);
    expect(asideBottom, "the sidebar ends above the bar").toBeLessThanOrEqual(barTop);

    // The sidebar has loaded once the pill is live; only then is an empty
    // project list a real empty list.
    await waitForLive(page);
    const projects = page.getByRole("navigation", { name: "Projects" });
    const count = await projects.getByRole("link").count();
    test.skip(count === 0, "no public project in the sidebar");

    const last = await projects.evaluate((nav) => {
      let scroller: Element | null = nav;
      while (scroller && getComputedStyle(scroller).overflowY !== "auto") {
        scroller = scroller.parentElement;
      }
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
      const links = nav.querySelectorAll("a");
      const link = links[links.length - 1];
      const aside = nav.closest("aside");
      if (!link || !aside) return null;
      const box = link.getBoundingClientRect();
      const outer = aside.getBoundingClientRect();
      return {
        inside:
          box.left >= outer.left &&
          box.top >= outer.top &&
          box.right <= outer.right &&
          box.bottom <= outer.bottom,
        bottom: box.bottom,
      };
    });
    if (!last) throw new Error("the project list has no last link or no aside");
    expect(last.inside, "the last project link is inside the sidebar").toBe(true);
    expect(last.bottom, "the last project link is above the bar").toBeLessThan(barTop);
  });

  test("idle on load, plays, survives navigation, stops", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    await page.goto("/");

    const bar = radio(page);
    await expect(bar).toBeVisible();
    expect(await audioState(page)).toEqual({ paused: true, hasSrc: false });
    expect(requests.filter((url) => /ntslive\.net/.test(url))).toEqual([]);

    // Loading comes before playing (aria-busy, a Stop name): only the settled
    // state is asserted, with retrying expectations.
    await bar.getByRole("button", { name: "Play NTS Slow Focus" }).click();
    await expect.poll(() => paused(page), { timeout: 10_000 }).toBe(false);
    const stop = bar.getByRole("button", { name: "Stop NTS Slow Focus" });
    await expect(stop).toHaveAttribute("aria-pressed", "true", { timeout: 10_000 });

    await page.evaluate(() => {
      window.__radio = document.querySelector("audio");
    });

    const expectSameAudioPlaying = async () => {
      expect(await page.evaluate(() => document.querySelector("audio") === window.__radio)).toBe(
        true,
      );
      expect(await paused(page)).toBe(false);
      const before = await page.evaluate(() => document.querySelector("audio")?.currentTime ?? 0);
      // The journey's own measure: two seconds of playback.
      await page.waitForTimeout(2000);
      const after = await page.evaluate(() => document.querySelector("audio")?.currentTime ?? 0);
      expect(after).toBeGreaterThan(before);
    };

    const sections = page.getByRole("navigation", { name: "Sections" });
    await sections.getByRole("link", { name: "Writing" }).click();
    await expect(page).toHaveURL("/writing");
    await expectSameAudioPlaying();

    await sections.getByRole("link", { name: "Watch me build" }).click();
    await expect(page).toHaveURL("/projects");
    await expectSameAudioPlaying();

    await page.getByRole("link", { name: "Daily log" }).click();
    await expect(page).toHaveURL("/projects/log");
    await expectSameAudioPlaying();

    await page
      .getByRole("banner")
      .getByRole("link", { name: /^Sviatlana Buben/ })
      .click();
    await expect(page).toHaveURL("/");
    await expectSameAudioPlaying();

    await stop.click();
    await expect.poll(() => paused(page)).toBe(true);
    const play = bar.getByRole("button", { name: "Play NTS Slow Focus" });
    await expect(play).toHaveAttribute("aria-pressed", "false");
  });

  for (const colorScheme of SCHEMES) {
    for (const viewport of [
      { width: 1920, height: 1080 },
      { width: 390, height: 844 },
    ]) {
      test(`a failing stream shows the error and a retry clears it, ${colorScheme} ${viewport.width}x${viewport.height}`, async ({
        page,
      }) => {
        await page.emulateMedia({ colorScheme });
        await page.setViewportSize(viewport);
        await page.goto("/");
        const bar = radio(page);
        const play = bar.getByRole("button", { name: "Play NTS Slow Focus" });
        const stop = bar.getByRole("button", { name: "Stop NTS Slow Focus" });
        const live = bar.locator('[aria-live="polite"]');
        const phone = viewport.width < 640;

        const expectOneRow = async () => {
          if (!phone) return;
          await expectNoHorizontalOverflow(page);
          const height = await bar.evaluate((el) => el.getBoundingClientRect().height);
          // Under 40px plus the safe-area inset, which is 0 in headless.
          expect(height, "the bar stays one row").toBeLessThan(40);
        };

        await expect(play).toBeVisible();
        await expectOneRow();

        // Registered after the fixture route, so it wins until unrouted.
        const abort = (route: { abort: () => Promise<void> }) => route.abort();
        await page.route(STREAM, abort);
        await play.click();
        await expect(live).toHaveText(ERROR, { timeout: 10_000 });
        await expect(bar).toBeVisible();
        await expect(bar.getByRole("link")).toHaveAttribute("href", PAGE_URL);
        await expect(play).toBeVisible();
        await expectOneRow();

        await page.unroute(STREAM, abort);
        await play.click();
        await expect.poll(() => paused(page), { timeout: 10_000 }).toBe(false);
        await expect(live).toHaveText(TITLE, { timeout: 10_000 });
        await expect(bar).not.toContainText(ERROR);
        await expect(stop).toBeVisible();
        await expectOneRow();
        await stop.click();
        await expect.poll(() => paused(page)).toBe(true);
      });
    }
  }
});
