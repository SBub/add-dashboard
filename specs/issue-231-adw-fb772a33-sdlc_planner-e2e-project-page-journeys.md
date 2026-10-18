# Chore: E2E specs: project page Active, Queue and History sections

## Metadata

issue_number: `231`
adw_id: `fb772a33`
issue_json: `{"number":231,"title":"E2E specs: project page Active, Queue and History sections"}`

## Chore Description

Convert the eight agent-driven journeys about `/projects` and a project page (Building now / Active,
Up next / Queue, Shipped / History, section tooltips, skeleton fallbacks) into Playwright specs under
`e2e/`, and delete each `.md` in the same commit. The specs read live data from the hosted database
through the app, so they walk the sidebar's projects until one has what a check needs; that search
lives in one shared helper, `findProjectWith`, in `e2e/fixtures.ts`. When no project matches, the
data-dependent test calls `test.skip(true, "<reason>")` so the report shows it as skipped, never as a
silent pass; checks that do not depend on data (headings, empty-state panels) still run.

Conversion rules (same as #228): one spec per journey at `e2e/<name>.spec.ts` with `test_` dropped;
every `**Verify**` step and every Success Criterion becomes an assertion; screenshot steps are
dropped (the review phase owns screenshots); role and label locators first, `page.evaluate` only for
computed style, geometry, selection and `elementFromPoint`; every trap a journey warns about is
encoded (the pill reads `connecting` before `live`; a client navigation leaves the previous route in
the DOM inside a hidden `Activity` under `cacheComponents`, so role locators, which skip hidden
subtrees, are used for presence and absence, and the History row geometry is read only from visible
elements).

Journeys in scope (all exist under `e2e/` now): `test_active_runs_shared_entry.md`,
`test_history_card_fields.md`, `test_history_page_turn.md`, `test_queue_row_single_line.md`,
`test_row_full_title_top_align.md`, `test_run_row_phase_label.md`,
`test_section_tooltip_layering.md`, `test_projects_skeleton_fallbacks.md`. The other `.md` journeys
(#229, #230) are out of scope and stay.

## Relevant Files

Use these files to resolve the chore:

- `AGENTS.md` - repository rules: Yarn only, no em-dashes, Conventional commits with no trailers,
  lefthook not bypassed.
- `.adw/project.md` - Tests section: the E2E code suite contract (`PORT=<run port> yarn test:e2e`,
  `reuseExistingServer`, never `CI=1`, specs import from `e2e/fixtures.ts`, never write). Do not edit.
- `docs/conditional-docs.md` - index; matching docs below.
- `app_docs/project-page.md` - the Active, Queue and History sections, paging (`?after=`/`?before=`),
  the `N of M` indicator.
- `app_docs/screens-and-components.md` - row layout, phase label, History card fields, branch and PR
  links, section heading tooltip and its layer.
- `app_docs/active-runs.md` - the shared Active entry behind `/projects`, the sidebar counts and a
  project page's Active section.
- `app_docs/error-and-loading-boundaries.md` - skeleton fallbacks and their labels.
- `app_docs/realtime.md` - the connection pill (`connecting` then `live`).
- `e2e/fixtures.ts` - shared `test`, `expect`, the `/hire` POST guard, `waitForLive`,
  `openFirstProject`; gains `findProjectWith` (and any helper used by two or more specs).
- `playwright.config.ts` - chromium only, 1920x1080, `testMatch: "**/*.spec.ts"`, `retries: 0`.
- `e2e/header_section_active.spec.ts`, `e2e/home_page.spec.ts` - style to model on (imports from
  `./fixtures`, `test.describe`, short comments, `boundingBox` geometry with a thrown error on null).
- `knip.json` - scans `e2e/**/*.ts`: every export added to `fixtures.ts` must be used by a spec.
- `src/components/RunRow.tsx` - Active and History rows: the `#<n>` link, the title `span`
  (`flex-1 basis-40 wrap-break-word leading-6`), the `adw_id` `code`, `StatusBadge` only on Active,
  `dl` with `Phase`/`Branch`/`Started` (Active, truncated `dd`s) or `Branch` (wrap, `select-all`
  `code` plus `aria-label="Open branch <b> on GitHub"` link)/`Finished`/`Duration`/`PR`/`Cost`.
- `src/components/QueueRow.tsx` - queue `li`: the `aria-hidden` rail span, the `next`/ordinal
  marker, the `#<n>` link, title `span`, `queued` pill.
- `src/components/QueueView.tsx` - `Nothing queued.` panel, the `ol`.
- `src/components/ActiveRunsView.tsx`, `src/components/ActiveRunsOverview.tsx`,
  `src/app/(dashboard)/projects/page.tsx` - `Building now` sections, `No runs in progress.`, one
  overview `section` per project headed by a level-3 heading link.
- `src/components/ProjectNav.tsx` - `nav[aria-label="Projects"]`; each entry's counts render as
  `<n> <status>` spans with `title="<n> <status>"` (queued, running, completed, failed).
- `src/components/HistoryLinks.tsx`, `src/components/HistoryPageLink.tsx` -
  `nav[aria-label="History pages"]`, the `Newer runs`/`Older runs` links, the `N of M` text.
- `src/components/HistoryTransition.tsx` - `HistoryResults` wrapper with `aria-busy={isPending}`.
- `src/components/SectionHeading.tsx` - `About <title>` button, `section-<slug>-detail` tooltip
  (`role="tooltip"`), shown on group hover or focus-within, `TOOLTIP_LAYER`.
- `src/components/LoadingSkeletons.tsx` - `role="status"` `aria-busy="true"` skeletons labelled
  `Loading projects`, `Loading runs`, `Loading history`, `Loading queue`, `Loading active runs`,
  `Loading pages`, `Loading project`; blocks carry `motion-safe:animate-pulse`.
- `src/lib/run-phase.ts` - `phaseLabel` (probe 1 target).
- `src/app/(dashboard)/projects/[owner]/[repo]/page.tsx` - section order and boundaries.
- The eight journeys listed above - the source of every assertion.
- `node_modules/@playwright/test` docs (installed version) for `test.skip`, `page.route`,
  `newCDPSession`, `emulateMedia`.

### New Files

- `e2e/active_runs_shared_entry.spec.ts`
- `e2e/history_card_fields.spec.ts`
- `e2e/history_page_turn.spec.ts`
- `e2e/queue_row_single_line.spec.ts`
- `e2e/row_full_title_top_align.spec.ts`
- `e2e/run_row_phase_label.spec.ts`
- `e2e/section_tooltip_layering.spec.ts`
- `e2e/projects_skeleton_fallbacks.spec.ts`

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. Read before writing

- Read the eight journeys in full, `e2e/fixtures.ts`, `playwright.config.ts`, the two model specs and
  the matching `app_docs/` above.
- Source `.ports.env` for `PORT` (fall back to 3000 only when absent). The `/prepare_app` server must
  already be up on that port; never start a second one, never touch a server on another port, never
  set `CI=1`.

### 2. Extend `e2e/fixtures.ts` with the shared helpers

Keep the existing exports unchanged. Add, each with a short comment in the file's style:

- `projectHrefs(page: Page): Promise<string[]>`: `page.goto("/projects")`, `waitForLive(page)`, then
  read every `href` of `getByRole("navigation", { name: "Projects" }).getByRole("link")`; assert each
  matches `/^\/projects\/[^/]+\/[^/]+$/` and that there is at least one. Only export it if two or more
  specs use it directly; otherwise keep it module-private.
- `findProjectWith(page, predicate: (page: Page) => Promise<boolean>, options?: { prefer?: string })`:
  `Promise<string | null>`. Walks the sidebar's projects in order (a `prefer` href first when the
  sidebar lists it, used for `SBub/adw-dashboard` in the page-turn spec), opening each with
  `page.goto(href)` (a full load, so no hidden `Activity` copy of the previous project lingers), waits
  for the `Building now`, `Up next` and `Shipped` level-2 headings and for no visible
  `aria-busy="true"` skeleton in the main pane, then calls `predicate(page)`. Returns the first href
  for which it is true, leaving the page on it, or `null`. The single place the walk exists; no spec
  copies it.
- An escape hatch for negative probe 5: when `process.env.E2E_FIND_NONE === "1"`, `findProjectWith`
  returns `null` without walking. One line plus a comment saying it exists so the skip path can be
  proven; it is not a test-data switch.
- `requireProject(page, predicate, reason, options?)`: calls `findProjectWith` and, on `null`, calls
  `test.skip(true, reason)` (which throws and ends the test as skipped); returns the href otherwise.
  Every data-dependent test uses this, so a skip always carries a reason.
- Section locators used by several specs, for example
  `section(page, title: "Building now" | "Up next" | "Shipped"): Locator` =
  `page.getByRole("main").locator("section").filter({ has: page.getByRole("heading", { level: 2, name: title, exact: true }) })`
  (sections have no accessible name, so the heading is the handle). Plus small predicates reused by
  two or more specs: `hasHistoryRow`, `hasQueuedItem`, `hasActiveRow` (each counts visible `li`
  under the section's list).
- Export only what at least one spec imports (knip).

### 3. `e2e/run_row_phase_label.spec.ts` (from `test_run_row_phase_label.md`)

- Test "the overview shows phase labels, not step keys": `/projects`, `waitForLive`, `Building now`
  heading visible. For every `dd` after a `dt` with text `Phase` in the main pane's Active lists
  (`page.evaluate` over `main li dl`): text does not start with `adw_`, contains no `code`. If there
  is no Active row anywhere, `test.skip(true, "no active run on /projects")` after the heading check.
- Test "History rows show no phase": `requireProject(page, hasHistoryRow, "no project has a History row")`;
  every History `li`'s `dt` texts contain neither `Phase` nor `Final phase`.
- Test "a project page's Active rows show a label with the raw key as title":
  `requireProject(page, hasActiveRow, "no project has an active run")`; every Active `Phase` value
  does not start with `adw_`, has no `code`, and its inner `span` has a non-empty `title` (the raw
  step key, which differs from the shown text whenever the key is known; assert `title` is non-empty
  and the shown text is not equal to it when the title starts with `adw_`).

### 4. `e2e/queue_row_single_line.spec.ts` (from `test_queue_row_single_line.md`)

- Test "Up next shows the queue or the empty panel" (always runs): open the first project
  (`openFirstProject`), `Up next` heading visible; either the `ol` has items or `Nothing queued.` is
  visible.
- Test "queue rows are single, marked rows": `requireProject(page, hasQueuedItem, "no project has a queued item")`.
  First `li` holds the marker `next`; second and third, when present, `2` and `3`. Every `li` contains
  text `/#\d+/` and a `queued` pill (exact, case-sensitive); none contains `label:`, `waiting`,
  `starts `, `manual`, `Removing the label` or case-sensitive `Queued`
  (`not.toContainText(/Queued/)` with a case-sensitive regex). Geometry via `page.evaluate` on the
  first row: pill top within 2px of the title span top (or of the `#<n>` link top when no title); pill
  right within 2px of the card's content right edge (card rect right minus computed
  `borderRightWidth` and `paddingRight`).

### 5. `e2e/row_full_title_top_align.spec.ts` (from `test_row_full_title_top_align.md`)

- Constant `T` built exactly as the journey says, `expect(T).toHaveLength(120)`.
- Test "headings are present" (always runs): `openFirstProject`, the three level-2 headings visible.
- Test "History rows show a 120-character title in full":
  `requireProject(page, hasHistoryRow, "no project has a History row")`. In the first History `li`
  with a title span (the `span` right after the `#<n>` link in the row's first flex group), set
  `textContent = T` (DOM only). At 1920x1080 assert: `textOverflow` not `ellipsis`, `whiteSpace` not
  `nowrap`, `scrollWidth <= clientWidth`, length 120, no `title` attribute, `toHaveText(T)` on the
  span (proves no cut), no element in the `li` with text `completed`, and when the `adw_id` `code` is on
  the first line, `|adwIdTop - spanTop| <= 2` (compare span box, not glyph rect, as the journey warns).
  Detail grid: History `Finished` `dd` `textOverflow` is `ellipsis`; History `Branch` `dd` is not
  `ellipsis`, not `nowrap`, and its `code` does not end in `...`. Resize to 375x667: line boxes (a
  `Range` over the text node, rects deduplicated by rounded `top`) more than at 1920 or at least 3,
  still no ellipsis and no overflow, still no `completed`. If no History row has a title,
  `test.skip(true, "no History row has a title")`.
- Test "Active rows ...": `requireProject(page, hasActiveRow, "no project has an active run")`; same
  title checks; `|pillTop - firstLineTop| <= 2` and `|pillTop - spanTop| <= 2` at 1920x1080; the
  `Branch` `dd` keeps `textOverflow: ellipsis`; at 375x667 the pill is still within 2px of the first
  line top.
- Test "Queue rows ...": `requireProject(page, hasQueuedItem, "no project has a queued item")`; same
  title checks, pill and marker tops within 2px of the first line top at 1920x1080 and at 375x667;
  with two or more rows, the first `li`'s `aria-hidden` rail span bottom >= the second marker's
  vertical centre.
- Comment: probe 2 (`truncate` on a title) must fail these.

### 6. `e2e/history_card_fields.spec.ts` (from `test_history_card_fields.md`)

- `requireProject(page, hasHistoryRow, "no project has a History row")` in each data test; viewport
  1280x800 via `page.setViewportSize`.
- Test "the first card shows exactly its fields": `dt` texts equal `["Branch","Finished","Duration"]`
  optionally followed by `"PR"` then `"Cost"` (assert by matching against
  `/^Branch,Finished,Duration(,PR)?(,Cost)?$/` on the joined list); no `completed` text, no
  `Final phase`, no `Started`; branch `code` text does not end in `...`, `userSelect` is `all`; the
  `dd`'s `textOverflow` not `ellipsis`, `whiteSpace` not `nowrap`, no overflow; the branch link
  (`getByRole("link", { name: "Open branch <b> on GitHub" })`) has `href`
  `https://github.com/<owner>/<repo>/tree/<branch>` (owner/repo from the project href),
  `target="_blank"`, `rel="noreferrer"`; field `dd` tops within 2px of each other.
- Test "a PR field links to the pull request": search the first card, then page with `Older runs`
  (click and wait for the `N of M` text to change) until a card with a `PR` `dt` exists; if none in
  any page, `test.skip(true, "no run in this project has a pull request")`. Link text `/^#\d+$/`,
  `href` `https://github.com/<owner>/<repo>/pull/<n>`, `target` `_blank`, `rel` `noreferrer`.
  (Search other projects through `findProjectWith` with a predicate that pages History.)
- Test "a Cost field is formatted": same search for a `Cost` `dt`; value matches
  `/^(\$\d+\.\d{2}|<\$0\.01)$/`; skip with reason when none.
- Test "one click and a triple click select exactly the branch": `locator.click()` on the `code`,
  `window.getSelection().toString()` equals the branch; `removeAllRanges`, `click({ clickCount: 3 })`,
  equals again.
- Test "a long branch wraps without overflow": set the branch `code`'s `textContent` to
  `'chore/issue-999-adw-deadbeef-'.padEnd(120, 'x')` (assert length 120); `li` and `dd` have no
  horizontal overflow at 1280x800; resize to 375x667: present field `dd` tops strictly increase, the
  branch wraps (a `Range` over the text node has rects at more than one rounded `top`), no overflow on
  `dd` or `li`.
- Test "the Active row keeps Phase, Branch, Started and its pill": when the found project has an
  Active row (else `test.skip(true, "no active run in this project")`), its first row's `dt`s are
  `Phase`, `Branch`, `Started` and it holds `running` or `failed`.

### 7. `e2e/history_page_turn.spec.ts` (from `test_history_page_turn.md`)

- Predicate: the `History pages` nav exists and its text matches `/^\s*1 of (\d+)/` with N > 1.
  `requireProject(page, hasTwoHistoryPages, "no project has more than one History page", { prefer: "/projects/SBub/adw-dashboard" })`.
- Viewport 1280x720. Scroll the `Shipped` `h2` to the top (`scrollIntoView({ block: "start" })`),
  record `scrollY` (assert > 0), the first History `li` text and the `Older runs` `href`.
- `page.route("**/*", ...)`: requests with an `rsc` header or `_rsc` search param wait 1500 ms then
  `route.continue()`; every other request `route.fallback()` at once (so the fixture's `/hire` guard
  still runs). Unroute in a `finally` / `afterEach`.
- Click `Older runs`; immediately `expect(wrapper).toHaveAttribute("aria-busy", "true")` where the
  wrapper is the History list's closest `[aria-busy]` ancestor (locate as
  `section(page, "Shipped").locator("div[aria-busy]")`, not a skeleton `role=status`). Then wait for
  `2 of N`; assert URL equals the recorded `href` resolved against `baseURL` and contains `?after=`,
  first row text differs, `scrollY` within 1px, `aria-busy="false"`.
- Record `Newer runs` `href`, click; `aria-busy="true"` within the delay; wait for `1 of N`; URL
  equals that `href`, has no `after=` and no `before=`; first row text equals the original; `scrollY`
  within 1px.
- Each present arrow is a link (`getByRole("link", { name: "Newer runs" | "Older runs" })`) with a
  non-empty `href` (`a` element, so middle-click works).
- Comment: probe 3 (removing `aria-busy={isPending}`) must fail this.

### 8. `e2e/active_runs_shared_entry.spec.ts` (from `test_active_runs_shared_entry.md`)

- Helper (local) `sidebarCounts(page, href)`: from the `Projects` nav link with that `href`, read the
  `title` of its count spans `/^(\d+) running$/` and `/^(\d+) failed$/`.
- Test "the overview has a Building now heading": `/projects`, `waitForLive`, level-2 `Building now`
  in main; then either `No runs in progress.` or at least one overview group.
- Test "an empty overview means zero counts everywhere": when `No runs in progress.` is visible,
  every sidebar project shows `0 running` and `0 failed`; otherwise
  `test.skip(true, "the overview has active runs")`.
- Test "counts and the project page agree with the overview": skip with
  `"no active run on /projects"` when the overview is empty. For the first group: project name
  (level-3 heading link text), `href`, every row's `adw_id` (`code` in each `li`, in order), counts of
  `running` and `failed` pills. The sidebar entry for that `href` shows the same two numbers; every
  sidebar project with no overview group shows `0 running` and `0 failed`. Then for every group, the
  sidebar numbers equal that group's pill counts (Success Criterion "for every project"). Click the
  group's heading link; URL is the `href`, the level-1 heading is the project name, `waitForLive`;
  the project page's `Building now` section lists exactly the noted `adw_id`s in order (read only
  visible rows: after this client navigation `/projects` sits in a hidden `Activity`, so scope to
  `section(page, "Building now")` and role/visible locators); the sidebar numbers are unchanged.
- This is the only spec whose search is the overview, not the sidebar walk, so it does not need
  `findProjectWith`.

### 9. `e2e/section_tooltip_layering.spec.ts` (from `test_section_tooltip_layering.md`)

- Local helper `assertTopmost(page, detailId)`: in `page.evaluate`, take the first child of
  `#<detailId>`'s rect; `document.elementFromPoint` at its centre is inside the tooltip; if the
  Queue's `next` marker rect intersects it, the same at the intersection's centre.
- For each of `Up next` (`section-up-next-detail`), `Building now` (`section-building-now-detail`),
  `Shipped` (`section-shipped-detail`): hover `About <title>`, `expect(tooltip).toBeVisible()`,
  `assertTopmost`; move the mouse to (0, 0), focus the button (`button.focus()` then also assert it
  opens on keyboard by tabbing to it: `page.keyboard.press("Tab")` until
  `toBeFocused()`, bounded loop), visible, `assertTopmost`.
- Test "tooltips sit above the queue rail": `requireProject(page, hasQueuedItem, "no project has a queued item")`,
  then the three tooltips; also assert the `next` marker exists so the overlap check is meaningful.
- Test "tooltips open on hover and focus" (always runs): `openFirstProject`, the three tooltips
  without the queue requirement, so the Building now and Shipped checks run even with no queue.

### 10. `e2e/projects_skeleton_fallbacks.spec.ts` (from `test_projects_skeleton_fallbacks.md`)

- `test.skip(({ browserName }) => browserName !== "chromium", "CDP is Chromium only")` at describe
  level (issue step 3).
- Test "the streamed document holds skeletons, not Loading text": `openFirstProject`-style href via
  the sidebar (`/projects`, `waitForLive`, first link `href`), `page.request.get(href)` (or
  `page.evaluate(fetch)`), full text contains `aria-busy="true"`, `aria-label="Loading runs"`,
  `aria-label="Loading queue"`, and `aria-label="Loading history"` or `aria-label="Loading pages"`;
  none of `Loading runs...`, `Loading queue...`, `Loading history...`, `Loading project...`, nor the
  plain `Loading...`; contains `Building now`, `Up next`, `Shipped`.
- Test "a skeleton shows under a slow network and the page does not jump":
  `newCDPSession(page)`, `Network.enable`, `Network.emulateNetworkConditions` with latency 2000,
  throughput 50000 each; `page.addInitScript` the `layout-shift` `PerformanceObserver` summing
  `window.__cls`. `page.goto(href, { waitUntil: "commit" })`; expect at least one
  `[aria-busy="true"]` (role `status` with a `Loading ` accessible name) to be visible; then wait up to
  60 s (`expect.poll` / `toHaveCount(0)` on `main [aria-busy="true"]`) and for either a `code` with an
  `adw_id` or `No completed runs yet.`; `window.__cls < 0.1`. Resize to 375x667, reload with
  `waitUntil: "commit"`, a busy skeleton is visible. Restore throttling (latency 0, throughput -1)
  in a `finally`. Give the test `test.setTimeout(120_000)`.
- Test "skeleton blocks stand still under reduced motion": parse the document text with `DOMParser`
  in the page, clone the first element whose class list contains `motion-safe:animate-pulse` into
  `document.body`; `page.emulateMedia({ reducedMotion: "reduce" })` gives `animationName` `none`;
  `"no-preference"` gives not `none`; remove the clone.
- Comment: probe 4 (a skeleton replaced by `Loading...`) must fail this.

### 11. Delete the eight journeys

- `git rm e2e/test_active_runs_shared_entry.md e2e/test_history_card_fields.md e2e/test_history_page_turn.md e2e/test_queue_row_single_line.md e2e/test_row_full_title_top_align.md e2e/test_run_row_phase_label.md e2e/test_section_tooltip_layering.md e2e/test_projects_skeleton_fallbacks.md`
  in the same commit as the specs.

### 12. Run the suite and the negative probes

- `yarn test:e2e --list` lists the eight new spec files.
- `PORT=$PORT yarn test:e2e`, then `PORT=$PORT yarn test:e2e --repeat-each=2`; both pass. Record, per
  spec, which tests were skipped and their reasons (from the list reporter or
  `--reporter=list`); this list goes in the pull request body.
- Probes, each run against the dev server (hot reload), each reverted with `git checkout -- <file>`
  right after, never committed:
  1. `phaseLabel` returns `phase` raw: `run_row_phase_label.spec.ts` fails (needs an active run; if
     none exists, say so and rely on probe 2).
  2. Add `truncate` to the title `span` in `QueueRow.tsx` or `RunRow.tsx`:
     `row_full_title_top_align.spec.ts` fails.
  3. Remove `aria-busy={isPending}` from `HistoryTransition.tsx`: `history_page_turn.spec.ts` fails
     (needs two History pages; otherwise say so).
  4. Replace a skeleton's content in `LoadingSkeletons.tsx` with the text `Loading...`:
     `projects_skeleton_fallbacks.spec.ts` fails.
  5. `E2E_FIND_NONE=1 PORT=$PORT yarn test:e2e`: the data-dependent tests appear as skipped with
     their reasons, not passed.
     Re-run each affected spec after restoring: passes. `git status --porcelain` shows only the intended
     files.
- If a spec exposes a real defect in the app, stop and report it; do not weaken the assertion and do
  not change application code.

### 13. Run the Validation Commands

- Run every command below; all pass.

## Test Coverage

The change is the tests themselves, in the E2E code suite layer (`e2e/*.spec.ts`, run by the test
phase as `yarn test:e2e`), the only browser layer the profile lists:

- `run_row_phase_label.spec.ts`: catches a phase rendered as the raw `adw_` key or in `code`, a lost
  raw-key hover title, or a phase on History rows.
- `queue_row_single_line.spec.ts`: catches a lost `next`/ordinal marker, a returned `label:` chip,
  wait or start hint, or a pill knocked off the title's first line or right edge.
- `row_full_title_top_align.spec.ts`: catches an ellipsized or overflowing title, a pill or marker off
  the first line, a broken queue rail, or lost truncation in the detail grid.
- `history_card_fields.spec.ts`: catches a changed History field set, a truncated or non-`select-all`
  branch, wrong branch, PR or Cost links/format, and broken one-row/stacked layout.
- `history_page_turn.spec.ts`: catches a lost `aria-busy` while pending, a scroll jump on page turn,
  wrong URL, or arrows that are not real links.
- `active_runs_shared_entry.spec.ts`: catches the sidebar counts, the overview and a project page's
  Active section disagreeing.
- `section_tooltip_layering.spec.ts`: catches a tooltip that does not open on hover or focus, or is
  painted over by the queue rail markers.
- `projects_skeleton_fallbacks.spec.ts`: catches a fallback that is text or nothing, layout shift
  > = 0.1 while streaming, or pulse animation under reduced motion.
  > Before this change none of these runs automatically: the `.md` journeys are agent-driven and opt-in.
  > The negative probes in step 12 prove each of the four named specs fails without the behaviour.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

- `yarn lint` - ESLint over the new specs and fixtures.
- `yarn typecheck` - the specs and the extended fixtures type-check (do not stage `next-env.d.ts`).
- `yarn knip` - no unused export in `e2e/fixtures.ts`, no unused file.
- `yarn format:check` - Prettier formatting of the new files.
- `yarn test` - unit layer unaffected.
- `yarn build` - the app still builds (needs `.env.local`).
- `yarn check:og` - the post metadata check after the build, part of the test phase order.
- `yarn test:e2e --list` - the eight new specs are collected (and no `.md`).
- `PORT=$PORT yarn test:e2e` - the whole suite passes against this run's server.
- `PORT=$PORT yarn test:e2e --repeat-each=2` - no order or state dependence, no flakes.
- `ls e2e | grep -E 'test_(active_runs_shared_entry|history_card_fields|history_page_turn|queue_row_single_line|row_full_title_top_align|run_row_phase_label|section_tooltip_layering|projects_skeleton_fallbacks)\.md'` - prints nothing.
- `ls e2e/*.md` - if #229 and #230 are merged, finds nothing; otherwise only their journeys remain.
- `grep -rnP "\x{2014}" e2e` - prints nothing (no em-dashes).
- `git status --porcelain` - only the eight specs, `e2e/fixtures.ts`, the eight deletions and this
  plan; no `.env*`, `next-env.d.ts`, `.ports.env`, `agents/`, `trees/`, `test-results/`,
  `playwright-report/`.

## Notes

- Never write to the hosted Supabase project; specs only read through the app. Never hard-code row
  counts, slugs (other than the `prefer` hint the journey names), titles or dates.
- `page.route` and DOM edits stay in the test browser. A spec's own `page.route` must call
  `route.fallback()` for requests it does not delay so the fixture's `/hire` guard still applies.
  Never submit the `/hire` form.
- Use `page.goto` inside `findProjectWith` (full loads) to avoid hidden `Activity` copies of the
  previous project; where a spec deliberately client-navigates (active runs shared entry), scope to
  the visible section and use role locators.
- The pill reads `connecting` before `live`; always go through `waitForLive` before judging data.
- `test.skip(true, reason)` inside a test body ends it as skipped with the reason in the report; put
  the data-independent assertions in separate tests so they still run.
- Do not edit `.adw/project.md`, `specs/` (other than this plan) or `adws/`; do not change application
  code; no new dependency.
- Commit as `chore: convert project page journeys to playwright specs` (Conventional, no trailers).
- The pull request body lists, per spec, the tests skipped for lack of data and their reasons, and
  the outcome of each negative probe.
