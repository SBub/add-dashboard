# Feature: a who-you-are page at `/`, the summary moves to `/watch`

## Metadata

issue_number: `169`
adw_id: `98e70d08`
issue_json: `{"number":169,"title":"Routes: a who-you-are page at /, the summary moves to /watch"}`

## Feature Description

`build.issebya.com` is the owner's portfolio, so its first screen should say who she is instead of
showing a ledger of runs. This change:

- moves the summary that renders at `/` today, unchanged (copy, cache scopes, tags, clock read,
  islands), to `/watch` (`src/app/watch/page.tsx`, with its `SummaryProviders`);
- turns `/` into a fully static intro page: an `h1`, two or three intro paragraphs, one line on ADW
  with a "Watch me build" link to `/watch`, and two card-styled doors into `/hire`, each
  preselecting an offer through `?offer=<slug>`;
- points the `/summary` 308 redirect at `/watch`;
- points the header's "Watch me build" link at `/watch` and marks it current on `/watch`,
  `/projects` and every project page; the brand is current only on `/`;
- lets `/hire` preselect its `<select>` from `?offer=product-engineer` / `?offer=ai-consulting`
  through a pure, unit-tested mapping in `src/lib/hire-request.ts`.

## User Story

As a hiring manager or a small-business owner landing on `build.issebya.com`
I want the first screen to tell me who Sviatlana is and offer me a direct door for my situation
So that I can reach the right contact form in one click, and still watch the ADW ledger when I
want proof

## Problem Statement

`/` is the run ledger. A visitor who arrives from a CV link or a referral sees tables of tokens and
cost before learning who the owner is or what she offers, and has to find the header button to
contact her, then pick an offer by hand.

## Solution Statement

Move the summary page file as is to `src/app/watch/`, outside `(dashboard)`, so every cache tag
(`summary:today`, `summary:past`), the two cache scopes and `requestToday()` move with it and the
revalidation webhook keeps working by tag. Write a new server component at `src/app/page.tsx` that
reads nothing at request time (no `connection()`, no `searchParams`, no clock, no data), so the
whole route is the static shell. Its copy lives in one module, `src/content/home.ts`, placeholder
text marked `[Placeholder]`. Its two doors link to `/hire?offer=<slug>`, the href built by a helper
in `src/lib/hire-request.ts` that is the inverse of the slug parser `/hire` uses, so the slugs are
spelled in one place. `/hire`'s existing request-time island (`HireStatus`) already awaits
`searchParams`; it passes the mapped offer to the form as the `<select>`'s `defaultValue`. The
mapping returns only an `OFFERS` member, never the raw query value.

The header section keys are renamed to read after the move: `"summary"` becomes `"home"` (the
brand, exactly `/`) and `"projects"` becomes `"watch"` (`/watch`, `/watch/`, `/projects`,
`/projects/*`). No live ADW figure on `/`: it would need a third argument-less clock read, and
`app_docs/clock-and-prerender.md` allows exactly two in the request path (plus the client-side
ones it lists).

## Relevant Files

Use these files to implement the feature:

- `README.md`: states "`/` is the summary"; update the one sentence describing the routes (it
  describes what the app is, which is allowed there).
- `AGENTS.md`: repository rules (Yarn only, no em-dashes, docs in the same change, `.adw/project.md`
  headings).
- `.adw/project.md`: the Workspaces health URL row and bullets (`/` "the summary" proves Supabase:
  now `/watch` does), the Tests section's list of `e2e/*.md` journeys (add `test_home_page.md`),
  the Review section's routes (`/` is now the intro page, `/watch` the summary). Keep the nine
  `##` headings untouched.
- `docs/conditional-docs.md`: add the `app_docs/home.md` line; the `summary.md` line says
  "changing `/`", becomes `/watch`; the `routing-and-navigation.md` line stays valid.
- `src/app/page.tsx`: today the summary. Moves to `src/app/watch/page.tsx` verbatim (only its
  `./summary-providers` import path is unchanged because the provider moves with it), then is
  rewritten as the new intro page.
- `src/app/summary-providers.tsx`: the summary's minimal `QueryClientProvider`; moves to
  `src/app/watch/summary-providers.tsx`, its comment's `/` becomes `/watch`.
- `src/app/summary/route.ts`: the 308 handler; `Location: "/"` becomes `Location: "/watch"`, its
  comment updated.
- `src/app/hire/page.tsx`: `SearchParams` gains `offer`; `HireStatus` maps it and passes
  `defaultOffer` to `HireForm`, whose `<select>` gets `defaultValue`. Its "Outside (dashboard),
  like "/"" comment names `/` and `/watch`.
- `src/lib/hire-request.ts`: add the slug mapping (`hireOfferFromSlug`, `hireOfferHref`).
- `src/lib/hire-request.test.ts`: unit tests for the mapping.
- `src/content/hire.ts`: `OFFERS` (values the mapping returns); read only, do not change values.
- `src/lib/header-section.ts` and `src/lib/header-section.test.ts`: section keys and `/watch`.
- `src/components/HeaderLink.tsx`: consumes `HeaderSection`; no logic change (type only flows).
- `src/components/SectionNav.tsx`: "Watch me build" `href` and fallback `href` become `/watch`,
  `section="watch"`; brand `section="home"`; comments updated.
- `src/app/layout.tsx`: root header and root `metadata` (unchanged; `/` sets its own `metadata`).
- `src/app/(dashboard)/layout.tsx`: comments say "The summary at / has no channel and no pill" and
  "/ has no sidebar"; update to `/watch` (and `/`).
- `src/lib/daily-summary.ts`: comment at line 36 names `src/app/page.tsx`; becomes
  `src/app/watch/page.tsx`.
- `app_docs/routing-and-navigation.md`: route tree, `/summary` target, header sections and their
  keys, its Rules.
- `app_docs/summary.md`: every "the summary at `/`" and "`/` is the landing page" becomes `/watch`
  (the summary is no longer the landing page; the intro page is).
- `app_docs/history-revalidation.md`: "The summary (`/`)" mentions (lines ~31, 209, 286, 402).
- `app_docs/clock-and-prerender.md`: the `requestToday` site moves to `src/app/watch/page.tsx`;
  add that `/` has no clock read.
- `app_docs/hire.md`: the `?offer=` preselect (page section, Rules, testing).
- `app_docs/screens-and-components.md`: line ~21 "`/`, the landing page, is the summary".
- `app_docs/realtime.md`, `app_docs/data-boundary.md`, `app_docs/error-and-loading-boundaries.md`:
  each names "the summary (`/`)"; becomes `/watch`, and the Realtime rule "Do not mount
  `Providers` or start Realtime on `/`" extends to `/watch`.
- `e2e/test_landing_no_filters.md`, `e2e/test_landing_today_refresh.md`,
  `e2e/test_header_section_active.md`, `e2e/test_day_card_charts.md`,
  `e2e/test_connection_indicator_scope.md`, `e2e/test_worker_status_widget.md`,
  `e2e/test_sticky_header.md`, `e2e/test_single_background_color.md`, `e2e/test_hire_page.md`:
  journeys that open `/` for the summary or assert header behaviour on `/`.
- `node_modules/next/dist/docs/01-app/`: read the guides on static rendering, `searchParams` and
  Cache Components before writing the pages (Next 16 moves faster than training data).
- `knip.json`, `vitest.config.ts`, `lefthook.yml`: the dead-code scan (`src/**`), the unit layer
  (`src/**/*.test.ts`) and the hooks the tree must pass.

### New Files

- `src/app/watch/page.tsx`: the summary, moved verbatim from `src/app/page.tsx`.
- `src/app/watch/summary-providers.tsx`: moved from `src/app/summary-providers.tsx`.
- `src/app/page.tsx` (rewritten): the static intro page.
- `src/content/home.ts`: `HOME_INTRO: string[]`, `HOME_ADW_LINE: string`, `HOME_DOORS`.
- `app_docs/home.md`: the `/` page doc.
- `e2e/test_home_page.md`: the acceptance journey for `/` and its doors.

## Implementation Plan

### Phase 1: Foundation

Add the pure offer-slug mapping to `src/lib/hire-request.ts` with its tests, and rename and extend
the header sections in `src/lib/header-section.ts` with their tests. Both are pure and land first
so every later file consumes a tested helper.

### Phase 2: Core Implementation

Move the summary page and its provider to `src/app/watch/` with `git mv` (history kept), then
write the new `src/app/page.tsx` and `src/content/home.ts`. Wire `/hire`'s preselect. Repoint the
`/summary` redirect and the header links.

### Phase 3: Integration

Update every doc that names `/` as the summary, add `app_docs/home.md` and its index line, update
`.adw/project.md` and `README.md`, update the e2e journeys and add `e2e/test_home_page.md`, then run
the validation commands, the static-read grep (with its negative check), the build's route table
and the served-HTML checks.

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. Read the Next 16 guides

- Skim `node_modules/next/dist/docs/01-app/` for the static/partial prerender and Cache Components
  guides, and the `page` file convention's `searchParams` prop, before touching pages.

### 2. Offer slug mapping in `src/lib/hire-request.ts`

- Add a private table `const OFFER_SLUGS = { "product-engineer": "Product engineer", "ai-consulting": "AI consulting" } as const satisfies Record<string, Offer>;`
  with a comment that the URL slugs are deliberately not the `OFFERS` values, so labels, the
  subject's values and URLs stay independent.
- Export `hireOfferFromSlug(slug: string | string[] | undefined): Offer`: returns the mapped offer
  when `slug` is a string that is an own key of `OFFER_SLUGS` (`Object.hasOwn`, so `constructor`,
  `toString` or `__proto__` never match), else `OFFERS[0]` (the first option, today's default).
  Doc comment: it only ever returns an `OFFERS` member, so the raw value is never echoed.
- Export `hireOfferHref(offer: Offer): string`: `/hire?offer=<slug>` for the slug whose value is
  `offer` (found from the same table; the table covers every `Offer`, enforce that with a type, for
  example derive a reverse `Record<Offer, slug>` typed so a new `OFFERS` entry without a slug is a
  type error).
- No clock reads, no env, no I/O (the file's existing contract).

### 3. Unit tests in `src/lib/hire-request.test.ts`

- `hireOfferFromSlug`: `"product-engineer"` gives `"Product engineer"`, `"ai-consulting"` gives
  `"AI consulting"`; `undefined`, `""`, `"designer"`, `"Product engineer"` (an option value, not a
  slug), `"PRODUCT-ENGINEER"`, `"constructor"`, `"__proto__"`, `"<script>"` and an array
  (`["ai-consulting", "product-engineer"]`) give `OFFERS[0]`.
- Never echoes: for every one of those inputs, the result is a member of `OFFERS`
  (`expect(OFFERS).toContain(result)`), and for `"<script>"` the result does not contain it.
- `hireOfferHref`: `"Product engineer"` gives `/hire?offer=product-engineer`, `"AI consulting"`
  gives `/hire?offer=ai-consulting`; round trip: for every offer in `OFFERS`, parsing the href's
  `offer` param with `hireOfferFromSlug` gives the offer back.

### 4. Header sections in `src/lib/header-section.ts`

- `export type HeaderSection = "home" | "watch" | "hire";`
- `"/"` returns `"home"`; `"/watch"`, `"/watch/"`, `"/projects"` and any path starting
  `"/projects/"` return `"watch"`; `/hire` unchanged; everything else `null` (so `/watchx`,
  `/watch-old`, `/watch/anything` and `/summary` are null; only `/watch` and `/watch/` belong,
  `/watch` has no sub-routes).
- Rewrite the file and function comments: the brand is the intro page at `/`, "Watch me build" is
  the summary at `/watch` plus the project overview and every project page.

### 5. Header section tests in `src/lib/header-section.test.ts`

- Rename the expected values (`"projects"` to `"watch"`, `"summary"` to `"home"`).
- Add: `/watch` and `/watch/` are `"watch"`; `/watchx`, `/watch-old` are null; `/` is `"home"`
  and is the only path tested that answers `"home"` (`/watch`, `/projects`, `/hire` are not
  `"home"`); `/projects/a/b` is still `"watch"`; `/summary` stays null.

### 6. Rename the section keys where they are used

- `src/components/SectionNav.tsx`: `HeaderLink section="watch"` for Watch me build, with
  `href="/watch"` on both the `HeaderLink` and the Suspense fallback `Link`; brand
  `section="home"`. Update the header comments ("leads to the summary at "/"" becomes "leads to the
  intro page at "/""; "the project overview" becomes "the summary at /watch, also current on the
  project overview and project pages").
- `grep -rn '"summary"\|"projects"' src/components src/lib` to confirm no other `HeaderSection`
  literal remains (`yarn typecheck` catches any miss).

### 7. Move the summary to `/watch`

- `git mv src/app/page.tsx src/app/watch/page.tsx` and
  `git mv src/app/summary-providers.tsx src/app/watch/summary-providers.tsx`.
- In `src/app/watch/page.tsx` change nothing in behaviour, copy, cache scopes, tags, `cacheLife`
  values or `metadata`. Only comments that say `/` become `/watch` if any do. Do not add
  `revalidatePath`.
- `src/app/watch/summary-providers.tsx`: comment "The summary page's (`/`) QueryClient" becomes
  `/watch`, and "`/` stays off the channel" becomes `/watch`.
- `src/lib/daily-summary.ts` line ~36: `src/app/page.tsx` becomes `src/app/watch/page.tsx`.
- `src/app/(dashboard)/layout.tsx` comments: "The summary at / has no channel and no pill" becomes
  "The summary at /watch, the intro page at / and /hire have no channel and no pill"; "/ has no
  sidebar and no widget" likewise.

### 8. Repoint `/summary`

- `src/app/summary/route.ts`: `Location: "/watch"`; comment: "The summary's old address (issue
  #83); the summary moved to /watch (issue #169), so the redirect follows it. ... answers a bare,
  relative `/watch` and reads nothing from the request."

### 9. Home copy module `src/content/home.ts`

- Header comment modelled on `src/content/hire.ts`: the `/` page's copy, the one place it lives;
  every string is placeholder text marked `[Placeholder]` until the owner replaces it.
- `export const HOME_HEADING = "Sviatlana Buben, product engineer";` (the `h1`; keep it here so all
  copy is in one module).
- `export const HOME_INTRO: string[]` with two or three `[Placeholder]` paragraphs (who she is,
  what she builds, that ADW builds her products in public).
- `export const HOME_ADW_LINE: string`, a `[Placeholder]` sentence on ADW, rendered followed by the
  "Watch me build" link.
- `export const HOME_DOORS: { offer: Offer; title: string; body: string }[]` with exactly two:
  `{ offer: "Product engineer", title: "Hiring a product engineer?", body: "[Placeholder] ..." }`
  and `{ offer: "AI consulting", title: "Want work off your plate?", body: "[Placeholder] ..." }`.
  Import `type Offer` from `@/content/hire`.
- No clock, no `new Date(`, nothing from `@/data`.

### 10. Intro page `src/app/page.tsx`

- A non-async server component `HomePage`, no props (so no `searchParams`), no `connection()`,
  no clock, no `@/data` import, no `cookies()`/`headers()`, no client component, no `Providers`.
- `export const metadata: Metadata = { title: "Sviatlana Buben, product engineer", description: "<one line, for example: Product engineer building her products in public with ADW. Hire her, or hand her work off your plate.>" }`.
- Layout, matching `/hire`'s container: `<div className="mx-auto max-w-6xl px-4 py-6">`, `h1`
  (`text-2xl font-semibold tracking-tight`) from `HOME_HEADING`, intro paragraphs in
  `mt-2 max-w-[70ch] space-y-2 text-base text-neutral-700 dark:text-neutral-300`.
- ADW line: `<p className="mt-3 max-w-[70ch] text-base ...">{HOME_ADW_LINE}{" "}<Link href="/watch" className="underline underline-offset-2 ...">Watch me build</Link></p>`.
- Doors: a `<ul>` (`mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-3xl`, stacked below `sm`,
  side by side from `sm` up), each `<li>` holding one `next/link` `Link` with
  `href={hireOfferHref(door.offer)}`, styled as a card (`block h-full rounded-lg border
border-neutral-200 p-4 hover:border-neutral-400 dark:border-neutral-800
dark:hover:border-neutral-600`, a visible focus ring), containing the title
  (`text-base font-semibold`) and the body (`mt-1 text-sm text-neutral-600 dark:text-neutral-400`).
  The whole card is the link, so its accessible name is the title plus body; keep the title first.
- No run rows, no `SectionBoundary` (there is no hole), no `Suspense`.
- Comment above the default export: the whole page is the static shell; it reads nothing at
  request time and has no live ADW figure (that would be a third argument-less clock read,
  `app_docs/clock-and-prerender.md`); the static link to `/watch` is the teaser. Outside
  `(dashboard)`: no Providers, no Realtime, no pill.

### 11. `/hire` preselects the offer

- `src/app/hire/page.tsx`: `type SearchParams = Promise<{ sent?: string | string[]; error?: string | string[]; offer?: string | string[] }>;`
- `HireStatus`: `const params = await searchParams; const status = hireStatus(params); const defaultOffer = hireOfferFromSlug(params.offer);` and render `<HireForm defaultOffer={defaultOffer} />`.
- `HireForm({ defaultOffer }: { defaultOffer: Offer })`: `<select ... defaultValue={defaultOffer}>`.
  Import `type Offer` from `@/content/hire`.
- Never render `params.offer` anywhere. `hireStatus` is unchanged.
- Update the page comment "Outside (dashboard), like "/"" to "like "/" and "/watch"".

### 12. Docs

- `app_docs/routing-and-navigation.md`: Overview route tree (`/`, `/watch`, `/projects`,
  `/projects/[owner]/[repo]`, `/hire`, the `/summary` redirect); How it works: the brand links to
  `/` (the intro page, `app_docs/home.md`), "Watch me build" to `/watch`, current on `/watch`,
  `/projects` and every project page; the summary is `src/app/watch/page.tsx` outside
  `(dashboard)`; `/` is `src/app/page.tsx`, static, outside `(dashboard)`; `/summary` is a 308 to a
  bare `/watch`. Rules: `headerSection` answers `"home"` (exactly `/`), `"watch"` (`/watch`,
  `/watch/`, `/projects` and below `/projects/`, never `/watchx` or `/projectsx`), `"hire"` or
  null; the `/summary` rule says `/watch`; `SectionNav` links to `/watch` only. Add issue 169's spec
  to its Specifications list.
- `app_docs/summary.md`: every `/` meaning the summary becomes `/watch`; `src/app/page.tsx` becomes
  `src/app/watch/page.tsx`; "`/` is the landing page" becomes "`/watch` is the summary page (the
  landing page is the intro at `/`, `app_docs/home.md`)"; the Rules line "The summary is the root
  route `/`" becomes "The summary is `/watch`, `src/app/watch/page.tsx`, outside `(dashboard)`".
  Add the spec link.
- `app_docs/history-revalidation.md`: "the summary page's (`/`)" and similar become `/watch`; state
  that revalidation is by tag, not path, so the move needs no `revalidatePath`, and none may be
  added.
- `app_docs/clock-and-prerender.md`: `requestToday` lives in `src/app/watch/page.tsx`; `/`
  (`src/app/page.tsx`) reads no clock; the count of argument-less sites does not change.
- `app_docs/screens-and-components.md`, `app_docs/realtime.md`, `app_docs/data-boundary.md`,
  `app_docs/error-and-loading-boundaries.md`: every "summary (`/`)" becomes `/watch`; the Realtime
  rule covers `/`, `/watch` and `/hire`.
- `app_docs/hire.md`: in "The page", `HireStatus` also maps `?offer=` with `hireOfferFromSlug`
  (`product-engineer` to `Product engineer`, `ai-consulting` to `AI consulting`, anything else the
  first option) into the select's `defaultValue`; the slugs are not the `OFFERS` values on purpose;
  `hireOfferHref` builds the `/` doors' links. Rules: add "Never render the raw `?offer` value; the
  page only ever uses the `Offer` `hireOfferFromSlug` returns" and "Every change to the slug table
  goes with a test case in `src/lib/hire-request.test.ts`". Add the spec link.
- New `app_docs/home.md` in the existing doc shape (title, Specifications, Overview, How it works,
  Rules): what `/` is (static intro, `h1`, intro, ADW line with the `/watch` link, two doors into
  `/hire?offer=...`), where its copy lives (`src/content/home.ts` only), why there is no live
  figure (a third argument-less clock read, see `app_docs/clock-and-prerender.md`), outside
  `(dashboard)`. Rules: "`src/app/page.tsx` never reads anything at request time: no
  `connection()`, no `searchParams`, no clock, no `cookies()`/`headers()`, no `@/data` import";
  "The page's copy lives only in `src/content/home.ts`"; "Door hrefs come only from
  `hireOfferHref`"; "Never mount `Providers` or Realtime on `/`".
- `docs/conditional-docs.md`: add
  `- \`app_docs/home.md\`: read when changing \`/\`, its copy in \`src/content/home.ts\` or its two doors into \`/hire\`.`and change the`summary.md`line to "read when changing`/watch`, ...". The `hire.md`line gains
"or the`?offer=` preselect".
- `README.md`: the opening paragraph: "`/` introduces the owner and leads to `/hire`. `/watch` is
  the summary of finished runs per UTC day across projects." Add `[Home page](app_docs/home.md)` to
  the Documentation list.
- `.adw/project.md`: health URL cell `/`, `/watch`, `/projects`, then the project page; the first
  bullet: `/` answering 200 proves the server is up (it is static); `/watch` answering 200 proves it
  can reach Supabase. Tests section: add `e2e/test_home_page.md` to the journey list. Review
  section: `/` is the intro page (heading, intro, ADW line with Watch me build link, two door
  cards; no sidebar, no pill), `/watch` is the summary with the description currently given for
  `/`; "(dashboard routes only; `/` has none)" becomes "`/`, `/watch` and `/hire` have none". Keep
  the nine headings and their order.
- No em-dashes anywhere. Do not edit any other file under `specs/`.

### 13. Update e2e journeys

- `e2e/test_landing_no_filters.md`: open `/watch`; `/watch?days=7&project=x`; `/summary?days=7`
  ends at exactly `/watch` with no `?`.
- `e2e/test_landing_today_refresh.md`: open `/watch`; "URL is still exactly `/watch`".
- `e2e/test_day_card_charts.md`: open `/watch`.
- `e2e/test_connection_indicator_scope.md`: the summary is at `/watch`; round trip through
  `/watch`; `/summary?days=7` lands on `/watch`; also assert `/` has no pill.
- `e2e/test_header_section_active.md`: step 1 `/` marks the brand only and the Watch me build link
  has `href="/watch"` and no `aria-current`; add `/watch` marks Watch me build only; keep
  `/projects`, a project page, `/projectsx`, `/hire`; add `/watchx` marks nothing (a 404).
  Success criteria updated.
- `e2e/test_worker_status_widget.md`: the widget is absent on `/` and on `/watch`.
- `e2e/test_sticky_header.md`: scroll test runs on `/watch` (the intro page may be too short to
  scroll); go back to `/watch`.
- `e2e/test_single_background_color.md`: check `/` and `/watch` and a project page.
- `e2e/test_hire_page.md`: step 8's default stays `Product engineer`; add a step: navigate to
  `/hire?offer=ai-consulting` and with `browser_evaluate` **Verify** the select's `value` is
  `AI consulting`; `/hire?offer=<script>` shows the select at `Product engineer` and `<script>`
  nowhere on the page.

### 14. Add `e2e/test_home_page.md`

- An agent-driven journey, because the route, the doors and the cross-page preselect are a browser
  surface and the project has no code E2E suite (profile Tests: E2E code suite `none`). Follow the
  shape of `e2e/test_hire_page.md` (`## User Story`, `## Test Steps` with `**Verify**` lines,
  `## Success Criteria`). Never submit the form.
- Steps: navigate to `/`; **Verify** the `h1` `Sviatlana Buben, product engineer`, the intro
  paragraphs, the ADW line with a `Watch me build` link `href="/watch"`, and two door links with
  `href="/hire?offer=product-engineer"` (text starts `Hiring a product engineer?`) and
  `href="/hire?offer=ai-consulting"` (text starts `Want work off your plate?`); **Verify** no
  `table`, no `Today,` heading, no connection indicator, no `Projects` sidebar navigation;
  **Verify** the header's brand link has `aria-current="page"` and `Watch me build` has none;
  screenshot at 1920x1080 and **Verify** the two doors share one row (equal `top` via
  `browser_evaluate`); click the first door, **Verify** URL `/hire?offer=product-engineer` and the
  select's value `Product engineer`; go back, click the second door, **Verify**
  `/hire?offer=ai-consulting` and value `AI consulting`; navigate to `/`, click the ADW line's
  `Watch me build`, **Verify** URL `/watch`, the heading `What an AI developer workflow gets done`
  and that the header's `Watch me build` has `aria-current="page"` and the brand has none; navigate
  to `/`, resize to 375x667, **Verify** the doors are stacked (second door's `top` greater than the
  first's `bottom`) and `document.documentElement.scrollWidth <= 375`; screenshot.
- Success criteria: intro and both doors on `/` with the exact hrefs; each door lands on `/hire`
  with its offer preselected; brand current on `/`, Watch me build current on `/watch`; doors side
  by side at desktop, stacked at 375 with no horizontal scroll; 2 screenshots.

### 15. Validate

- Run every command in `Validation Commands`, including the grep, its negative check (add
  `await connection()` to `src/app/page.tsx`, confirm the grep prints it, revert with
  `git checkout -- src/app/page.tsx` only if the file is committed, otherwise remove the line by
  hand), the build's route table and the served-HTML checks. Fix anything that fails without
  weakening a rule or a test.

## Testing Strategy

### Unit Tests

- `src/lib/hire-request.test.ts`: `hireOfferFromSlug` (both slugs, unknown, missing, empty, option
  value as slug, wrong case, prototype keys, array, script-like value) and `hireOfferHref` (both
  offers, round trip over `OFFERS`), plus the "result is always an `OFFERS` member" property.
- `src/lib/header-section.test.ts`: `/watch`, `/watch/` in `"watch"`; `/watchx`, `/watch-old`
  null; `/` the only `"home"`; `/projects`, `/projects/` and `/projects/a/b` still `"watch"`;
  `/hire` unchanged; `/summary` null.

### Test Coverage

- `src/lib/hire-request.test.ts` (vitest unit layer): catches a slug that maps to the wrong offer,
  a missing or unknown slug that preselects something other than the first option, and any path by
  which the raw `?offer` value could reach the page; fails today because the functions do not
  exist.
- `src/lib/header-section.test.ts` (vitest unit layer): catches `/watch` not marking "Watch me
  build", `/watchx` matching by prefix, or the brand being current anywhere but `/`; fails today
  because `/watch` answers null and the keys differ.
- The routes themselves (the move, the static `/`, the `/summary` target) have no unit layer here
  (no component or Playwright suite per the profile); they are proved by the static-read grep with
  its negative check, the `yarn build` route table and the served-HTML `curl` checks in
  `Validation Commands`, plus the `e2e/test_home_page.md` journey and the updated journeys (a task
  above, not a regression layer).

### Edge Cases

- `?offer=` repeated (`?offer=a&offer=b`, an array): first option.
- `?offer=constructor` / `__proto__`: first option (own-key check).
- `?offer=Product%20engineer` (an option value instead of a slug): first option.
- `?offer=ai-consulting&error=verification`: error message shows above a form preselected to
  `AI consulting`; `?offer=ai-consulting&sent=1`: thank-you, no form.
- `/watch/` (trailing slash) marks Watch me build; `/watchx` is a 404 marking nothing.
- `/summary?days=7` lands on bare `/watch`.
- A completion still refreshes `/watch` (tags unchanged, by-tag revalidation).
- `/` at 375px: doors stacked, no horizontal scroll; header still fits.
- `/` in dark mode: cards use the `dark:` border variants.

## Acceptance Criteria

- `/` renders the `h1`, the intro paragraphs from `src/content/home.ts`, the ADW line with a
  `Watch me build` link to `/watch`, and two card links to `/hire?offer=product-engineer` and
  `/hire?offer=ai-consulting`, side by side from `sm` up and stacked below; no run rows, no sidebar,
  no pill; title `Sviatlana Buben, product engineer` with a one-line description.
- `src/app/page.tsx` and `src/content/home.ts` read nothing at request time (the grep prints
  nothing); `yarn build` lists `/` as a static route.
- `/watch` renders the former summary unchanged (heading, intro, note, today card with Refresh,
  past day cards), with the same tags, scopes and `requestToday()`; no `revalidatePath` was added.
- `/summary` answers `308` with `location: /watch`.
- `/hire?offer=product-engineer` and `/hire?offer=ai-consulting` preselect their offers; any other
  or missing value preselects `Product engineer`; the raw value never appears in the page.
- The header brand is current only on `/`; Watch me build links to `/watch` and is current on
  `/watch`, `/projects` and every project page; Work with me unchanged.
- `Providers` and Realtime never mount on `/`, `/watch` or `/hire`.
- All docs listed in task 12 updated, `app_docs/home.md` added and indexed, `.adw/project.md`
  headings intact, no em-dashes, no `specs/` file other than this plan touched.
- `yarn lint`, `yarn typecheck`, `yarn knip`, `yarn format:check`, `yarn test`, `yarn build` pass.

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

- `yarn lint`: ESLint over the changed pages, helpers and tests.
- `yarn typecheck`: `next typegen` then `tsc`; catches every renamed `HeaderSection` literal and the
  new `searchParams` shape (never stage the rewritten `next-env.d.ts`).
- `yarn knip`: no unused export (the slug helpers and home copy are all consumed) and no orphaned
  file after the move.
- `yarn format:check`: Prettier on every touched file, Markdown included.
- `yarn test`: the vitest unit layer, including the new `hire-request` and `header-section` cases.
- `grep -nE "connection\(|searchParams|Date\.now|new Date\(|cookies\(|headers\(|from \"@/data\"" src/app/page.tsx src/content/home.ts`: must print nothing (exit 1); `/` reads nothing at request time. Negative check: temporarily add `await connection()` to `src/app/page.tsx`, rerun, confirm it prints that line, then remove it.
- `grep -rn "revalidatePath" src`: must print nothing; revalidation stays by tag.
- `grep -rn "—" src app_docs docs e2e README.md AGENTS.md .adw/project.md`: must print nothing (no em-dashes).
- `yarn build`: the production build (needs `.env.local`); its route table lists `/` (static), `/watch`, `/hire`, `/projects`, `/projects/[owner]/[repo]` and `/summary`.
- `set -a; [ -f .ports.env ] && . ./.ports.env; set +a; PORT=${PORT:-3000} yarn start & echo $! > /tmp/adw-98e70d08-start.pid`: serve the build on this run's port (never reuse or kill another process).
- `curl -s "http://localhost:${PORT:-3000}/" | grep -o 'href="/hire?offer=[a-z-]*"' | sort -u`: prints exactly `href="/hire?offer=ai-consulting"` and `href="/hire?offer=product-engineer"`.
- `curl -s "http://localhost:${PORT:-3000}/" | grep -c "<table"`: prints `0` (no run rows on `/`).
- `curl -s "http://localhost:${PORT:-3000}/watch" | grep -c "What an AI developer workflow gets done"`: at least `1`; and `curl -s "http://localhost:${PORT:-3000}/watch" | grep -c "Today,"`: at least `1` (the today card streams in the same response).
- `curl -sI "http://localhost:${PORT:-3000}/summary" | grep -iE "^HTTP|^location"`: `308` and `location: /watch`.
- `curl -s "http://localhost:${PORT:-3000}/hire?offer=ai-consulting" | grep -o '<option[^>]*selected[^>]*>'`: the `AI consulting` option is the selected one; `curl -s "http://localhost:${PORT:-3000}/hire?offer=%3Cscript%3E" | grep -c "<script>alert\|offer=%3Cscript"`: `0`.
- `kill "$(cat /tmp/adw-98e70d08-start.pid)"`: stop only the server this run started.

## Notes

- No new dependency.
- Section keys are renamed (`"summary"` to `"home"`, `"projects"` to `"watch"`) as the issue
  allows; `yarn typecheck` enforces that every use moved.
- `/api/revalidate` stays at its URL (registered in the toolkit's database trigger); cache tags in
  `src/lib/history-tags.ts` are untouched.
- No "Writing" header link: the blog issue adds it with `/writing`.
- Out of scope: real intro copy (the owner writes it; every string in `src/content/home.ts` is
  marked `[Placeholder]`), a live ADW figure on `/`, domains and Vercel config.
- If a later issue wants a live figure on `/`, it needs a third argument-less clock read and must
  change the rule in `app_docs/clock-and-prerender.md` in the same commit.
