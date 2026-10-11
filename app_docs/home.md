# Home page

**Specifications:**

- specs/issue-169-adw-98e70d08-sdlc_planner-who-you-are-home-page.md

## Overview

`/` (`src/app/page.tsx`) is a static intro page that sits outside `(dashboard)`: an `h1`, the intro
paragraphs, the ADW line with its "Watch me build" link to `/projects`, and two door cards into
`/hire?offer=product-engineer` and `/hire?offer=ai-consulting`. No sidebar, no connection pill.

## How it works

### Copy

All of the page's copy comes from `src/content/home.ts`: `HOME_HEADING` (the `h1`), `HOME_INTRO`
(the intro paragraphs), `HOME_ADW_LINE` (rendered followed by the "Watch me build" link) and
`HOME_DOORS` (each door's offer, title and body). The page also sets its own `metadata` title and
description.

### Doors

Each door is a link whose href is `hireOfferHref(door.offer)` (`src/lib/hire-request.ts`). The
slug table (`OFFER_SLUG`) lives there too, and `/hire` maps the slug back to the offer with
`hireOfferFromSlug` to show a form for that offer (no select, its prompt as the textarea label) (see `app_docs/hire.md`).

### Prerendering

`HomePage` is not async and takes no props: the whole page is the static shell and is prerendered
whole. It has no live ADW figure on purpose: one would be a third argument-less clock read (see
`app_docs/clock-and-prerender.md`). The static link to `/projects` is the teaser instead.

## Rules

- `src/app/page.tsx` never reads anything at request time: no `connection()`, no `searchParams`, no
  clock, no `cookies()`/`headers()`, no `@/data` import.
- The page's copy lives only in `src/content/home.ts`.
- Door hrefs come only from `hireOfferHref`.
- Never mount `Providers` or Realtime on `/`.
