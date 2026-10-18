# Chore: E2E specs: header at every width, radio footer, page background, post minimap

## Metadata

issue_number: `229`
adw_id: `dd8a18ff`
issue_json: `{"number":229,"title":"E2E specs: header at every width, radio footer, page background, post minimap"}`

## Chore Description

Convert the four remaining agent-driven journeys about the page chrome on the public routes into
Playwright specs, and delete the journeys in the same commit:

| Journey (deleted)                     | Spec (new)                            |
| ------------------------------------- | ------------------------------------- |
| `e2e/test_header_mobile.md`           | `e2e/header_mobile.spec.ts`           |
| `e2e/test_radio_bar.md`               | `e2e/radio_bar.spec.ts`               |
| `e2e/test_single_background_color.md` | `e2e/single_background_color.spec.ts` |
| `e2e/test_post_minimap.md`            | `e2e/post_minimap.spec.ts`            |

#228 (merged, `c42da60`) already provides `@playwright/test` 1.64.0, `playwright.config.ts` (one
`chromium` project, `testMatch: "**/*.spec.ts"`, review viewport 1920x1080, `webServer` adopting the
run's server), `e2e/fixtures.ts` (`test`, `expect`, the auto `/hire` POST guard, `waitForLive`,
`openFirstProject`), the `test:e2e` script and the CI step. This chore adds a `webkit` project that
runs only `post_minimap.spec.ts`, adds `webkit` to the CI install line and to the one-time install
line in `README.md`, and commits a small silent audio fixture so the radio spec never depends on
NTS being up.

Conversion rules (same as #228): one spec per journey; every `**Verify**` step and every Success
Criterion becomes an assertion; screenshot-only steps and "N screenshots are taken" criteria are
dropped (the review phase owns screenshots); role and label locators first, `page.evaluate` (or
`locator.evaluate`) only for computed style and geometry; every trap a journey warns about is
encoded in the spec. No application code changes. If a spec exposes a real defect, stop and report
it; never weaken an assertion.

## Relevant Files

Use these files to resolve the chore:

- `README.md`: the `Running it` block's one-time line `yarn playwright install chromium` becomes
  `yarn playwright install chromium webkit` (comment: the browsers the E2E suite uses; WebKit only
  for the minimap spec).
- `AGENTS.md`: rules (Yarn only, no em-dashes, Conventional commits, no trailers, hooks not
  bypassed).
- `.adw/project.md`: read only. Do NOT edit it (the issue forbids it; it names no journey or spec
  files).
- `docs/conditional-docs.md`: index; the matching docs are listed below.
- `app_docs/radio.md`: the radio footer's rules (`--radio-bar-height`, the body's bottom padding,
  idle on load, the same `<audio>` across navigation, error text). Read before writing
  `radio_bar.spec.ts`.
- `app_docs/screens-and-components.md`: the page background, sticky header, floating Work with me
  button, layers. Read before `header_mobile.spec.ts` and `single_background_color.spec.ts`.
- `app_docs/writing.md`: the post page minimap. Read before `post_minimap.spec.ts`.
- `app_docs/hire.md`: the Work with me header button and its hiding on `/hire`.
- `playwright.config.ts`: gains the `webkit` project.
- `e2e/fixtures.ts`: `test`, `expect`, `waitForLive`, `openFirstProject`; extended only with
  helpers shared by two or more specs (see step 1).
- `e2e/hire_page.spec.ts`: the model for the floating-link geometry. Its 375px check measures
  `right` from `document.documentElement.getBoundingClientRect().width` and `bottom` from
  `document.documentElement.clientHeight`, not `innerWidth`/`innerHeight`, because
  `scrollbar-gutter: stable` keeps a 15px gutter on Linux Chromium (CI) and none on macOS. The new
  specs must measure the same way (this is the trap fixed by `cfec6e7`, `a72c583`).
- `e2e/home_page.spec.ts`, `e2e/writing.spec.ts`: house style for specs (import from
  `./fixtures`, `test.describe`, a top comment saying what the spec covers, `boundingBox` null
  checks that throw).
- `.github/workflows/ci.yml`: `yarn playwright install --with-deps chromium` becomes
  `yarn playwright install --with-deps chromium webkit`.
- `knip.json`: scans `e2e/**/*.ts`; any new export in `fixtures.ts` must be used by a spec.
- `lefthook.yml`, `.prettierignore`: Prettier runs on staged `ts` and `md`; the audio fixture is a
  binary and is not touched.
- `src/app/layout.tsx`: `body > header` (sticky, `py-3`), `main` (`max-sm:pb-20`), the body's
  `pb-[calc(var(--radio-bar-height)+env(safe-area-inset-bottom,0px))]`, the tagline `span` (`hidden
lg:inline`). Read only.
- `src/app/globals.css`: `--background`, `color-scheme: light dark`, `--header-height: 3.5625rem`
  (57px), `--radio-bar-height`, `scrollbar-gutter: stable`. Read only.
- `src/components/SectionNav.tsx`: `HireLink` (one link, `max-sm:fixed`, 1rem above the radio,
  `max-sm:min-h-11`, `max-sm:hidden` when current on `/hire`). Read only.
- `src/components/RadioBar.tsx`, `src/lib/radio.ts`: `role="region"` named `NTS Slow Focus
radio`, button names `Play NTS Slow Focus` / `Stop NTS Slow Focus`, `aria-pressed`,
  `aria-busy` while loading, the `aria-live="polite"` span, `RADIO_STREAM_URL`
  (`https://stream-mixtape-geo.ntslive.net/mixtape`), `RADIO_PAGE_URL`, `RADIO_ERROR_TEXT`
  (`Can't reach NTS right now`); `src` set only on play and removed on stop. Read only.
- `src/components/PostMinimap.tsx`, `src/components/PostMinimapViewport.tsx`: `[data-minimap]`
  (`aria-hidden`, `inert`, `hidden ... xl:block`), `[data-minimap-shape]`,
  `[data-minimap-frame]`. Read only (the negative check 4 edits it temporarily and restores it).
- `src/content/posts/`: `my-moat.mdx`, `feature-flags.mdx` (committed content, so these slugs may
  be named in specs; never live data).
- `node_modules/@playwright/test` docs / types for `route.fulfill`, `page.unroute`,
  `page.emulateMedia`, project-level `testMatch`.

### New Files

- `e2e/header_mobile.spec.ts`
- `e2e/radio_bar.spec.ts`
- `e2e/single_background_color.spec.ts`
- `e2e/post_minimap.spec.ts`
- `e2e/assets/silence.ogg` (or `.mp3`/`.wav`, see step 4): a small silent audio file committed for
  the radio spec. Not named `*.md`, not `*.ts` (knip and the TS project ignore it).

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. Read the docs and confirm the environment

- Read `app_docs/radio.md`, `app_docs/screens-and-components.md`, `app_docs/writing.md`,
  `app_docs/hire.md` and the four journeys before deleting them.
- Source `.ports.env` for `PORT` (fall back to 3000 only when absent). The `/prepare_app` server is
  adopted by `reuseExistingServer`; never set `CI=1`, never start or kill another server.
- `yarn playwright install webkit` once (browsers live in the user cache; this never changes
  `yarn.lock`).

### 2. Shared helpers in `e2e/fixtures.ts` (only what two or more specs use)

Add, each with a one-line comment in the file's style, and use each from at least two specs (knip):

- `scrollToBottom(page)`: `window.scrollTo(0, document.documentElement.scrollHeight)` then wait
  one animation frame (used by header_mobile, radio_bar, post_minimap).
- `expectNoHorizontalOverflow(page)`: asserts `document.documentElement.scrollWidth <=
document.documentElement.clientWidth` (measured against the root's client width, not
  `innerWidth`, so the Linux scrollbar gutter cannot make it flaky) (used by header_mobile,
  radio_bar, post_minimap).
- `floatingHirePlacement(locator)`: returns `{ position, right, bottom, top, height }` for the
  Work with me link, with `right` from `document.documentElement.getBoundingClientRect().width -
rect.right` and `bottom` from `document.documentElement.clientHeight - rect.bottom`, exactly as
  `hire_page.spec.ts` measures it (used by header_mobile and radio_bar). Optionally switch
  `hire_page.spec.ts`'s 375px test to it; behaviour must stay identical.
- `const SCHEMES = ["light", "dark"] as const` is fine to export if both header_mobile and
  radio_bar and single_background_color use it.

Locators every spec uses: radio `page.getByRole("region", { name: "NTS Slow Focus radio" })`,
Work with me `page.getByRole("link", { name: "Work with me" })`, header `page.locator("body >
header")` (the journey's selector; `getByRole("banner")` is equivalent and preferred where it
resolves to the same element).

### 3. `e2e/header_mobile.spec.ts`

Top comment: the root header at every width from 320px, the one Work with me link (floating below
640, in the header from 640, hidden on `/hire` below 640), the tagline from 1024, no horizontal
overflow, light and dark. Reads only.

- Widths: 320x568, 375x667, 390x844, 430x932, 640x800, 768x1024, 1024x768, 1920x1080. Schemes:
  `light`, `dark`. Pages: `/`, `/projects/log`, `/writing`, `/writing/my-moat`.
- One `test` per scheme and viewport (`for` loops generating `test(\`${scheme} ${w}x${h}\`)`), each
doing `page.emulateMedia({ colorScheme })`, `page.setViewportSize`, then for each page
`page.goto`, and:
  - header height (`locator.evaluate(el => el.getBoundingClientRect().height)`) is 57 within 1.
  - `page.locator('a[href="/hire"]')` has count 1 and `page.getByRole("link", { name: "Work with
me" })` resolves to it (`toHaveCount(1)` on both, `toHaveAccessibleName("Work with me")`).
  - Below 640: computed `position` is `fixed`; the rect is inside the viewport (`left >= 0`, `top
    > = 0`, `right <= root width`, `bottom <= clientHeight`); `right`is 16 within 2 and`bottom`equals the radio region's height plus 16 within 2 (both via`floatingHirePlacement`, measured
from the root box); `height >= 44`. Then `scrollToBottom`and assert`main.lastElementChild.getBoundingClientRect().bottom <= link.getBoundingClientRect().top`.
  - From 640: the link's box is inside the header's box and its computed `position` is not
    `fixed`.
  - Tagline `page.getByText("Built with ADW, my AI developer workflow")`: `toBeHidden()` and
    computed `display` `none` below 1024; `toBeVisible()` at 1024 and 1920.
  - `expectNoHorizontalOverflow`.
  - Include `/hire` in the loop for the header height, tagline and overflow checks only (the issue
    lists it among the pages); the link checks for `/hire` are the two tests below.
- `test("/hire hides the link at 390")`: 390x844, `/hire`, link `toBeHidden()` and computed
  `display` `none`.
- `test("/hire marks the link current in the header at 1024")`: 1024x768, `/hire`, link visible,
  box inside the header box, `toHaveAttribute("aria-current", "page")`.
- Wait for the hydrated link before reading `aria-current` (`HeaderLink` streams the active state
  on some routes; use `expect(...).toHaveAttribute`, which retries).

### 4. Silent audio fixture

- Create `e2e/assets/` and a silent audio file long enough that playback is still running after
  the navigation step (allow at least 120 s; a live stream never ends, and a short file would end
  and set `paused` back to `true`). Keep it small (target under 100 KB): for example
  `ffmpeg -f lavfi -i anullsrc=r=48000:cl=mono -t 180 -c:a libopus -b:a 6k e2e/assets/silence.ogg`
  (Opus/Ogg is an open codec every Chromium build decodes; avoid AAC). Record the exact command in
  a comment at the top of `radio_bar.spec.ts` so the fixture can be regenerated.
- Never write it under a name ending in `.md`.

### 5. `e2e/radio_bar.spec.ts`

Top comment: what the bar must do, that the stream URL is routed in the test browser only to the
committed fixture (play, navigation and stop) or to `abort()` (error), and that NTS being down
never fails the suite. Nothing is requested from the real stream.

- `const STREAM = "**/stream-mixtape-geo.ntslive.net/**"`. In `test.beforeEach`, `page.route(STREAM,
r => r.fulfill({ status: 200, contentType: "audio/ogg", body: <fixture Buffer> }))` (read the
  file once with `node:fs` at module scope, path via `path.join(__dirname, "assets",
"silence.ogg")` or `new URL(..., import.meta.url)`, whichever the TS config accepts). If the
  first run shows Chromium cannot play a fulfilled media response, write a comment with the
  observed error and fall back to the live stream for the play steps only (the error step always
  uses `abort()`).
- Layout test per scheme and viewport (1920x1080, 1024x768, 390x844, 320x568 x light, dark), each
  visiting `/`, `/projects/log`, `/writing`, `/writing/my-moat`:
  - The region contains the text `NTS · SLOW FOCUS`; its link (`region.getByRole("link")`) has
    `href` `https://www.nts.live/infinite-mixtapes/slow-focus` and `target="_blank"`.
  - At scroll 0 and after `scrollToBottom`: computed `position` `fixed`, `rect.bottom` equals
    `document.documentElement.clientHeight` within 1, `rect.left` 0, `rect.width` equals
    `document.documentElement.clientWidth` within 1.
  - `textContent` does not match `/live/i`; no element in the region (itself included) has a
    computed `background-color` `rgb(r, g, b)` with `r > 150 && g < 100 && b < 100`.
  - The box (`button.parentElement`) has a computed `border-radius` other than `0px`; at 1024x768
    it equals the Work with me link's `border-radius`.
  - After `scrollToBottom`: `main.lastElementChild.getBoundingClientRect().bottom <=
region.top + 1` (the assertion message names "the end of the page is above the footer", the
    negative check 1 target) and `body > header`'s `top` is 0.
  - Below 640: link `bottom <= region.top - 8`, and after `scrollToBottom` the end of `main` is at
    or above the link's top.
- `test("the sidebar ends above the bar at 1024")`: 1024x768, `/projects/log`, `scrollToBottom`;
  the `aside` (`page.locator("aside")`, the dashboard sidebar) bottom `<=` region top; scroll the
  `navigation` named `Projects` list to its end (`el.scrollTop = el.scrollHeight` on its scroll
  container) and assert its last link's box is inside the `aside` and its bottom is above the
  region's top. If the sidebar lists no project, `test.skip(true, "no public project in the
sidebar")` for that part.
- `test("idle on load, plays, survives navigation, stops")` at 1920x1080, light:
  - Collect `page.on("request")` URLs from before `goto("/")`; after load assert the `audio` is
    `paused`, has no `src` attribute, and no collected URL matches `/ntslive\.net/`.
  - Click `Play NTS Slow Focus`. Expect within 10 s: `audio.paused === false`, the button named
    `Stop NTS Slow Focus` with `aria-pressed="true"`. Do not assert on the transient
    `aria-busy`/loading state (the `connecting`-before-`live` style trap: loading comes before
    playing; only assert the settled state with retrying `expect.poll`/`toHaveAttribute`).
  - Tag the element: `page.evaluate(() => { window.__radio = document.querySelector("audio") })`
    (declare the global type locally).
  - Navigate client-side only, by clicking: the header `Writing` link (`navigation` named
    `Sections`), then `Watch me build`, then the sidebar's `Daily log` link, then the brand link
    back to `/`. After each (`toHaveURL`), assert `document.querySelector("audio") ===
window.__radio`, `paused === false`, and `currentTime` read twice 2 s apart increases
    (`page.waitForTimeout(2000)` is acceptable here; it is the journey's own measure).
  - Click `Stop NTS Slow Focus`: `paused === true`, button named `Play NTS Slow Focus`,
    `aria-pressed="false"`.
- `test("a failing stream shows the error and a retry clears it")`, run for each scheme at
  1920x1080 and at 390x844 (the journey's steps 9 and 10):
  - `const abort = (r) => r.abort(); await page.route(STREAM, abort)` (registered after the
    fixture route, so it wins). Click play. Within 10 s: region visible, its live region
    (`region.locator('[aria-live="polite"]')`) has text `Can't reach NTS right now`, the link
    `href` is still the mixtape page, the button is named `Play NTS Slow Focus`.
  - `await page.unroute(STREAM, abort)` (only the abort handler; the fixture route stays). Click
    play. Within 10 s: `paused === false`, the region reads `NTS · SLOW FOCUS` and no longer the
    error. Click stop.
  - At 390x844, in idle, playing and error: `expectNoHorizontalOverflow`, and the region's height
    is under `40 + safe-area inset` (inset is 0 in headless; assert `< 40`).

### 6. `e2e/single_background_color.spec.ts`

Top comment: one page background, `html` and `body` the same colour, `color-scheme` declared, the
sticky header paints the body colour, light and dark.

- A local `readColours(page)` helper (`page.evaluate`) returning `html`, `body`, `main`, `main >
div`, `body > header` background colours and the bottom area colour (walk up from
  `document.elementFromPoint(innerWidth / 2, innerHeight - 5)` to the first ancestor whose
  background is not `rgba(0, 0, 0, 0)`; fall back to `html`).
- `test("/projects at 1920x2000 paints one colour in light and dark")`: viewport 1920x2000; for
  `light` then `dark`: `emulateMedia`, `goto("/projects")` (reload for dark), `waitForLive`, then
  assert `html` is not `rgba(0, 0, 0, 0)`; `html`, `body` and bottom are equal; `main` and
  `main > div` are each transparent or equal to `body` (failure message names the element, the
  negative check 3 target); header equals `body`; `getComputedStyle(documentElement).colorScheme`
  contains `light` and `dark`. Finally the dark `html` colour differs from the light one.
- `test("/, /projects/log and a project page paint html and body the same")`: for each scheme, `/`,
  `/projects/log` and the first project via `openFirstProject` (never a hard-coded slug): `html`
  not transparent and equal to `body`; also `main` transparent or equal to `body` (covers the
  pages negative check 3 might touch). If `/projects` lists no project, `test.skip(true, "no
public project in the sidebar")` for the project page part only.
- `/projects` at 1920x2000 is the case where content is shorter than the window; keep that
  viewport.

### 7. `e2e/post_minimap.spec.ts`

Top comment: the post minimap from 1280px, in Chromium and WebKit (the old `zoom`-based minimap
broke only in WebKit), none below 1280 and none on other pages.

- `test("at 1440x900 the strip is a sticky, inert map of the whole post")` on
  `/writing/feature-flags`:
  - `strip = page.locator("[data-minimap]")`; wait for it and for at least one
    `[data-minimap-shape]` (`expect(...).not.toHaveCount(0)`, the "wait a moment for the strip to
    be drawn" of the journey). `toHaveAttribute("aria-hidden", "true")`, `inert` attribute present,
    not inside `article`, visible; its left `>` the article's right; its top `>=` the header's
    bottom; width `<= 140`; height `<= 0.7 * innerHeight + 1`.
  - No `a, img, h1, h2, h3, nav` inside (`toHaveCount(0)`); no text nodes (TreeWalker
    `SHOW_TEXT`); no element in it (itself included) has a computed `zoom` other than `1` or
    `normal`.
  - `[data-minimap-shape="image"]` count equals `article img` count, and that count is greater than
    0 (do not hard-code 3); at least one `heading` and one `text` shape; the max shape `bottom` `<=`
    inner box (`[data-minimap] .relative`, first) bottom + 1.
  - Frame (`[data-minimap-frame]`) at scroll 0: top within 1 of the inner box top. Record it and the
    strip's top.
  - `scrollToBottom`, then `expect.poll` until the frame stops moving: strip inside the viewport,
    top `>=` header bottom; frame bottom within 1 of the inner box bottom.
  - Scroll to the middle (`(scrollHeight - innerHeight) / 2`), poll: frame top strictly between the
    scroll-0 and end tops; strip top equals its top from the first check (within 1).
  - `page.locator("h1")` count 1. Then `/writing/my-moat`: the last link in `article` has text
    `Watch me build live`.
- `test("below 1280 no minimap is displayed")`: for 1024x768 (assert at a width between 1024 and
  1279 explicitly: also run 1279x800 so negative check 4 fails) and 390x844, on
  `/writing/feature-flags` and `/writing/my-moat`: the strip's `getBoundingClientRect().width` is 0,
  it holds no `[data-minimap-shape]`, `expectNoHorizontalOverflow`.
- `test("/writing has no minimap")`: 1440x900, `[data-minimap]` count 0.
- Assert in WebKit exactly as in Chromium; no `browserName` branches.

### 8. `playwright.config.ts`: the `webkit` project

- `projects: [chromium, { name: "webkit", testMatch: /post_minimap\.spec\.ts$/, use: {
...devices["Desktop Safari"], viewport: VIEWPORT } }]`. The `chromium` project keeps the root
  `testMatch` (all specs, the minimap included).
- Replace the comment `Chromium only; Firefox and WebKit are out of scope.` with one saying the
  suite is Chromium; WebKit runs only the minimap spec (the minimap broke only in Safari's engine);
  Firefox is out of scope.

### 9. CI and README

- `.github/workflows/ci.yml`: `yarn playwright install --with-deps chromium webkit`.
- `README.md`: `yarn playwright install chromium webkit   # once per machine, the browsers the E2E
suite uses (WebKit only for the minimap spec)`.

### 10. Delete the four journeys

- `git rm e2e/test_header_mobile.md e2e/test_radio_bar.md e2e/test_single_background_color.md
e2e/test_post_minimap.md`, in the same commit as the specs. No other file references them
  (checked: only `test_header_mobile.md` names `test_radio_bar.md`).

### 11. Run the suite, then the negative checks

- `PORT=$PORT yarn test:e2e`, then `PORT=$PORT yarn test:e2e --repeat-each=2`. Fix flakiness in the
  spec (waits, retrying expects), never by weakening an assertion. A real app defect: stop and
  report.
- Negative checks (probes; restore each with `git checkout -- <file>` and never commit them):
  1. Remove `pb-[calc(var(--radio-bar-height)+env(safe-area-inset-bottom,0px))]` from `<body>` in
     `src/app/layout.tsx`: `radio_bar.spec.ts` fails on "the end of the page is above the footer".
  2. Add `py-4` to `body > header` in `src/app/layout.tsx`: `header_mobile.spec.ts` fails at 375.
  3. Add `bg-neutral-100` to `<main>` in `src/app/layout.tsx`: `single_background_color.spec.ts`
     fails in at least one scheme.
  4. In `src/components/PostMinimap.tsx` change `xl:block` to `lg:block`: `post_minimap.spec.ts`
     fails at 1024 (and 1279) in both `chromium` and `webkit`.
     Each spec passes again once restored. Then `git status --porcelain` shows only the intended files.

### 12. Validation

Run every command in `Validation Commands`. Commit with a Conventional message (`test: ...` or
`chore: ...`), no trailers, hooks not bypassed. Never stage `.env*`, `next-env.d.ts`, `.ports.env`,
`agents/`, `trees/`, `test-results/`, `playwright-report/`.

## Test Coverage

The chore is itself the test coverage, on the E2E code suite layer (`e2e/*.spec.ts`, run last by
the test phase as `PORT=<run port> yarn test:e2e`):

- `e2e/header_mobile.spec.ts`: catches a header taller than one 57px row at any width from 320, a
  second or misplaced Work with me link, the floating link visible on `/hire` or overlapping the end
  of `main`, a tagline below 1024, and horizontal overflow. Today only an opt-in journey checks
  these; nothing in the automatic suite does across widths.
- `e2e/radio_bar.spec.ts`: catches the footer covering the end of a page (body padding lost), the
  bar not pinned, autoplay or a request to NTS on load, play/stop state and `aria-pressed`
  regressions, the `<audio>` remounting on client-side navigation, and a missing error state, all
  without the network.
- `e2e/single_background_color.spec.ts`: catches a second background shade on `main`, its wrapper
  or the header, a transparent `html`, or a missing `color-scheme`.
- `e2e/post_minimap.spec.ts` (chromium and webkit): catches the minimap showing below 1280, leaking
  text, links or focus into the strip, `zoom` returning, the frame not tracking scroll, and any
  WebKit-only breakage.

Each is proven to fail without the guarded behaviour by the four negative checks in step 11. No
unit test is needed: nothing in `src/` changes.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

- `yarn lint` (ESLint over the new specs, the fixture helpers and the config).
- `yarn typecheck` (the specs and `playwright.config.ts` are type-checked; do not stage the
  rewritten `next-env.d.ts`).
- `yarn knip` (new exports in `e2e/fixtures.ts` must be used; no unused files).
- `yarn format:check` (Prettier over the specs, config, README and CI file).
- `yarn test` (unit layer; unchanged, proves no regression).
- `yarn build` (the profile's build; proves nothing in the app changed and the env path works).
- `yarn check:og` (post metadata check after the build, part of the profile's test order).
- `yarn test:e2e --list` (lists the four new specs; `post_minimap.spec.ts` under both `chromium`
  and `webkit`, and no other spec under `webkit`).
- `PORT=$PORT yarn test:e2e` (the whole suite passes, WebKit included, against the adopted server).
- `PORT=$PORT yarn test:e2e --repeat-each=2` (no flakiness).
- `ls e2e/test_header_mobile.md e2e/test_radio_bar.md e2e/test_single_background_color.md e2e/test_post_minimap.md`
  (must fail: all four deleted).
- `grep -rnP "\x{2014}" e2e playwright.config.ts README.md .github` (must print nothing: no
  em-dashes).
- `git status --porcelain` (after the negative checks: only the intended files).

## Notes

- `scrollbar-gutter: stable` gives a 15px gutter on Linux Chromium (CI) and none on macOS. Every
  horizontal and bottom measurement uses the root box (`documentElement.getBoundingClientRect()
.width`, `documentElement.clientWidth`, `documentElement.clientHeight`), never `innerWidth` or
  `innerHeight`, or the specs pass locally and fail in CI (the lesson of `cfec6e7`). Where a
  journey says `innerWidth`, translate it to the root box.
- The radio has a `loading` state between play and playing (`aria-busy`, stop-labelled button);
  assert only the settled state with retrying expectations, like `connecting` before `live`.
- `page.route` takes precedence in reverse registration order; registering the `abort` handler
  after the fixture handler and unrouting only that handler restores the fixture for the retry.
- The `.adw/project.md` Install section still installs only chromium; the issue forbids editing it,
  so on a fresh machine the ADW run needs `yarn playwright install webkit` once (already present on
  this machine: `webkit_mac14_arm64_special-2251`). Mention this in the pull request.
- No documentation update: tests and config only (the profile's Documentation section: tests alone
  need none). `README.md` changes only its install line.
- No screenshots for review: nothing user-visible changes.
- The hosted Supabase project is only read through the app; no spec writes, and no spec submits the
  `/hire` form (the fixture's guard stays on).
