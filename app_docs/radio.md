# Radio bar

**Specifications:**

- specs/issue-211-adw-c1f6991d-sdlc_planner-nts-slow-focus-radio-bar.md

## Overview

`src/components/RadioBar.tsx` is a thin bar above the sticky header on every route. It plays NTS
Radio's Slow Focus infinite mixtape. Left to right it shows the red live dot and `LIVE NOW`, then a
bordered box holding `∞`, the play / stop button and `NTS · SLOW FOCUS`, which links to
`RADIO_PAGE_URL` in a new tab. It is idle on load.

## How it works

### Placement

The bar is the first child of `<body>` in `src/app/layout.tsx`, before `<header>`, in normal flow
(not sticky, no z-index). It scrolls away while the header stays pinned at `top: 0`. The root
layout never remounts on client-side navigation, so the one `<audio>` keeps playing between pages.
A full page load stops it.

The root is `<div role="region" aria-label="NTS Slow Focus radio">`, never a `<header>`, so
`body > header` is still the sticky header. `--header-height`, `HEADER_LAYER` and the sidebar's
sticky offset are unchanged. Only the sidebar's `md` height subtracts `--radio-bar-height`
(`src/app/globals.css`, `h-9` plus the 1px border, `2.3125rem`), so the column fits the viewport
at scroll 0.

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
- Never make the bar sticky or give it a z-index; never change `--header-height`, `HEADER_LAYER` or
  the sidebar's sticky offset for it (only the sidebar's height subtracts `--radio-bar-height`,
  which must change with the bar's height or border).
- The bar is never a `<header>`: `body > header` is the sticky header.
- The `NTS` name and the link to the mixtape page are always rendered, in every state; never
  replace them with an icon.
- Only the Slow Focus stream; no other channel, schedule, volume, playlist or now-playing feed.
- The URLs and the error text live only in `src/lib/radio.ts`; every transition goes through
  `radioReducer`, with a test case for each change.
- The red dot is the only accent colour; the error text stays neutral.
