import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { SummaryPhase } from "@/types/adw";
import { ClassColumnChart } from "./ClassColumnChart";
import { PhaseColumnChart } from "./PhaseColumnChart";

const DAY = "2026-10-01";

const plan: SummaryPhase = {
  phase: "adw_plan_iso",
  runs: 2,
  input: 1000,
  cache_read: 2000,
  cache_creation: 300,
  output: 400,
  cost_usd: 1.25,
  duration_s: 120,
};

describe("ClassColumnChart", () => {
  const markup = renderToStaticMarkup(
    createElement(ClassColumnChart, {
      counts: { runs: 3, features: 2, bugs: 1, chores: 0, patches: 0 },
      day: DAY,
    }),
  );

  it("is titled What I worked on, with its subtitle", () => {
    expect(markup).toContain("What I worked on");
    expect(markup).toContain("Runs finished that day");
    expect(markup).not.toContain("Work by class");
  });

  it("starts its screen-reader summary with the title", () => {
    expect(markup).toContain('<p class="sr-only">What I worked on: 2 feature, 0 chore, 1 bug</p>');
  });

  describe("on a chores-only day", () => {
    const choresOnly = renderToStaticMarkup(
      createElement(ClassColumnChart, {
        counts: { runs: 3, features: 0, bugs: 0, chores: 3, patches: 0 },
        day: DAY,
      }),
    );

    it("still shows feature, chore and bug, in that order", () => {
      const feature = choresOnly.indexOf('aria-label="feature: 0 runs"');
      const chore = choresOnly.indexOf('aria-label="chore: 3 runs"');
      const bug = choresOnly.indexOf('aria-label="bug: 0 runs"');
      expect(feature).toBeGreaterThan(-1);
      expect(chore).toBeGreaterThan(feature);
      expect(bug).toBeGreaterThan(chore);
      expect(choresOnly).not.toMatch(/aria-label="(patch|other):/);
    });

    it("lists the zeros in its screen-reader summary", () => {
      expect(choresOnly).toContain(
        '<p class="sr-only">What I worked on: 0 feature, 3 chore, 0 bug</p>',
      );
    });

    it("places a zero above the baseline with a 0% share", () => {
      expect(choresOnly).toMatch(/<span data-value-placement="above" class="[^"]*">0<\/span>/);
      expect(choresOnly).toContain('<dd class="text-right tabular-nums">0%</dd>');
    });
  });

  it("renders nothing for a day with no runs", () => {
    expect(
      renderToStaticMarkup(
        createElement(ClassColumnChart, {
          counts: { runs: 0, features: 0, bugs: 0, chores: 0, patches: 0 },
          day: DAY,
        }),
      ),
    ).toBe("");
  });
});

describe("PhaseColumnChart", () => {
  it("says no usage was published under the new title when there are no phases", () => {
    const markup = renderToStaticMarkup(createElement(PhaseColumnChart, { phases: [], day: DAY }));
    expect(markup).toContain("What each step cost: no per-phase usage published.");
    expect(markup).not.toContain("Cost by phase");
  });

  it("starts its screen-reader summary with the title", () => {
    const markup = renderToStaticMarkup(
      createElement(PhaseColumnChart, { phases: [plan], day: DAY }),
    );
    expect(markup).toContain('<p class="sr-only">What each step cost: Plan $1.25</p>');
    expect(markup).not.toContain("Cost by phase");
  });
});

describe("ColumnChart values", () => {
  const classMarkup = renderToStaticMarkup(
    createElement(ClassColumnChart, {
      counts: { runs: 3, features: 2, bugs: 1, chores: 0, patches: 0 },
      day: DAY,
    }),
  );
  const phaseMarkup = renderToStaticMarkup(
    createElement(PhaseColumnChart, { phases: [plan], day: DAY }),
  );
  const values = (markup: string) => [
    ...markup.matchAll(/<span data-value-placement="above" class="([^"]*)">([^<]*)<\/span>/g),
  ];
  const columnCount = (markup: string) => (markup.match(/<li /g) ?? []).length;

  it.each([
    ["class", classMarkup],
    ["phase", phaseMarkup],
  ])("places every %s value above its bar", (_, markup) => {
    expect(columnCount(markup)).toBeGreaterThan(0);
    expect(values(markup)).toHaveLength(columnCount(markup));
    expect(markup).not.toContain('data-value-placement="inside"');
  });

  it.each([
    ["class", classMarkup],
    ["phase", phaseMarkup],
  ])("tilts every %s value in regular weight and the text colour", (_, markup) => {
    for (const [, className] of values(markup)) {
      expect(className).toContain("[transform:rotate(-45deg)]");
      expect(className).toContain("origin-bottom-left");
      expect(className).not.toMatch(/font-semibold|font-medium|text-white|text-neutral-950/);
    }
  });

  it("includes the tallest bar's value and the zero", () => {
    const labels = values(classMarkup).map(([, , label]) => label);
    expect(labels).toEqual(["2", "0", "1"]);
  });

  it.each([
    ["class", classMarkup],
    ["phase", phaseMarkup],
  ])("keeps every %s bar empty and capped at 28px", (_, markup) => {
    expect(markup.match(/style="height:[^"]*"><\/span>/g)).toHaveLength(columnCount(markup));
    expect(markup).toContain("max-w-7");
    expect(markup).not.toContain("max-w-14");
  });

  it("shows the phase cost above its bar", () => {
    expect(values(phaseMarkup).map(([, , label]) => label)).toEqual(["$1.25"]);
  });
});
