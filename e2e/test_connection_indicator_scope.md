# E2E Test: Connection Indicator Scope

Checks that the Realtime connection indicator exists only on the dashboard routes (`/projects`, the
summary at `/projects/log` and the project pages), where the channel is opened, that the intro page
at `/` and the `/hire` page show none, that the pill reaches `live` again after a round trip through
`/`, and that the old `/summary` and `/watch` addresses render the not-found page.

## User Story

As a person watching ADW runs
I want the connection indicator to appear only where the dashboard holds a live connection
So that the pages outside the dashboard never show a pill stuck at `connecting`

## Test Steps

1. Navigate to `/` under the `Application URL` (the intro page).
2. **Verify** the heading `Sviatlana Buben, product engineer` (level 1) is present, there is no
   `navigation` named `Projects` (the sidebar) and no element with role `status` in the
   accessibility snapshot.
3. Take a screenshot of the intro page.
4. Navigate to `/projects`.
5. **Verify** the URL is `/projects`, the `Projects` navigation (the sidebar) and the
   `Building now` heading (level 2) are present.
6. **Verify** an element with role `status` is present and within 15 seconds its text is `live`
   (in development it may read `connecting` once before that; wait and re-snapshot).
7. Take a screenshot of the project overview.
8. Click the first project link in the sidebar's `Projects` navigation and note its `href`.
9. **Verify** the URL is `/projects/<owner>/<repo>` (the noted `href`) and the `status` element
   reads `live` (wait up to 15 seconds).
10. Click the header's brand link `Sviatlana Buben, building in public` (`href="/"`).
11. **Verify** the URL is `/` and the `Sviatlana Buben, product engineer` heading is present.
12. **Verify** the accessibility snapshot contains no element with role `status`, and no text
    `connecting`, `live` or `reconnecting`. Judge this from `browser_snapshot` (and the
    screenshot), never from a raw DOM query such as `document.querySelector('[role=status]')`:
    with `cacheComponents`, Next keeps the previous route's subtree in the document inside a hidden
    React `Activity` (`display: none`, effects unmounted, so the hidden pill reads `connecting`).
    That subtree is not rendered, is absent from the accessibility snapshot and does not count as
    present.
13. Go back in history (`browser_navigate_back`) to the project page from step 9.
14. **Verify** the URL is the project page from step 9 and a `status` element is present and within
    15 seconds reads `live` again.
15. Take a screenshot of the project page.
16. **Verify** the header's `Sections` navigation contains no `Summary` link.
17. Navigate directly (full page load) to `/projects/log`.
18. **Verify** the `What an AI developer workflow gets done` heading is present, the `Projects`
    navigation (the sidebar) is present, and an element with role `status` is present and within
    15 seconds reads `live`.
19. Navigate directly (full page load) to `/summary?days=7`, then to `/watch`. On each, **Verify**
    the URL is unchanged (no redirect) and the not-found page renders (the `Not found` heading and
    the text `There is nothing at this address.`).
20. Navigate to `/hire`. **Verify** the accessibility snapshot contains no element with role
    `status` and no `navigation` named `Projects`.

## Success Criteria

- The pill is absent on `/`, both on a full page load and after a client navigation, and on `/hire`.
- The `status` pill reaches `live` on `/projects`, on `/projects/log` and on a project page.
- The pill reaches `live` again after a round trip from a project page through `/`.
- `/summary?days=7` and `/watch` render the not-found page, with no redirect.
- 3 screenshots are taken.
