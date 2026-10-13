# Chore: Daily log charts: narrower bars, regular-weight values above bars tilted 45 degrees

## Metadata

issue_number: `207`
adw_id: `7ac1bc18`
issue_json: `{"number":207,"title":"Daily log charts: narrower bars, regular-weight values above bars tilted 45 degrees"}`

## Chore Description

The three column charts on `/projects/log` ("What I worked on", "Tokens by model", "What each step
cost") look heavy: bars are broad (up to 56px, `max-w-14`), values are bold (`font-semibold`), and a
value sits inside a tall bar but above a short one (`barValueInside`). Make them calm and consistent:

1. Narrower bars (cap `max-w-7`, 28px), still equal width and centred in equal slots, with rounded
   tops, colours, guide lines, class dots, hover/focus popovers and the zero hairline unchanged.
2. Values never bold: `text-xs tabular-nums`, regular weight, normal text colour (inherited, not
   white, not `NEUTRAL_BAR_VALUE`).
3. Every value above its bar (`data-value-placement="above"` on every column), never a descendant of
   the bar, rotated -45 degrees (reading up to the right), anchored at the bar's top centre
   (`origin-bottom-left` at `left-1/2`), so its start sits over its bar.
4. Headroom: a fixed band above the 180px bar plot (`pt-14`, 56px) holds the tilted value over the
   tallest bar (the longest label, `$123.45` or `999.9M`, is about 50px wide: rotated it is about
   (50 + 16) x 0.707 = 47px tall, plus the 4px gap), so it stays inside the figure and never meets
   the subtitle. The bar plot keeps `h-45`; `columnHeights` and its maths do not change.
5. Remove what becomes dead: `barValueInside`, `BAR_VALUE_MIN_PX`, `CHART_PLOT_PX`, their tests,
   the `inside` branch, the `valueClass` prop, `NEUTRAL_BAR_VALUE` and its contrast test (with the
   test helpers only it used).
6. Update `app_docs/summary.md` and `e2e/test_day_card_charts.md` to the new placement.

Both render sites share `src/components/ColumnChart.tsx`: today's card (`TodaySummary`, client) and
every past day's card (`SummaryDayCard` via `DayCharts`). `ColumnChart` stays stateless and without
`"use client"`. The table under the charts, the card header and the Refresh button are out of scope.

## Relevant Files

Use these files to resolve the chore:

- `README.md`, `AGENTS.md`: repository rules (Yarn only, no em-dashes, docs layout, commit format).
- `.adw/project.md`: the profile; single app at the root, all commands unfiltered. No profile change
  is needed (no script, port, env file or doc location moves).
- `docs/conditional-docs.md`: index; the `app_docs/summary.md` line (charts on `/projects/log`) and
  the `app_docs/screens-and-components.md` line (a component's props) match this task.
- `app_docs/summary.md`: the placement paragraph (around lines 37 to 41) and the Rules bullets
  naming `NEUTRAL_BAR_VALUE` (around line 224), `barValueInside` (around lines 229 and 260) and
  `max-w-14` (around line 255). These are invariants and change in the same commit.
- `app_docs/screens-and-components.md`: lists `ColumnChart` among stateless components that the
  client `TodaySummary` renders; read to keep that rule, no edit expected.
- `src/components/ColumnChart.tsx`: the chart; bar width, value placement, headroom, guides, empty
  box, `valueClass` prop and doc comment all change here.
- `src/components/ModelColumnChart.tsx`, `src/components/PhaseColumnChart.tsx`: pass
  `valueClass={NEUTRAL_BAR_VALUE}`; drop the prop and the import.
- `src/components/ClassColumnChart.tsx`: uses `ColumnChart` without `valueClass`; its doc comment
  ("a zero column is a hairline with 0 above it") stays true; no code change.
- `src/components/SummaryCharts.test.ts`: server-markup tests (`renderToStaticMarkup`) of the chart
  components; it pins the old above-value markup (`mb-1 text-xs tabular-nums`) and gets the new
  assertions.
- `src/lib/daily-summary.ts`: `CHART_PLOT_PX`, `BAR_VALUE_MIN_PX`, `barValueInside` (lines 263 to 275) are removed; `columnHeights` stays untouched.
- `src/lib/daily-summary.test.ts`: the `barValueInside` describe block (around line 730) and its
  import are removed.
- `src/lib/chart-colors.ts`: `NEUTRAL_BAR_VALUE` (line 47) and its comment are removed; `CLASS_BG`,
  `MODEL_BG`, `PHASE_BG`, `CLASS_FILL` untouched.
- `src/lib/chart-colors.test.ts`: the "in-bar value meets AA" test and the helpers only it uses
  (`NEUTRAL_HEX`, `luminance`, `contrast`, `themeHex`) are removed.
- `src/lib/layers.ts`, `src/lib/layers.test.ts`: no `z-<n>` at or above `HEADER_LAYER`; the chart
  keeps its existing `z-10` popover and adds no new z-index.
- `e2e/test_day_card_charts.md`: agent-driven journey describing inside values; rewritten for the
  new placement.
- `knip.json`, `lefthook.yml`, `package.json`: the checks that must stay green.

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. Remove the dead placement helper

- In `src/lib/daily-summary.ts` delete `CHART_PLOT_PX`, `BAR_VALUE_MIN_PX` and `barValueInside`
  with their comments. Leave `columnHeights` exactly as is.
- In `src/lib/daily-summary.test.ts` delete the `describe("barValueInside", ...)` block and remove
  `barValueInside` from the import list.

### 2. Remove `NEUTRAL_BAR_VALUE`

- In `src/lib/chart-colors.ts` delete `NEUTRAL_BAR_VALUE` and its comment.
- In `src/lib/chart-colors.test.ts` delete the `"%s in-bar value meets AA (4.5:1) in both themes"`
  test, then `NEUTRAL_HEX`, `luminance`, `contrast` and `themeHex` (used only by it), and drop
  `NEUTRAL_BAR_VALUE` from the import. Keep the "keep their keys", "holds neutral backgrounds only"
  and "class colours" tests and `NEUTRAL_MAPS`.
- In `src/components/ModelColumnChart.tsx` and `src/components/PhaseColumnChart.tsx` remove the
  `valueClass={NEUTRAL_BAR_VALUE}` prop and `NEUTRAL_BAR_VALUE` from the import.

### 3. Rework `ColumnChart`

In `src/components/ColumnChart.tsx`:

- Drop the `barValueInside` import and the `valueClass` prop (interface field, its doc line and the
  `= "text-white"` default). Update the `valueLabel` doc to "The value as text, tilted above its bar."
- Headroom: the column's plot box becomes `flex h-45 w-full flex-col items-center justify-end`
  inside a wrapper with `pt-14` (or give the plot span `box-content pt-14 h-45`), so every bar
  still scales within 180px and a 56px band sits above the tallest bar. Move the guide-line overlay
  down by the same band (`absolute inset-x-0 top-14 h-45`) so the guides stay aligned with the
  bars' 25/50/75/100 percent heights.
- Empty state: give the empty box the full plot height including the band (`h-59`, 236px) so an
  empty chart card stays the same height as a filled one in the same row.
- Bar: `flex min-h-px w-full max-w-7 rounded-t-md ${column.colorClass}` with the inline height; it
  no longer holds any child.
- Value: rendered for every column, as a sibling before the bar (never inside it):
  ```tsx
  <span data-value-placement="above" className="relative h-0 w-full">
    <span className="absolute bottom-1 left-1/2 origin-bottom-left -rotate-45 text-xs whitespace-nowrap tabular-nums">
      {column.valueLabel}
    </span>
  </span>
  ```
  Implementer's choice whether `data-value-placement` sits on the outer anchor or the text span, but
  it must be on one element per column, and the e2e journey and unit test must target the element
  that carries the computed `transform` (put the attribute on the rotated text span so one element
  answers all checks). No `font-semibold`/`font-medium`, no colour class (it inherits the card's
  text colour). No `aria-hidden`: the label duplicates the `li`'s `aria-label` and stays readable.
- Keep the `li`'s `aria-label`, `aria-describedby`, `tabIndex`, focus ring, the name row (dot,
  `wrap-anywhere`), the `sr-only` summary and the `role="tooltip"` popover unchanged; the popover's
  `bottom-full` now sits above the band, which is fine.
- Keep `gridTemplateColumns: repeat(n, minmax(0, 5rem))` and the gap rule. If, at 1024x768 or
  375x812, the last column's tilted value crosses the figure's right content edge (it extends about
  35px right of its bar centre), add right padding to the `ul` (`pr-4`) rather than widening the
  figure; verify in step 6.
- Rewrite the doc comment: 180px bar plot under a 56px band for the values, bars capped at 28px
  (`max-w-7`) and centred in equal slots, every value above its bar in regular weight, rotated 45
  degrees from the bar's top centre; drop all mention of `valueClass`, white and `barValueInside`.

### 4. Update the markup tests

In `src/components/SummaryCharts.test.ts`:

- Replace the zero-placement assertion (`mb-1 text-xs tabular-nums`) with assertions on the new
  value element.
- Add a `describe("ColumnChart values", ...)` (render `ClassColumnChart` with
  `{ runs: 3, features: 2, bugs: 1, chores: 0, patches: 0 }` and `PhaseColumnChart` with `[plan]`)
  asserting:
  - the count of `data-value-placement="above"` equals the column count, and the markup contains no
    `data-value-placement="inside"`;
  - every value element's class contains `-rotate-45` and `origin-bottom-left` and contains neither
    `font-semibold`, `font-medium` nor `text-white` (the tallest bar, `feature: 2`, and the zero,
    `chore: 0`, both included);
  - no bar holds a value: the bar span (the one with the inline `height`) is empty
    (`/style="height:[^"]*"><\/span>/` matches once per column);
  - the bar carries `max-w-7` and not `max-w-14`;
  - the phase chart's value element contains `$1.25` and has no `text-neutral-950`.

### 5. Update the docs

- `app_docs/summary.md`, placement paragraph: bars are narrow (capped at 28px) and evenly spaced;
  every value (run count, token label or cost) sits above its bar in the normal text colour and
  regular weight, tilted 45 degrees, in a band reserved above the 180px plot so the tallest bar's
  value stays inside the card. Remove the white/near-black inside colours and `barValueInside`.
- `app_docs/summary.md`, Rules: drop "with in-bar text from `NEUTRAL_BAR_VALUE` ... pinned in
  `src/lib/chart-colors.test.ts`"; remove `barValueInside` from the geometry list; change `max-w-14`
  to `max-w-7`; replace "the value placement (inside the bar or above it) comes only from
  `barValueInside`" with: every value sits above its bar, never inside it, regular weight, rotated
  -45 degrees from the bar's top centre, in the 56px band (`pt-14`) above the 180px plot (`h-45`);
  never bold a value, never put it inside a bar.
- No em-dashes. `docs/conditional-docs.md` line for `summary.md` still fits; no change.

### 6. Rewrite the E2E journey

In `e2e/test_day_card_charts.md`:

- Intro and Success Criteria: replace "a bar's value sits inside it (white ... ) or just above"
  with "every value sits above its bar, regular weight, tilted 45 degrees, inside its card".
- Step 4: keep the zeros check (`[data-value-placement="above"]` shows `0`).
- Step 7: drop the inside-value colour checks; keep the neutral-gray bar background check. Add, with
  `browser_evaluate` for every figure of today's card and one past day's card: every column has
  exactly one `[data-value-placement="above"]` element; its computed `font-weight` is `400`; its
  computed `transform` is a matrix with `a ≈ 0.7071`, `b ≈ -0.7071` (a -45 degree rotation, within
  0.01); it is not a descendant of the bar (the element with the inline `height` style); its
  `getBoundingClientRect()` lies inside the figure's content box (0.5px tolerance) and its `top` is
  at or below the `figcaption`'s `bottom`.
- Step 8: bars equal width within 1px and each `width <= 28` (plus 0.5px), centres equally spaced.
- Step 10: name rows (`li > span.mt-2`) have computed `transform` `none` and their text is unchanged.
- Step 14: drop "Repeat the step 7 colour checks in the dark scheme"; repeat the step 7
  placement checks instead.
- Steps 15 and 16: run the step 7 value checks and the step 8 width cap at 1024x768 and at 375x812
  (change 375x667 to 375x812), on today's card and one past card; screenshots of all three charts
  at 1920x1080, 1024x768 and 375x812.

### 7. Verify in the browser and run the negative check

- Source `.ports.env` and run `yarn dev` (the profile allows it); open `/projects/log` and run the
  journey's checks at 1920x1080, 1024x768 and 375x812 for today's card and one past card; take
  screenshots of all three charts at each size into `agents/7ac1bc18/<agent_name>/review_img/`.
- Negative check: temporarily add `font-semibold` to the value's class; confirm both the unit test
  from step 4 and the journey's `font-weight` 400 assertion fail; remove it and confirm
  `git diff` has no `font-semibold` on the value.

### 8. Run the validation commands

- Run every command under `Validation Commands`; all must pass.

## Test Coverage

- Unit (`src/**/*.test.ts`, vitest, server markup via `renderToStaticMarkup`):
  `src/components/SummaryCharts.test.ts` gains assertions that every column's value is
  `data-value-placement="above"`, rotated (`-rotate-45`, `origin-bottom-left`), not bold, not white,
  outside an empty bar, and that bars carry `max-w-7`. Each fails on today's code (inside values,
  `font-semibold`, `text-white`, `max-w-14`), catching a return to inside or bold values that nothing
  checks once `barValueInside` and its tests are gone.
- Removed tests: the `barValueInside` and `NEUTRAL_BAR_VALUE` contrast tests are deleted with the
  code they cover; no replacement is needed because the code no longer exists.
- No helper computes the headroom or offset (they are fixed Tailwind classes), so there is no new
  pure helper to test; the computed geometry is checked in the browser by the e2e journey, listed
  as a task (step 6), not here.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

- `yarn lint` - ESLint over the changed components and tests (no unused imports left).
- `yarn typecheck` - the removed `valueClass` prop and `barValueInside` export leave no dangling
  reference.
- `yarn knip` - no unused export (`NEUTRAL_BAR_VALUE`, `barValueInside`) or file remains.
- `yarn format:check` - Prettier on every changed file.
- `yarn test` - unit tests, including the new `SummaryCharts.test.ts` assertions and the trimmed
  `daily-summary.test.ts`, `chart-colors.test.ts` and `layers.test.ts`.
- `yarn build` - the summary page and its charts still build (needs `.env.local`).
- `yarn check:og` - the post metadata check the profile runs after the build.

## Notes

- Do not touch `columnHeights`, `CLASS_BG`, `MODEL_BG`, `PHASE_BG`, `CLASS_FILL`, the table, the
  card header or the Refresh button. Nothing under `adws/` (a symlink to the toolkit).
- Why the -45 degree labels cannot collide: adjacent labels are parallel and their anchors are one
  slot apart, so their perpendicular distance is at least slot x 0.707 (about 30px at the narrowest
  slot), more than one `text-xs` line.
- `h-59` and `top-14` are Tailwind v4 spacing values (multiples of 4px); no arbitrary values needed.
- Commits: Conventional Commits, bare type (`chore: ...`), no trailers of any kind.
- No em-dashes in any file.
