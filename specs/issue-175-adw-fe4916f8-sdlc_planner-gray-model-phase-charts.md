# Chore: Summary charts: gray bars for Tokens by model and What each step cost

## Metadata

issue_number: `175`
adw_id: `fe4916f8`
issue_json: `{"number":175,"title":"Summary charts: gray bars for Tokens by model and What each step cost"}`

## Chore Description

Each day card on `/watch` (and the today card) shows three chart cards built on the shared
`ColumnChart`: **What I worked on** (classes, `CLASS_BG`), **Tokens by model** (`MODEL_BG`: indigo,
teal, orange, neutral) and **What each step cost** (`PHASE_BG`: cyan, blue, purple, pink, yellow).
The last two paint every column a different hue, so the card reads as a full palette. Every column
already has its name written under it, so colour does not identify columns; those two charts go
gray.

What changes:

- `src/lib/chart-colors.ts`: every value of `MODEL_BG` and `PHASE_BG` becomes one neutral bar
  colour, `bg-neutral-400 dark:bg-neutral-500`. Both maps and all their keys stay; only values
  change.
- The model and phase charts drop the colour dot beside each column label. Label text, order and
  placement stay.
- The value text inside a gray bar must meet WCAG AA (4.5:1) in both themes. White fails on
  `neutral-400` (about 2.6:1), so those two charts use `text-neutral-950 dark:text-white` for the
  in-bar value (calculation in Notes).
- Tooltips: `ColumnChart`'s tooltip has no colour swatch today (only a `dl` of label/value rows), so
  nothing to remove; confirm and keep the text unchanged.

What does not change: the class chart (`CLASS_BG`, its dots, its white in-bar text), the per-project
`ClassDistributionBar` (`CLASS_FILL`), `IssueClassBadge`, `STATUS_COLORS` and every reader of it,
the connection pill, `HIRE_ACCENT`, and `src/lib/status-colors.test.ts`.

Implementation shape: `ColumnChart` gains two optional chart-level props, so the class chart needs
no edit and keeps today's output byte for byte:

- `dots?: boolean` (default `true`): when `false`, the label row renders no `aria-hidden` dot span.
- `valueClass?: string` (default `"text-white"`): the text colour class of the in-bar value, a full
  literal class string from `src/lib/chart-colors.ts`.

`ModelColumnChart` and `PhaseColumnChart` pass `dots={false}` and
`valueClass={NEUTRAL_BAR_VALUE}`, a new export in `src/lib/chart-colors.ts`.

## Relevant Files

Use these files to resolve the chore:

- `AGENTS.md`, `.adw/project.md`: rules (Yarn only, no em-dashes, literal Tailwind strings, feature
  doc Rules are invariants, docs in the same change).
- `docs/conditional-docs.md`: index; its `summary.md` line (charts) and `screens-and-components.md`
  line (a colour) both match this task.
- `app_docs/summary.md`: describes the chart values "in white inside its bar" and names "beside a
  dot of the bar's colour" (around lines 36-40), the Rules bullet on chart colours (around lines
  201-205) and "wraps under its dot" (around line 234). Must be updated in the same change.
- `app_docs/screens-and-components.md`: the colour rules (around lines 216-230); gets one sentence
  that the model and phase chart bars are neutral gray and that class hues stay the badges'.
- `src/lib/chart-colors.ts`: `MODEL_BG`, `PHASE_BG` values change; new `NEUTRAL_BAR_VALUE`; header
  comment updated (it says model and phase hues sit outside the class and status palettes).
- `src/components/ColumnChart.tsx`: shared column chart; renders the dot (`size-2 rounded-full
${column.colorClass}`) and the in-bar value (`text-white`). Gains `dots` and `valueClass` props;
  its doc comment and the `ChartColumn.name` comment ("beside a colour dot") updated.
- `src/components/ModelColumnChart.tsx`: passes `dots={false}` and `valueClass`.
- `src/components/PhaseColumnChart.tsx`: passes `dots={false}` and `valueClass`.
- `src/components/ClassColumnChart.tsx`: read only, must stay unchanged (dots and white text by
  default).
- `src/components/ClassDistributionBar.tsx`, `src/lib/accent.ts`, `src/lib/status-colors.ts`,
  `src/lib/status-colors.test.ts`: read only, must stay unchanged.
- `e2e/test_day_card_charts.md`: the agent journey asserts in-bar value "computed `color` is
  `rgb(255, 255, 255)`" for the tallest bar of any chart (step 7) and labels "with a colour dot"
  (intro, step 10, Success Criteria). Must be updated to the per-chart rule.
- `vitest.config.ts`, `knip.json`: confirm `src/**/*.test.ts` is picked up and the new export is
  used from `src/`.
- `node_modules/tailwindcss/theme.css`: source of the neutral values (`--color-neutral-400:
oklch(70.8% 0 none)`, `-500: oklch(55.6% 0 none)`, `-950: oklch(14.5% 0 none)`).

### New Files

- `src/lib/chart-colors.test.ts`: vitest unit test pinning the chart colour maps and the in-bar
  contrast.

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. Make the model and phase colours neutral in `src/lib/chart-colors.ts`

- Set every value of `MODEL_BG` (`opus`, `sonnet`, `haiku`, `other`) and `PHASE_BG`
  (`adw_plan_iso`, `adw_build_iso`, `adw_test_iso`, `adw_review_iso`, `adw_document_iso`) to the
  literal `"bg-neutral-400 dark:bg-neutral-500"`. Write each literal out in full (no shared
  constant interpolated into a template); a shared `const NEUTRAL_BAR = "bg-neutral-400
dark:bg-neutral-500";` assigned as a plain value is fine since the string itself stays literal in
  source, but keep both maps and every key.
- Add, with a one-line doc comment:
  `export const NEUTRAL_BAR_VALUE = "text-neutral-950 dark:text-white";`
  (the in-bar value text on the neutral bar; white fails AA on `neutral-400`).
- Leave `CLASS_FILL` and `CLASS_BG` exactly as they are.
- Rewrite the file header comment: class hues are `IssueClassBadge`'s and carry meaning; model and
  phase bars are one neutral gray because the name under each column identifies it; nothing here is
  a status hue. No em-dashes.

### 2. Add `dots` and `valueClass` to `src/components/ColumnChart.tsx`

- Add to `ColumnChartProps`: `dots?: boolean` (doc: "A dot of the bar's colour beside each name;
  off when every bar is the same gray.") and `valueClass?: string` (doc: "Text colour of a value
  inside its bar, a full literal class string from src/lib/chart-colors.ts.").
- Destructure with defaults `dots = true`, `valueClass = "text-white"`.
- Render the `aria-hidden` dot span only when `dots` is true.
- In-bar value span: replace the hard-coded `text-white` with `${valueClass}`
  (`className={\`text-xs font-semibold tabular-nums ${valueClass}\`}`).
- Leave the tooltip markup untouched (it has no swatch).
- Update `ChartColumn.name`'s comment ("under the plot, beside a colour dot when the chart has
  dots") and the component doc comment (value inside the bar in `valueClass`, white by default;
  name beside a dot of the bar's colour when `dots`). No em-dashes.

### 3. Wire the model and phase charts

- `src/components/ModelColumnChart.tsx`: import `NEUTRAL_BAR_VALUE` alongside `MODEL_BG`; pass
  `dots={false}` and `valueClass={NEUTRAL_BAR_VALUE}` to `ColumnChart`. Keep `colorClass:
MODEL_BG[modelFamily(m.model)]`, titles, summaries, names, aria labels and detail rows as they are.
- `src/components/PhaseColumnChart.tsx`: same, with `PHASE_BG[p.phase]`.
- Do not touch `src/components/ClassColumnChart.tsx`.

### 4. Add `src/lib/chart-colors.test.ts`

Modelled on `src/lib/status-colors.test.ts` (vitest `describe`/`it`):

- **Model and phase maps are neutral only**: for every value of `MODEL_BG` and `PHASE_BG`, every
  space-separated class matches `/^(?:dark:)?bg-neutral-\d{2,3}$/`. Also assert their keys:
  `Object.keys(MODEL_BG)` equals `["opus", "sonnet", "haiku", "other"]` and `Object.keys(PHASE_BG)`
  equals the five phase keys, so the maps keep their shape.
- **Class colours are pinned**: `expect(CLASS_BG).toEqual({...})` and
  `expect(CLASS_FILL).toEqual({...})` with today's exact values (`violet-500`, `fuchsia-500`,
  `neutral-400`, `lime-500`, `neutral-300 dark:...-neutral-600`, as in the current file).
- **In-bar value contrast**: a local (test-only, not exported from `src/`) WCAG helper:
  hex to relative luminance (sRGB linearisation `c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) **
2.4`, `L = 0.2126 R + 0.7152 G + 0.0722 B`) and `contrast = (Lmax + 0.05) / (Lmin + 0.05)`. A
  local table of the Tailwind v4 neutrals in sRGB hex, with a comment citing
  `node_modules/tailwindcss/theme.css` (`neutral-400 #a1a1a1`, `neutral-500 #737373`,
  `neutral-950 #0a0a0a`, `white #ffffff`). Parse the light and dark tokens out of each `MODEL_BG` /
  `PHASE_BG` value and out of `NEUTRAL_BAR_VALUE` (the class without `dark:` is light, the one with
  `dark:` is dark), look them up in the table (fail if a token is missing from it), and assert
  contrast `>= 4.5` for light (bar vs text) and for dark. Expected: about 7.7:1 light, about 4.7:1
  dark.
- **Negative check (manual, not committed)**: temporarily set `MODEL_BG.sonnet` to
  `"bg-teal-500"`, run `yarn test src/lib/chart-colors.test.ts`, confirm the neutral test fails,
  then revert. Likewise temporarily set `NEUTRAL_BAR_VALUE` to `"text-white dark:text-white"` and
  confirm the contrast test fails (white on `neutral-400` is about 2.6:1), then revert. Record both
  in the PR description.

### 5. Update `app_docs/summary.md`

- Around lines 36-40: the value sits inside its bar (white on the class colours, near-black on the
  gray model and phase bars in light mode and white in dark mode) or just above a bar too short for
  it; under each bar is its name; the class chart's names sit beside a dot of the bar's colour (the
  class hue, matching the badges), while the model and phase bars are one neutral gray with no dot,
  the name alone identifying the column.
- Rules bullet (around lines 201-205): class colours only from `CLASS_FILL`/`CLASS_BG`, matching
  `IssueClassBadge`; model and phase bars only from `MODEL_BG`/`PHASE_BG`, which hold one neutral
  gray (`bg-neutral-400 dark:bg-neutral-500`) for every key, with in-bar text from
  `NEUTRAL_BAR_VALUE` (AA on that gray in both themes, pinned in `src/lib/chart-colors.test.ts`).
  Add the invariant: never give a model or a phase its own hue, and never drop the class chart's
  dots or change class hues here.
- Around line 234 ("wraps under its dot"): "wraps (under its dot in the class chart) and then
  inside the word".
- Add a link to this spec wherever the doc lists its specs (follow #174's pattern, commit
  `46f6d4e`). No em-dashes.

### 6. Update `app_docs/screens-and-components.md`

- In the colour rules near the `Issue class badges are not states...` sentence (around line 225),
  add: the summary's model and phase chart bars are one neutral gray (`MODEL_BG`, `PHASE_BG` in
  `src/lib/chart-colors.ts`), their names carry identity; class chart colours are the badge hues.
  Keep it to one or two lines. No em-dashes.

### 7. Update `e2e/test_day_card_charts.md`

- Intro (lines 5-7): a bar's value sits inside it (white on class bars, AA contrast text on the
  gray model and phase bars) or above it; class labels carry a colour dot, model and phase labels
  are text only.
- Step 7: the tallest class bar's inside value is `rgb(255, 255, 255)`; for the model and phase
  figures, the bar's computed `background-color` is a neutral gray (equal R, G and B) and an inside
  value's computed `color` is either `rgb(10, 10, 10)`-ish near black (light scheme) or
  `rgb(255, 255, 255)` (dark scheme); i.e. `color` has equal R, G, B and differs from the bar.
- Step 10: class figure labels have one `[aria-hidden="true"]` dot each whose background is not
  gray; model and phase figure labels have no `[aria-hidden="true"]` element; no label row has an
  `img` or `svg`; all shown in full.
- New step: **Verify** a status badge (e.g. a completed or failed count on the day card header)
  keeps its status colour and the header's Work with me button keeps its fuchsia background
  (computed `background-color` not gray).
- Step 16 / screenshots: take the 1920x1080 screenshot in both colour schemes (use
  `browser_run_code_unsafe` with `page.emulateMedia({ colorScheme: "light" })` then `"dark"`),
  showing gray model and phase bars without dots and the class chart with its hues and dots.
- Success Criteria: replace "white inside it" and "with a colour dot" with the per-chart rules
  above; add "model and phase bars are gray without label dots in both schemes; class bars keep
  their colours and dots; the status badge and Work with me button keep their colours". No
  em-dashes.

### 8. Run the Validation Commands

- Run every command below from the worktree root; all must pass with zero errors. Confirm
  `git diff --stat` shows no change to `src/lib/status-colors.test.ts`, `src/lib/status-colors.ts`,
  `src/lib/accent.ts`, `src/components/ClassColumnChart.tsx` or `src/components/ClassDistributionBar.tsx`.
- Confirm no em-dash was introduced: `git diff | grep -n $'\u2014'` (the U+2014 character) returns nothing.

## Test Coverage

- `src/lib/chart-colors.test.ts` (unit, vitest, the profile's one test layer):
  - catches a model or phase hue creeping back into `MODEL_BG`/`PHASE_BG` (nothing tests these maps
    today);
  - catches any drift of `CLASS_BG`/`CLASS_FILL` (pinned, so this chore and later ones cannot
    change class colours unnoticed);
  - catches an in-bar value colour that fails 4.5:1 against the gray in either theme (e.g. reverting
    to white text on `neutral-400`).
- The dot removal and the `valueClass` wiring in `ColumnChart` are JSX with no component test layer
  in this project (profile: no component tests, no Playwright suite); their browser evidence is the
  updated agent journey `e2e/test_day_card_charts.md` (task 7) and the review phase's screenshots of
  `/watch` at 1920x1080 and 375x667.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

- `yarn format:check`: Prettier formatting of every touched file.
- `yarn lint`: ESLint on the changed components and the new test.
- `yarn typecheck`: the new `ColumnChart` props and the new export type-check.
- `yarn knip`: `NEUTRAL_BAR_VALUE` is used from `src/` and nothing became dead.
- `yarn test`: the new `chart-colors.test.ts` passes and `status-colors.test.ts` passes unchanged.
- `yarn build`: the app still builds (reads `.env.local`, renders `/watch`).

## Notes

- Contrast calculation (Tailwind v4 neutrals from `node_modules/tailwindcss/theme.css`, sRGB):
  - `neutral-400` oklch(70.8% 0 0) ≈ `#a1a1a1`, L ≈ 0.356; `neutral-500` oklch(55.6% 0 0) ≈
    `#737373`, L ≈ 0.171; `neutral-950` oklch(14.5% 0 0) ≈ `#0a0a0a`, L ≈ 0.003; white L = 1.
  - Light, `neutral-950` on `neutral-400`: (0.356 + 0.05) / (0.003 + 0.05) ≈ 7.7:1, passes.
    White on `neutral-400`: 1.05 / 0.406 ≈ 2.6:1, fails (why white cannot stay).
  - Dark, white on `neutral-500`: 1.05 / 0.221 ≈ 4.7:1, passes (narrowly; do not lighten the dark
    bar). `neutral-950` on `neutral-500` would be about 4.2:1 and fail, hence the per-theme text.
- The value placed above a short bar keeps the inherited page text colour; unchanged.
- The tooltip already has no swatch; if a reviewer finds one, it is in `ColumnChart`'s `role="tooltip"`
  span only.
- The `dark:` bar variant follows `prefers-color-scheme` (the app has no theme toggle); the e2e
  screenshots in both schemes use media emulation.
- Do not start the dev server during planning or implementation unless the review phase asks for
  it, and then only on `PORT` from `.ports.env`.
- Commit as `chore: ...` with no trailers (profile Documentation section).
