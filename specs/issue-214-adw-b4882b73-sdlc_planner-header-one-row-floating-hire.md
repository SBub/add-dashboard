# Feature: Header in one row on every width; Work with me floats bottom-right on phones

## Metadata

issue_number: `214`
adw_id: `b4882b73`
issue_json: `{"number":214,"title":"Header in one row on every width; Work with me floats bottom-right on phones"}`

## Feature Description

The sticky root header wraps to two rows on phones and tablets (89px instead of 57px): below `sm`
the row needs about 410px, and from `sm` to about 850px the tagline "Built with ADW, my AI
developer workflow" pushes "Work with me" to a second line. This feature keeps the header one row
(57px, the value `--header-height` already documents) at every width from 320px up, and on phones
(below `sm`, 640px) turns the single "Work with me" link into a floating button in the bottom-right
corner, inside thumb reach. The tagline shows only from `lg` (1024px). The owner-only Login /
Logout button follows "Work with me" into the corner on phones, stacked above it, because the
header row cannot hold it at 390px.

## User Story

As a visitor reading the site on a phone or a tablet
I want a compact one-row header and a "Work with me" button that is always under my thumb
So that the header takes less of the screen and the contact entry point is one tap away wherever I am on the page

## Problem Statement

At 390, 640 and 768px the header is 89px tall: "Work with me" drops to a second row. That wastes
vertical space on small screens, contradicts the `--header-height` comment ("wraps to two rows only
below `md`"), and leaves the main call to action at the top of the page, out of reach once the
visitor scrolls.

## Solution Statement

- Keep exactly one `HireLink` (one `<a href="/hire">`). Its class list gains `max-sm:` variants
  that make it `fixed` at `right-4` and `bottom-[calc(1rem+env(safe-area-inset-bottom,0px))]`,
  with a soft shadow, a 44px minimum height and a new `FLOATING_LAYER` (`z-30`) below
  `HEADER_LAYER`. From `sm` up none of these apply, so it sits in the header's right group exactly
  as today. A `fixed` element is positioned against the viewport (the header has no `transform`,
  `filter` or `contain`), so it can stay in the header's DOM.
- Hide it on `/hire` below `sm` through the active state `HeaderLink` already computes:
  `activeClassName="max-sm:hidden"`, `inactiveClassName=""`. `aria-current="page"` is untouched.
  The Suspense fallback is the inactive link with the same base classes, so fallback and resolved
  link sit and look the same at every width (the fallback is only ever shown on project pages
  outside `generateStaticParams`, never on `/hire`, whose pathname is static).
- Tagline: `hidden lg:inline` instead of `hidden sm:inline`.
- Tighten the below-`sm` gaps so the remaining row (brand short form, "Watch me build", "Writing")
  fits 320px with headroom: left group `gap-2 sm:gap-6`, nav `gap-2.5 sm:gap-4`
  (32 + 116 + 8 + 100 + 10 + 46 = 312px of 320). From `sm` up the gaps are unchanged.
- `IdentifyButton`: below `sm` it is `fixed` at `right-4`,
  `bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))]` (1rem + 2.75rem button + 0.5rem gap),
  same `FLOATING_LAYER`, shadow, `min-h-11`; from `sm` up unchanged in the header row.
- `<main className="max-sm:pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">` reserves room so the
  last line of every page clears the button when scrolled to the end (button top is at most
  1rem + 2.75rem + inset = 3.75rem + inset from the bottom).

## Relevant Files

Use these files to implement the feature:

- `AGENTS.md`: rules (no em-dashes, docs in `app_docs/`, Yarn only).
- `.adw/project.md`: profile; Tests lists the `e2e/*.md` journeys (add the new one), Review says
  "The fuchsia Work with me button is in the header on every route" (update for phones).
- `docs/conditional-docs.md`: index; the lines for `screens-and-components.md`,
  `routing-and-navigation.md`, `hire.md` and `analytics.md` match this task. No new doc, so no
  new line; widen the `screens-and-components.md` line to mention the floating button.
- `app_docs/screens-and-components.md`: sticky header, z-index layers, `--header-height` (around
  line 215 to 242). Add the floating button, `FLOATING_LAYER`, the tagline breakpoint, `main`'s
  bottom padding.
- `app_docs/routing-and-navigation.md`: header links paragraph (lines 20 to 35) and the
  current-section rules (around line 132). Describe the button's position by width and that it is
  hidden on `/hire` below `sm`.
- `app_docs/hire.md`: describes the Work with me header button as the page's entry point; one
  sentence on its phone position.
- `app_docs/analytics.md`: describes the Login / Logout button's placement; note it floats above
  Work with me below `sm`.
- `src/app/layout.tsx`: header markup, tagline span, `<main>`.
- `src/components/SectionNav.tsx`: `HIRE_LINK`, `HireLink`, `BrandLink`, `SectionNav` gaps and the
  header comment block.
- `src/components/HeaderLink.tsx`: the one `usePathname` reader; used as is (active / inactive
  classes), no change expected.
- `src/components/IdentifyButton.tsx`: Login / Logout classes.
- `src/lib/layers.ts`, `src/lib/layers.test.ts`: z-index layers and their guard; add
  `FLOATING_LAYER`.
- `src/lib/accent.ts`: `HIRE_ACCENT`, reused unchanged.
- `src/lib/header-section.ts`: source of truth for sections; read only, unchanged.
- `src/app/globals.css`: `--header-height` comment (value unchanged).
- `e2e/test_hire_page.md`, `e2e/test_header_section_active.md`,
  `e2e/test_header_login_hidden.md`, `e2e/test_sticky_header.md`: locate "Work with me" in the
  header; must hold at desktop and mobile widths.
- `.claude/commands/test_e2e.md`: the journey file contract.

### New Files

- `e2e/test_header_mobile.md`: agent-driven journey for one-row header and the floating button
  across eight viewports, light and dark.

## Implementation Plan

### Phase 1: Foundation

Add `FLOATING_LAYER = "z-30"` to `src/lib/layers.ts` with a doc comment (the phone-only floating
buttons; below `HEADER_LAYER` so the header and the section tooltip draw over them, above content
`z-10`), and extend `src/lib/layers.test.ts` to pin it.

### Phase 2: Core Implementation

Change `HireLink` and `IdentifyButton` classes for the floating position below `sm`, hide
`HireLink` on `/hire` below `sm` through `activeClassName`, move the tagline to `lg`, tighten the
below-`sm` gaps, and pad `<main>` below `sm`.

### Phase 3: Integration

Update the `--header-height` comment, the feature docs, the profile, the four existing journeys,
and add `e2e/test_header_mobile.md`.

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. Add `FLOATING_LAYER` and its test

- In `src/lib/layers.ts` add, after `HEADER_LAYER`:
  `export const FLOATING_LAYER = "z-30";` with a comment: the layer of the phone-only floating
  buttons (Work with me, Login / Logout) below `sm`; below `HEADER_LAYER` so the header and the
  section tooltip draw over them, above every other `z-<n>` in `src/` so content scrolls under
  them; written out in full so Tailwind sees it.
- In `src/lib/layers.test.ts` add a `describe("FLOATING_LAYER")` with:
  - it is a numeric `z-<n>` class below `HEADER_LAYER`;
  - it is the layer of `SectionNav.tsx` and `IdentifyButton.tsx` (each source contains
    `FLOATING_LAYER` and has no inline `z-<n>`);
  - it is above every other `z-<n>` in `src/` (same loop as the HEADER_LAYER case, with the
    floating value).
- Keep the existing guards; `z-30` lives only in `layers.ts` (exempt), so no source gains a raw
  `z-<n>` at or above 40.

### 2. Float `HireLink` below `sm`

- In `src/components/SectionNav.tsx`, import `FLOATING_LAYER` and define (full literal classes):
  `const HIRE_FLOAT = "max-sm:fixed max-sm:right-4 max-sm:bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] max-sm:flex max-sm:min-h-11 max-sm:items-center max-sm:px-4 max-sm:shadow-lg";`
  and `const HIRE_LINK = \`rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap ${HIRE_ACCENT} ${FLOATING_LAYER} ${HIRE_FLOAT}\`;`.
`FLOATING_LAYER`is applied unprefixed:`z-index`is inert on the statically positioned link from`sm`up, and a raw`max-sm:z-30` here would bypass the layer constants the guard pins.
(`FLOATING_LAYER`and`HIRE_ACCENT` are full literals in their own modules, which Tailwind scans.)
- In `HireLink`, pass `activeClassName="max-sm:hidden"` and `inactiveClassName=""`; the fallback
  stays `<Link href="/hire" className={HIRE_LINK}>`, identical to the inactive resolved link.
- Update the comment above `HireLink` and the file's header comment: one link, in the header's
  right group from `sm`, floating bottom-right below `sm`, hidden there on `/hire`.

### 3. Fit the row at 320px

- `src/app/layout.tsx`: left group `gap-2 sm:gap-6`; tagline span `hidden lg:inline`.
- `src/components/SectionNav.tsx`: nav `gap-2.5 sm:gap-4`; add `whitespace-nowrap` to
  `BRAND_LINK` so the brand never breaks inside itself (it is a flex item and could shrink and wrap
  to two lines, growing the header).
- Keep `flex-wrap` on the header row as graceful degradation below 320px; the journey asserts
  57px at 320 and up.

### 4. Float `IdentifyButton` below `sm`

- `src/components/IdentifyButton.tsx`: import `FLOATING_LAYER`; append `${FLOATING_LAYER}` and
  `max-sm:fixed max-sm:right-4 max-sm:bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] max-sm:min-h-11 max-sm:bg-background max-sm:shadow-lg`
  (opaque, since it floats over content). From `sm` up unchanged. Update its comment.

### 5. Reserve bottom space

- `src/app/layout.tsx`: `<main className="max-sm:pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">`.
  Check `src/app/(dashboard)/layout.tsx`: below `md` its column is not a scroll container, so the
  padding on `main` is what the window scroll reaches; nothing else changes there.

### 6. Update the `--header-height` comment

- `src/app/globals.css`: the header is one row at every width from 320px (the Work with me button
  floats below `sm`, the tagline shows from `lg`); value `3.5625rem` unchanged. Its tallest item is
  still the Work with me button's 2rem box from `sm` up; below `sm` the brand and nav set the row,
  which stays within the same height (verify 57px in the journey; if it is shorter below `sm`, give
  the row `min-h-8` on the inner div so the height is 57px at every width, and note it in the
  comment).

### 7. Update the feature docs and the profile

- `app_docs/screens-and-components.md`: sticky header section: one row at every width, tagline from
  `lg`, the floating Work with me (and Login / Logout above it) below `sm`, `FLOATING_LAYER`
  between content and `HEADER_LAYER`, `main`'s bottom padding below `sm`. Add a Rule: never render
  a second Work with me link for mobile; never put the floating buttons at or above
  `HEADER_LAYER`. Add this spec to its list of specs.
- `app_docs/routing-and-navigation.md`: header links paragraph: the button's position by width,
  hidden on `/hire` below `sm` (through the active state), `aria-current="page"` on `/hire`
  unchanged. Add this spec.
- `app_docs/hire.md`, `app_docs/analytics.md`: one sentence each on the phone position.
- `docs/conditional-docs.md`: extend the `screens-and-components.md` line with "the floating Work
  with me button".
- `.adw/project.md`: add `e2e/test_header_mobile.md` to the Tests list; in Review, "The fuchsia
  Work with me button is in the header from 640px up and floats bottom-right below it (hidden on
  `/hire` there)". Do not touch the nine headings.

### 8. Update the existing journeys

- `e2e/test_hire_page.md`: "in the header" checks run at 1920x1080; step 22 at 375: `Work with me`
  is not in the header's box on `/hire` and is not visible there; on `/` at 375 it is visible,
  `position: fixed`, bottom-right. Success criteria worded by width.
- `e2e/test_header_section_active.md`: the `/hire` `aria-current` check at 1920x1080 (state it);
  the 375 screenshot step stays.
- `e2e/test_header_login_hidden.md`: "the `Work with me` link is present" means present in the
  document (`a[href="/hire"]`), in the header at 1920x1080; add a 375x667 check on `/` that no
  Login / Logout exists anywhere and the link is present.
- `e2e/test_sticky_header.md`: step 8 at 375: also **Verify** the header height is 57px (within
  1px) and the brand, `Watch me build` and `Writing` are inside it.

### 9. Add `e2e/test_header_mobile.md`

- Model on `e2e/test_sticky_header.md` (`## User Story`, `## Test Steps` with **Verify** lines,
  `## Success Criteria`). Steps, from the issue's Verification section:
  - For each of `/`, `/projects/log`, `/writing`, `/writing/my-moat`, at 320x568, 375x667, 390x844,
    430x932, 640x800, 768x1024, 1024x768, 1920x1080, in light and dark (`browser_run_code_unsafe`
    with `page.emulateMedia({ colorScheme })`):
    - `body > header` height is 57px within 1px;
    - exactly one `a[href="/hire"]` with accessible name `Work with me`;
    - below 640: computed `position` is `fixed`, rect inside the viewport, `innerWidth - right` and
      `innerHeight - bottom` are 16px within 2px, height at least 44px; from 640: rect inside
      `body > header`'s rect and `position` is not `fixed`;
    - below 640, after `window.scrollTo(0, document.documentElement.scrollHeight)`,
      `main.lastElementChild.getBoundingClientRect().bottom <= button.getBoundingClientRect().top`;
    - the tagline text is not visible below 1024 and visible at 1024 and 1920;
    - `document.documentElement.scrollWidth <= innerWidth`.
  - `/hire` at 390x844: the link is not visible (computed `display` is `none`); at 1024x768 it is
    inside the header with `aria-current="page"`.
  - Screenshots of the header and floating button at 390 and 768, light and dark (4 at least).
- The radio bar above the header is out of scope; the checks read `body > header`.

### 10. Negative check (not committed)

- Temporarily set the tagline back to `hidden sm:inline`, run the 768x1024 header height check of
  `e2e/test_header_mobile.md`, confirm it reports about 89px and fails, then restore
  `hidden lg:inline`. `git diff` must not show the probe.

### 11. Run the validation commands

- Run every command in `Validation Commands`.

## Testing Strategy

### Unit Tests

- `src/lib/layers.test.ts`: `FLOATING_LAYER` is a numeric `z-<n>` class below `HEADER_LAYER`,
  above every other `z-<n>` in `src/`, and is the layer `SectionNav.tsx` and `IdentifyButton.tsx`
  use (no raw z-index there). Fails without the change (missing export, sources lack it).

### Test Coverage

- `src/lib/layers.test.ts` (unit, vitest): pins the floating buttons' layer between content and
  the header, catching a future `z-50` on the floating button that would cover the section tooltip,
  or a raw `z-30` that bypasses the layer constants. Nothing pins this today.
- The layout behaviour itself (one row, fixed position, hidden on `/hire`, bottom padding) is CSS
  in a rendered page; the profile has no component or Playwright code layer, so it is covered by
  the agent-driven journey `e2e/test_header_mobile.md` (task 9), which is the only way to measure
  computed position and rects at many viewports here.

### Edge Cases

- 320px wide: brand, "Watch me build", "Writing" fit one row (312px of 320).
- 640px exactly: `sm` applies, the link is back in the header, row fits (about 594px).
- 1023px vs 1024px: tagline hidden then shown, row still one line at 1024 (measured 57px today).
- `/hire` below `sm`: no floating button, no empty gap; `/hire` from `sm`: `aria-current="page"`.
- Project page outside `generateStaticParams`: the Suspense fallback is inactive and identical to
  the resolved inactive link, so the floating button does not jump when the pathname streams in.
- iPhone with a home indicator: `env(safe-area-inset-bottom)` lifts the button; `main`'s padding
  adds the same inset.
- Section tooltip near the bottom-right on phones: `TOOLTIP_LAYER` draws over the button.
- Dark mode: the button keeps `HIRE_ACCENT`; the shadow stays soft.
- Owner with Login / Logout on a phone: it floats above Work with me; on `/hire` it floats alone
  at its own offset.

## Acceptance Criteria

- `body > header` is 57px (within 1px) at 320, 375, 390, 430, 640, 768, 1024 and 1920 wide on `/`,
  `/projects/log`, `/writing` and a post, light and dark.
- Exactly one `a[href="/hire"]` named "Work with me" at every width.
- Below 640px it is `position: fixed`, 16px (within 2px) from the right and bottom edges, at least
  44px tall, and the last child of `<main>` ends above it when scrolled to the bottom; from 640px it
  is inside the header and not fixed.
- On `/hire` it is hidden below 640px and has `aria-current="page"` in the header at 1024px.
- The tagline is hidden below 1024px and visible from 1024px.
- No horizontal overflow at any tested width.
- `--header-height`, `HEADER_LAYER`, `TOOLTIP_LAYER` and the sidebar's sticky offset unchanged; no
  `z-<n>` at or above `HEADER_LAYER` outside `layers.ts`.
- Docs and the four existing journeys updated; `e2e/test_header_mobile.md` added; no em-dashes.

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

- `yarn lint`: ESLint over the changed components and tests.
- `yarn typecheck`: `next typegen` and `tsc --noEmit`, the new export and its imports.
- `yarn knip`: `FLOATING_LAYER` is used, no dead export.
- `yarn format:check`: Prettier on all changed files, including the docs and journeys.
- `yarn test`: vitest, including the extended `src/lib/layers.test.ts`.
- `yarn build`: the app builds and prerenders with the new classes.
- `yarn check:og`: the post metadata check after the build, unaffected but part of the suite.
- `grep -rn "$(printf '\342\200\224')" src app_docs docs e2e specs/issue-214-adw-b4882b73-sdlc_planner-header-one-row-floating-hire.md .adw/project.md`: must print nothing (no em-dashes).

## Notes

- No new dependency.
- Why `FLOATING_LAYER` is applied unprefixed: `z-index` does nothing on a statically positioned
  element, so `z-30` from `sm` up is inert; this keeps the class a full literal in `layers.ts`
  where the guard expects it.
- Known limit: for the owner only (Login / Logout visible, flag-gated, never in dev or review),
  the row from 640px to about 680px needs brand with suffix 246 + nav 162 + gaps + Logout 84 + Work
  with me 114, which can wrap. Visitors never see it; widen the floating range or hide the brand
  suffix until `md` in a follow-up if it matters.
- The radio bar (#211) sits above the header and is out of scope; every check reads
  `body > header`.
- Do not start the dev server on a port other than `PORT` from `.ports.env`; the journeys run in
  the test phase through the Playwright MCP server.
