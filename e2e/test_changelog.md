# E2E Test: Changelog

Checks the changelog inside the dashboard: the sidebar lists the projects, then `Daily log`, then
`Changelog`, then the worker widget; `Changelog` opens `/projects/changelog`, an index of every push
to production, newest first, and is the only sidebar entry marked current there and on every entry
page, while the header's `Watch me build` stays current; each index card and each entry page shows
a stats strip (pull request link, lines added and removed, commits, files, comments); an entry page
lists what shipped under a plain title; an unknown entry renders the changelog not-found copy; and at 375px
neither page scrolls horizontally. The pages are static; this journey never writes.

## User Story

As a visitor watching the ADW builds (a hiring manager or a small-business owner)
I want a changelog of every push to production, listing the pull requests each one shipped
So that I can see what this workflow actually delivered to production, and when

## Test Steps

1. Resize the browser to 1920x1080 and navigate to `/projects`.
2. **Verify** the sidebar `aside` shows, in document order, the project links of the `navigation`
   named `Projects`, then a link named `Daily log` (`href="/projects/log"`), then a link named
   `Changelog` with `href="/projects/changelog"`, then the worker widget (text `Ready to build`,
   `Checking status...` or `Offline`). With `browser_evaluate`, **Verify** the order with
   `compareDocumentPosition` and that each one's `getBoundingClientRect().top` is greater than the
   previous one's. **Verify** the `Changelog` link has no `aria-current`.
3. Click the `Changelog` link. **Verify** the URL is `/projects/changelog`, the `Changelog` heading
   (level 1) is present, the list holds at least 10 entries, each with a `time` element, a title
   link to `/projects/changelog/<id>`, a stats strip (`[data-testid="changelog-stats"]`) and a
   counts label (`N features, N fixes, N chores`, `Branch sync` or `Revert`). With
   `browser_evaluate`, **Verify** the `time` elements' `dateTime` values are non-increasing from
   top to bottom.
   With `browser_evaluate`, read the first (newest) card's id `<id>` = `<date>-pr<n>` and its
   strip. Run `gh api repos/SBub/adw-dashboard/pulls/<n> --jq
'[.additions,.deletions,.commits,.changed_files,.comments+.review_comments]'` and **Verify** the
   strip has a link named `Production pull request #<n>` with text `#<n>` and
   `href="https://github.com/SBub/adw-dashboard/pull/<n>"`, the text `+<additions>` and
   `−<deletions>` (U+2212 minus) inside an element whose `aria-label` is
   `<additions> lines added, <deletions> removed`, and the texts `<commits> commits`,
   `<files> files` and `<comments> comment` or `<comments> comments`. **Verify** no card title
   contains `promote develop to master`.
4. **Verify** the `Changelog` link has `aria-current="page"`, the `Daily log` link and every link
   in the `Projects` navigation have none, and the header's `Watch me build` link has
   `aria-current="page"`. Take a screenshot of `/projects/changelog`.
5. Click the first (newest) entry's title. **Verify** the URL is `/projects/changelog/<id>`, the
   level-1 heading does not contain `promote develop to master` and no text on the page contains
   `Production is currently broken`. **Verify** the stats strip under the heading carries the same
   values as in step 3: a link named `Production pull request #<n>` (text `#<n>`) pointing to
   `https://github.com/SBub/adw-dashboard/pull/<n>`, `+<additions>`, `−<deletions>` with the
   `aria-label` `<additions> lines added, <deletions> removed`, `<commits> commits`,
   `<files> files` and the comments count. **Verify** at least one level-2 heading among `Features`, `Fixes`, `Chores` or `Reverted` is present with
   list items linking to `https://github.com/SBub/adw-dashboard/pull/...`, and the `Changelog`
   link still has `aria-current="page"`. Take a screenshot.
6. Navigate to `/projects/log`. **Verify** the `Daily log` link has `aria-current="page"` and the
   `Changelog` link has none.
7. Navigate directly (full page load) to `/projects/changelog/does-not-exist`. **Verify** the text
   `There is no changelog entry at this address.` renders inside the dashboard shell (the sidebar
   is present). Take a screenshot.
8. Navigate to the newest entry page from step 5 and resize to 375x667. With `browser_evaluate`,
   **Verify** `document.documentElement.scrollWidth <= window.innerWidth`. Take a screenshot.
9. Navigate to `/projects/changelog` at 375x667. **Verify** the same no-horizontal-scroll check.
   Take a screenshot.

## Success Criteria

- The sidebar shows the projects, then `Daily log`, then `Changelog`
  (`href="/projects/changelog"`), then the worker widget.
- `/projects/changelog` lists at least 10 entries, newest first, each with date, title, stats
  strip and counts; no title reads `promote develop to master`.
- The newest entry's strip, on the index and on its page, matches `gh api` for its pull request:
  link, added and removed lines, commits, files and comments.
- `Changelog` has `aria-current="page"` on `/projects/changelog` and its entries only; `Daily log`
  is still current only on `/projects/log`; the header's `Watch me build` is current on the
  changelog routes.
- An entry page shows the stats strip with its production pull request link and lists shipped pull
  requests under at least one section heading.
- An unknown entry renders `There is no changelog entry at this address.`
- No horizontal scroll at 375px on either changelog page.
- 5 screenshots are taken.
