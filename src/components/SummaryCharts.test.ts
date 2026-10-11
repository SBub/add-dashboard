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
      expect(choresOnly).toContain(
        '<span data-value-placement="above" class="mb-1 text-xs tabular-nums">0</span>',
      );
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
