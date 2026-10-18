import {
  expect,
  hasActiveRow,
  hasHistoryRow,
  requireProject,
  sectionRows,
  test,
  waitForLive,
  type Locator,
} from "./fixtures";

// Active rows show the phase as a word (Planning, Building, ..., Complete), in
// plain text, with the raw step key as the hover title; History rows show no
// phase. Probe: phaseLabel returning the key raw must fail this spec.

// The step keys phaseLabel turns into a word. Any other key is shown raw on
// purpose (a new toolkit step is never hidden), so only these are checked.
const KNOWN_STEPS = new Set([
  "ensure_adw_id",
  "queue:classification",
  ...["plan", "build", "test", "review", "document", "ci", "patch"].map((s) => `adw_${s}_iso`),
]);

function isKnownStep(key: string): boolean {
  if (KNOWN_STEPS.has(key) || key.endsWith(":composer") || key.endsWith(":complete")) return true;
  return key.endsWith(":failed") && KNOWN_STEPS.has(key.slice(0, -":failed".length));
}

interface PhaseValue {
  text: string;
  hasCode: boolean;
  title: string | null;
}

// Every dd that follows a `Phase` dt in these rows.
async function phaseValues(rows: Locator): Promise<PhaseValue[]> {
  return rows.evaluateAll((lis) =>
    lis.flatMap((li) =>
      Array.from(li.querySelectorAll("dt"))
        .filter((dt) => dt.textContent?.trim() === "Phase")
        .map((dt) => {
          const dd = dt.nextElementSibling;
          return {
            text: dd?.textContent?.trim() ?? "",
            hasCode: dd?.querySelector("code") != null,
            title: dd?.querySelector("span")?.getAttribute("title") ?? null,
          };
        }),
    ),
  );
}

function expectLabels(values: PhaseValue[]): void {
  for (const value of values) {
    expect(value.hasCode).toBe(false);
    if (value.title === null || isKnownStep(value.title)) expect(value.text).not.toMatch(/^adw_/);
    if (value.title !== null && isKnownStep(value.title)) expect(value.text).not.toBe(value.title);
  }
}

test.describe("run row phase label", () => {
  test("the overview shows phase labels, not step keys", async ({ page }) => {
    await page.goto("/projects");
    await waitForLive(page);
    await expect(
      page.getByRole("main").getByRole("heading", { level: 2, name: "Building now", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("main").locator('[aria-busy="true"]').filter({ visible: true }),
    ).toHaveCount(0, { timeout: 30_000 });

    const rows = sectionRows(page, "Building now");
    test.skip((await rows.count()) === 0, "no active run on /projects");
    const values = await phaseValues(rows);
    expect(values.length).toBeGreaterThan(0);
    expectLabels(values);
  });

  test("History rows show no phase", async ({ page }) => {
    await requireProject(page, hasHistoryRow, "no project has a History row");
    const dts = await sectionRows(page, "Shipped").evaluateAll((lis) =>
      lis.flatMap((li) => Array.from(li.querySelectorAll("dt"), (dt) => dt.textContent?.trim())),
    );
    expect(dts.length).toBeGreaterThan(0);
    expect(dts).not.toContain("Phase");
    expect(dts).not.toContain("Final phase");
  });

  test("a project page's Active rows show a label with the raw key as title", async ({ page }) => {
    await requireProject(page, hasActiveRow, "no project has an active run");
    const values = await phaseValues(sectionRows(page, "Building now"));
    expect(values.length).toBeGreaterThan(0);
    expectLabels(values);
    for (const value of values) {
      // A run with no phase shows `none` and no title.
      if (value.text === "none" && value.title === null) continue;
      expect(value.title).toBeTruthy();
    }
  });
});
