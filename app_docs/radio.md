# Radio bar

**Specifications:**

- specs/issue-211-adw-c1f6991d-sdlc_planner-nts-slow-focus-radio-bar.md
- specs/issue-216-adw-155628ce-sdlc_planner-radio-bar-sticky-footer.md

## Overview

`src/components/RadioBar.tsx` is a thin footer fixed to the bottom of the viewport on every route.
It plays NTS Radio's Slow Focus infinite mixtape. It shows only a rounded (`rounded-md`) bordered box
holding `∞`, the play / stop button and `NTS · SLOW FOCUS`, which links to `RADIO_PAGE_URL` in a new
tab. There is no live label and no accent colour. It is idle on load.

## How it works

### Placement

The bar is the last child of `<body>` in `src/app/layout.tsx`, after `<main>`. It is
`fixed inset-x-0 bottom-0` on `FOOTER_LAYER` (`src/lib/layers.ts`, `z-20`: below `FLOATING_LAYER`,
`HEADER_LAYER` and `TOOLTIP_LAYER`, above every other z-index in `src/`, pinned by
`src/lib/layers.test.ts`), with `bg-background` so content scrolls under it, a top border and a
bottom padding of the safe-area inset. The root layout never remounts on client-side navigation,
so the one `<audio>` keeps playing between pages. A full page load stops it.

`body` reserves `--radio-bar-height` (`src/app/globals.css`, `h-9` plus the 1px border,
`2.3125rem`) plus the safe-area inset as bottom padding, so the end of every page clears the bar.
Below `sm` the floating Work with me button sits `--radio-bar-height` + 1rem + the inset from the
bottom, the owner's Login / Logout button above it, and `main` keeps a 5rem bottom padding for the
button. The sidebar's `md` height still subtracts `--radio-bar-height`, so the column ends above
the footer; its sticky offset and `--header-height` are unchanged.

The root is `<div role="region" aria-label="NTS Slow Focus radio">`, never a `<header>` or
`<footer>`, so `body > header` is still the sticky header.

### Stream

`RADIO_STREAM_URL` (`https://stream-mixtape-geo.ntslive.net/mixtape`) redirects to a radiomast edge
that serves `audio/mpeg`. `<audio preload="none">` has no `src` in the markup. The play click sets
`src` and calls `play()`. Stop pauses, removes `src` and calls `load()`, which drops the connection
so the next play is live.

### State machine

`radioReducer` in `src/lib/radio.ts` has the statuses `idle | loading | playing`, an `error` flag
and an `attempt` counter. Every click increments the attempt. `playing` and `fail` events count
only for the current attempt while loading or playing, so the AbortError from a stopped `play()`
and the error event of a dropped stream are ignored as stale. A double click on play is a no-op.

`radioButtonLabel` names the button (`Play NTS Slow Focus` / `Stop NTS Slow Focus`), and
`aria-pressed` and `aria-busy` follow the status. Unit tests: `src/lib/radio.test.ts`,
`src/components/RadioBar.test.ts`.

### Errors

On a failure the link's text becomes `RADIO_ERROR_TEXT` (`Can't reach NTS right now`) in neutral
grey. The link and its href stay, and the button returns to play. The text is announced through a
span with `aria-live="polite"` and no `role="status"`, because the connection pill is the one
status element. A retry keeps the error text while loading and clears it on `playing`.

### Analytics

`radio_played` and `radio_stopped` are sent on click (see `app_docs/analytics.md`).

## Rules

- Never autoplay; `src` is set only by the play click handler, and `preload="none"`.
- The bar is fixed to the bottom on `FOOTER_LAYER`, below `FLOATING_LAYER`; never put it at or above
  `FLOATING_LAYER`, and never change `--header-height`, `HEADER_LAYER` or the sidebar's sticky
  offset for it. `--radio-bar-height` is the one source for the body's bottom padding, the floating
  buttons' offsets and the sidebar's height, and must change with the bar's height or border.
- The bar is never a `<header>` or `<footer>` landmark; it stays `role="region"` with its name
  (`body > header` is the sticky header).
- The `NTS` name and the link to the mixtape page are always rendered, in every state; never
  replace them with an icon.
- Only the Slow Focus stream; no other channel, schedule, volume, playlist or now-playing feed.
- The URLs and the error text live only in `src/lib/radio.ts`; every transition goes through
  `radioReducer`, with a test case for each change.
- No live label and no accent colour: never the text `LIVE`, never a status hue; the error text
  stays neutral.
