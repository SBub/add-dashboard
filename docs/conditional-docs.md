# Conditional docs

One line per feature doc in `app_docs/`, saying when to read it; read the lines whose situation matches your task.

- `app_docs/screens-and-components.md`: read when changing a component's props, a row's layout, a run row's phase label, the History card's fields, its branch link or its pull request link, a section heading, a colour, a timestamp's format, the page background, the sticky header, its z-index layer or the sidebar's sticky offset; when adding or removing `"use client"`; when changing the worker status widget or the sidebar's column layout.
- `app_docs/routing-and-navigation.md`: read when changing the route tree, the header's links, the Writing link or their current-section marking; when touching a project page's not-found decision or `generateStaticParams`.
- `app_docs/types.md`: read when changing `src/types/adw.ts`; when a database column is added, renamed or removed.
- `app_docs/data-boundary.md`: read when changing `src/data/index.ts`, a query key, the query client or a server prefetch; when adding a database read or an environment variable; when touching `getWorkers`.
- `app_docs/clock-and-prerender.md`: read when adding a time-dependent label or any `Date.now()`/`new Date()`; when a component ships as its Suspense fallback in the served HTML; when changing the worker store's poll.
- `app_docs/active-runs.md`: read when changing the Active entry, `getActiveRunsState`, `activeRunsQuery`, the three Active islands or the helpers in `src/lib/active-runs.ts`; when the sidebar's counts disagree with a project's Active section.
- `app_docs/project-page.md`: read when changing the project page's Active, Queue or History sections; when touching History's paging, its bookmark or its `?q` search.
- `app_docs/history-revalidation.md`: read when changing the `revalidateHistory` action, the `/api/revalidate` handler, a cache tag, `cacheLife` or `staleTimes`; when a completed run does not appear in History.
- `app_docs/error-and-loading-boundaries.md`: read when adding a `Suspense`, a `QueryBoundary`, a `SectionBoundary` or a loading fallback; when a failed read takes down more than its own section.
- `app_docs/realtime.md`: read when changing the `adw` channel, a Realtime reducer, the catch-up read or the connection pill; when a live update does not reach the screen.
- `app_docs/summary.md`: read when changing `/projects/log` (the daily log), its charts, its today card, its cache scopes or the sidebar's Daily log entry; when a day's totals look wrong.
- `app_docs/hire.md`: read when changing `/hire`, its form, the `sendHireRequest` action, `src/content/hire.ts`, the Turnstile or Resend configuration, the Work with me header button, the offer prompts or `?offer=`.
- `app_docs/home.md`: read when changing `/`, its copy in `src/content/home.ts`, `LOCATION` in `src/content/site.ts` or its two doors into `/hire`.
- `app_docs/writing.md`: read when adding or changing a post under `src/content/posts/`, the registry, `src/lib/posts.ts`, `/writing`, a post page, its Open Graph image, `src/mdx-components.tsx`, the post page's breadcrumb, the post page's minimap or the post metadata check (`yarn check:og`).
- `app_docs/analytics.md`: read when adding, renaming or removing a PostHog event, changing `instrumentation-client.ts` or `src/app/global-error.tsx`, or touching the PostHog environment variables; when reading or adding a PostHog feature flag, calling `identify` or `reset`, changing the header's Login / Logout button; or tagging a device as internal (`?internal=`) or excluding automated browsers.
- `app_docs/changelog.md`: read when adding or changing a changelog entry under `src/content/changelog/`, its registry, `src/lib/changelog.ts`, `src/lib/changelog-backfill.ts`, `scripts/backfill-changelog.ts`, `src/components/ChangelogStats.tsx` (the stats strip), `/projects/changelog` or the sidebar's Changelog entry.
- `app_docs/radio.md`: read when changing the NTS radio bar above the header, `src/components/RadioBar.tsx`, `src/lib/radio.ts`, the stream or credit URLs, `--radio-bar-height`, or what renders before the header in `src/app/layout.tsx`.
