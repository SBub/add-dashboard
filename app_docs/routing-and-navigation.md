# Routing and navigation

**Specifications:**

- specs/issue-127-adw-2ab91140-sdlc_planner-move-feature-docs.md
- specs/issue-164-adw-cf1087b2-sdlc_planner-hire-me-page-contact-form.md
- specs/issue-166-adw-1eacd918-sdlc_planner-relabel-dashboard-for-audiences.md
- specs/issue-169-adw-98e70d08-sdlc_planner-who-you-are-home-page.md
- specs/issue-170-adw-d5ef5a75-sdlc_planner-add-mdx-writing-blog.md
- specs/issue-173-adw-3fe1f775-sdlc_planner-production-changelog-backfill.md
- specs/issue-214-adw-b4882b73-sdlc_planner-header-one-row-floating-hire.md

## Overview

The route tree (`/`, `/projects`, `/projects/log`, `/projects/changelog`, `/projects/changelog/[id]`, `/projects/[owner]/[repo]`, `/hire`, `/writing`, `/writing/[slug]`), the header's links and their current-section marking, and how a project page decides it is not found. Pages live under `src/app/`, the header helpers in `src/components/SectionNav.tsx` and `src/lib/header-section.ts`.

## How it works

The static intro page is `/` (see `app_docs/home.md`). The summary, the daily
log at `/projects/log` (the sidebar's Daily log entry), shows finished runs per UTC day across projects: issue classes, total duration,
tokens (fresh input, cache read, output) and cost (see `app_docs/summary.md`).
The header's brand, "Sviatlana Buben, building in public" (below `sm` only
"Sviatlana Buben", the rest in a `hidden sm:inline` span), links to `/`, the
intro page; its "Watch me build" link goes to `/projects`, and its "Writing"
link goes to `/writing` and is emphasised on `/writing` and every post below it. At the
header's right, on every route from `sm` (640px), the Work with me button
(`HireLink`) is a solid fuchsia button linking to `/hire`; it carries
`aria-current="page"` only on `/hire`. Below `sm` the same link floats in the
bottom-right corner of the viewport, and on `/hire` it is hidden there through
its active state (`max-sm:hidden`), since the page is the form it leads to;
`aria-current="page"` is unchanged. Just before it, a small neutral Login /
Logout button (`IdentifyButton`) appears only when the `login` PostHog flag is
on (see `app_docs/analytics.md`); it is absent from the prerendered HTML. The link of the current section carries `aria-current="page"`, and
"Watch me build" is emphasised on `/projects`, `/projects/log`, `/projects/changelog` and its
entries, and every project page. On a project
page added after the deploy (not among the pre-rendered slugs) the shell carries
the unmarked link and the highlight arrives with the streamed pathname. The
summary's old addresses `/watch` and `/summary` are gone with no redirect; both
are 404.

### Routing

A project slug is exactly `owner/repo`, so the detail page has two named
segments, `src/app/(dashboard)/projects/[owner]/[repo]/page.tsx`.
`/projects/SBub/adw-dashboard` arrives as
`{ owner: "SBub", repo: "adw-dashboard" }`; the page assembles the slug once,
and everything below it (the data boundary, the query key, the cache tags, the
History bookmark, the `revalidateHistory` action) takes the slug as is.

URLs never carry the project id: it is a UUID and an internal key. The slug
stays the key because it is what the toolkit derives from the git remote, it is
the tenant key in the database, and it mirrors the GitHub URL.

Project pages are pre-rendered at build time from the project list
(`generateStaticParams` awaits `getProjects()`, so the database is read during
the build, and splits each slug into an `{ owner, repo }` pair; an empty list
yields the placeholder pair `_` / `none`, because an empty result fails the
build under `cacheComponents`); a slug that is not in that list still renders
on demand. The segment's `loading.tsx` is the Suspense boundary
that lets the shell prerender while the page streams in (its fallback is
`ProjectPageSkeleton`, a skeleton of the header, Active, Queue and History),
and its `error.tsx` is
the client error boundary (message, digest, Retry) for anything the page body
throws. A failure inside one of the pane's own boundaries (`QueryBoundary`
around Active, `SectionBoundary` around History) stays in that section and
never reaches it.
An unknown slug calls Next's `notFound()`, which renders
`src/app/(dashboard)/not-found.tsx` inside the two-pane shell; URLs that match
no route at all fall through to the root `src/app/not-found.tsx`, with a 404
status. That includes a path with one or three segments under `/projects`
(`/projects/SBub`, `/projects/SBub/adw-dashboard/extra`) and an encoded slash
(`/projects/SBub%2Fadw-dashboard`, one segment): the router answers them, no
slug lookup happens.

The intro page `/` is `src/app/page.tsx`: static, prerendered whole, outside
the `(dashboard)` group: no project sidebar, no project prefetch, no
`Providers` and no Realtime channel, so `/` shows no connection pill: the pill
is rendered by the `(dashboard)` layout beside `Providers`, where the channel
is. The summary is `/projects/log`
(`src/app/(dashboard)/projects/log/page.tsx`), inside the group, so it has the
sidebar, the pill and the worker widget. Between the project list and the
worker widget the sidebar carries two static entries, Daily log then Changelog
(`SidebarEntryLink`); Daily log links to the summary and is current only on
`/projects/log`. `log` is a static segment, so it outranks `[owner]` and never clashes
with a project page, which always has two segments (`/projects/log/x` resolves
to `[owner]/[repo]` with owner `log` and 404s like any unknown slug). The
changelog, `/projects/changelog` and `/projects/changelog/[id]`
(`src/app/(dashboard)/projects/changelog/`), is static, prerendered from the
registry, inside the group; `changelog` is a static segment that outranks
`[owner]` as `log` does, and an unknown entry id renders the segment's own
`not-found.tsx`, not the project not-found (see `app_docs/changelog.md`). The
project overview (every active run of every project, grouped by project in
sidebar order, each group headed by a link to its project page, or "No runs in
progress.") is `src/app/(dashboard)/projects/page.tsx`
at `/projects`, beside the `projects/[owner]/[repo]` segment.
`/hire` (`src/app/hire/page.tsx`) likewise sits outside `(dashboard)`, with
no `Providers`, no Realtime and no pill (see `app_docs/hire.md`).
`/writing` (`src/app/writing/page.tsx`) and `/writing/[slug]`
(`src/app/writing/[slug]/page.tsx`) also sit outside `(dashboard)`. They are
static (prerendered from the post registry), with no `Providers`, no Realtime
and no pill; an empty production post list yields the placeholder slug `_`,
which 404s (see `app_docs/writing.md`). A post page carries an in-page
breadcrumb back to `/writing` (see `app_docs/writing.md`); it does not change
the header's current-section marking.

## Rules

- The project route is `projects/[owner]/[repo]`. The slug is assembled from
  `owner` and `repo` only in the page (`${owner}/${repo}`, once); no other
  file splits or joins it, and everything below the page (data boundary,
  `queryKeys.queue(slug)`, `historyTag`, the bookmark,
  `revalidateHistory`) takes the slug as is. `generateStaticParams` in the
  same file is the one place that splits a slug, into the two params. URLs
  never carry the project id. Do not reintroduce a catch-all segment.
- `generateStaticParams` in `src/app/(dashboard)/projects/[owner]/[repo]/page.tsx`
  must never return an empty array. Under `cacheComponents` an empty result
  fails the build (nothing to prerender the segment with), so the empty-list
  branch returns the placeholder `{ owner: "_", repo: "none" }`, which the page
  turns into `notFound()` at request time. Keep that guard when touching the
  function.
- A project page's not-found decision is `getProject(slug) === null`:
  `getProject` is the page's `"use cache"` scope (tag `projects`, no clock
  read) that finds the slug in `getProjects()`, shared by the page body,
  the header and `generateMetadata`; never from the Active entry, never by
  searching a dehydrated state's queries by hash, and never from the queue (`getQueue` returns `[]` for an unknown
  slug); the History islands render only after that decision, so
  `getCompletedRuns` returning an empty page for an unknown slug is never shown.
- The header's current section comes only from `headerSection` in
  `src/lib/header-section.ts` (pure, tested in
  `src/lib/header-section.test.ts`; every change to it goes with a test
  case), read by `HeaderLink`. "Watch me build" (section key `"watch"`) is active on
  `/projects` and every path below `/projects/`, the daily log
  `/projects/log` and the changelog `/projects/changelog` included (never `/projectsx`, and never `/watch`, which no
  longer exists) and takes the brand's text colour; the
  brand (section key `"home"`) is active on exactly `/` and keeps its
  styling; "Work with me" (section key `"hire"`) is active on exactly `/hire`
  (never `/hirex` or `/hire-me`) and keeps its accent; "Writing" (section key
  `"writing"`) is active on `/writing`, `/writing/` and every path below
  `/writing/` (never `/writingx` or `/writing-old`). So `headerSection`
  answers `"home"`, `"watch"`, `"writing"`, `"hire"` or null. The active link carries `aria-current="page"`, the others none.
- `/watch` and `/summary` are removed with no redirect (owner decision,
  #182); both are 404. Do not add a redirect for either, in `next.config.ts`
  or in a route handler.
- The summary is `/projects/log` and the changelog is `/projects/changelog`,
  both static segments inside `(dashboard)`. Do not give a project page a
  one-segment URL; the two-segment project route is what keeps `log` and
  `changelog` from clashing with a project.
  The project overview (sidebar plus every active run, grouped by project) is
  `/projects`, `src/app/(dashboard)/projects/page.tsx`; its `Building now`
  heading is static in the page, above the `SectionBoundary` of its island; the header's
  `SectionNav` links to `/projects` and `/writing` and the brand, rendered by
  `BrandLink` from the same file, links to `/`.
