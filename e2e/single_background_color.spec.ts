import { SCHEMES, expect, openFirstProject, test, waitForLive, type Page } from "./fixtures";

// One page background from the top of the window to the bottom, in light and
// dark: html and body paint the same opaque colour, color-scheme names both
// schemes, main and its shell wrapper paint no second shade, and the sticky
// header paints the body colour, including when the content is shorter than
// the window. Reads only.

const TRANSPARENT = "rgba(0, 0, 0, 0)";

interface Colours {
  html: string;
  body: string;
  main: string | null;
  shell: string | null;
  header: string | null;
  bottom: string;
  colorScheme: string;
}

function readColours(page: Page): Promise<Colours> {
  return page.evaluate(() => {
    const bg = (el: Element | null) => (el ? getComputedStyle(el).backgroundColor : null);
    const html = getComputedStyle(document.documentElement).backgroundColor;
    // The painted colour of the bottom area: the first ancestor of the
    // element there that paints a background, else the root.
    let bottom = html;
    let el = document.elementFromPoint(innerWidth / 2, innerHeight - 5);
    while (el) {
      const colour = getComputedStyle(el).backgroundColor;
      if (colour !== "rgba(0, 0, 0, 0)") {
        bottom = colour;
        break;
      }
      el = el.parentElement;
    }
    return {
      html,
      body: getComputedStyle(document.body).backgroundColor,
      main: bg(document.querySelector("main")),
      shell: bg(document.querySelector("main > div")),
      header: bg(document.querySelector("body > header")),
      bottom,
      colorScheme: getComputedStyle(document.documentElement).colorScheme,
    };
  });
}

function expectOneShade(colours: Colours, element: "main" | "shell"): void {
  const colour = colours[element];
  if (colour === null) return;
  expect(
    colour === TRANSPARENT || colour === colours.body,
    `${element === "main" ? "main" : "main > div"} paints a second shade: ${colour} on ${colours.body}`,
  ).toBe(true);
}

test.describe("single background colour", () => {
  test("/projects at 1920x2000 paints one colour in light and dark", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 2000 });
    const html: Record<string, string> = {};

    for (const colorScheme of SCHEMES) {
      await test.step(colorScheme, async () => {
        await page.emulateMedia({ colorScheme });
        await page.goto("/projects");
        await waitForLive(page);
        const colours = await readColours(page);
        const detail = JSON.stringify(colours);
        expect(colours.html, detail).not.toBe(TRANSPARENT);
        expect(colours.body, detail).toBe(colours.html);
        expect(colours.bottom, detail).toBe(colours.body);
        expectOneShade(colours, "main");
        expectOneShade(colours, "shell");
        expect(colours.header, `the header paints a second shade: ${detail}`).toBe(colours.body);
        expect(colours.colorScheme).toContain("light");
        expect(colours.colorScheme).toContain("dark");
        html[colorScheme] = colours.html;
      });
    }

    expect(html.dark, "dark and light paint the same colour").not.toBe(html.light);
  });

  test("/, /projects/log and a project page paint html and body the same", async ({ page }) => {
    for (const colorScheme of SCHEMES) {
      await test.step(colorScheme, async () => {
        await page.emulateMedia({ colorScheme });

        const check = async (where: string) => {
          const colours = await readColours(page);
          const detail = `${where}: ${JSON.stringify(colours)}`;
          expect(colours.html, detail).not.toBe(TRANSPARENT);
          expect(colours.body, detail).toBe(colours.html);
          expectOneShade(colours, "main");
        };

        await page.goto("/");
        await check("/");
        await page.goto("/projects/log");
        await check("/projects/log");

        await page.goto("/projects");
        // The sidebar has loaded once the pill is live; only then is an empty
        // project list a real empty list.
        await waitForLive(page);
        const count = await page
          .getByRole("navigation", { name: "Projects" })
          .getByRole("link")
          .count();
        if (count === 0) {
          test.info().annotations.push({
            type: "skip",
            description: "no public project in the sidebar",
          });
          return;
        }
        const href = await openFirstProject(page);
        await check(href);
      });
    }
  });
});
