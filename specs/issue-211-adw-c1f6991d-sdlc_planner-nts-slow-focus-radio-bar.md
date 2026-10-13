# Feature: NTS Slow Focus radio bar above the header on every page

## Metadata

issue_number: `211`
adw_id: `c1f6991d`
issue_json: `{"number":211,"title":"NTS Slow Focus radio bar above the header on every page"}`

## Feature Description

A thin bar above the site header, on every route, that plays NTS Radio's Slow Focus infinite
mixtape (a 24/7 ambient, drone and ragas stream). It is a reduced take on the NTS live bar on
nts.live: one stream, one control (play / stop), in the site's own palette. It reads, left to
right: a small red dot and `LIVE NOW`, then a small bordered box holding `∞`, the play / stop
button and the title `NTS · SLOW FOCUS`, which links to the mixtape page on nts.live so the credit
is always visible. Nothing plays until the visitor presses play. Because the bar is rendered by the
root layout, which client-side navigation never remounts, the same `<audio>` element keeps playing
while the visitor moves between pages. When the stream fails, the bar stays, the title is replaced
by a short polite error (`Can't reach NTS right now`) and the button returns to play so the visitor
can retry. `radio_played` and `radio_stopped` go to PostHog through the existing production-only
setup.

## User Story

As a visitor reading the site
I want to start and stop a calm background stream from any page
So that I can listen to NTS Slow Focus while I browse, without it stopping each time I change page

## Problem Statement

The site has no ambient, personal touch beyond its content, and a stream started from a page
component would stop on every navigation. The widget has to sit outside every page, never autoplay,
keep the sticky header and every layout invariant (header at `top: 0`, `--header-height`, the
sidebar offset, `HEADER_LAYER`, one `body > header`, the status hue guard) intact, credit NTS
visibly, and fail softly when the stream is unreachable.

## Solution Statement

- A pure state machine in `src/lib/radio.ts` (status `idle | loading | playing`, an `error` flag
  and an `attempt` counter) decides every transition, labels the button and drops stale events
  (a `play()` rejection or `error` event that belongs to a stream the visitor already stopped).
  It is unit-tested in node, like the other `src/lib` helpers.
- A leaf client component `src/components/RadioBar.tsx` holds the reducer with `useReducer`, owns
  one `<audio preload="none">` with no `src` in the markup, sets `src` only inside the play click
  handler and calls `play()`, and on stop pauses, removes `src` and calls `load()`, so the
  connection is dropped and the next play is live. Media events (`onPlaying`, `onError`) are React
  props on the `<audio>`; no `useEffect` is needed.
- `src/app/layout.tsx` renders `<RadioBar />` as the first child of `<body>`, before the
  `<header>`, in normal flow (not sticky, no z-index). Sticky `top-0` on the header keeps pinning it
  at `0` once the bar has scrolled away; `--header-height`, `HEADER_LAYER` and the sidebar offset
  are untouched.
- The bar's root is a `<div>` (a labelled region), never a `<header>`, so `body > header` keeps
  matching the one sticky header every existing journey queries.
- The title link stays rendered in every state and always points at the mixtape page; in the error
  state its text becomes the error, so the NTS credit and the link are never removed (and the
  visitor whose browser cannot reach the stream gets a way to listen on nts.live). The link sits
  inside a `role="status"` `aria-live="polite"` span, so the switch to the error text is announced.
- The red dot is a status hue (`red-*`), which `src/lib/status-colors.test.ts` forbids outside the
  map. `RadioBar.tsx` becomes the second exemption next to `ConnectionIndicator.tsx` (it describes
  a broadcast, not a run state), and the rule in `app_docs/screens-and-components.md` and the
  comment in `src/lib/status-colors.ts` change in the same commit, as `AGENTS.md` requires.

## Relevant Files

Use these files to implement the feature:

- `README.md`: repository overview; lists the feature docs (add the new Radio doc to its list).
- `AGENTS.md`: rules (Yarn only, no em-dashes, one doc per feature, doc Rules are invariants).
- `.adw/project.md`: the profile; its Tests section lists every `e2e/*.md` journey and its Review
  section describes what every route shows. Both gain the bar in the same change.
- `docs/conditional-docs.md`: the doc index; gains one line for `app_docs/radio.md`.
- `app_docs/screens-and-components.md`: describes the sticky root header, the `bg-background`
  exception, the client component list and the status hue guard's one exemption. Matches this task
  (sticky header, z-index layer, `"use client"`, a colour).
- `app_docs/analytics.md`: the events table and the rule that `posthog-js` is imported only in
  client components. Matches this task (adding PostHog events).
- `app_docs/routing-and-navigation.md`: describes the root layout's header; read to confirm nothing
  there changes (the header's links are untouched).
- `src/app/layout.tsx`: the root layout; `<RadioBar />` goes before `<header>`.
- `src/app/globals.css`: holds `--header-height` and the `--background` / `--foreground` tokens;
  read only, must not change.
- `src/lib/layers.ts`, `src/lib/layers.test.ts`: `HEADER_LAYER = "z-40"` and the guard that no other
  `z-<n>` reaches it. The bar takes no z-index at all.
- `src/lib/status-colors.ts`, `src/lib/status-colors.test.ts`: the status hue guard and its
  exemption list (`ConnectionIndicator.tsx`); `RadioBar.tsx` joins it for the red dot.
- `src/components/IdentifyButton.tsx`, `src/components/IdentifyButton.test.ts`: the pattern for a
  header client leaf that imports `posthog-js`, and for a node test that renders a client component
  with `renderToStaticMarkup` and a mocked `posthog-js`.
- `src/components/TodaySummary.tsx`: the pattern for `posthog.capture` from a click handler.
- `src/components/ConnectionIndicator.tsx`: the existing exempt component with its own colours and
  `role="status"`; read for the live-region idiom.
- `e2e/test_sticky_header.md`, `e2e/test_single_background_color.md`,
  `e2e/test_header_login_hidden.md`: existing journeys that query `body > header`; they must pass
  unchanged, and they are the model for the new journey's format.
- `vitest.config.ts`: `src/**/*.test.ts` only, node environment; the new tests are `.test.ts`.
- `knip.json`: every new export must be used.
- `playwright-mcp-config.json`: headless Chromium; the stream is `audio/mpeg` (checked on
  2026-10-13: `stream-mixtape-geo.ntslive.net/mixtape` 302s to `streams.radiomast.io`, then to an
  edge answering `200 Content-Type: audio/mpeg` with `Access-Control-Allow-Origin: *`), which
  Chromium decodes.

### New Files

- `src/lib/radio.ts`: the stream and page URLs, the error text, the reducer and the label helper.
- `src/lib/radio.test.ts`: unit tests for the reducer and the label.
- `src/components/RadioBar.tsx`: the `"use client"` bar.
- `src/components/RadioBar.test.ts`: the server markup test (idle, no autoplay, no `src`, credit).
- `app_docs/radio.md`: the feature doc.
- `e2e/test_radio_bar.md`: the agent-driven acceptance journey the issue asks for.

## Implementation Plan

### Phase 1: Foundation

Write the pure model in `src/lib/radio.ts` and its tests first: constants, state, events, reducer,
label. Everything the component decides comes from here, so the hard part (ordering of `stop`,
a late `play()` rejection, a late `error` event, retry after error) is pinned in node before any
DOM work.

### Phase 2: Core Implementation

Build `RadioBar.tsx` on the reducer: the markup and classes, the play / stop handlers that drive the
`<audio>` imperatively, the media event props, the live region, the icons and the two
`posthog.capture` calls. Add its server markup test.

### Phase 3: Integration

Mount it in `src/app/layout.tsx` before the `<header>`, add the status hue exemption, then the
docs (new feature doc, index line, analytics events table, screens and components, README list,
profile) and the E2E journey.

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. Read the framework and project context

- Read `app_docs/screens-and-components.md`, `app_docs/analytics.md` and
  `app_docs/routing-and-navigation.md` in full.
- Skim the installed Next guide on the root layout and client components under
  `node_modules/next/dist/docs/` (layouts preserve state on navigation; `"use client"` leaves in a
  server layout) to confirm the persistence assumption still holds in this Next version.

### 2. Create `src/lib/radio.ts`

- A short file comment in the style of `src/lib/analytics.ts`: what the bar plays, that this file
  is plain (no React, no `posthog-js`, no DOM) and testable in node.
- Constants, each written once and used by the component:
  - `RADIO_STREAM_URL = "https://stream-mixtape-geo.ntslive.net/mixtape"`
  - `RADIO_PAGE_URL = "https://www.nts.live/infinite-mixtapes/slow-focus"`
  - `RADIO_ERROR_TEXT = "Can't reach NTS right now"`
- Types:
  - `RadioStatus = "idle" | "loading" | "playing"`
  - `RadioState = { status: RadioStatus; error: boolean; attempt: number }`
  - `RadioEvent = { type: "play"; attempt: number } | { type: "stop"; attempt: number } | { type: "playing"; attempt: number } | { type: "fail"; attempt: number }`
- `INITIAL_RADIO_STATE: RadioState = { status: "idle", error: false, attempt: 0 }`.
- `radioReducer(state, event)`:
  - `play`: only from `idle`; becomes `loading` with the event's `attempt`; `error` is kept (the
    message stays while the retry loads; only a successful play clears it). From any other status,
    return `state` unchanged.
  - `stop`: from `loading` or `playing`, becomes `idle` with the event's `attempt` and
    `error: false` (the visitor's own action). From `idle`, unchanged.
  - `playing`: only when `event.attempt === state.attempt` and status is `loading` (or already
    `playing`); becomes `playing` with `error: false`. Otherwise unchanged (a stale event).
  - `fail`: only when `event.attempt === state.attempt` and status is `loading` or `playing`;
    becomes `idle` with `error: true`. Otherwise unchanged, so the `AbortError` a `play()` promise
    rejects with after the visitor pressed stop, or an `error` event from a dropped stream, never
    shows the error.
- `radioButtonLabel(status)`: `"Play NTS Slow Focus"` for `idle`, `"Stop NTS Slow Focus"` for
  `loading` and `playing` (pressing during loading stops the attempt).
- Export only what the component and its test use (knip).

### 3. Create `src/lib/radio.test.ts`

Model on `src/lib/analytics.test.ts` (`describe` / `it`, no mocks needed). Cases:

- `play` from idle is `loading` with the new attempt and no error.
- `playing` with the current attempt is `playing`; with an older attempt it is ignored.
- `stop` from `playing` and from `loading` is `idle` with no error and the new attempt.
- `fail` with the current attempt from `loading` and from `playing` is `idle` with `error: true`.
- `fail` after `stop` (same old attempt, status `idle`) leaves the state idle with no error: the
  rejection a pause causes is not an error.
- A stale `fail` from attempt 1 arriving while attempt 3 is loading is ignored (stop then play
  quickly).
- Retry: from `{ idle, error: true }`, `play` keeps `error: true` while loading; `playing` clears it.
- `play` while `loading` or `playing` is a no-op (double click).
- `radioButtonLabel` returns the two names for the three statuses.
- The constants: the stream URL host is `stream-mixtape-geo.ntslive.net` and the page URL is
  exactly the Slow Focus mixtape page (guards against an edit that drops the credit link).

### 4. Create `src/components/RadioBar.tsx`

- `"use client"` at the top; imports `posthog from "posthog-js"`, `useReducer`, `useRef` from
  React, and the model from `@/lib/radio`. A doc comment saying: rendered by the root layout before
  the header, which navigation never remounts, so the one `<audio>` survives client-side
  navigation; no autoplay; `src` is set only on play and removed on stop; credit link always
  rendered.
- State: `const [state, dispatch] = useReducer(radioReducer, INITIAL_RADIO_STATE)`,
  `const audioRef = useRef<HTMLAudioElement>(null)`, `const attemptRef = useRef(0)`.
- `play()` (click when `state.status === "idle"`):
  - `const attempt = ++attemptRef.current`; `dispatch({ type: "play", attempt })`;
  - `posthog.capture("radio_played")`;
  - `audio.src = RADIO_STREAM_URL`; `audio.play().catch(() => dispatch({ type: "fail", attempt }))`
    (the reducer drops it when the visitor stopped meanwhile).
- `stop()` (click when loading or playing):
  - `const attempt = ++attemptRef.current`; `dispatch({ type: "stop", attempt })`;
  - `posthog.capture("radio_stopped")`;
  - `audio.pause()`; `audio.removeAttribute("src")`; `audio.load()` (drops the connection and the
    buffer; with no `src` the resource selection ends quietly, and any `error` it raises is stale).
- `<audio ref={audioRef} preload="none" onPlaying={() => dispatch({ type: "playing", attempt: attemptRef.current })} onError={() => dispatch({ type: "fail", attempt: attemptRef.current })} />`
  with no `src`, no `autoPlay`, no `controls` (hidden: an `<audio>` without `controls` renders
  nothing).
- Markup (one row at every width, small uppercase text):
  - Root: `<div role="region" aria-label="NTS Slow Focus radio" className="border-b border-neutral-200 bg-background dark:border-neutral-800">`. Not `<header>`, no `sticky`, no `z-<n>`.
  - Inner: `mx-auto flex h-9 max-w-6xl items-center gap-3 px-4 text-[11px] font-medium tracking-wider uppercase` (36px tall, same width and gutter as the header).
  - Left: `<span className="flex shrink-0 items-center gap-1.5">` with a `size-1.5 rounded-full bg-red-600` dot (`aria-hidden`) and `LIVE NOW` in `text-neutral-500 dark:text-neutral-400`.
  - Box: `<div className="flex min-w-0 items-center gap-2 border border-neutral-300 px-2 py-0.5 dark:border-neutral-700">` holding:
    - `<span aria-hidden="true">∞</span>`;
    - the button: `type="button"`, `aria-label={radioButtonLabel(state.status)}`,
      `aria-pressed={state.status !== "idle"}`, `aria-busy={state.status === "loading"}`,
      `onClick={state.status === "idle" ? play : stop}`, a fixed `size-5` hit area with
      `flex shrink-0 items-center justify-center` and a visible focus outline in neutral; its child
      is an inline `aria-hidden` SVG: a play triangle (idle), a small spinning ring
      (`animate-spin motion-reduce:animate-none`, loading), a stop square (playing), all
      `fill-current` / `stroke-current` so they follow `text-foreground`;
    - `<span role="status" aria-live="polite" className="min-w-0 truncate">` wrapping the one
      `<a href={RADIO_PAGE_URL} target="_blank" rel="noopener noreferrer">` whose text is
      `NTS · SLOW FOCUS` normally and `RADIO_ERROR_TEXT` when `state.error` (the error text in
      `text-neutral-500 dark:text-neutral-400`, no extra hue). The link and the span carry
      `truncate` so a long text ends in an ellipsis at 375px.
- No `useEffect`, no `z-<n>`, no other status hue than the dot, no em-dashes.

### 5. Create `src/components/RadioBar.test.ts`

Model on `src/components/IdentifyButton.test.ts` (`vi.mock("posthog-js", ...)` with a
`capture: vi.fn()`, `renderToStaticMarkup(createElement(RadioBar))`). Assert on the server markup:

- contains `LIVE NOW` and `NTS · SLOW FOCUS`;
- the link has `href="https://www.nts.live/infinite-mixtapes/slow-focus"`, `target="_blank"` and
  `rel="noopener noreferrer"`;
- the button has `aria-label="Play NTS Slow Focus"` and `aria-pressed="false"`;
- the `<audio>` has `preload="none"` and neither a `src` nor an `autoplay` attribute;
- the root is not a `<header>` and its class list has no `sticky` and no `z-` class;
- does not contain `Can't reach NTS right now` (no error on load).

### 6. Exempt the bar from the status hue guard

- In `src/lib/status-colors.test.ts`, add `"/src/components/RadioBar.tsx"` to `EXEMPT` and extend
  the comment above it: the radio bar's live dot describes a broadcast, not a run state.
- Update the header comment of `src/lib/status-colors.ts`, which names the connection pill as the
  one exemption, to name both.

### 7. Mount the bar in the root layout

- In `src/app/layout.tsx`, import `RadioBar` and render `<RadioBar />` as the first child of
  `<body>`, before `<header>`. Change nothing on the header, `<main>` or `metadata`.
- Do not touch `src/app/globals.css`, `src/lib/layers.ts` or `src/app/(dashboard)/layout.tsx`.

### 8. Write `app_docs/radio.md`

Follow the shape of the other feature docs (`**Specifications:**` with this spec's path,
`## Overview`, `## How it works`, `## Rules`). Cover: what it plays (Slow Focus, the stream URL,
that it redirects to radiomast), where it sits (first child of `body`, before the sticky header,
scrolls away, rendered once by the root layout so playback survives client-side navigation; a full
page load stops it), the look, the state machine in `src/lib/radio.ts` and why stale events are
dropped, the error behaviour (title link text becomes the error, link and credit stay, polite
announcement, button back to play, success clears it), the two events, and that it is
`role="region"` not `<header>`. Rules:

- Never autoplay; `src` is set only by the play click handler, and `preload="none"`.
- Never make the bar sticky or give it a z-index; never change `--header-height`, `HEADER_LAYER` or
  the sidebar offset for it.
- The bar is never a `<header>`: `body > header` is the sticky header.
- The `NTS` name and the link to the mixtape page are always rendered, in every state; never
  replace them with an icon.
- Only the Slow Focus stream; no other channel, schedule, volume, playlist or now-playing feed.
- The URLs and the error text live only in `src/lib/radio.ts`; every transition goes through
  `radioReducer`, with a test case for each change.
- The red dot is the only accent colour; the error text stays neutral.

### 9. Update the other docs and the profile

- `docs/conditional-docs.md`: add one line, for example
  `- \`app_docs/radio.md\`: read when changing the NTS radio bar above the header, \`src/components/RadioBar.tsx\`, \`src/lib/radio.ts\`, the stream or credit URLs, or what renders before the header in \`src/app/layout.tsx\`.`
- `app_docs/analytics.md`: add `radio_played` and `radio_stopped` rows to the events table (sent
  from `src/components/RadioBar.tsx`, properties: none), and a sentence that they fire on the
  visitor's click, not on the stream actually starting or failing.
- `app_docs/screens-and-components.md`: in the root header rule, say the radio bar
  (`app_docs/radio.md`) sits above the header in normal flow and scrolls away while the header pins
  at `top: 0`; in the `bg-background` rule, list the bar beside the header as an element that
  matches the page colour; add `RadioBar` (holds the player state and the `<audio>`) to the
  `"use client"` list; in the status colour rule, name `RadioBar`'s live dot as the second
  exemption. Add this spec to its `**Specifications:**` list.
- `README.md`: add `- [Radio bar](app_docs/radio.md)` to the documentation list.
- `.adw/project.md`: add `e2e/test_radio_bar.md` to the journey list in Tests, and in Review note
  that the radio bar (`LIVE NOW`, the play button, `NTS · SLOW FOCUS`) sits above the header on
  every route and is idle on load. Keep the nine `##` headings untouched.

### 10. Add the acceptance journey `e2e/test_radio_bar.md`

The profile has no code E2E suite and no component test layer, so playback across client-side
navigation, the real network request and the error path through a failing stream can only be shown
in a browser; the issue asks for this journey by name. Follow `e2e/test_sticky_header.md`'s format
(`# E2E Test: Radio Bar`, intro, `## User Story`, `## Test Steps` numbered with `**Verify**` lines,
`## Success Criteria`). Steps, using `browser_evaluate` and `browser_run_code_unsafe` for
`page.route` and `page.emulateMedia({ colorScheme })`:

1. Resize to 1280x800, light colour scheme, navigate to `/`. **Verify** the element before
   `body > header` (`document.querySelector('body > header').previousElementSibling`) is the bar,
   it contains `LIVE NOW` and `NTS · SLOW FOCUS`, and its link's `href` is
   `https://www.nts.live/infinite-mixtapes/slow-focus` with `target="_blank"`.
2. **Verify** `document.querySelector('audio').paused === true`, it has no `src`, and the network
   request list contains no request to `ntslive.net`. Screenshot (idle).
3. Click the button named `Play NTS Slow Focus`. **Verify** within 10s that `audio.paused` is
   `false` and the button's accessible name is `Stop NTS Slow Focus` with `aria-pressed="true"`.
   Tag the element (`window.__radio = document.querySelector('audio')`). Screenshot (playing).
4. Click the header link to `/writing`, then to `/projects/log` (Watch me build, then the sidebar's
   Daily log, or the header link that reaches it), then the brand link back to `/`. After each,
   **Verify** `document.querySelector('audio') === window.__radio`, `paused === false`, and
   `currentTime` read twice 2s apart increases.
5. Click `Stop NTS Slow Focus`. **Verify** `paused === true`, name back to `Play NTS Slow Focus`,
   `aria-pressed="false"`.
6. On `/projects/log`, scroll to the bottom. **Verify** `body > header` has
   `getBoundingClientRect().top === 0` and the bar's `getBoundingClientRect().bottom <= 0`.
7. Error: `page.route('**/stream-mixtape-geo.ntslive.net/**', r => r.abort())`, scroll to top,
   click play. **Verify** within 10s the bar is still in the DOM and visible, the `role="status"`
   region reads `Can't reach NTS right now`, the link still points at the mixtape page, and the
   button's name is `Play NTS Slow Focus`. Screenshot (error).
8. `page.unroute(...)`, click play. **Verify** within 10s `paused === false` and the error text is
   gone (`NTS · SLOW FOCUS` is back). Click stop.
9. Repeat the idle, playing and error screenshots in dark (`emulateMedia({ colorScheme: 'dark' })`).
10. Resize to 375x812 and repeat steps 1 to 3, 5 and 7 to 8 in light and dark. **Verify**
    `document.documentElement.scrollWidth <= innerWidth` in idle, playing and error states, and the
    bar is a single row (its height under 40px).

Success Criteria: bar before the header with the credit link; idle and silent on load with no
request to `ntslive.net`; play, stop and the accessible names; playback survives navigation on the
same element; header pinned and bar scrolled out; no horizontal scroll at 375px; error shown in the
bar and cleared by a successful retry; 12 screenshots (idle, playing, error x 2 widths x 2
schemes).

### 11. Negative check (not committed)

- Temporarily change the error branch in `RadioBar.tsx` to return `null` for the whole bar when
  `state.error` is true, run step 7 of the journey, and confirm it fails (the bar is gone). Restore
  the file and confirm `git diff` shows no trace of the probe.
- Likewise confirm `src/lib/radio.test.ts` fails if the `fail` branch stops checking the attempt,
  then restore.

### 12. Run the validation commands

Run every command in `Validation Commands` and fix anything they report.

## Testing Strategy

### Unit Tests

- `src/lib/radio.test.ts`: every reducer transition, the stale-event guard, retry semantics, the
  label, the two URLs.
- `src/components/RadioBar.test.ts`: the server markup is idle, silent (no `src`, no `autoplay`,
  `preload="none"`), credited (`NTS · SLOW FOCUS`, the link with `target` and `rel`), labelled
  (`Play NTS Slow Focus`, `aria-pressed="false"`), not a `<header>`, not sticky and without a
  z-index.
- Existing guards that must keep passing: `src/lib/layers.test.ts` (no z-index in the bar),
  `src/lib/status-colors.test.ts` (with the new exemption).

### Test Coverage

- `src/lib/radio.test.ts` (unit, vitest): catches a stop that surfaces as an error, a stale
  rejection from an earlier attempt that breaks a retry, a double click starting twice, and an
  error that a successful play fails to clear. Fails without the feature (the module does not
  exist).
- `src/components/RadioBar.test.ts` (unit, vitest, server render): catches autoplay or an eager
  `src` creeping into the markup, a lost credit link, a wrong accessible name and the bar turning
  into a second `<header>` or a sticky / layered element. Fails without the feature.
- Playback across navigation and the real error path have no test layer here (no component or
  Playwright suite); they are proven by the `e2e/test_radio_bar.md` journey in task 10.

### Edge Cases

- Stop pressed while loading: `play()` rejects with `AbortError`; no error is shown.
- Stop then play in quick succession: the first attempt's late rejection is ignored.
- Double click on play: the second `play` event is a no-op.
- Stream fails mid-play (network drop): the `error` event turns the bar to the error state with the
  button back to play.
- Retry after error: the error text stays during loading and clears on `playing`.
- Full page load (not client-side navigation) stops the stream: expected and documented.
- 375px wide: the title truncates with an ellipsis; no horizontal scroll in any state.
- Dark mode: border and secondary text use the header's dark tokens.
- Automated browser and non-production builds: `posthog.capture` is a no-op, nothing throws.
- Reduced motion: the loading ring does not spin.

## Acceptance Criteria

- On every route the bar is the element before `body > header`, shows the red dot, `LIVE NOW`, `∞`,
  the play button and `NTS · SLOW FOCUS` linking to the Slow Focus page in a new tab.
- On load the `<audio>` is paused, has no `src`, and no request to `ntslive.net` has been made.
- Play starts the stream within 10s, with a loading state then a stop icon; the button's name and
  `aria-pressed` follow the state. Stop pauses and drops the stream.
- The same `<audio>` keeps playing across client-side navigation between `/`, `/writing` and
  `/projects/log`.
- After scrolling, `body > header` is at `top: 0` and the bar is out of view; `--header-height`,
  `HEADER_LAYER` and the sidebar offset are unchanged; `e2e/test_sticky_header.md` passes unchanged.
- At 375px, `scrollWidth <= innerWidth` and the bar is one row.
- A failing stream leaves the bar visible with `Can't reach NTS right now` announced politely, the
  credit link still present, the button back to play; a successful retry clears it.
- `radio_played` and `radio_stopped` are captured on click and listed in `app_docs/analytics.md`.
- `app_docs/radio.md` exists with Rules, has one line in `docs/conditional-docs.md`, and
  `app_docs/screens-and-components.md`, `README.md` and `.adw/project.md` mention it.
- No em-dashes in any changed file; all validation commands pass.

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

- `yarn lint` - ESLint over the new component, lib and tests.
- `yarn typecheck` - `next typegen` then `tsc --noEmit`; the reducer's event union and the audio ref.
- `yarn knip` - no unused export in `src/lib/radio.ts` or the component.
- `yarn format:check` - Prettier on every changed file, docs included.
- `yarn test` - the new radio and RadioBar tests, plus the layers and status hue guards.
- `yarn build` - the root layout still prerenders with a client leaf before the header.
- `yarn check:og` - post metadata check after the build, unaffected but part of the profile's
  sequence.
- `grep -rn "—" src/lib/radio.ts src/lib/radio.test.ts src/components/RadioBar.tsx src/components/RadioBar.test.ts app_docs/radio.md e2e/test_radio_bar.md; test $? -eq 1` - no em-dashes in the new files.

## Notes

- No new dependency: icons are inline SVG, analytics uses the existing `posthog-js`.
- The bar is a `<div role="region">`, not a second `<header>`, because three journeys query
  `body > header` and expect the sticky header.
- Error and credit: the issue asks for the error "in place of the title" and also that the NTS
  credit and link are never removed. The plan keeps the link element in every state and swaps only
  its text, so both hold, and a visitor whose network blocks the stream can still reach nts.live.
- The red dot needs the status hue exemption (`red` is in the guard's pattern); the doc rule that
  names the connection pill as the one exemption changes in the same commit.
- `audio/mpeg` plays in headless Chromium, so the journey can observe real playback; Playwright
  clicks count as a user gesture for the autoplay policy.
- Commit with a bare Conventional Commit type (`feat: ...`) and no trailers, per the profile.
- Future (out of scope): other NTS channels, now-playing metadata, volume, keeping playback across
  full page loads.
