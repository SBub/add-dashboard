# Chore: Playwright E2E suite: setup, profile switch and the first five specs

## Metadata

issue_number: `228`
adw_id: `8092c9cd`
issue_json: `{"number":228,"title":"Playwright E2E suite: setup, profile switch and the first five specs"}`

## Chore Description

Give the dashboard a real `@playwright/test` suite. Today `.adw/project.md` says `E2E code suite: none`, so
every UI plan wrote an agent-driven journey (`e2e/*.md`, 25 of them) that the test phase runs through the
Playwright MCP server. From now on code specs are the default: deterministic, run by the test phase (as
`PORT=<run port> yarn test:e2e`, last, against the server `/prepare_app` already started) and by CI.

This chore:

1. adds `@playwright/test@1.64.0` (exact pin) and a `test:e2e` script, without touching the
   `@playwright/mcp` `0.0.81` pin;
2. adds a root `playwright.config.ts` modelled on `issebya-homes-ai-system/apps/website/playwright.config.ts`
   (port from `PORT`, `reuseExistingServer: !CI`, `gracefulShutdown`, chromium only, 1920x1080, only
   `**/*.spec.ts` collected), minus its env loading, its `E2E_MOCK_*` mocks, `workers: 1` and its
   Firefox/WebKit projects;
3. adds a shared fixture `e2e/fixtures.ts` (a POST guard on `/hire`, `waitForLive`, `openFirstProject`) that
   every spec and the follow-up issues #229, #230, #231 import;
4. converts five data-free journeys to specs and deletes the `.md` files: `home_page`, `hire_page`,
   `writing`, `header_section_active`, `header_login_hidden`;
5. ignores Playwright output, makes lint/typecheck/knip/format pass, runs the suite in CI, and switches the
   ADW profile's `## Install` and `## Tests` content (headings untouched) plus `README.md`'s run block.

Facts checked in this worktree:

- The connection pill is `src/components/ConnectionIndicator.tsx`: a `<span role="status" aria-live="polite">`
  whose text is exactly `connecting`, `live` or `reconnecting`. It is not the only `role="status"`:
  `LoadingSkeletons.tsx` renders `role="status"` skeletons with an `aria-label`, and `TodaySummary.tsx` has one
  for its error. `waitForLive` must therefore filter by text, not take the first `status`.
- The sidebar is `src/components/ProjectNav.tsx` (`<nav aria-label="Projects">`); the header nav is
  `src/components/SectionNav.tsx` (`<nav aria-label="Sections">` with `Watch me build` and `Writing`),
  `BrandLink` (`Sviatlana Buben` plus `<span className="hidden sm:inline">, building in public</span>`) and
  `HireLink` (the single `Work with me` link: in the header from `sm`, `max-sm:fixed` below it, hidden on `/hire`
  below `sm`). The header is `body > header` in `src/app/layout.tsx`, which also renders `IdentifyButton`
  (the PostHog-flag-gated Login/Logout button).
- `LOCATION = "Remote, Lisbon"` lives in `src/content/site.ts`.
- `eslint-config-next` enables `react-hooks/rules-of-hooks`, which flags a call to a function named `use`
  outside a component. Playwright's fixture callback is conventionally named `use`, so the fixture names it
  differently (for example `run`); do not disable the rule.
- `eslint.config.mjs` does not read `.gitignore` (flat config), Prettier 3 does. `knip.json` `project` covers
  `src/**` and `scripts/**` only and ignores `@playwright/mcp`; knip's Playwright plugin turns on once
  `@playwright/test` is a dependency and adds `playwright.config.ts` plus the spec files as entries.

## Relevant Files

Use these files to resolve the chore:

- `README.md`: the `## Running it` block and the `## Scripts` table get `yarn test:e2e` and the one-time
  `yarn playwright install chromium`. No feature description.
- `AGENTS.md`: Yarn only, no em-dashes, conventional commits with no trailers, `.adw/project.md` headings
  contract.
- `.adw/project.md`: `## Install` gains the browser install step; `## Tests` loses `E2E code suite: none`, the
  "There is no component test layer and no Playwright suite..." sentence and the enumerated journey list. The
  nine `##` headings stay exactly as they are.
- `package.json`: new devDependency `@playwright/test` `1.64.0` (exact) and script `test:e2e`.
- `yarn.lock`: updated by `yarn add -D`, committed with it.
- `knip.json`: add `e2e/**/*.ts` and `playwright.config.ts` to `project` so the fixture's exports are checked;
  never add `@playwright/test` to `ignoreDependencies`.
- `eslint.config.mjs`: add `playwright-report/**`, `test-results/**`, `blob-report/**` to `ignores`
  (flat config does not read `.gitignore`).
- `.gitignore`: add `playwright-report/`, `test-results/`, `blob-report/`.
- `.github/workflows/ci.yml`: two steps after `yarn check:og`.
- `tsconfig.json`: read only. It already includes `**/*.ts`, so specs and the config are typechecked; no change.
- `lefthook.yml`: read only. Must not gain `test:e2e`.
- `playwright-mcp-config.json`, `.mcp.json`: read only; the review phase depends on them and on the MCP pin.
- `e2e/test_home_page.md`, `e2e/test_hire_page.md`, `e2e/test_writing.md`,
  `e2e/test_header_section_active.md`, `e2e/test_header_login_hidden.md`: the five journeys to convert, then
  delete.
- `src/components/ConnectionIndicator.tsx`, `src/components/ProjectNav.tsx`, `src/components/SectionNav.tsx`,
  `src/app/layout.tsx`, `src/components/HireRequestForm.tsx`, `src/components/HireOfferFields.tsx`,
  `src/content/site.ts`, `src/content/home.ts`, `src/content/hire.ts`: read only, to pick the right role and
  label locators.
- `../../../issebya-homes-ai-system/apps/website/playwright.config.ts`: the reference config (read only).
- `app_docs/hire.md`: the `/hire` rules (never submit a valid form; `?sent=1`, `?error=<code>` by URL).
- `app_docs/home.md`: `/`, `LOCATION`, the two doors into `/hire`.
- `app_docs/writing.md`: `/writing`, the post page, its breadcrumb.
- `app_docs/routing-and-navigation.md`: the header links and their current-section marking, not-found.
- `app_docs/analytics.md`: PostHog never initialises when `navigator.webdriver` is `true`, which is why the
  Login/Logout button is absent and why the suite sends no analytics.
- `app_docs/realtime.md`: the connection pill states that `waitForLive` reads.
- `node_modules/@playwright/test/` (after install): `types/test.d.ts` for `TestConfig.webServer.gracefulShutdown`
  and fixture typing.

### New Files

- `playwright.config.ts`: the suite config at the repository root.
- `e2e/fixtures.ts`: shared `test` and `expect`, the `/hire` POST guard, `waitForLive`, `openFirstProject`.
- `e2e/home_page.spec.ts`
- `e2e/hire_page.spec.ts`
- `e2e/writing.spec.ts`
- `e2e/header_section_active.spec.ts`
- `e2e/header_login_hidden.spec.ts`

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. Add the dependency and the script

- Run `yarn add -D @playwright/test@1.64.0`. Check `package.json` reads `"@playwright/test": "1.64.0"` (no
  caret; edit it to the exact pin if Yarn added one and re-run `yarn install`). `@playwright/mcp` stays
  `"0.0.81"`.
- Add `"test:e2e": "playwright test"` to `scripts`, after `check:og`.
- Run `yarn playwright install chromium` once (browsers go to the user cache; nothing in the repo changes).
- Check `yarn playwright --version` prints `Version 1.64.0` and
  `node -p "require('@playwright/mcp/package.json').version"` prints `0.0.81`.

### 2. Ignore Playwright output

- `.gitignore`: add a short commented block, e.g.
  `# @playwright/test output (yarn test:e2e); never commit it` then `playwright-report/`, `test-results/`,
  `blob-report/`.
- `eslint.config.mjs`: extend the existing `ignores` array with `"playwright-report/**"`, `"test-results/**"`,
  `"blob-report/**"`.

### 3. Write `playwright.config.ts`

Modelled on the website config, each non-obvious line commented with why:

- `import { defineConfig, devices } from "@playwright/test";`
- `const PORT = process.env.PORT ?? "3000";` with a comment: the ADW test phase runs the suite as
  `PORT=<run port> yarn test:e2e` against the server `/prepare_app` started on that port; 3000 only as a local
  default. `const BASE_URL = \`http://localhost:${PORT}\`;`
- `testDir: "./e2e"`, `testMatch: "**/*.spec.ts"` with a comment: `e2e/*.md` are agent-driven journeys the
  test phase runs through the MCP, and must never be collected.
- `forbidOnly: !!process.env.CI`, `retries: 0` (comment: a flaky spec should fail, not be retried into green;
  the issue asks for `0` locally, and CI keeps `0` too so a flake is visible). Leave `workers` at the default:
  nothing here writes shared state.
- `use: { baseURL: BASE_URL, viewport: { width: 1920, height: 1080 } }`, comment: the review viewport, same as
  `playwright-mcp-config.json`; specs that need 375 or 390 call `page.setViewportSize` themselves.
- `projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1920, height: 1080 } } }]`
  (the device preset sets its own 1280x720 viewport, so repeat the viewport after the spread). Comment:
  chromium only; Firefox/WebKit are out of scope.
- `webServer`:
  - `command: process.env.CI ? "yarn start" : "yarn dev"`, comment: CI has just run `yarn build`; locally the
    ADW run's server is usually already up and adopted.
  - `url: BASE_URL`, `reuseExistingServer: !process.env.CI`, comment: this is how the test phase's
    `/prepare_app` server on the run's port is adopted; never set `CI=1` in an ADW run.
  - `timeout: 120_000` (comment: first `next dev` compile of `/` plus the database read can be slow).
  - `gracefulShutdown: { signal: "SIGTERM", timeout: 5000 }`, comment: let `next` close sockets before any
    fallback SIGKILL.
  - `env: { PORT }`, comment: pins the spawned server to the port `baseURL` points at; `next dev` and
    `next start` both read `PORT`, so nothing passes `--port`.
- No `.env` loading in this process: specs read only through the app, and the server loads its own env files.
- No em-dashes in comments.

### 4. Write `e2e/fixtures.ts`

Exports `test`, `expect`, `waitForLive`, `openFirstProject`; every spec imports from `./fixtures`, never from
`@playwright/test` directly.

- `test = base.extend<{ hireGuard: void }>({ hireGuard: [async ({ context }, run) => { ... await run(); }, { auto: true }] })`
  (name the callback `run`, not `use`: `react-hooks/rules-of-hooks` from `eslint-config-next` flags `use(...)`).
  The guard calls `context.route((url) => url.pathname === "/hire", (route) => route.request().method() === "POST" ? route.abort() : route.fallback())`
  so it covers every page and popup in the context, whether the action posts through `fetch` (hydrated,
  `Next-Action` header) or as a native form POST (not hydrated). Comment: a second line of defence, not a
  licence; a valid submit would email `hire@issebya.com`. Use `fallback()` rather than `continue()` so a spec
  that adds its own route still runs.
- `export { expect } from "@playwright/test";`
- `export async function waitForLive(page: Page): Promise<void>`: the sidebar pill is a `role="status"` whose
  whole text is the state; other `status` elements exist (skeletons, the today card's error), so locate
  `page.getByRole("status").filter({ hasText: /^(connecting|live|reconnecting)$/ })` and
  `await expect(pill).toHaveText("live", { timeout: 15_000 })`.
- `export async function openFirstProject(page: Page): Promise<string>`: `await page.goto("/projects")`, take
  `page.getByRole("navigation", { name: "Projects" }).getByRole("link").first()`, wait for it to be visible,
  read `href` (`getAttribute`, assert non-null and matching `^/projects/[^/]+/[^/]+$`), click it,
  `await expect(page).toHaveURL(href)`, return `href`. Comment: never hard-code a slug, the public projects
  change. If the first sidebar link turns out to be the Daily log or Changelog entry rather than a project,
  scope to the project links (check `ProjectNav.tsx` and filter by the `href` shape) so the helper always
  returns a project page.

### 5. Convert `e2e/test_home_page.md` -> `e2e/home_page.spec.ts`

One `test.describe("home page")` with tests per journey block; every **Verify** and Success Criterion an
assertion; screenshot steps dropped.

- `/` at 1920x1080: `getByRole("heading", { level: 1, name: "Sviatlana Buben" })`; `getByText("Product Engineer, AI Consultant")`;
  `getByText("Remote, Lisbon")` visible (negative probe 1 targets this); the intro line
  `Offline: running guest house issebya.com` with `getByRole("link", { name: "issebya.com" })` having
  `href="https://www.issebya.com"`; `Love forest bathing, NTS, PostHog`; `getByText("[Placeholder]")` and
  `getByText(/^Online:/)` count 0. "Directly under it" ordering: assert the role line's box top is greater than
  the heading's box bottom, and `Remote, Lisbon` below the role line (geometry through `boundingBox`).
- Doors: links with `href="/hire?offer=product-engineer"` (name starts `Building a product?`) and
  `href="/hire?offer=ai-consulting"` (name starts `Want to automate your processes with AI?`), located with
  `getByRole("link", { name: /^Building a product\?/ })` then `toHaveAttribute("href", ...)`. Each door has
  only its title (its text equals the title, no description line).
- No `table` role, no heading matching `/^Today,/`, `getByRole("status")` count 0, no `navigation` named
  `Projects`.
- Header: brand link (`getByRole("banner").getByRole("link", { name: /^Sviatlana Buben/ })`) has
  `aria-current="page"`; `Watch me build` in `navigation` `Sections` has no `aria-current`.
- Doors on one row at 1920: their bounding box `y` equal.
- Click first door: URL `/hire?offer=product-engineer`, `getByRole("combobox")` count 0, hidden
  `input[type=hidden][name=offer]` `toHaveValue("Product engineer")` (a hidden input has no role, so CSS is
  allowed here), `getByLabel("What are you building?")` is the textarea, no level-2 heading. `page.goBack()`,
  click second door: `/hire?offer=ai-consulting`, no combobox, hidden value `AI consulting`,
  `getByLabel("Tell me about your business")`, no text `Structure and automate your processes with AI`.
- `/` then click header `Watch me build`: URL `/projects`, heading level 2 `Building now`, `Watch me build`
  `aria-current="page"`, brand none.
- `/` at 375x667: doors stacked (second `y` > first `y + height`), `document.documentElement.scrollWidth <= 375`
  via `page.evaluate`, `Remote, Lisbon` visible.
- Never touch the `/hire` form's Send button.

### 6. Convert `e2e/test_hire_page.md` -> `e2e/hire_page.spec.ts`

- Header link at 1920: on `/`, `getByRole("banner").getByRole("link", { name: "Work with me" })` has
  `href="/hire"` and no `aria-current`; same on `/projects`; then `openFirstProject(page)` and the same link
  is in the header; click it: URL `/hire`, `aria-current="page"`.
- Static shell: heading `Work with me`, `Remote, Lisbon` below it (negative probe 1 targets this),
  `getByRole("link", { name: "LinkedIn profile" })` with `target="_blank"` and `rel="noreferrer"`, no
  `[Placeholder]`; no level-2 or level-3 heading, no text `Structure and automate your processes with AI`.
- Select: `getByLabel("What brings you here?")` (a combobox) has exactly two `option`s; read
  `[value, text]` pairs with `select.evaluate` and assert they equal
  `[["Product engineer", "I need a product engineer"], ["AI consulting", "I want to structure and automate my processes with AI"]]`;
  `toHaveValue("Product engineer")`; `getByLabel("What are you building?")` visible; `selectOption("AI consulting")`
  then `getByLabel("Tell me about your business")`; back to the first and the label returns.
- Accent: with `page.evaluate`, collect `bg-fuchsia-*` classes of `getByRole("button", { name: "Send" })` and
  of the header `Work with me` link (use `locator.evaluate((el) => [...el.classList].filter(...))`); equal,
  non-empty.
- The `Activity` trap from step 11, encoded: this test arrives at `/hire` from a project page, so the project
  page sits in the DOM inside a hidden `Activity`. Assert absence with `getByRole("status")` count 0,
  `getByText(/^(connecting|live|reconnecting)$/)` not visible, and
  `getByRole("navigation", { name: "Projects" })` count 0 (role locators skip hidden subtrees). Add a comment
  saying why, and never use `page.locator("nav[aria-label=Projects]")` or `querySelector` for presence.
- Browser validation: choose an offer, `getByLabel("Email")` (confirm the exact label in
  `HireRequestForm.tsx`) fill `visitor@example.com`, leave the motivation empty, click `Send`; URL is still
  exactly `/hire` (no query); `textarea.evaluate((el) => (el as HTMLTextAreaElement).validity.valueMissing)` is
  `true`. Nothing is posted (the guard is also there).
- By URL only: `/hire?sent=1` shows `Thanks, your message was sent.` and no `Send` button / no form;
  `/hire?error=verification` shows `We could not verify you are human. Please try again.` above the form (its
  box `y` less than the select's); `/hire?error=<script>` shows the form, no error text, and
  `page.locator("body")` `not.toContainText("<script>")`.
- `?offer=product-engineer` and `?offer=ai-consulting`: no level-2 or level-3 heading, combobox count 0,
  exactly one hidden `offer` input with the offer's value, the offer's textarea label; no
  `Structure and automate...` on the second. `?offer=nope` and `?offer=<script>`: no offer block, combobox with
  value `Product engineer`, no `<script>` text.
- 375x667 on `/hire`: header shows `Sviatlana Buben` and `Watch me build`; `getByText("building in public")`
  not visible (`toBeHidden`); `Remote, Lisbon` visible; `scrollWidth <= 375`; the `Work with me` link
  `toBeHidden()` (computed `display` `none`, read with `locator.evaluate`) and its box not inside
  `body > header`'s box (a null box or one outside counts).
- 375x667 on `/`: `Work with me` link visible, computed `position` `fixed`, `innerWidth - rect.right` within
  2 of 16, `innerHeight - rect.bottom` within 2 of the radio region's height plus 16, the region located with
  `getByRole("region", { name: "NTS Slow Focus radio" })`.
- No test fills a valid form and clicks `Send`.

### 7. Convert `e2e/test_writing.md` -> `e2e/writing.spec.ts`

- `/writing` at 1920: level-1 `Writing`, `getByRole("link", { name: "My moat as a Product Engineer" })` with
  `href="/writing/my-moat"`, `getByText("For product teams")`, a date next to the post (assert the post's list
  item contains a `time` element or a date-shaped text; check `PostMetaLine.tsx` for the markup). `Writing` in
  `Sections` has `aria-current="page"`, `Watch me build` none. No `status`, no `Projects` navigation, no
  `Breadcrumb` navigation.
- Click the post: URL `/writing/my-moat`, level-1 heading the post title, `Writing` still current.
- Breadcrumb: `getByRole("navigation", { name: "Breadcrumb" })` exists; precedes the `h1` in document order
  (`page.evaluate` with `compareDocumentPosition`); its `Writing` link `href="/writing"`; its
  `[aria-current="page"]` element has the post title; the `/` separator is `aria-hidden="true"`.
- Click the breadcrumb `Writing`: URL `/writing`, h1 `Writing`; go to `/writing/my-moat`.
- Article: the last link inside `getByRole("article")` has text `Watch me build live` and `href="/projects"`;
  no link named `Work with me` inside the article.
- Meta: `meta[property="og:title"]` content `My moat as a Product Engineer`, `og:image` non-empty (CSS on
  `head` is the only way; `toHaveAttribute("content", ...)`).
- 390x844: `/writing` and `/writing/my-moat` each `scrollWidth <= 390`; the breadcrumb's current element has
  computed `white-space` `nowrap`.
- `my-moat` is a committed post under `src/content/posts/`, not live data, so naming its slug is allowed.

### 8. Convert `e2e/test_header_section_active.md` -> `e2e/header_section_active.spec.ts`

- `/`: brand link (accessible name `Sviatlana Buben, building in public` at 1920, `href="/"`) has
  `aria-current="page"`; `Watch me build` has `href="/projects"` and no `aria-current`.
- `/projects/log`: `Watch me build` current, brand none. `/projects`: same; call `waitForLive(page)` here
  (the dashboard routes carry the pill; this also gives `waitForLive` a caller so knip does not flag it).
- `openFirstProject(page)`: URL equals the returned `href` and matches `/projects/<owner>/<repo>`; `Watch me build`
  current.
- `/projectsx`: not-found renders (level-1 or the `Not found` heading, check `src/app/not-found.tsx` and
  `src/app/(dashboard)/not-found.tsx` for the exact text), brand and `Watch me build` not current.
- `/watch` and `/watchx`: `Not found` heading; brand, `Watch me build` and `Work with me` all without
  `aria-current`.
- `/hire` at 1920: `Work with me` current, brand and `Watch me build` not.
- Assert "no `aria-current`" with `not.toHaveAttribute("aria-current")`. Screenshot steps 7 and 8 dropped.

### 9. Convert `e2e/test_header_login_hidden.md` -> `e2e/header_login_hidden.spec.ts`

- For each of `/`, `/projects`, `/writing`, `/hire` at 1920: within `getByRole("banner")`,
  `getByRole("button", { name: /^(Login|Logout)$/ })` and `getByRole("link", { name: /^(Login|Logout)$/ })`
  have count 0; the `Work with me` link (`href="/hire"`) is attached, and on `/` its box lies inside
  `body > header`'s box (geometry via `boundingBox`). A `for` loop over the routes generating one `test` each
  keeps it compact.
- 375x667 on `/`: no Login/Logout button or link anywhere on the page, and the `a[href="/hire"]` link is
  attached (`getByRole("link", { name: "Work with me" })`).
- Comment: the button is gated by the PostHog flag `login`; PostHog never initialises under
  `navigator.webdriver`, so the flag reads `undefined` here.

### 10. Delete the five converted journeys

- `git rm e2e/test_home_page.md e2e/test_hire_page.md e2e/test_writing.md e2e/test_header_section_active.md e2e/test_header_login_hidden.md`
  in the same commit as the specs. `ls e2e/*.md | wc -l` must print `20`.

### 11. Lint, types, dead code, format

- `knip.json`: add `"e2e/**/*.ts"` and `"playwright.config.ts"` to `project`. Do not add `@playwright/test` to
  `ignoreDependencies`; it is used by the config and the fixture. Run `yarn knip`; if it reports the config or
  specs as unused, add `"entry": [..., "playwright.config.ts", "e2e/**/*.spec.ts"]` alongside the existing
  `scripts/backfill-changelog.ts` instead of ignoring anything.
- `yarn lint` (fix any `react-hooks` or `security/*` report by changing the code, never the rule),
  `yarn typecheck` (the specs compile under `strict` and `noUncheckedIndexedAccess`: guard indexed reads),
  `yarn format` then `yarn format:check`.
- `grep -rnP "\x{2014}" e2e playwright.config.ts .adw/project.md README.md .github` prints nothing.

### 12. CI

- `.github/workflows/ci.yml`, after `- run: yarn check:og`, in the same `check` job and env:
  `- run: yarn playwright install --with-deps chromium` then `- run: yarn test:e2e`. `CI` is set by Actions, so
  the config spawns `yarn start` on 3000 and does not reuse a server. No new secrets: the build already has the
  two public Supabase vars; `/hire` builds with an empty Turnstile key.

### 13. ADW profile `.adw/project.md` (content only, headings untouched)

- `## Install`: insert a step after `yarn install --immutable` and renumber the following one: `yarn playwright install chromium`
  (the browser `@playwright/test` needs; browsers live in the user cache, so this is a no-op once present and
  never a reason to change `yarn.lock`).
- `## Tests`:
  - In the first paragraph, append after `yarn check:og` that the E2E suite `yarn test:e2e` runs last.
  - Replace the sentence "There is no component test layer and no Playwright suite; a user-visible change gets
    its browser evidence from the review phase's screenshots, not from a test." with: there is no component
    test layer; the browser layer is the Playwright suite below.
  - Replace the whole `E2E code suite: none ...` paragraph (with its file list) by: `E2E code suite:
e2e/*.spec.ts` (`@playwright/test`, chromium, `playwright.config.ts`), run last by the test phase as
    `PORT=<run port> yarn test:e2e`; the `/prepare_app` server must already be up on this run's port, which
    `reuseExistingServer` adopts; never set `CI=1` in a run (it disables reuse and switches the server to
    `yarn start`); specs import `test`/`expect` from `e2e/fixtures.ts` (the `/hire` POST guard,
    `waitForLive`, `openFirstProject`), read the hosted database through the app and never write; a
    user-visible change adds or extends a spec there. Then one sentence: agent-driven `e2e/*.md` journeys are
    opt-in and normally absent; the remaining ones are being converted to specs. No journey or spec file names.
  - Keep the lefthook paragraph, and say `test:e2e` is in neither hook (needs a server and the network).
- Check `grep -c '^## ' .adw/project.md` is `9` and the order is Identity, Workspaces, Install, Build, Tests,
  Ports, Protected, Documentation, Review.

### 14. README.md

- In the `## Running it` block, after `yarn dev`, add
  `yarn playwright install chromium   # once per machine, the browser the E2E suite uses` and
  `yarn test:e2e   # Playwright specs in e2e/, against the dev server on PORT (or one it starts)`.
- Add a `yarn test:e2e` row to the `## Scripts` table: `Playwright E2E specs (e2e/*.spec.ts)`. No feature text.

### 15. Negative probes (never committed)

1. Change `LOCATION` in `src/content/site.ts` to another string; with the run's server up,
   `PORT=$PORT yarn test:e2e home_page hire_page` must fail on the `Remote, Lisbon` assertions. Restore with
   `git checkout src/content/site.ts`.
2. In `hire_page.spec.ts`, temporarily add a test that selects an offer, fills a valid email and motivation,
   clicks `Send`, and asserts the URL never becomes `?sent=1` (wait a few seconds with
   `expect(page).not.toHaveURL(/sent=1/)`), plus a `page.on("requestfailed")` check that the POST to `/hire`
   was aborted. Run it, then remove the probe.
3. `cp e2e/home_page.spec.ts e2e/x.spec.md`; `yarn test:e2e --list` must not list it; delete it.

- Then `git status --porcelain` shows only intended files.

### 16. Run the Validation Commands

- Run every command below from the worktree root, in order, and fix anything that fails.

## Test Coverage

- Browser layer, the new Playwright suite (the profile's E2E code suite once step 13 lands):
  `e2e/home_page.spec.ts`, `e2e/hire_page.spec.ts`, `e2e/writing.spec.ts`,
  `e2e/header_section_active.spec.ts`, `e2e/header_login_hidden.spec.ts`. Together they catch, on every test
  phase and every CI run, regressions that today only an agent-driven MCP journey catches when someone chooses
  to run it: the `/` and `/hire` copy and doors, the `?offer=`/`?sent=`/`?error=` states, the header's
  current-section marking, the absent Login button, the post page's breadcrumb and closing link, and the 375
  and 390 px layouts. Negative probe 1 proves they fail without the behaviour they assert.
- The infrastructure itself (`playwright.config.ts`, `e2e/fixtures.ts`, CI step, profile, README) needs no
  separate test: it is config and documentation, exercised by the specs running at all, and its safety
  properties (the `/hire` POST guard, `.md` never collected) are proven by negative probes 2 and 3 rather than
  by a permanent test, which would have to submit a valid form.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

- `yarn install --immutable` - the committed `package.json` and `yarn.lock` agree.
- `yarn playwright --version` - prints `Version 1.64.0`.
- `node -p "require('@playwright/mcp/package.json').version"` - prints `0.0.81`, the MCP pin is intact.
- `yarn lint` - ESLint passes with the specs, fixture and config.
- `yarn typecheck` - specs and config compile under the strict tsconfig.
- `yarn knip` - no unused files, exports or dependencies with `e2e/**` in scope.
- `yarn format:check` - Prettier passes.
- `yarn test` - unit tests unchanged and green.
- `yarn build` - production build still passes.
- `yarn check:og` - post metadata check, after the build.
- `yarn test:e2e --list` - lists exactly the five new spec files and no `.md`.
- `set -a; . ./.ports.env; set +a; PORT=$PORT yarn test:e2e` - with this run's `/prepare_app` server up on
  `PORT`, the suite passes against it (never against a server on 3000 this run did not start).
- `PORT=$PORT yarn test:e2e --repeat-each=2` - no flake.
- `ls e2e/*.md | wc -l` - prints `20`; `ls e2e | grep -E 'test_(home_page|hire_page|writing|header_section_active|header_login_hidden)\.md'` prints nothing.
- `grep -n "E2E code suite" .adw/project.md` - no longer says `none`.
- `grep -c '^## ' .adw/project.md` - prints `9`; `grep '^## ' .adw/project.md` - prints Identity, Workspaces,
  Install, Build, Tests, Ports, Protected, Documentation, Review in that order.
- `grep -rnP "\x{2014}" e2e playwright.config.ts .adw/project.md README.md .github` - prints nothing.
- `git status --porcelain` - only intended files; no `test-results/`, `playwright-report/`, `.env*`,
  `next-env.d.ts`, `.ports.env`, `agents/`, `trees/`.

## Notes

- Never submit the `/hire` form with valid input outside the throwaway probe 2, and even then only with the
  fixture's guard active. `?sent=1` and `?error=<code>` are opened by URL.
- Never pass `--port`, never set `CI=1` in an ADW run, never edit `.ports.env`, never probe or kill a server on
  3000 this run did not start. If no server is up on `PORT`, `yarn test:e2e` starts `yarn dev` on it itself
  (and stops it after), which is allowed: the profile marks the app as one ADW may start.
- Do not hard-code project slugs, titles or row counts from the database; `openFirstProject` exists for that.
  `my-moat` and the `/` and `/hire` copy are committed content, not live data.
- Do not add `test:e2e` to `lefthook.yml`; it needs a server and the network.
- `e2e/*.md` journeys still run through the MCP in the test phase until #229, #230 and #231 convert them; those
  issues reuse `e2e/fixtures.ts`, so keep its three exports stable and documented with short comments.
- Commits: conventional, bare type (`chore: ...`), no trailers of any kind.
- No feature doc changes are needed: this is tooling and tests (profile `## Documentation`: tests alone or a
  dependency need no documentation). `docs/conditional-docs.md` is untouched.
- Do not edit `specs/` (beyond this plan) or `adws/` by hand.
