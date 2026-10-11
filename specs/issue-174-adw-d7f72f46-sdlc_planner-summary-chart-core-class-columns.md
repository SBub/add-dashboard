# Chore: Summary charts: always show feature, chore and bug columns; label Document as Docs

## Metadata

issue_number: `174`
adw_id: `d7f72f46`
issue_json: `{"number":174,"title":"Summary charts: always show feature, chore and bug columns; label Document as Docs"}`

## Chore Description

Two small fixes to the day card charts on the summary page (`/watch`):

1. **"What I worked on" always shows the three main classes**, `feature`, `chore` and `bug`, even
   when a day has zero runs of one of them, so every day card has the same three columns to compare.
   Today `ClassColumnChart` renders one column per class present (it calls `classCounts`, which drops
   zero counts), so a chores-only day shows a single lonely column. `/patch` and `other` still appear
   only when their count is above 0.
2. **The `Document` phase label becomes `Docs`.** At the card's width `Document` wraps under its dot
   onto a second line while `Plan`, `Build`, `Test`, `Review` fit on one.

Constraints from the issue:

- Class names stay exactly `feature`, `chore`, `bug`, `patch`, `other` (owner rule). Only which
  columns show changes.
- `classCounts` and `classSegments` behave exactly as now (the per-project table's stacked class bar
  keeps omitting empty segments); their existing tests in `src/lib/daily-summary.test.ts` pass
  unchanged.
- The chart still returns nothing for a day with no runs at all.
- Phase order stays Plan, Build, Test, Review, Docs; `CI` is never a column. Only the display name
  changes; the phase key `adw_document_iso`, `PHASE_ORDER` and everything else stay.
- No em-dashes. Docs in the same change.

Decisions taken here (the issue leaves them open):

- A zero column renders through the existing `ColumnChart` unchanged: its bar already has `min-h-px`,
  so a 0% height draws a 1px hairline at the baseline in the class colour, and
  `barValueInside(0)` is `false`, so the value `0` sits just above the baseline. Its name and dot sit
  under it as for any column. No change to `ColumnChart`.
- The tooltip of a zero column shows `Share` as `0%`. `shareLabel` already returns `"0%"` for a zero
  count and stays as it is (pure, unchanged), so every class column keeps the same two tooltip rows.
- The empty-day guard moves from "no column present" to "no runs counted": `ClassColumnChart` sums the
  `classColumns` counts and returns `null` when the sum is 0 (a no-runs day gives
  `feature 0, chore 0, bug 0`, which must still render nothing).

## Relevant Files

Use these files to resolve the chore:

- `README.md`: repository overview (read first, no change).
- `AGENTS.md`: repository rules (no em-dashes, conventional commits with no trailers, docs in the same
  change, Rules sections are invariants).
- `.adw/project.md`: ADW profile; single app at the root, `yarn` only, the validation commands, the
  test layer (`src/**/*.test.ts` only, no Playwright suite, `e2e/*.md` agent journeys). No change
  needed: no script, port, env file or doc location moves.
- `docs/conditional-docs.md`: the index; the `app_docs/summary.md` line matches ("read when changing
  `/watch`, its charts"). No new doc, so the index line stays.
- `app_docs/summary.md`: the summary feature doc. Its prose says "one column per class present",
  lists phases ending in `Document`, and says "absent entries are omitted"; its Rules list
  `classCounts` as the class chart's source and the phase order ending in `Document`. All must be
  updated in this change.
- `src/lib/daily-summary.ts`: holds `classCounts`, `classSegments`, `shareLabel`, `classLabel`. The
  new pure `classColumns` goes here (the doc's rule: everything that shapes the report lives in this
  file, every change goes with a test case). Its header comment mentions "the column charts' class
  counts", and `classCounts`' JSDoc says it is shared by the class bar and the class column chart,
  which stops being true and must be reworded.
- `src/lib/daily-summary.test.ts`: existing `classCounts` (line ~591) and `classSegments` (line ~649)
  tests must pass unchanged; the new `describe("classColumns")` goes beside them.
- `src/components/ClassColumnChart.tsx`: switches from `classCounts` to `classColumns`, new empty
  guard, JSDoc updated ("one column per class present" is no longer true).
- `src/components/SummaryCharts.test.ts`: renders `ClassColumnChart` and `PhaseColumnChart` with
  `renderToStaticMarkup`. Its existing sr-only assertion (`What I worked on: 2 feature, 1 bug` for
  `features 2, bugs 1, chores 0`) changes to include `0 chore`, and it gets new chores-only and
  no-runs cases.
- `src/components/ColumnChart.tsx`: read only. Confirms a 0% bar keeps a `min-h-px` hairline and the
  value goes above it; no change.
- `src/components/ClassDistributionBar.tsx`: read only. The per-project table's stacked bar through
  `classSegments`; must not change (out of scope).
- `src/components/DayCharts.tsx`: read only; passes `day.totals` to `ClassColumnChart`, unchanged.
- `src/lib/phase-usage.ts`: `PHASE_NAMES.adw_document_iso` becomes `"Docs"`; the `phaseName` JSDoc
  ("Plan, Build, Test, Review or Document") becomes "... or Docs".
- `src/lib/phase-usage.test.ts`: the `phaseName` table row `["adw_document_iso", "Document"]` becomes
  `"Docs"`.
- `src/components/PhaseColumnChart.tsx`: JSDoc line 17 lists "Plan, Build, Test, Review, Document";
  becomes `Docs`.
- `e2e/test_day_card_charts.md`: the agent-driven journey asserts `Document` (step 5 and Success
  Criteria) and "absent entries are omitted" for all three charts; update for `Docs`, the always-on
  three class columns and the new single-line label check.
- `src/lib/run-phase.ts` and `app_docs/screens-and-components.md`: read only. Run rows say
  `Documenting` / `Docs done` from a separate map; they are not the chart label and must not change.

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. Add `classColumns` to `src/lib/daily-summary.ts`

- Do not touch the body or behaviour of `classCounts` or `classSegments`.
- Factor the unfiltered list into one private helper so the order is spelled once, for example:
  ```ts
  /** Every class with its count in the fixed order, zeros included; "other" floored at 0. */
  function allClassCounts(
    day: Pick<DailySummary, "runs" | "features" | "bugs" | "chores" | "patches">,
  ): ClassCount[] {
    const known = day.features + day.bugs + day.chores + day.patches;
    return [
      { key: "/feature", count: day.features },
      { key: "/chore", count: day.chores },
      { key: "/bug", count: day.bugs },
      { key: "/patch", count: day.patches },
      { key: "other", count: Math.max(0, day.runs - known) },
    ];
  }
  ```
  and make `classCounts` `return allClassCounts(day).filter(({ count }) => count > 0);` (identical
  output, same tests). If you prefer not to refactor, `classColumns` may build its own list, but the
  key order must be exactly `/feature`, `/chore`, `/bug`, `/patch`, `other`.
- Add the exported pure function:
  ```ts
  /** The classes the column chart always shows, even at zero. */
  const CORE_CLASSES: readonly ClassKey[] = ["/feature", "/chore", "/bug"];

  /**
   * The class column chart's columns in classCounts' order: /feature, /chore and
   * /bug always (zero counts included, so every day card has the same three
   * columns), then /patch and other only when above 0. classCounts and the class
   * bar keep omitting zeros.
   */
  export function classColumns(
    day: Pick<DailySummary, "runs" | "features" | "bugs" | "chores" | "patches">,
  ): ClassCount[] {
    return allClassCounts(day).filter(({ key, count }) => CORE_CLASSES.includes(key) || count > 0);
  }
  ```
- Reword `classCounts`' JSDoc: it is the class bar's source (through `classSegments`); the column
  chart uses `classColumns`, which shares its order. Update the file header comment's "the column
  charts' class counts" to mention `classColumns`.
- No em-dashes in any comment.

### 2. Unit-test `classColumns` in `src/lib/daily-summary.test.ts`

- Import `classColumns`; add `describe("classColumns", ...)` right after `describe("classCounts")`.
  Do not edit any existing `classCounts` or `classSegments` case.
- Cases:
  - chores-only day `{ runs: 3, features: 0, bugs: 0, chores: 3, patches: 0 }` gives exactly
    `[{ key: "/feature", count: 0 }, { key: "/chore", count: 3 }, { key: "/bug", count: 0 }]`.
  - a day with a patch `{ runs: 4, features: 1, bugs: 0, chores: 2, patches: 1 }` gives four columns
    `/feature 1, /chore 2, /bug 0, /patch 1` (patch last, no `other`).
  - `other` appears last only when runs exceed the known classes:
    `{ runs: 6, features: 1, bugs: 1, chores: 1, patches: 1 }` ends with `{ key: "other", count: 2 }`;
    `{ runs: 1, features: 2, bugs: 0, chores: 0, patches: 0 }` (runs below the known sum) has no
    `other` and gives `/feature 2, /chore 0, /bug 0`.
  - a no-runs day gives the three core columns at 0 (the component, not this function, decides to
    render nothing).
  - never sorts by count: `{ runs: 12, features: 1, bugs: 9, chores: 2, patches: 0 }` keys are
    `["/feature", "/chore", "/bug"]`.
- **Negative check (do it, do not commit it):** temporarily change `classColumns` to
  `.filter(({ count }) => count > 0)`, run `yarn test`, confirm the chores-only case fails, then revert
  and rerun `yarn test` green.

### 3. Switch `ClassColumnChart` to `classColumns`

- In `src/components/ClassColumnChart.tsx` import `classColumns` instead of `classCounts`.
- `const columns = classColumns(counts); const total = columns.reduce(...);`
  `if (total === 0) return null;` (a day with no runs still renders nothing).
- Use `columns` for `summary` and `columns`; the summary therefore lists zeros, e.g.
  `What I worked on: 0 feature, 3 chore, 0 bug`.
- Keep `valueLabel: String(count)` (so a zero column shows `0` above the baseline), `ariaLabel`
  (`bug: 0 runs` is already correct pluralisation), `colorClass: CLASS_BG[key]`, and the detail rows
  `Runs` and `Share` with `shareLabel(count, total)` (gives `0%` for a zero column). Do not change
  `shareLabel`.
- Update the JSDoc: "/feature, /chore and /bug always, /patch and other when present, in
  classColumns' fixed order; a zero column is a hairline with 0 above it ... Nothing when there are no
  runs."

### 4. Extend `src/components/SummaryCharts.test.ts`

- Update the existing sr-only expectation for `{ runs: 3, features: 2, bugs: 1, chores: 0 }` to
  `'<p class="sr-only">What I worked on: 2 feature, 0 chore, 1 bug</p>'`.
- Add a chores-only case (`{ runs: 3, features: 0, bugs: 0, chores: 3, patches: 0 }`): the markup
  contains `aria-label="feature: 0 runs"`, `aria-label="chore: 3 runs"`, `aria-label="bug: 0 runs"`
  in that order, no `patch` or `other` `aria-label`, and the sr-only text
  `What I worked on: 0 feature, 3 chore, 0 bug`; a zero column's value `0` is placed
  `data-value-placement="above"` and its tooltip `Share` is `0%`.
- Add a no-runs case (`{ runs: 0, features: 0, bugs: 0, chores: 0, patches: 0 }`):
  `renderToStaticMarkup` returns `""`.

### 5. Rename the phase label to `Docs`

- `src/lib/phase-usage.ts`: `adw_document_iso: "Docs"`; JSDoc of `phaseName` becomes
  "Plan, Build, Test, Review or Docs". Nothing else in the file changes (`PHASE_ORDER`, keys, sums).
- `src/lib/phase-usage.test.ts`: the `phaseName` row becomes `["adw_document_iso", "Docs"]`.
- `src/components/PhaseColumnChart.tsx`: JSDoc order list becomes "Plan, Build, Test, Review, Docs".
- Leave `src/lib/run-phase.ts` (`Documenting`, `Docs done`) and `src/lib/chart-colors.ts` alone.

### 6. Update `app_docs/summary.md`

- Prose (around lines 21-31): "What I worked on" becomes "`feature`, `chore` and `bug` always, even at
  0 (a zero column is a hairline at the baseline with `0` above it and a `0%` share), `patch` and
  `other` only when present (`classColumns`)", and the class order sentence names `classColumns` for
  the chart and `classCounts` for the per-project bar. Phase list ends in `Docs`. "absent entries are
  omitted" applies only to models, phases and the optional classes.
- Rules (around lines 203-213): add `classColumns` to the list of column helpers in
  `src/lib/daily-summary.ts`; rewrite the fixed-order rule so the class chart's order comes from
  `classColumns` (`feature`, `chore`, `bug` always, `patch`, `other` when above 0) while
  `classCounts`/`classSegments` keep omitting zeros for `ClassDistributionBar`; phases
  `Plan`, `Build`, `Test`, `Review`, `Docs`. Add the invariant: never filter the three core classes
  out of the class chart, and never add zero segments to the class bar.
- No em-dashes. No dated changelog entry. `docs/conditional-docs.md` needs no change (same doc,
  its line still describes when to read it).

### 7. Update the agent journey `e2e/test_day_card_charts.md`

- Step 3: the class figure's `li` `aria-label`s start with exactly `feature`, `chore`, `bug` (in that
  order, zeros included, e.g. `bug: 0 runs`), optionally followed by `patch` then `other`; counts add
  up to the header's `N runs`.
- Add a step: find a day card whose classes are only chores (its per-project class bars show only
  chore, or its `What I worked on` figure has `feature: 0 runs` and `bug: 0 runs`); **Verify** that
  figure's labels are exactly `feature`, `chore`, `bug`, and that the zero columns show `0` above the
  baseline (`[data-value-placement="above"]`). If no such day exists in the 30-day window, note it and
  check the three-label rule on the first card instead.
- Step 5: phases are a subsequence of `Plan`, `Build`, `Test`, `Review`, `Docs`, never `CI`, never
  `Document`.
- Add to the 1920x1080 and 375x667 checks (steps 7 and 14): when the phase figure has `Docs`,
  **Verify** with `browser_evaluate` that the `Docs` name row (`li > span.mt-2`) has the same
  `getBoundingClientRect().height` as the `Plan` name row (within 0.5px), i.e. it sits on one line.
- Success Criteria: classes `feature`, `chore`, `bug` always and `patch`, `other` when present;
  phases end in `Docs`; "absent entries are omitted" only for models, phases and the optional
  classes; `Docs` on one line at 1920 and at 375.
- Do not create anything under `.claude/commands/e2e/`. The profile already lists this journey, so
  `.adw/project.md` needs no change.

### 8. Run the validation commands

- Run every command in `Validation Commands` below from the worktree root; all must pass. Do not
  stage `next-env.d.ts`. Commit as `chore: ...` with no trailers.

## Test Coverage

- Unit (`src/lib/daily-summary.test.ts`, vitest): `classColumns` cases, chores-only gives
  `/feature 0, /chore 3, /bug 0`, patch day gives four columns, `other` only when runs exceed the known
  classes, no sorting. Catches the chart dropping a zero core class (the negative check in task 2
  proves the chores-only case fails with a zero filter); nothing tests this today. The unchanged
  `classCounts`/`classSegments` cases guard the class bar.
- Unit (`src/components/SummaryCharts.test.ts`, vitest, static markup): the chores-only chart renders
  `feature`, `chore`, `bug` columns with zeros, the sr-only summary lists `0 feature ... 0 bug`, a
  zero's share is `0%` and its value sits above; a no-runs day renders nothing. Catches the component
  still calling `classCounts` or losing its empty-day guard.
- Unit (`src/lib/phase-usage.test.ts`, vitest): `phaseName("adw_document_iso") === "Docs"`. Catches
  the label reverting.
- The single-line `Docs` label and the three labels in the browser are checked by the agent-driven
  journey `e2e/test_day_card_charts.md` (task 7), an acceptance gate rather than a regression layer;
  the profile has no Playwright code suite.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

- `yarn lint` - ESLint over the changed TS/TSX (commit hook gate).
- `yarn typecheck` - `next typegen` + `tsc --noEmit`; catches a wrong `ClassKey`/`ClassCount` type
  on `classColumns` and the component.
- `yarn knip` - dead-code check: `classCounts` must still be used (by `classSegments` and its tests)
  and `classColumns` is used by `ClassColumnChart`; no unused export left.
- `yarn format:check` - Prettier on all changed files, including the two markdown docs and the spec.
- `yarn test` - vitest: new `classColumns` and chart cases, the `Docs` phase name, and the unchanged
  `classCounts`/`classSegments` cases.
- `yarn build` - production build (reads `.env.local`); proves `/watch` still prerenders with the
  changed chart.

## Notes

- The issue's ids: issue number `174`, adw_id `d7f72f46`.
- Visual review: `/watch` at 1920x1080 and 375x667 (profile Review section). Look for a chores-only
  day card showing three class columns with hairline zeros, and `Docs` on one line in the phase chart.
- `classCounts` stays exported: `classSegments` and the existing tests use it. If knip ever flags it,
  do not delete it or weaken its tests; the issue requires its behaviour unchanged.
- Colours and the per-project class bar are out of scope.
- No em-dashes anywhere (code comments, docs, journey, commit message).
