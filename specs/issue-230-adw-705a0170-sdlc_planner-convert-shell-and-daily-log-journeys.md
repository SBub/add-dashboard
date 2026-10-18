# Chore: E2E specs: dashboard shell, sidebar entries and the daily log

## Metadata

issue_number: `230`
adw_id: `705a0170`
issue_json: `{"number":230,"title":"E2E specs: dashboard shell, sidebar entries and the daily log"}`

## Chore Description

Convert the eight agent-driven journeys about the dashboard shell and the daily log from
`e2e/test_<name>.md` to Playwright specs at `e2e/<name>.spec.ts`, and delete each journey in the same
commit as its spec:

| journey (deleted)                        | spec (new)                               |
| ---------------------------------------- | ---------------------------------------- |
| `e2e/test_daily_log_sidebar.md`          | `e2e/daily_log_sidebar.spec.ts`          |
| `e2e/test_changelog.md`                  | `e2e/changelog.spec.ts`                  |
| `e2e/test_connection_indicator_scope.md` | `e2e/connection_indicator_scope.spec.ts` |
| `e2e/test_sticky_header.md`              | `e2e/sticky_header.spec.ts`              |
| `e2e/test_worker_status_widget.md`       | `e2e/worker_status_widget.spec.ts`       |
| `e2e/test_landing_no_filters.md`         | `e2e/landing_no_filters.spec.ts`         |
| `e2e/test_landing_today_refresh.md`      | `e2e/landing_today_refresh.spec.ts`      |
| `e2e/test_day_card_charts.md`            | `e2e/day_card_charts.spec.ts`            |

Conversion rules (same as #228, already applied in `e2e/header_section_active.spec.ts`,
`e2e/home_page.spec.ts`, `e2e/hire_page.spec.ts`, `e2e/writing.spec.ts`,
`e2e/header_login_hidden.spec.ts`):

- Every `**Verify**` step and every Success Criterion becomes an assertion. Screenshot-only steps
  (and the "N screenshots are taken" criterion) are dropped; the review phase owns screenshots.
- Role and label locators first (`getByRole`, `getByLabel`, `getByText`); `page.evaluate` only for
  computed style and geometry (`getComputedStyle`, `getBoundingClientRect`,
  `compareDocumentPosition`, `elementFromPoint`, `scrollWidth`).
- Every trap a journey warns about is encoded: `connecting` before `live` (always `waitForLive`,
  15 s), `Checking status...` before `Ready to build` / `Offline` (accept either live state, 30 s),
  hidden `Activity` subtrees kept in the document under `cacheComponents` (judge absence from the
  accessibility tree or visible elements only, never from a raw DOM count).
- Specs import `test`, `expect` and helpers from `e2e/fixtures.ts` only; they read the hosted
  database through the app and never write; nothing hard-codes live row counts, slugs, titles or
  dates. A "if no such X, note it and pass" branch becomes `test.skip(true, "<reason>")` for that
  check alone.

Also update the rule in `app_docs/summary.md` (line 202) to name the two new spec files.

## Relevant Files

Use these files to resolve the chore:

- `README.md`: repository overview; read first, no change (it must not reference the journeys; it
  does not).
- `AGENTS.md`: rules (Yarn only, no em-dashes, Conventional commits, no trailers, feature-doc Rules
  are invariants).
- `.adw/project.md`: the ADW profile; Tests section names the Playwright suite and the
  `PORT=<run port> yarn test:e2e` command; Ports section (`.ports.env`, `PORT=9200` in this
  worktree); Protected section. Must not be edited by this chore.
- `docs/conditional-docs.md`: the index; the matching docs are listed below.
- `app_docs/summary.md`: `/projects/log`, today card, Refresh, charts, the sidebar's Daily log
  entry; its Rules line 202 names the two journeys and must be changed to the spec names.
- `app_docs/changelog.md`: `/projects/changelog`, the sidebar's Changelog entry, the stats strip.
- `app_docs/realtime.md`: the connection pill and its states.
- `app_docs/screens-and-components.md`: the sticky header, the sidebar's sticky offset and column
  layout, the worker status widget, section tooltips and their layer.
- `app_docs/routing-and-navigation.md`: the not-found decision for `/watch` and `/summary`, the
  header's current-section marking.
- `app_docs/clock-and-prerender.md`: why the served HTML holds `Checking status...` and the today
  card.
- `e2e/fixtures.ts`: `test` (with the auto `/hire` POST guard), `expect`, `waitForLive`,
  `openFirstProject`. Extend it with helpers shared by two or more of the new specs (see Step 1).
- `playwright.config.ts`: `testMatch: "**/*.spec.ts"`, `baseURL` from `PORT`, 1920x1080 default
  viewport, chromium only, `retries: 0`. No change.
- `e2e/header_section_active.spec.ts`, `e2e/home_page.spec.ts`: style to copy (describe per
  journey, comments stating the journey's claim, `boundingBox` null guards that throw).
- `knip.json`: scans `e2e/**/*.ts`; every new export in `fixtures.ts` must be imported by a spec.
- `package.json`: `test:e2e` is `playwright test`; scripts `lint`, `typecheck`, `knip`,
  `format:check`, `test`, `build`.
- `.github/workflows/ci.yml`: CI runs `yarn test:e2e` after `yarn build` (server `yarn start`). No
  change.
- Application code read for locators and claims (never edited):
  - `src/app/(dashboard)/layout.tsx`: the `aside` order (pill row, scroll wrapper with
    `ProjectNav`, `Daily log` and `Changelog` entries, worker widget inside a `border-t` div), the
    sticky offset `md:top-[calc(var(--header-height)+1.5rem)]`.
  - `src/components/SidebarEntryLink.tsx`: `aria-current="page"` when current; `Changelog` is
    `nested` (current on every `/projects/changelog/*`).
  - `src/components/WorkerStatus.tsx`: `Checking status...`, `Ready to build`, `Offline`,
    `last beat <Timestamp>` or `never seen`; no `role="status"`, an `aria-live` div.
  - `src/components/ConnectionIndicator.tsx`: the `status` pill.
  - `src/components/TodaySummary.tsx`: `Today, <time dateTime={today}>`, the `Refresh` button
    (`Refreshing...` while pending), `Refresh failed` line; Refresh is `refetch()` only.
  - `src/data/index.ts` `getSummaryToday`: the three `day=eq.<today>` reads (`daily_summary`,
    `daily_model_summary`, `daily_phase_summary`) plus `getSummaryProjects`; `getWorkers` reads
    `workers` on its own 30 s poll.
  - `src/components/DailySummaryList.tsx`: the window line ending `, all projects`.
  - `src/components/SummaryDayCard.tsx`, `DayCharts.tsx`, `ColumnChart.tsx`,
    `ClassColumnChart.tsx`, `ModelColumnChart.tsx`, `PhaseColumnChart.tsx`,
    `ProjectBreakdownTable.tsx`, `ClassDistributionBar.tsx`: figures, `data-value-placement`,
    bars with inline `height`, `li > span.mt-2` name rows, `Issue classes:` svg.
  - `src/components/ChangelogStats.tsx`: `data-testid="changelog-stats"`, the
    `Production pull request #<n>` link, `role="img"` with `aria-label`
    `<additions> lines added, <deletions> removed`, `N commits`, `N files`, `N comment(s)`.
  - `src/components/SectionHeading.tsx`: `About <title>` buttons and `#section-<slug>-detail`.
  - `src/app/(dashboard)/projects/log/page.tsx`: the `Daily log` `h1` and intro.
  - `src/content/changelog/index.ts`: the static entries (repository content, not live data).
- The eight journeys listed above: the source of every assertion; deleted by this chore.

### New Files

- `e2e/daily_log_sidebar.spec.ts`
- `e2e/changelog.spec.ts`
- `e2e/connection_indicator_scope.spec.ts`
- `e2e/sticky_header.spec.ts`
- `e2e/worker_status_widget.spec.ts`
- `e2e/landing_no_filters.spec.ts`
- `e2e/landing_today_refresh.spec.ts`
- `e2e/day_card_charts.spec.ts`

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. Extend `e2e/fixtures.ts` with the shared helpers

Add only helpers used by two or more of the new specs (knip fails on an unused export), each with a
one-line comment in the file's style. Do not create a second fixture file.

- `workerWidget(page)`: the sidebar widget's state text,
  `page.locator("aside").getByText(/^(Ready to build|Offline|Checking status\.\.\.)$/)`, and a
  `waitForWorkerState(page)` that expects it to match `/^(Ready to build|Offline)$/` within 30 s.
  Never a hard-coded state. (daily_log_sidebar, changelog, sticky_header, worker_status_widget.)
- `expectNotFound(page, path)`: `page.goto(path)`, then expect the URL pathname and search to equal
  `path` (no redirect), the heading `Not found` and the text `There is nothing at this address.`
  visible. (daily_log_sidebar, connection_indicator_scope, landing_no_filters.)
- `expectInDocumentOrder(locators, { strictTop })`: through one `page.evaluate` over the element
  handles, asserts each one `compareDocumentPosition` follows the previous
  (`DOCUMENT_POSITION_FOLLOWING`) and each `getBoundingClientRect().top` is greater than (strict) or
  at least (mobile) the previous one's. (daily_log_sidebar, changelog.)
- `expectNoHorizontalScroll(page)`: `document.documentElement.scrollWidth <= window.innerWidth`.
  (daily_log_sidebar, changelog, day_card_charts.)
- `servedHtml(request, path)`: `(await request.get(path)).text()` after asserting `ok()`; the
  spec's `request` fixture uses `baseURL`, so it reads the app only. (worker_status_widget,
  landing_today_refresh, day_card_charts.)
- `sidebarProjectLinks(page)`: `page.getByRole("navigation", { name: "Projects" }).getByRole("link")`.
  Reuse it inside `openFirstProject` too.

Absence on routes that follow a dashboard route (the hidden `Activity` trap): assert with role
locators (`getByRole("status")` excludes `display: none`) or with `getByText(...)` plus
`.filter({ visible: true })` / `toBeHidden()`, never `toHaveCount(0)` on a plain text or CSS
locator. Put a comment on each such assertion naming the trap.

### 2. `e2e/daily_log_sidebar.spec.ts` (from `test_daily_log_sidebar.md`), delete the journey

- `Watch me build` in the `Sections` navigation from `/` lands on `/projects` with the level-2
  `Building now` heading.
- On `/projects`: at least one project link matching `^/projects/[^/]+/[^/]+$`; a `Daily log` link
  with `href="/projects/log"`; the worker widget; `expectInDocumentOrder` (last project link,
  `Daily log`, widget; strict tops). `Daily log` has no `aria-current`.
- Click `Daily log`: URL `/projects/log`, level-1 `Daily log`, an `article` whose level-2 heading
  starts `Today,`, then at least one past day card (an `article` with a level-2 heading not starting
  `Today,`) or the text `No finished runs in the previous 30 days.` (accept either, do not
  hard-code). `Daily log` has `aria-current="page"`, no link in `Projects` has `aria-current`
  (loop over `all()`), the header `Watch me build` has `aria-current="page"`.
- Click the first project link (note `href`): URL is that `href`, `Daily log` has no
  `aria-current`.
- `expectNotFound(page, "/watch")`, `expectNotFound(page, "/summary")`.
- `/projects/log` at 375x667: the same order with non-strict tops, `expectNoHorizontalScroll`.
- Delete `e2e/test_daily_log_sidebar.md`.

### 3. `e2e/changelog.spec.ts` (from `test_changelog.md`), delete the journey

- On `/projects`: order last project link, `Daily log`, `Changelog`
  (`href="/projects/changelog"`), widget, strict tops; `Changelog` has no `aria-current`.
- Click `Changelog`: URL `/projects/changelog`, level-1 `Changelog`; at least 10 entries (the
  entries are repository content, `CHANGELOG_ENTRIES` holds 10, not live data), each with a `time`,
  a title link matching `^/projects/changelog/[^/]+$`, a `getByTestId("changelog-stats")` and a counts
  label matching `/^\d+ features?, \d+ fix(es)?, \d+ chores?$|^Branch sync$|^Revert$/` (check the
  exact singular/plural wording in the index page source before writing the regex). `dateTime`
  values non-increasing top to bottom (one `evaluate` over the `time` elements). No card title
  contains `promote develop to master`.
- Newest card: parse `<id>` = `<date>-pr<n>` from its title href. Its strip has a link named
  `Production pull request #<n>` with text `#<n>` and `href` `https://github.com/SBub/adw-dashboard/pull/<n>`.
  Read the expected numbers from GitHub with the `request` fixture:
  `GET https://api.github.com/repos/SBub/adw-dashboard/pulls/<n>` (send
  `Authorization: Bearer ${process.env.GITHUB_TOKEN}` only when set); when the response is not
  `ok()` (rate limit), `test.skip(true, "GitHub API unavailable: <status>")` for that comparison only
  (put it in its own `test`). Otherwise expect `+<additions>`, `−<deletions>` (U+2212) inside the
  `img` named `<additions> lines added, <deletions> removed` (use `plural` wording: `1 line added`
  when 1), `<commits> commits`, `<files> files`, `<comments> comment(s)` where comments is
  `comments + review_comments`. This is a GET read of a public API, the spec's equivalent of the
  journey's `gh api`.
- `Changelog` `aria-current="page"`; `Daily log` and every `Projects` link have none; header
  `Watch me build` is current.
- Click the newest title: URL `/projects/changelog/<id>`; `h1` does not contain
  `promote develop to master`; no `Production is currently broken` text; the strip under the
  heading has the same values as the index card (compare the two strips' texts and the `img`
  `aria-label`, so the index and the page agree even when the GitHub test skipped); at least one
  level-2 heading among `Features`, `Fixes`, `Chores`, `Reverted` with list item links matching
  `^https://github.com/SBub/adw-dashboard/pull/`; `Changelog` still `aria-current="page"`.
- `/projects/log`: `Daily log` current, `Changelog` not.
- `/projects/changelog/does-not-exist`: `There is no changelog entry at this address.` visible and
  the `Projects` navigation present (dashboard shell).
- At 375x667 the newest entry page and `/projects/changelog`: `expectNoHorizontalScroll`.
- Delete `e2e/test_changelog.md`.

### 4. `e2e/connection_indicator_scope.spec.ts` (from `test_connection_indicator_scope.md`), delete the journey

- `/`: level-1 `Sviatlana Buben`, text `Product Engineer, AI Consultant`, no `Projects`
  navigation, `getByRole("status")` count 0.
- `/projects`: URL, `Projects` navigation, level-2 `Building now`, `waitForLive`.
- `openFirstProject`: URL is the returned `href`, `waitForLive`.
- Click the banner link `Sviatlana Buben, building in public`: URL `/`, level-1 heading; no
  `status` role; `getByText(/^(connecting|live|reconnecting)$/)` has no visible match (comment: the
  previous route's pill is kept in a hidden `Activity` and reads `connecting`; it does not count).
- `page.goBack()`: URL is the project `href`, `waitForLive` again.
- The `Sections` navigation has no `Summary` link.
- Full load `/projects/log`: level-1 `Daily log`, `Projects` navigation, `waitForLive`.
- `expectNotFound(page, "/summary?days=7")`, `expectNotFound(page, "/watch")`.
- `/hire`: no `status` role, no `Projects` navigation.
- Delete `e2e/test_connection_indicator_scope.md`.

### 5. `e2e/sticky_header.spec.ts` (from `test_sticky_header.md`), delete the journey

One `evaluate` helper local to the spec (used only here) returns the header box, `scrollY`, and
whether `elementFromPoint` at a link's centre is inside that link.

- 1280x800 `/projects/log`, scroll to bottom: `scrollY > 0`, `body > header` `top` is 0, brand
  link (`Sviatlana Buben, building in public`) and `Watch me build` hit-tested visible; header
  computed `backgroundColor` equals `body`'s and is not `rgba(0, 0, 0, 0)`; `elementFromPoint` 8px
  from the header's right edge at its vertical centre is inside the header.
- `/projects`, `waitForLive`, click the first project link (note `href`). Scroll to top, hover the
  `About Building now` button (or the first `About <section>` button), expect its
  `#section-<slug>-detail` visible (derive the id from `aria-describedby`/`aria-controls` or the
  `section-<slug>-detail` rule in `SectionHeading.tsx`); `scrollBy` until the button's top is within
  8px of the header's bottom, re-hovering if hidden; if the tooltip box intersects the header box,
  `elementFromPoint` at the intersection's centre is inside the tooltip, else at the tooltip's centre.
- Scroll to bottom: header `top` 0 with brand and nav hit-tested; `aside` `top` equals header
  height + 24 within 1px and `bottom <= innerHeight`; scroll the sidebar's scroll container
  (`aside` child with `overflow-y: auto`) to its bottom, the last project link's box is inside the
  aside's box and the viewport; the worker widget is inside the aside's box and the viewport.
- `page.goBack()` to `/projects/log`: `scrollY` restored to the bottom within a tolerance (for
  example `scrollY >= scrollHeight - innerHeight - 2`, polled with `expect.poll`); then
  `page.goForward()` and expect the project URL.
- 375x667 `/projects/log`: the bottom-scroll checks and opacity checks; brand is
  `Sviatlana Buben` only below `sm` (use the accessible name the header renders there, check
  `HeaderLink`/`layout.tsx`); header height 57 within 1px; brand, `Watch me build` and `Writing`
  link boxes inside the header box. Then on the project page at 375: header `top` 0, brand and nav
  hit-tested, opaque. No sidebar checks below `md`.
- Delete `e2e/test_sticky_header.md`.

### 6. `e2e/worker_status_widget.spec.ts` (from `test_worker_status_widget.md`), delete the journey

- `servedHtml(request, "/projects")` contains `Checking status...` and either a `<code>` holding an
  `adw_id` (`/<code[^>]*>[0-9a-f]{8}<\/code>/`) or `No runs in progress.`.
- 1920x1080 `/projects`, `waitForLive`, `waitForWorkerState`; the widget's container text matches
  `/^(Ready to build|Offline)\s*(last beat \d{2}\.\d{2}\.\d{4} \d{2}:\d{2} UTC|never seen)$/` and
  contains no `started`, no `pid` (the host-name rule is covered by the full-text regex). The
  container is the widget text's parent `div[aria-live="polite"]`.
- Geometry: the widget area's bottom is within 1px of the aside's bottom minus its computed
  `padding-bottom`, and fully inside the viewport.
- Click the first project link: widget still at the bottom of the aside (same geometry).
- 375x667: the widget's `top` is greater than the project strip's (`Projects` navigation) `bottom`.
- 1920x1080 `/projects/log`: widget at the bottom of the aside and `waitForWorkerState`.
- Navigate (client, via the brand link and then `/hire` with `goto`) to `/` and `/hire`: no visible
  `Ready to build`, `Offline` or `Checking status...` (comment the hidden `Activity` trap).
- Delete `e2e/test_worker_status_widget.md`.

### 7. `e2e/landing_no_filters.spec.ts` (from `test_landing_no_filters.md`), delete the journey

A local `expectReport(page)` (used by both loads in this spec) asserts:

- level-1 `Daily log` followed by the paragraph
  `What my AI developer workflow shipped each day, and what it cost.`;
- no `Times are UTC` text; no `published metrics` text outside the day cards (`main` minus
  `article`s: `page.locator("main p", { hasText: "published metrics" })` filtered to not inside an
  `article`);
- at least one past day card below the today card, holding a per-project table whose `Project`
  column cells contain no links; if the window has no past card, `test.skip(true, "no past day in
the 30-day window")` for that check;
- the window line ends with `all projects` and contains `30 days`;
- no `combobox`, no `button` named `Apply`, no `form` in `main`.

Tests: `/projects/log`; `/projects/log?days=7&project=x` (same report, no error panel, no
`No public project named` text); `expectNotFound` for `/summary?days=7` and `/watch`, each also with
no level-1 `Daily log`. Delete `e2e/test_landing_no_filters.md`.

### 8. `e2e/landing_today_refresh.spec.ts` (from `test_landing_today_refresh.md`), delete the journey

- `/projects/log`: level-1 `Daily log`, then an `article` whose level-2 heading starts `Today,` and
  holds a `Refresh` button, then past day cards or `No finished runs in the previous 30 days.`.
  When the window line is present, it ends `all projects` and today's `time[dateTime]` equals the
  window end's `dateTime` plus one UTC day (compute in the spec from the two attributes, never from
  the test clock).
- `servedHtml(request, "/projects/log")` contains `Today,` and `Refresh`.
- Note the first past day card's heading text. Start recording with `page.on("request")` before the
  click; read the app origin from `new URL(page.url()).origin` and the Supabase origin from the
  first `/rest/v1/` request URL. Click `Refresh`, expect the button to read `Refreshing...` or to be
  `aria-busy` at some point is not required; wait until it is named `Refresh` and enabled again.
- Then assert over the recorded requests: zero requests to the app origin (no document, no `_rsc`,
  no `POST`); exactly one `GET` each to `/rest/v1/daily_summary`, `/rest/v1/daily_model_summary`,
  `/rest/v1/daily_phase_summary` with `day=eq.<today>` in the query; at most one `GET` to
  `/rest/v1/projects`; every other Supabase REST request is a `GET` to `/rest/v1/workers` (the
  widget's independent 30 s poll, not caused by the click; comment why it is tolerated) and nothing
  else. WebSocket frames are not requests and are ignored. Never `page.route` here: the claim is
  which requests are made, so no Supabase response is mocked.
- URL still exactly `/projects/log`, button named `Refresh`, no `Refresh failed` text, the first past
  day heading unchanged.
- Delete `e2e/test_landing_today_refresh.md`.

### 9. `e2e/day_card_charts.spec.ts` (from `test_day_card_charts.md`), delete the journey

Select "the first day card with runs" as the first `article` on `/projects/log` that contains the
three figures (today when it has runs, else the first past card). If no card has runs,
`test.skip(true, "no day with runs in the window")`. Split into tests so a skip stays narrow:

- Captions: three `figure`s directly below the header, `figcaption`s `What I worked on` /
  `Runs finished that day`, `Tokens by model` / `All tokens, including cache reads`,
  `What each step cost` / `What each pipeline step cost that day`; same `top` at 1920x1080; no
  `[aria-hidden="true"]` in any `figcaption`; title and subtitle `left` equal.
- Class order: `li` `aria-label`s start `feature`, `chore`, `bug` (zeros included), optional `patch`
  then `other`; counts sum to the header's `N runs`.
- Chore-only day (its own test): find a card whose class figure has `feature: 0 runs` and
  `bug: 0 runs`; if none, `test.skip(true, "no chore-only day in the 30-day window")`; else labels
  exactly `feature`, `chore`, `bug` and the zero columns show `0` in
  `[data-value-placement="above"]`.
- Models: labels a subsequence of `Haiku`, `Sonnet`, `Opus` then any other, or the text
  `No per-model usage published.`. Phases: subsequence of `Plan`, `Build`, `Test`, `Review`, `Docs`,
  never `CI` or `Document`, values match `^(\$\d+\.\d{2}|<\$0\.01)$`, or
  `No per-phase usage published.`.
- A local `checkPlacement(page, card)` evaluate (reused at each viewport and scheme): model and
  phase bars neutral gray; each `li` has exactly one `[data-value-placement="above"]` with
  `font-weight` 400; model/phase transform matrix `a ≈ 0.7071`, `b ≈ -0.7071` within 0.01; class
  value transform `none`, centred within 1px over its bar; value not inside the bar (inline
  `height`); value box inside the figure's content box (0.5px); value `top >=` figcaption
  `bottom`; no `[data-value-placement="inside"]`. Run on today's card and one past card. Write the
  matrix check with plain ASCII in code (`about 0.7071`).
- A local `checkBars(page, card)`: per figure with two or more columns, equal bar widths and equal
  centre spacing within 1px, widths at most 28px (0.5px); `Docs` name row height equals `Plan`'s
  within 0.5px when `Docs` is present.
- Tooltips: hover a model column, expect `Model`, `Input`, `Cache read`, `Cache write`, `Output`,
  `Cost` with `$`; hover and then keyboard-focus a phase column (`focus()` or Tab), expect `Input`,
  `Cache read`, `Cache write`, `Output`, `Time`, `Runs`; hover a class column, expect `Runs` and
  `Share` with `%`. Skip a sub-check with `test.skip` only when that figure has no column.
- Labels: class name rows have one `[aria-hidden="true"]` dot, not gray for `feature` and `bug`;
  model and phase name rows have none; no `img`/`svg` in name rows; `scrollWidth <= clientWidth`;
  name rows' transform `none`.
- Colours: a completed or failed count on the card header has a non-gray `color`; the banner's
  `Work with me` link has a non-gray `background-color`.
- The per-project table holds an `svg` whose `aria-label` starts `Issue classes:`.
- `servedHtml(request, "/projects/log")` contains the three captions.
- Dark scheme: `page.emulateMedia({ colorScheme: "dark" })`, rerun `checkPlacement` and the gray
  bar check.
- 1024x768: same `top` for the three figures, `expectNoHorizontalScroll`, the `What each step cost`
  `ul`, `li`s and name rows inside the figure's content box, name rows not overlapping,
  `checkBars`, `checkPlacement`.
- 375x812: figures stacked (each `top >=` previous `bottom`), `expectNoHorizontalScroll`, the same
  containment and no-overlap, `checkBars`, `checkPlacement`, the `Docs` one-line check.
- Delete `e2e/test_day_card_charts.md`.

### 10. Update `app_docs/summary.md`

- Replace `` `e2e/test_connection_indicator_scope.md` and `e2e/test_landing_no_filters.md` `` with
  `` `e2e/connection_indicator_scope.spec.ts` and `e2e/landing_no_filters.spec.ts` `` on line 202,
  keeping "assert the `h1` text, so change them together".
- `grep -rn "e2e/test_" app_docs docs README.md` must print nothing for the eight journeys (other
  journeys still listed are the sibling issues' and stay).

### 11. Run the specs and the negative probes

- `set -a; . ./.ports.env; set +a` (PORT is 9200 here). The `/prepare_app` server on that port is
  adopted by `reuseExistingServer`; never set `CI=1`, never touch a server on another port.
- `PORT=$PORT yarn test:e2e --list`: the eight new specs appear.
- `PORT=$PORT yarn test:e2e`, then `PORT=$PORT yarn test:e2e --repeat-each=2`. A real defect
  exposed by a spec is reported and the run stops; never weaken an assertion or edit app code.
- Probes, each reverted with `git checkout -- <file>` right after (never in the diff):
  1. Change the `Daily log` `h1` in `src/app/(dashboard)/projects/log/page.tsx`:
     `landing_no_filters.spec.ts` and `connection_indicator_scope.spec.ts` fail.
  2. `aria-current={undefined}` always in `src/components/SidebarEntryLink.tsx`:
     `daily_log_sidebar.spec.ts` and `changelog.spec.ts` fail.
  3. Change `Ready to build` (and `Offline` if the worker is offline) in
     `src/components/WorkerStatus.tsx`: `worker_status_widget.spec.ts` fails.
  4. Make Refresh call `router.refresh()` in `src/components/TodaySummary.tsx`:
     `landing_today_refresh.spec.ts` fails.
     Run each probe as `PORT=$PORT yarn test:e2e <spec>`, then rerun after restoring and see it pass.
     `git status --porcelain` afterwards shows only the intended files.

### 12. Commit

- One `test:` (or `chore:`) commit per journey conversion is fine, or one commit; each converted
  `.md` is deleted in the same commit as its spec. Conventional message, no trailers, hooks on.
- Never stage `.env*`, `next-env.d.ts`, `.ports.env`, `agents/`, `trees/`, `test-results/`,
  `playwright-report/`, `specs/` beyond this plan.

### 13. Run the Validation Commands

Run every command below; all must pass.

## Test Coverage

The change is the tests. Eight Playwright specs in the E2E code suite (`e2e/*.spec.ts`, run last by
the test phase as `PORT=<run port> yarn test:e2e`) replace the opt-in journeys, so these claims
become regression checks that run on every test phase and in CI, which nothing does now:

- `daily_log_sidebar.spec.ts`: the sidebar order and the `Daily log` current marking (catches probe 2).
- `changelog.spec.ts`: the `Changelog` entry, the index order and the stats strip (catches probe 2).
- `connection_indicator_scope.spec.ts`: the pill only on dashboard routes, `live` after a round trip
  (catches probe 1).
- `sticky_header.spec.ts`: the pinned, opaque header, tooltip layering, sticky sidebar, scroll
  restoration.
- `worker_status_widget.spec.ts`: the widget's served state, its live state and placement (catches
  probe 3).
- `landing_no_filters.spec.ts`: no filters, ignored params, not-found for old addresses (catches
  probe 1).
- `landing_today_refresh.spec.ts`: Refresh makes only today's Supabase reads (catches probe 4).
- `day_card_charts.spec.ts`: the three chart cards' order, placement and layout at three widths.

The doc edit to `app_docs/summary.md` needs no test: it is a rule's wording.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

- `yarn format:check`: Prettier on the new specs and the doc.
- `yarn lint`: ESLint over `e2e/**` (including react-hooks rules on fixture callbacks).
- `yarn typecheck`: the specs and the extended fixtures type-check.
- `yarn knip`: every new fixture export is used; no dead helper.
- `yarn test`: the unit layer is untouched and still green.
- `yarn build`: the app still builds (and CI runs the suite against `yarn start` after it).
- `set -a; . ./.ports.env; set +a; PORT=$PORT yarn test:e2e --list`: the eight new specs are
  collected (and no `.md`).
- `PORT=$PORT yarn test:e2e`: the whole suite passes against the run's server.
- `PORT=$PORT yarn test:e2e --repeat-each=2`: no flake.
- `ls e2e/test_daily_log_sidebar.md e2e/test_changelog.md e2e/test_connection_indicator_scope.md e2e/test_sticky_header.md e2e/test_worker_status_widget.md e2e/test_landing_no_filters.md e2e/test_landing_today_refresh.md e2e/test_day_card_charts.md 2>&1 | grep -c "No such file"`: prints 8.
- `grep -rnE "e2e/test_(daily_log_sidebar|changelog|connection_indicator_scope|sticky_header|worker_status_widget|landing_no_filters|landing_today_refresh|day_card_charts)" app_docs docs README.md`: prints nothing.
- `grep -rnP "\x{2014}" e2e app_docs/summary.md`: prints nothing (no em-dashes).
- `git status --porcelain`: only the eight specs, `e2e/fixtures.ts`, the eight deletions,
  `app_docs/summary.md` and this plan.

## Notes

- `.adw/project.md` names no journey or spec file after #228 and must not be edited.
- `getByText` and CSS locators include elements inside a hidden `Activity`; `getByRole` and
  `toBeVisible`/`filter({ visible: true })` do not. Every "absent after a client navigation" check
  must use the latter.
- PostHog is not initialised under `navigator.webdriver`, so Refresh's `posthog.capture` sends
  nothing; if a PostHog request ever shows up after the click, that is a finding, not something to
  filter out.
- The worker widget polls `workers` every 30 s independently of Refresh; it is the one Supabase
  REST read tolerated in the Refresh window, and only as a `GET` to `/rest/v1/workers`.
- The changelog's GitHub comparison is the spec's form of the journey's `gh api`: an unauthenticated
  (or `GITHUB_TOKEN`) GET of a public endpoint, skipped with a reason when rate-limited. If the
  numbers disagree (for example a comment added after the entry was written), report it as a
  content finding; do not loosen the comparison.
- The changelog entry count (10) comes from repository content, not live data, so `>= 10` is not a
  hard-coded live count.
- The profile marks `adw_plan_build_test_iso` as the right workflow: nothing a reviewer would
  screenshot changes.
