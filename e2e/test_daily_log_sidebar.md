# E2E Test: Daily Log Sidebar

Checks that the summary lives at `/projects/log` inside the dashboard: `Watch me build` leads to
`/projects`, the sidebar lists the projects, then a `Daily log` entry, then the worker widget; the
`Daily log` entry opens the summary and is the only sidebar entry marked current there, while the
header's `Watch me build` stays current; a project page does not mark `Daily log`; the old `/watch`
and `/summary` addresses render the not-found page; and at 375px the sidebar keeps the same order
without horizontal scroll. The hosted database is read only; this journey never writes.

## User Story

As a visitor watching the ADW builds
I want the daily summary one click away in the project sidebar
So that I can switch between the projects and the daily log without leaving the dashboard

## Test Steps

1. Resize the browser to 1920x1080 and navigate to the `Application URL` (`/`).
2. Click the `Watch me build` link in the header's `Sections` navigation. **Verify** the URL is
   `/projects` and the `Building now` heading (level 2) is present.
3. **Verify** the sidebar `aside` shows, in document order, the project links of the `navigation`
   named `Projects` (at least one link to `/projects/<owner>/<repo>`), then a link named `Daily log`
   with `href="/projects/log"`, then the worker widget (text `Ready to build`,
   `Checking status...` or `Offline`). With `browser_evaluate`, **Verify** the order with
   `compareDocumentPosition` (last project link before `Daily log`, `Daily log` before the widget)
   and that each one's `getBoundingClientRect().top` is greater than the previous one's.
4. **Verify** the `Daily log` link has no `aria-current`. Take a screenshot of `/projects`.
5. Click the `Daily log` link. **Verify** the URL is `/projects/log`, the
   `What an AI developer workflow gets done` heading (level 1) is present, an `article` whose
   level-2 heading starts with `Today,` is present, followed by at least one past day card (an
   `article` with a level-2 date heading) or the text `No finished runs in the previous 30 days.`
6. **Verify** the `Daily log` link has `aria-current="page"`, no link in the `Projects` navigation
   has `aria-current`, and the header's `Watch me build` link has `aria-current="page"`.
7. Take a screenshot of `/projects/log` at 1920x1080.
8. Click the first project link in the sidebar's `Projects` navigation and note its `href`.
   **Verify** the URL is `/projects/<owner>/<repo>` (the noted `href`) and the `Daily log` link has
   no `aria-current`.
9. Navigate directly (full page load) to `/watch`. **Verify** the URL is unchanged (no redirect)
   and the not-found page renders (the `Not found` heading and the text
   `There is nothing at this address.`).
10. Navigate directly (full page load) to `/summary`. **Verify** the same not-found page renders
    with no redirect. Take a screenshot of the not-found page.
11. Navigate to `/projects/log` and resize to 375x667. With `browser_evaluate`, **Verify** the
    last project link, the `Daily log` link and the worker widget come in that order (each one's
    `top` at or below the previous one's `top`, and `compareDocumentPosition` as in step 3), and
    `document.documentElement.scrollWidth <= window.innerWidth`. Take a screenshot at 375x667.

## Success Criteria

- `Watch me build` lands on `/projects`.
- The sidebar shows the projects, then `Daily log` (`href="/projects/log"`), then the worker
  widget, at 1920px and at 375px.
- `Daily log` opens `/projects/log` with today's card and the past day cards.
- `Daily log` has `aria-current="page"` only on `/projects/log`, where no project entry is current
  and the header's `Watch me build` is current.
- `/watch` and `/summary` render the not-found page, with no redirect.
- No horizontal scroll at 375px on `/projects/log`.
- 4 screenshots are taken.
