import { expect, floatingHirePlacement, openFirstProject, test, type Locator } from "./fixtures";

// The header's Work with me link, the /hire shell, its form, the shared accent,
// browser-side validation and the states read from the URL. It never submits a
// valid form: a valid submit would email hire@issebya.com.

const NO_OFFER_BLOCK_TEXT = "Structure and automate your processes with AI";

function fuchsiaClasses(locator: Locator): Promise<string[]> {
  return locator.evaluate((el) => [...el.classList].filter((c) => c.startsWith("bg-fuchsia-")));
}

test.describe("hire page", () => {
  test("the header links to /hire on every route, current only there", async ({ page }) => {
    const hire = page.getByRole("banner").getByRole("link", { name: "Work with me" });

    await page.goto("/");
    await expect(hire).toHaveAttribute("href", "/hire");
    await expect(hire).not.toHaveAttribute("aria-current");

    await page.goto("/projects");
    await expect(hire).toHaveAttribute("href", "/hire");
    await expect(hire).not.toHaveAttribute("aria-current");

    await openFirstProject(page);
    await expect(hire).toBeVisible();
    await hire.click();
    await expect(page).toHaveURL("/hire");
    await expect(hire).toHaveAttribute("aria-current", "page");

    // With cacheComponents, Next keeps the project page in the document inside
    // a hidden React Activity. Role locators skip hidden subtrees, so they judge
    // presence correctly; a raw nav[aria-label=Projects] query would not.
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(page.getByText(/^(connecting|live|reconnecting)$/)).not.toBeVisible();
    await expect(page.getByRole("navigation", { name: "Projects" })).toHaveCount(0);
  });

  test("shows the static shell with no offer blocks", async ({ page }) => {
    await page.goto("/hire");
    const heading = page.getByRole("heading", { level: 1, name: "Work with me" });
    const location = page.getByText("Remote, Lisbon");
    await expect(heading).toBeVisible();
    await expect(location).toBeVisible();
    const headingBox = await heading.boundingBox();
    const locationBox = await location.boundingBox();
    if (!headingBox || !locationBox) throw new Error("shell lines have no box");
    expect(locationBox.y).toBeGreaterThanOrEqual(headingBox.y + headingBox.height);

    const linkedIn = page.getByRole("link", { name: "LinkedIn profile" });
    await expect(linkedIn).toHaveAttribute("target", "_blank");
    await expect(linkedIn).toHaveAttribute("rel", "noreferrer");
    await expect(page.getByText("[Placeholder]")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 2 })).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 3 })).toHaveCount(0);
    await expect(page.getByText(NO_OFFER_BLOCK_TEXT)).toHaveCount(0);
  });

  test("the select offers exactly two offers and drives the prompt", async ({ page }) => {
    await page.goto("/hire");
    const select = page.getByLabel("What brings you here?");
    await expect(select.getByRole("option")).toHaveCount(2);
    const options = await select.evaluate((el) =>
      [...(el as HTMLSelectElement).options].map((o) => [o.value, o.text]),
    );
    expect(options).toEqual([
      ["Product engineer", "I need a product engineer"],
      ["AI consulting", "I want to structure and automate my processes with AI"],
    ]);
    await expect(select).toHaveValue("Product engineer");
    await expect(page.getByLabel("What are you building?")).toBeVisible();

    await select.selectOption("AI consulting");
    await expect(page.getByLabel("Tell me about your business")).toBeVisible();
    await select.selectOption("Product engineer");
    await expect(page.getByLabel("What are you building?")).toBeVisible();
  });

  test("Send and the header link share the fuchsia accent", async ({ page }) => {
    await page.goto("/hire");
    const send = fuchsiaClasses(page.getByRole("button", { name: "Send" }));
    const header = fuchsiaClasses(
      page.getByRole("banner").getByRole("link", { name: "Work with me" }),
    );
    const [sendClasses, headerClasses] = await Promise.all([send, header]);
    expect(sendClasses.length).toBeGreaterThan(0);
    expect(sendClasses).toEqual(headerClasses);
  });

  test("an empty motivation is blocked by the browser", async ({ page }) => {
    await page.goto("/hire");
    await page.getByLabel("What brings you here?").selectOption("AI consulting");
    await page.getByLabel("Your email").fill("visitor@example.com");
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page).toHaveURL("/hire");
    const motivation = page.getByLabel("Tell me about your business");
    expect(
      await motivation.evaluate((el) => (el as HTMLTextAreaElement).validity.valueMissing),
    ).toBe(true);
  });

  test("?sent=1 shows the confirmation in place of the form", async ({ page }) => {
    await page.goto("/hire?sent=1");
    await expect(page.getByText("Thanks, your message was sent.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send" })).toHaveCount(0);
    await expect(page.getByLabel("Your email")).toHaveCount(0);
  });

  test("?error=verification shows its message above the form", async ({ page }) => {
    await page.goto("/hire?error=verification");
    const message = page.getByText("We could not verify you are human. Please try again.");
    const select = page.getByLabel("What brings you here?");
    await expect(message).toBeVisible();
    await expect(select).toBeVisible();
    const messageBox = await message.boundingBox();
    const selectBox = await select.boundingBox();
    if (!messageBox || !selectBox) throw new Error("message or select has no box");
    expect(messageBox.y).toBeLessThan(selectBox.y);
  });

  test("an unknown ?error= shows the plain form without echoing it", async ({ page }) => {
    await page.goto("/hire?error=<script>");
    await expect(page.getByLabel("What brings you here?")).toBeVisible();
    // Next's route announcer is a role=alert outside main, so scope to main.
    await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
    await expect(page.getByText("We could not verify you are human.")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText("<script>");
  });

  for (const { slug, value, prompt } of [
    { slug: "product-engineer", value: "Product engineer", prompt: "What are you building?" },
    { slug: "ai-consulting", value: "AI consulting", prompt: "Tell me about your business" },
  ]) {
    test(`?offer=${slug} fixes the offer in a hidden input`, async ({ page }) => {
      await page.goto(`/hire?offer=${slug}`);
      await expect(page.getByLabel(prompt)).toBeVisible();
      await expect(page.getByRole("heading", { level: 2 })).toHaveCount(0);
      await expect(page.getByRole("heading", { level: 3 })).toHaveCount(0);
      await expect(page.getByRole("combobox")).toHaveCount(0);
      const offer = page.locator('input[type="hidden"][name="offer"]');
      await expect(offer).toHaveCount(1);
      await expect(offer).toHaveValue(value);
      await expect(page.getByText(NO_OFFER_BLOCK_TEXT)).toHaveCount(0);
    });
  }

  for (const slug of ["nope", "<script>"]) {
    test(`?offer=${slug} falls back to the select`, async ({ page }) => {
      await page.goto(`/hire?offer=${slug}`);
      const select = page.getByRole("combobox");
      await expect(select).toHaveValue("Product engineer");
      await expect(page.getByRole("heading", { level: 2 })).toHaveCount(0);
      await expect(page.getByRole("heading", { level: 3 })).toHaveCount(0);
      await expect(page.locator("body")).not.toContainText("<script>");
    });
  }

  test("at 375px /hire fits and hides the floating link", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/hire");
    const banner = page.getByRole("banner");
    await expect(banner.getByRole("link", { name: /^Sviatlana Buben/ })).toBeVisible();
    await expect(banner.getByRole("link", { name: "Watch me build" })).toBeVisible();
    await expect(page.getByText("building in public")).toBeHidden();
    await expect(page.getByText("Remote, Lisbon")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      375,
    );

    const hire = page.locator('a[href="/hire"]');
    await expect(hire).toBeHidden();
    expect(await hire.evaluate((el) => getComputedStyle(el).display)).toBe("none");
    const headerBox = await page.locator("body > header").boundingBox();
    const hireBox = await hire.boundingBox();
    if (!headerBox) throw new Error("header has no box");
    if (hireBox) {
      const inside =
        hireBox.x >= headerBox.x &&
        hireBox.y >= headerBox.y &&
        hireBox.x + hireBox.width <= headerBox.x + headerBox.width &&
        hireBox.y + hireBox.height <= headerBox.y + headerBox.height;
      expect(inside).toBe(false);
    }
  });

  test("at 375px / floats the link bottom-right above the radio", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    const hire = page.getByRole("link", { name: "Work with me" });
    await expect(hire).toBeVisible();
    const radio = page.getByRole("region", { name: "NTS Slow Focus radio" });
    await expect(radio).toBeVisible();

    const placement = await floatingHirePlacement(hire);
    const radioHeight = await radio.evaluate((el) => el.getBoundingClientRect().height);
    expect(placement.position).toBe("fixed");
    expect(Math.abs(placement.right - 16), JSON.stringify(placement)).toBeLessThanOrEqual(2);
    expect(Math.abs(placement.bottom - (radioHeight + 16))).toBeLessThanOrEqual(2);
  });
});
