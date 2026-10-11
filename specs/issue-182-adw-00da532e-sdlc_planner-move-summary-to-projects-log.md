# Bug: Watch me build does not reach the projects; the summary moves to /projects/log as Daily log

## Metadata

issue_number: `182`
adw_id: `00da532e`
issue_json: `{"number":182,"title":"Watch me build: link to /projects, move the summary to /projects/log as Daily log in the sidebar"}`

## Bug Description

Since #169 the header's **Watch me build** link (and the landing page's static Watch me build link) goes to
`/watch`, the summary page. `/watch` lives outside the `(dashboard)` group: it has no sidebar and no link to
`/projects` or to any project page. So `/projects` and every `/projects/[owner]/[repo]` page are unreachable
from navigation; a visitor can only reach them by typing the URL.

Expected:

- Watch me build (header and landing) links to `/projects`.
- The summary lives at `/projects/log` inside `(dashboard)`, so it has the sidebar, the connection pill and the
  worker widget.
- The sidebar has a **Daily log** entry under the project list and above the worker widget, current
  (`aria-current="page"`, project-entry active styling) only on `/projects/log`.
- `/watch` and `/summary` are removed, no redirects (both 404).

Actual: Watch me build goes to `/watch`, `/summary` 308s to `/watch`, the sidebar has no Daily log entry.

## Problem Statement

The navigation graph has no edge into the projects section: the only header/landing entry points at a
sidebar-less summary page. The summary must move into the projects section and the entry must point at
`/projects`, without changing the summary's caching, revalidation, content or the behaviour of `/projects` and
project pages.

## Solution Statement

1. Move `src/app/watch/page.tsx` to `src/app/(dashboard)/projects/log/page.tsx`, unchanged apart from the provider
   and comments. `/projects/log` is a static segment, so it wins over `/projects/[owner]` and can never clash
   with a project page (always two segments).
2. **Reuse the layout's query client** (delete `src/app/watch/summary-providers.tsx`). Justification for
   `app_docs/summary.md`: the today card's key `["summary-today", day]` (`queryKeys.summaryToday`) shares no
   prefix with `projects`, `active-runs` or `queue`; the Realtime listener writes only those keys through
   `setQueryData`, and its catch-up enumerates only the `queue` prefix (`src/data/realtime.ts` `findAll`), so
   nothing in `Providers` touches the summary entry. `TodaySummary` is `staleTime: "static"` and
   `refetchOnMount: false`, so it is never refetched by the shared client; Refresh is still its own `refetch()`.
   A nested second `QueryClientProvider` would shadow the layout's client for that subtree for no benefit.
   The page's `HydrationBoundary` now writes into the `Providers` client, exactly like a project page's islands.
3. Add a static `Daily log` link to the sidebar in `src/app/(dashboard)/layout.tsx`, between the scrolling
   project-list wrapper and the worker widget block, outside every data boundary. It needs `usePathname()` for
   `aria-current`, so it is a tiny client component (`src/components/DailyLogLink.tsx`) wrapped in a plain
   `Suspense` whose fallback is the same link inactive, the same pattern as `SectionNav`/`HeaderLink`
   (`usePathname` suspends while prerendering a project page outside `generateStaticParams`; without the
   Suspense it would hold back the layout's shell). It reads no query, so the "two boundaries, never a bare
   Suspense" rule (which is about `useSuspenseQuery`) does not apply, as in `SectionNav`.
4. Share the project entry's border/active classes so Daily log and a project entry cannot drift: move the two
   class strings out of `ProjectNavItem` into exported constants (`src/lib/nav-entry.ts`), used by both.
5. Header: `SectionNav` Watch me build `href="/projects"`; `headerSection` drops the `/watch` case
   (`/projects`, `/projects/log` and everything below `/projects/` stay `"watch"`).
6. Landing: `src/app/page.tsx` link to `/projects`; comment in `src/content/home.ts`.
7. Delete `src/app/watch/` and `src/app/summary/` (no redirects, owner decision).
8. Update every comment and doc that names `/watch`, `/summary` or `SummaryProviders`.

## Steps to Reproduce

1. `yarn build && PORT=$PORT yarn start` (port from `.ports.env`).
2. Open `/`. Click Watch me build: the URL is `/watch`.
3. On `/watch` look for any link to `/projects` or a project page: there is none (no sidebar). The header's
   Watch me build link also points at `/watch`.
4. `curl -sI http://localhost:$PORT/summary` answers 308 to `/watch`.

## Root Cause Analysis

#169 moved the summary from `/` to `/watch` and repointed Watch me build at it, but placed the page outside the
`(dashboard)` route group (on purpose at the time: no Realtime, no pill). The `(dashboard)` layout's sidebar is
the only navigation into project pages, and `/projects` itself was only linked from the header's Watch me build
link before #169. Repointing that link removed the last navigation edge into `/projects`. The fix is structural:
the summary joins the group whose layout carries the navigation, and the header link points at the section's
root.

## Relevant Files

Use these files to fix the bug:

- `README.md`: lists `/watch` as the summary; update the route description.
- `AGENTS.md`: rules (no em-dashes, docs in the same change, profile headings).
- `.adw/project.md`: Workspaces health URLs (`/watch`), Tests (e2e journey list), Review section (`/watch`
  description, "no sidebar, no pill", the `/watch` link on `/`). Keep the nine `##` headings and their order.
- `docs/conditional-docs.md`: `summary.md` line says `/watch`; `routing-and-navigation.md` line mentions the
  `/summary` redirect.
- `src/app/watch/page.tsx`: the summary page to move.
- `src/app/watch/summary-providers.tsx`: the summary's own QueryClient; deleted (layout's client reused).
- `src/app/summary/route.ts`: the 308 to `/watch`; deleted.
- `src/app/(dashboard)/layout.tsx`: the sidebar; gets the Daily log entry; comments name `/watch`.
- `src/app/providers.tsx`: the layout's `Providers` (one QueryClient, Realtime); read to justify reuse, unchanged.
- `src/components/ProjectNav.tsx`: project entry styling and `aria-current` pattern to match.
- `src/components/SectionNav.tsx`, `src/components/HeaderLink.tsx`: header link `href` and the Suspense-with-
  inactive-fallback pattern to copy.
- `src/lib/header-section.ts`, `src/lib/header-section.test.ts`: section mapping and its tests.
- `src/app/page.tsx`, `src/content/home.ts`: landing Watch me build link and comments.
- `src/app/hire/page.tsx` (comment line 141), `src/app/api/revalidate/route.ts`,
  `src/app/actions/revalidate-history.ts`, `src/lib/history-tags.ts`, `src/lib/daily-summary.ts`,
  `src/components/TodaySummary.tsx`, `src/data/index.ts`, `src/data/query-keys.ts`: comments naming `/watch`
  or `src/app/watch/page.tsx`.
- `src/data/realtime.ts`: confirms which keys the listener and catch-up touch (only `projects`,
  `active-runs`, `queue`). Unchanged.
- `src/app/(dashboard)/projects/[owner]/[repo]/page.tsx`: `generateStaticParams` and the two-segment route, to
  confirm `/projects/log` cannot clash. Unchanged.
- `app_docs/summary.md`, `app_docs/routing-and-navigation.md`, `app_docs/home.md`, `app_docs/realtime.md`,
  `app_docs/history-revalidation.md`, `app_docs/clock-and-prerender.md`, `app_docs/data-boundary.md`,
  `app_docs/error-and-loading-boundaries.md`, `app_docs/screens-and-components.md`: every mention of `/watch`,
  `/summary`, `src/app/watch/...` or `SummaryProviders`, plus rules that say the summary is outside
  `(dashboard)` or has no pill/sidebar.
- e2e journeys that open `/watch` or `/summary`: `e2e/test_landing_no_filters.md`,
  `e2e/test_landing_today_refresh.md`, `e2e/test_day_card_charts.md`,
  `e2e/test_connection_indicator_scope.md`, `e2e/test_header_section_active.md`, `e2e/test_home_page.md`,
  `e2e/test_worker_status_widget.md`, `e2e/test_single_background_color.md`, `e2e/test_sticky_header.md`.
- `node_modules/next/dist/docs/`: read the App Router guides on route groups, dynamic segments
  (static-vs-dynamic precedence) and `usePathname` under Cache Components before editing.

### New Files

- `src/app/(dashboard)/projects/log/page.tsx`: the moved summary page.
- `src/components/DailyLogLink.tsx`: client component, the sidebar's Daily log link with `aria-current`.
- `src/lib/nav-entry.ts`: the sidebar entry class strings shared by `ProjectNavItem` and `DailyLogLink`.
- `e2e/test_daily_log_sidebar.md`: agent-driven journey for the navigation flow (see task 10 for why).

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. Read before editing

- Read `app_docs/summary.md`, `routing-and-navigation.md`, `realtime.md`, `data-boundary.md`,
  `clock-and-prerender.md`, `error-and-loading-boundaries.md`, `history-revalidation.md`, and the Next docs on
  route groups, dynamic routes and `usePathname` under `node_modules/next/dist/docs/`.

### 2. Header section mapping (test first)

- In `src/lib/header-section.test.ts`: change the first case to "is watch for the daily log at /projects/log"
  (`/projects/log` and `/projects/log/` map to `"watch"`); move `/watch`, `/watch/` into the null case
  (`expect(headerSection("/watch")).toBeNull()`), keep `/watchx`, `/watch-old`, `/watch/anything`, `/summary`
  as null; replace `/watch` in the "is home for the root only" and "never puts ... in the hire section" cases
  with `/projects/log`. Run `yarn test`: the `/watch` null assertion fails against the unfixed code.
- In `src/lib/header-section.ts`: delete the `/watch` line; rewrite the header comment and JSDoc (the watch
  section is `/projects`, `/projects/` and everything below, which includes the daily log at `/projects/log`;
  `/projectsx` matches nothing). Run `yarn test`: passes.

### 3. Header and landing links

- `src/components/SectionNav.tsx`: both Watch me build `href`s (fallback and `HeaderLink`) become `/projects`;
  comment: the section is the projects overview, the daily log at `/projects/log` and every project page.
- `src/app/page.tsx`: `<Link href="/projects">`; comments: the static link to `/projects` is the teaser;
  "Outside (dashboard), like /writing and /hire".
- `src/content/home.ts`: comment "followed by the Watch me build link to /projects".

### 4. Move the summary page

- `git mv src/app/watch/page.tsx "src/app/(dashboard)/projects/log/page.tsx"`.
- In the moved file: remove the `SummaryProviders` import and wrapper in `TodayIsland` (keep the
  `HydrationBoundary` and `QueryBoundary` exactly as they are); rewrite the island comment ("hydrated into the
  dashboard layout's Providers client"). Keep `metadata`, `getPastDays`, `getTodayState` (tags and `cacheLife`
  values unchanged), `requestToday` (`connection()` then the clock, still below it), `SummaryContent`, the
  `SectionBoundary`s and all copy unchanged. The outer wrapper `mx-auto max-w-6xl px-4 py-6` duplicates the
  layout's padding: change it to a plain `<div>` (the layout's `<section className="min-w-0 flex-1">` already
  provides width and padding, as on `/projects`). Check `/projects/page.tsx` for the exact wrapper it uses and
  match it.
- `git rm src/app/watch/summary-providers.tsx` (knip would flag it otherwise) and remove `src/app/watch/`.
- `git rm src/app/summary/route.ts` and remove `src/app/summary/`. No redirect is added anywhere
  (`next.config.ts` untouched).

### 5. Shared sidebar entry classes

- Create `src/lib/nav-entry.ts` exporting `NAV_ENTRY` (`block rounded-lg border px-3 py-2.5 transition-colors`),
  `NAV_ENTRY_ACTIVE` (`border-neutral-900 bg-neutral-100 dark:border-neutral-100 dark:bg-neutral-900`) and
  `NAV_ENTRY_INACTIVE` (`border-neutral-200 hover:border-neutral-400 dark:border-neutral-800
dark:hover:border-neutral-600`), the exact strings in `ProjectNavItem` today.
- `src/components/ProjectNav.tsx`: build the `Link` className from those constants (rendered classes
  byte-identical to today).

### 6. Daily log link

- Create `src/components/DailyLogLink.tsx` (`"use client"`): `DailyLogLink` reads `usePathname()`, `active =
pathname === "/projects/log"`, renders `<Link href="/projects/log" aria-current={active ? "page" :
undefined} className={`${NAV_ENTRY} ${active ? NAV_ENTRY_ACTIVE : NAV_ENTRY_INACTIVE}`}>` with
  `<span className="block truncate text-sm font-semibold">Daily log</span>`. Also export
  `DailyLogLinkFallback` (no hook, inactive classes, same markup) for the Suspense fallback; it must be
  importable from the server layout (a client module export is fine since it is a component).
- `src/app/(dashboard)/layout.tsx`: between the `md:min-h-0 md:flex-1 md:overflow-y-auto` wrapper and the
  worker widget `div`, add `<div className="shrink-0"><Suspense fallback={<DailyLogLinkFallback />}><DailyLogLink
/></Suspense></div>` with a comment: static, reads no query, so outside every boundary like the worker widget;
  `shrink-0` and outside the scroll wrapper so it stays in view from `md` up; on mobile it follows the project
  strip; the plain Suspense is for `usePathname`, which suspends while prerendering a project page outside
  `generateStaticParams` (same as `SectionNav`). The worker widget block's `border-t` stays the separator under
  it; add `border-t ... pt-2` (or equivalent) above Daily log only if the screenshot shows it running into the
  list. Update the layout's comments naming `/watch` (lines about the pill and the widget): the intro at `/`,
  `/writing` and `/hire` have no channel, no pill and no widget; the daily log at `/projects/log` is in the group.
- Confirm on mobile (375px) there is no horizontal scroll: the link is a full-width block in the column aside.

### 7. Comments under src

- Replace every `/watch` naming the summary with `/projects/log` (and `src/app/watch/page.tsx` with
  `src/app/(dashboard)/projects/log/page.tsx`) in `src/app/api/revalidate/route.ts`,
  `src/app/actions/revalidate-history.ts`, `src/lib/history-tags.ts`, `src/lib/daily-summary.ts`,
  `src/components/TodaySummary.tsx`, `src/data/index.ts`, `src/data/query-keys.ts`, `src/app/hire/page.tsx`
  ("Outside (dashboard), like / and /writing"). The webhook comment "`/watch` shows public projects only" keeps
  its meaning with the new path.
- Run `grep -rn '"/watch"\|/watch\b\|"/summary"\|SummaryProviders\|summary-providers' src` and fix until empty.

### 8. Feature docs and index

- `app_docs/summary.md`: the summary is `/projects/log` (`src/app/(dashboard)/projects/log/page.tsx`), inside
  `(dashboard)`, so it renders under `Providers` (sidebar, pill, worker widget, Realtime). Replace the
  `SummaryProviders` paragraph and rule with the reuse justification from the Solution Statement (key does not
  collide, Realtime writes and catch-up never touch it, static staleTime, Refresh is its own refetch). Rewrite
  "The page has no Realtime listener: it is outside `(dashboard)`" to: the channel is open but has no listener for
  the summary; a completion's `revalidateHistory` drops `summary:today` but `router.refresh()` runs only on that
  project's page, so an open daily log updates through Refresh (unchanged behaviour). Keep cache scopes, tags and
  `cacheLife` text as is. Add a rule: the sidebar's Daily log entry is static, outside every data boundary.
- `app_docs/routing-and-navigation.md`: route tree (`/`, `/projects`, `/projects/log`,
  `/projects/[owner]/[repo]`, `/hire`, `/writing`, `/writing/[slug]`); Watch me build links to `/projects` and is
  current on `/projects`, `/projects/log` and every project page; `/projects/log` is a static segment and never
  clashes with the two-segment project route; delete the `/summary` redirect prose and its rules, add a rule:
  `/watch` and `/summary` are removed with no redirect (owner decision, #182), do not add one.
- `app_docs/home.md`: the Watch me build link goes to `/projects`.
- `app_docs/realtime.md`: the routes without the channel are `/`, `/writing` and `/hire`; the summary at
  `/projects/log` is in `(dashboard)` and shows the pill; drop the `SummaryProviders` sentence; the page file path.
- `app_docs/history-revalidation.md`, `clock-and-prerender.md`, `data-boundary.md` (also: "Every server prefetch
  and `Providers` build from" the factory, no `SummaryProviders`), `error-and-loading-boundaries.md`,
  `screens-and-components.md` (the `/watch` paragraph becomes `/projects/log` inside the two-pane screen; the
  sidebar column now holds project list, Daily log, worker widget; drop `SummaryProviders` from the client
  component list; add `DailyLogLink`): every mention of `/watch`, `/summary`, `src/app/watch` or
  `SummaryProviders`.
- `docs/conditional-docs.md`: `summary.md` line "changing `/projects/log` (the daily log), its charts, its today
  card, its cache scopes or the sidebar's Daily log entry"; `routing-and-navigation.md` line drops "the
  `/summary` redirect".
- `README.md`: `/projects/log` (Daily log, in the projects sidebar) is the summary; Watch me build leads to
  `/projects`.
- `.adw/project.md`: health URLs `/`, `/projects/log`, `/projects`, then the project page; the `/watch` health
  prose becomes `/projects/log`; Review section: `/` link to `/projects`, `/projects/log` (sidebar with Daily log
  current, pill, worker widget, heading, intro, note, today card with Refresh, past day cards), `/projects`
  sidebar now includes Daily log; the pill sentence lists `/`, `/writing` and `/hire`; add
  `e2e/test_daily_log_sidebar.md` to the Tests journey list. Do not rename or reorder the nine `##` headings.
- `grep -rn '/watch\|/summary\b\|SummaryProviders' app_docs docs README.md .adw` must print nothing that
  describes a live route (a sentence saying they were removed with no redirect is fine). No em-dashes anywhere.

### 9. Update existing e2e journeys

- Every step that opens `/watch` opens `/projects/log`: `test_landing_no_filters.md`,
  `test_landing_today_refresh.md` (including `fetch("/watch")` and "URL is still exactly `/watch`"),
  `test_day_card_charts.md` (its `fetch("/watch")`), `test_sticky_header.md`, `test_single_background_color.md`.
- Steps asserting `/summary` redirects (`test_landing_no_filters.md` 11-12, `test_connection_indicator_scope.md`
  17-18) become: `/summary` and `/watch` render the not-found page.
- `test_connection_indicator_scope.md`: the pill is absent on `/` (and `/hire`), and present on `/projects/log`;
  the round trip goes through `/` instead of `/watch`.
- `test_worker_status_widget.md`: absent on `/` and `/hire`; present on `/projects/log`.
- `test_header_section_active.md`: Watch me build `href="/projects"`; current on `/projects/log`, `/projects`,
  a project page; `/watch` and `/watchx` render not-found with no link marked.
- `test_home_page.md`: Watch me build `href="/projects"`; clicking it lands on `/projects`.

### 10. New journey for the Daily log navigation

- Create `e2e/test_daily_log_sidebar.md` (`## User Story`, `## Test Steps` with **Verify** lines,
  `## Success Criteria`, per `.claude/commands/test_e2e.md`). Why a journey: the profile has no component or
  Playwright code layer, and the bug is navigation between rendered routes plus `aria-current` driven by
  `usePathname`, which no `src/**/*.test.ts` can exercise. Steps: from `/` click Watch me build, URL is
  `/projects`; the sidebar shows project entries, then `Daily log`, then the worker widget (`Ready to build`,
  `Checking status...` or `Offline`); Daily log has no `aria-current`; click it, URL `/projects/log`, today's
  card heading (`Today,`) and the day cards render, Daily log has `aria-current="page"`, no project entry has it;
  click the first project entry, land on its page, Daily log has no `aria-current`; navigate to `/watch` and
  `/summary`, each renders the not-found page; resize to 375x667 on `/projects/log`, the order is projects,
  Daily log, worker widget and `document.documentElement.scrollWidth <= window.innerWidth`.

### 11. Served HTML check

- `yarn build && PORT=$PORT yarn start` (port from `.ports.env`, never 3000 unless absent), then the curl checks
  in Validation Commands. Stop only the server this run started.

### 12. Run the Validation Commands

## Test Coverage

Unit (`src/**/*.test.ts`, vitest): `src/lib/header-section.test.ts` asserts `/projects/log` and `/projects/log/`
map to `"watch"` and `/watch`, `/watch/` map to `null`. The `/watch` null assertion fails against the unfixed
`headerSection` (which returns `"watch"`) and passes after; it catches the header marking a route that no longer
exists or a later reintroduction of the `/watch` section. The navigation flow itself (Watch me build to
`/projects`, Daily log current only on `/projects/log`, 404 on `/watch` and `/summary`) has no code test layer in
this project; it is covered by the served-HTML curl checks below and the `e2e/test_daily_log_sidebar.md` journey
(task 10). The existing `revalidateHistory` and `/api/revalidate` tests must pass unchanged: revalidation is by
tag, not path.

## Validation Commands

Execute every command to validate the bug is fixed with zero regressions.

- Before the fix (reproduce): `grep -rn 'href="/watch"' src` prints `src/app/page.tsx` and
  `src/components/SectionNav.tsx`; after the fix it prints nothing.
- `grep -rn '"/watch"\|/watch\b\|"/summary"' src`: prints nothing (comments included). Negative check: add
  `href="/watch"` to a comment in `src/app/page.tsx`, confirm the grep prints it, revert with
  `git checkout -- src/app/page.tsx` (only if that file had no other unstaged edits; otherwise remove the line by
  hand).
- `test ! -e src/app/watch && test ! -e src/app/summary && echo removed`: both directories are gone.
- `yarn lint`: lint.
- `yarn typecheck`: typegen picks up the moved route and the removed ones.
- `yarn knip`: no unused export (`SummaryProviders` deleted, new constants used).
- `yarn format:check`: formatting.
- `yarn test`: unit tests, including the updated `header-section.test.ts` and the unchanged revalidation tests.
- `yarn build`: the route tree builds; `/projects/log` appears as a partially prerendered route; `/watch` and
  `/summary` are absent from the route list.
- With `yarn start` on `$PORT` (source `.ports.env`):
  - `curl -s -o /dev/null -w '%{http_code}\n' localhost:$PORT/projects/log` prints `200`.
  - `curl -s localhost:$PORT/projects/log | grep -o 'Today,\|aria-current="page"[^>]*>[^<]*<span[^>]*>Daily log\|Daily log\|Ready to build\|Checking status...\|href="/projects/[^"/]*/[^"]*"' | sort | uniq -c`:
    today's heading, `Daily log`, a project link and the widget text are present (inspect that `Daily log`'s
    anchor carries `aria-current="page"`).
  - `curl -s localhost:$PORT/projects | grep -o '<a[^>]*href="/projects/log"[^>]*>'`: one anchor without
    `aria-current`.
  - `curl -s -o /dev/null -w '%{http_code}\n' localhost:$PORT/watch` and `.../summary` each print `404`.
  - `for p in / /writing /hire; do curl -s localhost:$PORT$p | grep -o '<a[^>]*>Watch me build' ; done`: every
    anchor has `href="/projects"`.

## Notes

- No new dependency.
- Owner decision: no redirects from `/watch` or `/summary`; do not add one in `next.config.ts` or a route handler.
- Route precedence: `/projects/log` is a static segment and outranks `[owner]`; a path like `/projects/log/x`
  still resolves to `[owner]/[repo]` with owner `log` and 404s through `notFound()` like any unknown slug.
- The page's metadata title and all summary copy, charts, colours and labels (#174, #175) stay unchanged.
- `Providers`' `onHistoryChange` only calls `router.refresh()` on the changed project's page; that is unchanged.
  On an open `/projects/log` a completion drops `summary:today` server-side and the Refresh button (or the next
  visit) shows it, as on `/watch` before.
- `/`, `/writing` and `/hire` stay outside `(dashboard)`: no Providers, no Realtime, no pill.
- Do not edit other files under `specs/`. No em-dashes in any file.
