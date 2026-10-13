# Patch: Write the radio bar feature doc and its index, analytics, README and profile entries

## Metadata

adw_id: `c1f6991d`
review_change_request: `Issue #1: Spec steps 8 and 9 (and the acceptance criterion that app_docs/radio.md exists with Rules, has one line in docs/conditional-docs.md, and is mentioned by app_docs/screens-and-components.md, README.md and .adw/project.md) are largely not implemented. app_docs/radio.md does not exist; no radio line in docs/conditional-docs.md; no radio_played or radio_stopped rows in app_docs/analytics.md; no Radio bar link in README.md; the Review section of .adw/project.md does not mention the bar; app_docs/screens-and-components.md lacks the root header rule extension, the RadioBar "use client" entry and this spec in **Specifications:**. The em-dash grep validation fails because app_docs/radio.md is missing. Severity: blocker`

## Issue Summary

**Original Spec:** specs/issue-211-adw-c1f6991d-sdlc_planner-nts-slow-focus-radio-bar.md
**Issue:** The code for the radio bar shipped (`src/lib/radio.ts`, `src/components/RadioBar.tsx`, the root layout mount, the status hue exemption, `--radio-bar-height` in the sidebar height, the e2e journey), but spec steps 8 and 9 (the documentation) were mostly skipped. `app_docs/radio.md` is missing, so the spec's em-dash grep exits 2 and its `test $? -eq 1` fails.
**Solution:** Docs only, no code changes. Write `app_docs/radio.md` so it describes what actually shipped, then add the one-line entries in the index, analytics doc, screens doc, README and profile Review section that spec step 9 asks for. Two places where the code differs from the spec's text, and the doc must follow the code: the live region is `aria-live="polite"` without `role="status"` (the connection pill stays the one status element), and the bar has no `bg-background`. The sidebar's sticky offset is unchanged, but its `md` height subtracts `--radio-bar-height`.

## Files to Modify

Use these files to implement the patch:

- `app_docs/radio.md` (new)
- `docs/conditional-docs.md`
- `app_docs/analytics.md`
- `app_docs/screens-and-components.md`
- `README.md`
- `.adw/project.md`

## Implementation Steps

IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Create `app_docs/radio.md`

- Use the same shape as `app_docs/home.md`: `# Radio bar`, then `**Specifications:**` with the single item `- specs/issue-211-adw-c1f6991d-sdlc_planner-nts-slow-focus-radio-bar.md`, then `## Overview`, `## How it works` and `## Rules`.
- Overview: `src/components/RadioBar.tsx` is a thin bar above the sticky header on every route. It plays NTS Radio's Slow Focus infinite mixtape. Left to right it shows the red live dot and `LIVE NOW`, then a bordered box holding `∞`, the play / stop button and `NTS · SLOW FOCUS`, which links to `RADIO_PAGE_URL` in a new tab. It is idle on load.
- How it works, using these subsections:
  - `### Placement`: the bar is the first child of `<body>` in `src/app/layout.tsx`, before `<header>`, in normal flow (not sticky, no z-index). It scrolls away while the header stays pinned at `top: 0`. The root layout never remounts on client-side navigation, so the one `<audio>` keeps playing between pages. A full page load stops it. The root is `<div role="region" aria-label="NTS Slow Focus radio">`, never a `<header>`, so `body > header` is still the sticky header. `--header-height`, `HEADER_LAYER` and the sidebar's sticky offset are unchanged. Only the sidebar's `md` height subtracts `--radio-bar-height` (`src/app/globals.css`, `h-9` plus the 1px border, `2.3125rem`), so the column fits the viewport at scroll 0.
  - `### Stream`: `RADIO_STREAM_URL` (`https://stream-mixtape-geo.ntslive.net/mixtape`) redirects to a radiomast edge that serves `audio/mpeg`. `<audio preload="none">` has no `src` in the markup. The play click sets `src` and calls `play()`. Stop pauses, removes `src` and calls `load()`, which drops the connection so the next play is live.
  - `### State machine`: `radioReducer` in `src/lib/radio.ts` has the statuses `idle | loading | playing`, an `error` flag and an `attempt` counter. Every click increments the attempt. `playing` and `fail` events count only for the current attempt while loading or playing, so the AbortError from a stopped `play()` and the error event of a dropped stream are ignored as stale. A double click on play is a no-op. `radioButtonLabel` names the button (`Play NTS Slow Focus` / `Stop NTS Slow Focus`), and `aria-pressed` and `aria-busy` follow the status. Unit tests: `src/lib/radio.test.ts`, `src/components/RadioBar.test.ts`.
  - `### Errors`: on a failure the link's text becomes `RADIO_ERROR_TEXT` (`Can't reach NTS right now`) in neutral grey. The link and its href stay, and the button returns to play. The text is announced through a span with `aria-live="polite"` and no `role="status"`, because the connection pill is the one status element. A retry keeps the error text while loading and clears it on `playing`.
  - `### Analytics`: `radio_played` and `radio_stopped` are sent on click (see `app_docs/analytics.md`).
- `## Rules`: the seven rules from spec step 8, word for word apart from punctuation (no em-dashes):
  - Never autoplay; `src` is set only by the play click handler, and `preload="none"`.
  - Never make the bar sticky or give it a z-index; never change `--header-height`, `HEADER_LAYER` or the sidebar's sticky offset for it (only the sidebar's height subtracts `--radio-bar-height`, which must change with the bar's height or border).
  - The bar is never a `<header>`: `body > header` is the sticky header.
  - The `NTS` name and the link to the mixtape page are always rendered, in every state; never replace them with an icon.
  - Only the Slow Focus stream; no other channel, schedule, volume, playlist or now-playing feed.
  - The URLs and the error text live only in `src/lib/radio.ts`; every transition goes through `radioReducer`, with a test case for each change.
  - The red dot is the only accent colour; the error text stays neutral.

### Step 2: Index and analytics

- `docs/conditional-docs.md`: append after the changelog line:
  ``- `app_docs/radio.md`: read when changing the NTS radio bar above the header, `src/components/RadioBar.tsx`, `src/lib/radio.ts`, the stream or credit URLs, `--radio-bar-height`, or what renders before the header in `src/app/layout.tsx`.``
- `app_docs/analytics.md`, events table (around line 38): add the rows ``| `radio_played` | `src/components/RadioBar.tsx` | none |`` and ``| `radio_stopped` | `src/components/RadioBar.tsx` | none |`` in alphabetical order (between `hire_request_submitted` and `run_history_searched`). Under the `hire_request_submitted` paragraph, add a paragraph: `` `radio_played` and `radio_stopped` fire on the visitor's click, not when the stream actually starts or fails. `` Prettier will re-pad the table.

### Step 3: `app_docs/screens-and-components.md`

- `**Specifications:**`: append `- specs/issue-211-adw-c1f6991d-sdlc_planner-nts-slow-focus-radio-bar.md`.
- Root header rule (the bullet starting "The root header in `src/app/layout.tsx` is `sticky top-0`", around line 212): after "on every route and at every width." add: ``The radio bar (`app_docs/radio.md`) sits above it in normal flow, as the first child of `body`, and scrolls away while the header stays pinned at `top: 0`.``
- `"use client"` list (around line 146): after `` `IdentifyButton`, which subscribes to PostHog's feature flags and distinct id, `` insert `` `RadioBar`, which holds the player state and the `<audio>`, ``.
- Leave the `bg-background` rule alone: the shipped bar has no `bg-` class.

### Step 4: README and profile

- `README.md`: after `- [Changelog](app_docs/changelog.md)` (line 27) add `- [Radio bar](app_docs/radio.md)`.
- `.adw/project.md`, `## Review`, first bullet: after "The fuchsia Work with me button is in the header on every route." add ``The radio bar (`LIVE NOW`, the play button, `NTS · SLOW FOCUS`) sits above the header on every route and is idle on load; do not press play during review unless the spec is about the bar.`` Do not rename or reorder any `##` heading.

### Step 5: Format and check

- Run `yarn format` so Prettier formats the new and changed markdown, then run the validation commands below.

## Validation

Execute every command to validate the patch is complete with zero regressions.

- `grep -rn $'\xe2\x80\x94' src/lib/radio.ts src/lib/radio.test.ts src/components/RadioBar.tsx src/components/RadioBar.test.ts app_docs/radio.md e2e/test_radio_bar.md; test $? -eq 1` (must exit 0)
- `grep -n "radio" docs/conditional-docs.md README.md .adw/project.md app_docs/analytics.md app_docs/screens-and-components.md` (each file has at least one hit; `radio_played` and `radio_stopped` appear in analytics)
- `yarn format:check`
- `yarn lint && yarn typecheck && yarn knip && yarn test`
- `yarn build && yarn check:og`

## Patch Scope

**Lines of code to change:** about 90 (about 75 in the new doc, about 15 across five existing docs), no source code
**Risk level:** low
**Testing required:** the em-dash grep exits 0, format check, then the profile's lint, typecheck, knip, unit, build and og sequence, which should be unaffected by doc-only changes
