# Chore: Radio bar as a sticky footer, no LIVE NOW, rounded box

## Metadata

issue_number: `216`
adw_id: `155628ce`
issue_json: `{"number":216,"title":"Radio bar: sticky footer instead of above the header, no LIVE NOW, rounded box"}`

## Chore Description

The NTS Slow Focus radio bar (#211, PR #212) renders as the first child of `<body>`, above the sticky
header, in normal flow, and scrolls away. Move it to a fixed footer: a thin bar pinned to the bottom
of the viewport on every route, so the stop button is always reachable while music plays. At the
same time:

1. Remove the red dot and the `LIVE NOW` label. "Live" belongs to the dashboard's run updates (the
   connection pill); the radio must not compete with it. With the dot gone, `RadioBar` stops being
   an exemption in the status hue guard.
2. Round the bordered box around `∞`, the button and the title with `rounded-md`, like the rest of
   the app's bordered boxes and the Work with me button.

#214 (merged at `4b37dfc`, the base of this branch) already floats the Work with me link
bottom-right below `sm` (`FLOATING_LAYER = "z-30"`, offset `1rem + safe area`) and stacks the
owner's Login / Logout button above it (offset `4.25rem + safe area`), and gives `<main>` a
`max-sm:pb-[calc(5rem+env(safe-area-inset-bottom,0px))]`. Both floating buttons must now sit above
the footer, and the reserved bottom space must cover both.

Decisions taken from the code as it is now:

- **Layer.** `z-30` is already `FLOATING_LAYER`, and the floating buttons must draw above the
  footer, so the footer takes a new `FOOTER_LAYER = "z-20"`: below `FLOATING_LAYER` (hence below
  `HEADER_LAYER` and `TOOLTIP_LAYER`) and above every other literal z-index in `src/` (today only
  `z-10`: the queue rail markers in `QueueRow.tsx` and the chart value tooltip in
  `ColumnChart.tsx`), so content scrolls under it.
- **Reserved space.** `<body>` gets `pb-[calc(var(--radio-bar-height)+env(safe-area-inset-bottom,0px))]`
  at every width (the footer's box is `--radio-bar-height` plus its safe-area padding). Since the
  inset now lives on `body`, `<main>`'s phone padding drops its inset and becomes `max-sm:pb-20`
  (5rem), so below `sm` the total is footer + inset + 5rem, which clears the button (its top is at
  footer + inset + 1rem + 2.75rem).
- **Floating offsets.** Work with me: `max-sm:bottom-[calc(var(--radio-bar-height)+1rem+env(safe-area-inset-bottom,0px))]`.
  Login / Logout: `max-sm:bottom-[calc(var(--radio-bar-height)+4.25rem+env(safe-area-inset-bottom,0px))]`.
  The Work with me link's bottom is then 16px above the footer's top (the issue requires at least 8px).
- **Sidebar.** Its `md` height keeps subtracting `--radio-bar-height`; with the sticky top at
  `--header-height + 1.5rem`, its bottom is `innerHeight - --radio-bar-height - 1.5rem`, above the
  footer. The sticky offset is unchanged.
- **Background.** The footer takes `bg-background` (content scrolls under it). That makes it the
  second exception to the "no page-level wrapper takes a `bg-` class" rule in
  `app_docs/screens-and-components.md`; the rule is updated in the same commit.
- `aria-live="polite"` on the title span stays (it is the error announcement). Any "no `live`"
  check therefore reads the bar's text, never its raw markup.

## Relevant Files

Use these files to resolve the chore:

- `AGENTS.md` - rules: Yarn only, no em-dashes, Rules in feature docs are invariants and change in the same commit, keep `.adw/project.md` in step.
- `.adw/project.md` - the Review section describes the bar as `LIVE NOW` above the header; update that sentence (never touch the nine `##` headings).
- `docs/conditional-docs.md` - line for `app_docs/radio.md` says "above the header" and "what renders before the header"; update.
- `README.md` - only links to `app_docs/radio.md`; no change needed (checked).
- `app_docs/radio.md` - the feature doc: Overview, Placement, Rules ("Never make the bar sticky or give it a z-index", "The red dot is the only accent colour") all change.
- `app_docs/screens-and-components.md` - the root header bullet (radio bar sits above it), the floating buttons bullet (offsets, `main` padding), the single background rule (exception list), the status colours bullet (radio exemption), the sidebar height bullet.
- `app_docs/analytics.md` - lists `radio_played` / `radio_stopped`; unchanged (checked), events stay.
- `src/components/RadioBar.tsx` - the bar: root classes, the `LIVE NOW` span, the box's radius, the doc comment.
- `src/components/RadioBar.test.ts` - asserts `LIVE NOW` and "not sticky, no z-index"; rewrite those cases.
- `src/app/layout.tsx` - renders `<RadioBar />` before `<header>`; moves after `<main>`; body and main padding.
- `src/app/globals.css` - `--radio-bar-height` comment ("above the header", "bottom border", "scrolls away").
- `src/app/(dashboard)/layout.tsx` - sidebar height subtracting `--radio-bar-height`; class unchanged, read to confirm.
- `src/lib/layers.ts` / `src/lib/layers.test.ts` - add and pin `FOOTER_LAYER`.
- `src/lib/status-colors.ts` / `src/lib/status-colors.test.ts` - drop the radio exemption and its comments.
- `src/lib/radio.ts` - line 1 comment says "The radio bar above the header"; update the wording only.
- `src/components/SectionNav.tsx` - `HIRE_FLOAT` bottom offset and its comment.
- `src/components/IdentifyButton.tsx` - floating bottom offset and its comment.
- `e2e/test_radio_bar.md` - journey for the bar; rewrite for the footer.
- `e2e/test_header_mobile.md` - asserts the floating link is 16px from the viewport bottom and calls the bar "above the header"; update.
- `e2e/test_sticky_header.md` - step 6 checks the sidebar bottom `<= innerHeight`; still true, no change needed (the footer journey adds the stricter check).

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. Add `FOOTER_LAYER` in `src/lib/layers.ts`

- Append after `FLOATING_LAYER`:
  ```ts
  /**
   * The radio bar's z-index class: the footer fixed to the bottom of the
   * viewport. Below `FLOATING_LAYER`, so the phone-only floating buttons (and
   * the header and the section tooltip above them) draw over it, and above
   * every other `z-<n>` in `src/`, so content scrolls under it. Pinned by
   * `layers.test.ts`. Written out in full so Tailwind sees it.
   */
  export const FOOTER_LAYER = "z-20";
  ```
- In the `FLOATING_LAYER` comment nothing changes (z-20 is only ever referenced through the constant, so the scan still finds nothing at or above z-30).

### 2. Pin it in `src/lib/layers.test.ts`

- Import `FOOTER_LAYER`; add `const footerValue = Number(FOOTER_LAYER.slice("z-".length));`.
- Add `describe("FOOTER_LAYER", ...)` modelled on the `FLOATING_LAYER` block:
  - `it("is a numeric z-index class below the floating layer")`: matches `/^z-\d+$/` and `footerValue < floatingValue`.
  - `it("is the radio bar's layer")`: `/src/components/RadioBar.tsx` source contains `FOOTER_LAYER` and `zIndexes(source)` is `[]`.
  - `it("is above every other z-index in src")`: no literal z-index outside the exempt files with `value >= footerValue`.

### 3. Rework `src/components/RadioBar.tsx`

- Import `FOOTER_LAYER` from `@/lib/layers`.
- Root `div` (keep `role="region"` and `aria-label="NTS Slow Focus radio"`): className
  `` `fixed inset-x-0 bottom-0 ${FOOTER_LAYER} border-t border-neutral-200 bg-background pb-[env(safe-area-inset-bottom,0px)] dark:border-neutral-800` ``.
- Inner row unchanged: `mx-auto flex h-9 max-w-6xl items-center gap-3 px-4 text-[11px] font-medium tracking-wider uppercase`.
- Delete the first child span (red `bg-red-600` dot and `LIVE NOW`).
- Box: add `rounded-md` → `flex min-w-0 items-center gap-2 rounded-md border border-neutral-300 px-2 py-0.5 dark:border-neutral-700`.
- Everything else (button, `RadioIcon`, `aria-live` span, credit link, `<audio preload="none">`, handlers, posthog events) unchanged.
- Rewrite the component's doc comment: the root layout renders it after `<main>` as a footer fixed to the bottom of the viewport on `FOOTER_LAYER`; the body reserves its height; client-side navigation never remounts the root layout so the one `<audio>` keeps playing; nothing autoplays; credit link in every state; `aria-live` without `role="status"`; no live label or accent colour (the connection pill owns "live").

### 4. Move it in `src/app/layout.tsx`

- `<body className="min-h-screen pb-[calc(var(--radio-bar-height)+env(safe-area-inset-bottom,0px))] antialiased">` (let Prettier's Tailwind plugin order the classes if configured).
- Remove `<RadioBar />` before `<header>`; render it after `<main>` as the last child of `<body>`.
- `<main className="max-sm:pb-20">` (5rem for the floating button; the footer and the inset are reserved on `body`).
- `<header>` untouched (`sticky top-0 ${HEADER_LAYER} ...`).

### 5. Lift the floating buttons above the footer

- `src/components/SectionNav.tsx`: in `HIRE_FLOAT` replace `max-sm:bottom-[calc(1rem+env(safe-area-inset-bottom,0px))]` with `max-sm:bottom-[calc(var(--radio-bar-height)+1rem+env(safe-area-inset-bottom,0px))]`; update the comment above it ("fixed bottom-right, 1rem above the radio footer, inside thumb reach and above the safe-area inset").
- `src/components/IdentifyButton.tsx`: replace `max-sm:bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))]` with `max-sm:bottom-[calc(var(--radio-bar-height)+4.25rem+env(safe-area-inset-bottom,0px))]`; update the comment ("stacked above the floating Work with me button, which sits 1rem above the radio footer").

### 6. Update `src/app/globals.css`

- Replace the `--radio-bar-height` comment: the radio footer fixed to the bottom of the viewport (`h-9` and its 1px top border), without the safe-area padding it adds below; the one source for the body's bottom padding, the floating buttons' bottom offsets and the sidebar's height (which subtracts it so the column ends above the footer). Value stays `2.3125rem`.

### 7. Drop the radio exemption from the status hue guard

- `src/lib/status-colors.ts`: rewrite the closing paragraph of the doc comment so the connection pill is the one exemption ("The sidebar's connection pill (ConnectionIndicator) keeps its own colours on purpose: it describes the socket, not a run. It is the one exemption in status-colors.test.ts. ...").
- `src/lib/status-colors.test.ts`: remove `"/src/components/RadioBar.tsx"` from `EXEMPT`, rewrite the comment above it (one file allowed a status hue outside the map), and rename the test `"finds no status hue class outside the map and the connection pill"`.

### 8. Update `src/lib/radio.ts` comment

- Line 1: "The radio bar above the header plays ..." → "The radio footer plays ..." (wording only).

### 9. Rewrite `src/components/RadioBar.test.ts`

- Import `FOOTER_LAYER` from `@/lib/layers`. Derive `const root = html.match(/^<div[^>]*>/)?.[0] ?? "";` and `const text = html.replace(/<[^>]*>/g, "");`.
- Credit case: drop `expect(html).toContain("LIVE NOW")`; keep `NTS · SLOW FOCUS` and the link assertion.
- Replace the "not sticky, without a z-index" case with:
  - `it("is a region fixed to the bottom on the footer layer, never a header or footer landmark")`: `html` has no `<header` and no `<footer`; `root` contains `role="region"`, `fixed`, `bottom-0`, `inset-x-0`, `border-t`, `bg-background`, `FOOTER_LAYER`, and does not match `/\bborder-b\b/` or `/\bsticky\b/`.
  - `it("shows no live label and no red")`: `text` does not match `/live/i`; `html` does not match `/\bbg-red-\d+/` (and, stronger, `/\bred-\d{2,3}\b/`).
  - `it("rounds the box around the button")`: the `div` that directly precedes `<span aria-hidden="true">∞</span>` has `rounded-md` (for example `expect(html).toMatch(/<div class="[^"]*\brounded-md\b[^"]*"><span aria-hidden="true">∞<\/span>/)`).
- Keep the idle and `<audio>` cases as they are.

### 10. Update `app_docs/radio.md`

- Add `- specs/issue-216-adw-155628ce-sdlc_planner-radio-bar-sticky-footer.md` under Specifications.
- Overview: a thin footer fixed to the bottom of the viewport on every route; it shows only a rounded (`rounded-md`) bordered box holding `∞`, the play / stop button and `NTS · SLOW FOCUS`; no live label, no accent colour.
- Placement: last child of `<body>`, after `<main>`; `fixed inset-x-0 bottom-0`, `FOOTER_LAYER` (`z-20`, below `FLOATING_LAYER`, `HEADER_LAYER`, `TOOLTIP_LAYER`, above every other z-index, pinned by `layers.test.ts`), `bg-background`, top border, bottom padding of the safe-area inset. `body` reserves `--radio-bar-height` plus the inset; below `sm` the floating Work with me button sits `--radio-bar-height` + 1rem + inset from the bottom and Login / Logout above it; `main` keeps 5rem below `sm`. Sidebar height still subtracts `--radio-bar-height`; sticky offset and `--header-height` unchanged. Root layout never remounts, so playback survives client-side navigation.
- Rules: replace "Never make the bar sticky or give it a z-index ..." with: "The bar is fixed to the bottom on `FOOTER_LAYER`, below `FLOATING_LAYER`; never put it at or above `FLOATING_LAYER`, and never change `--header-height`, `HEADER_LAYER` or the sidebar's sticky offset for it. `--radio-bar-height` is the one source for the body's bottom padding, the floating buttons' offsets and the sidebar's height, and must change with the bar's height or border." Replace "The red dot is the only accent colour" with: "No live label and no accent colour: never the text `LIVE`, never a status hue; the error text stays neutral." Change "The bar is never a `<header>`" to "never a `<header>` or `<footer>` landmark; it stays `role=\"region\"` with its name".

### 11. Update `app_docs/screens-and-components.md`

- Add the spec path to its Specifications list.
- Single background rule: exceptions are the sticky root header and the radio footer (both `bg-background`, content scrolls under them).
- Root header bullet: replace "The radio bar ... sits above it in normal flow, as the first child of `body`, and scrolls away" with "The radio bar (`app_docs/radio.md`) is a footer fixed to the bottom of the viewport on `FOOTER_LAYER`, rendered after `main`; `body` reserves its height."
- Floating buttons bullet: the Work with me button is 1rem from the right edge and 1rem above the radio footer (`--radio-bar-height` + 1rem + the safe-area inset); `FLOATING_LAYER` is above `FOOTER_LAYER`; below `sm` `main` takes a bottom padding of 5rem on top of the body's footer padding.
- Sidebar bullet: its height subtracts the radio footer's `--radio-bar-height` so the column ends above the footer.
- Status colours bullet: the connection pill is the one exemption (remove the radio's red live dot).

### 12. Update `docs/conditional-docs.md` and `.adw/project.md`

- `docs/conditional-docs.md` line for `app_docs/radio.md`: "read when changing the NTS radio footer, `src/components/RadioBar.tsx`, `src/lib/radio.ts`, the stream or credit URLs, `--radio-bar-height`, `FOOTER_LAYER`, the body's bottom padding or what renders after `main` in `src/app/layout.tsx`." Add "the radio footer's layer" to the `screens-and-components.md` line's z-index wording if helpful.
- `.adw/project.md` Review: replace "The radio bar (`LIVE NOW`, the play button, `NTS · SLOW FOCUS`) sits above the header on every route" with "The radio footer (a rounded box with `∞`, the play button and `NTS · SLOW FOCUS`) is fixed to the bottom of the viewport on every route, below the floating Work with me button on phones". Headings untouched.

### 13. Rewrite `e2e/test_radio_bar.md`

Keep the existing format (title, intro, User Story, Test Steps, Success Criteria) and the play / navigate / stop / forced failure / retry steps. Changes:

- Intro: the bar is a footer fixed to the bottom of the viewport.
- Matrix: pages `/`, `/projects/log`, `/writing`, `/writing/my-moat`; viewports 1920x1080, 1024x768, 390x844, 320x568; light and dark. For each, read `bar = document.querySelector('[role="region"][aria-label="NTS Slow Focus radio"]')`:
  - computed `position` is `fixed`; `rect.bottom` equals `innerHeight` within 1, `rect.left` is 0 and `rect.width` equals `document.documentElement.clientWidth` within 1; at scroll 0 and again after `window.scrollTo(0, document.documentElement.scrollHeight)`.
  - `bar.textContent` does not match `/live/i`; no element in `bar` (itself included) has a computed `background-color` with a dominant red (for example `rgb(r,g,b)` where `r > 150 && g < 100 && b < 100`).
  - the box (`bar.querySelector('button').parentElement`) computed `border-radius` is not `0px`, and at 1024x768 equals the computed `border-radius` of the `a[href="/hire"]` link.
  - after scrolling to the bottom, `document.querySelector('main').lastElementChild.getBoundingClientRect().bottom <= bar.getBoundingClientRect().top + 1`.
  - below 640 wide (not on `/hire`): `link = a[href="/hire"]`, `link.getBoundingClientRect().bottom <= bar.getBoundingClientRect().top - 8`, and after scrolling to the bottom the last child of `main` ends at or above `link.getBoundingClientRect().top`.
  - `document.querySelector('body > header').getBoundingClientRect().top === 0` after scrolling.
- At 1024x768 on `/projects/log`: scroll to the bottom; the sidebar `aside`'s `getBoundingClientRect().bottom <= bar.getBoundingClientRect().top`; scroll the project list to its end and the last link is inside the aside and above the bar's top.
- Playback steps as today (play, Verify `audio.paused === false`, tag `window.__radio`, navigate via the header links `/writing`, `Watch me build` then sidebar `Daily log`, brand back to `/`, same element still playing with `currentTime` advancing; stop; `page.route` abort shows `Can't reach NTS right now` with the link kept; `page.unroute` and retry clears it).
- Remove the old "element before `body > header`" and "bar bottom `<= 0` after scrolling" checks.
- Screenshots: footer idle, playing and error at 1920x1080 and 390x844, light and dark (12).
- Success Criteria updated to match.

### 14. Update `e2e/test_header_mobile.md`

- Intro: the radio footer is checked by `e2e/test_radio_bar.md`; this journey only places the floating button relative to it.
- Step 2 below 640: `innerWidth - rect.right` is 16 within 2, and `innerHeight - rect.bottom` equals the radio region's height plus 16 within 2 (that is, the link sits 16px above the footer's top); the scrolled-to-bottom `main` check is unchanged.
- Success Criteria: "fixed 16px from the right edge and 16px above the radio footer".

### 15. Negative check (not committed)

- Temporarily remove the `pb-[...]` class from `<body>` in `src/app/layout.tsx`, run the "last child of `main` ends at or above the region's top" check at 1920x1080 on `/writing/my-moat` and `/projects/log` (scrolled to the bottom) and confirm it fails; restore the class. `git diff src/app/layout.tsx` must show only the intended changes.

### 16. Run the Validation Commands

- Run every command below, in order, and fix anything that fails without weakening a rule, type or test.

## Test Coverage

- `src/components/RadioBar.test.ts` (vitest, `src/**/*.test.ts`): the rewritten cases fail on today's component: the root must carry `fixed`, `bottom-0`, `border-t`, `bg-background` and `FOOTER_LAYER`; the bar's text must not match `/live/i` and the markup must carry no `red-` class; the box around `∞` must have `rounded-md`. Catches a regression to the old in-flow bar, the live label or the square box.
- `src/lib/layers.test.ts` (vitest): new `FOOTER_LAYER` block fails without the constant; catches the footer drifting to or above `FLOATING_LAYER` (floating buttons hidden under it) or content with a literal z-index climbing over it, and a literal z-index replacing the constant in `RadioBar.tsx`.
- `src/lib/status-colors.test.ts` (vitest): with `RadioBar.tsx` removed from `EXEMPT`, it now catches any status hue (the red dot) returning to the bar.
- Position against the viewport, the reserved space and the floating button's clearance are rendered-layout facts the unit layer cannot measure; there is no component or Playwright suite (`E2E code suite: none`). That evidence comes from the agent-driven journeys updated in tasks 13 and 14 and the review phase's screenshots.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

- `yarn lint` - ESLint over the changed components, layout and tests.
- `yarn typecheck` - `next typegen` then `tsc --noEmit`; the new `FOOTER_LAYER` import and test types (do not stage `next-env.d.ts`).
- `yarn knip` - no unused export (`FOOTER_LAYER` must be imported by `RadioBar.tsx`).
- `yarn format:check` - Prettier on every changed file, including the docs and specs.
- `yarn test` - vitest: `RadioBar.test.ts`, `layers.test.ts`, `status-colors.test.ts` and the rest.
- `yarn build` - the root layout and every route still build and prerender with the footer.
- `yarn check:og` - post metadata check on the built output, unaffected but part of the profile's sequence.
- `grep -rn $'\xe2\x80\x94' src app_docs docs e2e .adw specs/issue-216-adw-155628ce-sdlc_planner-radio-bar-sticky-footer.md` - no em-dashes introduced (must print nothing for the changed files).
- `grep -rn "LIVE NOW" src app_docs docs e2e .adw` - no remaining reference to the removed label (must print nothing).

## Notes

- Do not start the dev server in this phase except as the profile allows (`yarn dev` with `PORT` from `.ports.env`); never reuse or kill a server on another port.
- Commit with a bare Conventional Commit type (`chore: ...`), no trailers.
- `aria-live="polite"` contains the substring `live`; that is expected. Every "no live" check reads text (`textContent`, or the markup with tags stripped), never raw HTML.
- The safe-area inset is counted once below `sm`: on `body` (with the footer), on the footer's own bottom padding (inside its box) and in each floating button's offset; `main`'s 5rem drops it.
- `e2e/test_single_background_color.md` compares the sticky header's colour with `body`; the footer uses the same `bg-background`, so it passes. It is not extended here.
- Out of scope: other mixtapes, now-playing data, volume, the header layout, anything under `adws/`.
