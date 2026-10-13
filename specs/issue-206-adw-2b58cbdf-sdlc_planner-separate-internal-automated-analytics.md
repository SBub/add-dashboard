# Feature: Separate own and automated visits from real analytics

## Metadata

issue_number: `206`
adw_id: `2b58cbdf`
issue_json: `{"number":206,"title":"Separate own and automated visits from real analytics"}`

## Feature Description

Production PostHog data on build.issebya.com is dominated by the owner's own visits and by
automated browsers (Playwright) checking the live site. This feature separates both from real
visitors:

1. Automated browsers (`navigator.webdriver === true`) never initialise PostHog, so they send
   nothing at all.
2. The owner can tag a browser as internal by opening `https://build.issebya.com/?internal=1` once.
   From then on every event from that browser carries the super property `internal: true`, which a
   PostHog test-account filter hides. `?internal=0` removes the tag. Tagging (not opting out) keeps
   `identify` and feature flags (`login`, `machine-onboarding`, targeted by her email) working.

## User Story

As the site owner
I want my own browsers tagged as internal and automated browsers excluded from PostHog
So that production analytics show only real visitors while my flags and Login still work for me

## Problem Statement

`instrumentation-client.ts` initialises PostHog for every production visit, including the owner's
and Playwright's. Nothing distinguishes them from real visitors, so insights are mostly noise.
Opting the owner out would also stop `identify` and break flag targeting by email.

## Solution Statement

Move the start-up decision into pure, node-testable functions in `src/lib/analytics.ts` (which
never imports `posthog-js`, the client is passed in, as with `createIdentityStore`):

- `internalTagAction(search: string): "tag" | "untag" | null` parses a query string with
  `URLSearchParams`: `internal` equal to `"1"` gives `"tag"`, `"0"` gives `"untag"`, anything else
  (missing, empty, `yes`, malformed) gives `null`.
- `startAnalytics(env, browser, client)` holds the whole init condition: the existing
  `vercelEnv === "production"` and token and host checks, plus `browser !== undefined &&
browser.webdriver !== true`. When it passes it calls `client.init(projectToken, host)`, then
  applies `internalTagAction(browser.search)`: `client.register({ internal: true })` for `"tag"`,
  `client.unregister("internal")` for `"untag"`, nothing for `null`.

`instrumentation-client.ts` keeps reading the three `NEXT_PUBLIC_*` variables literally (so Next
inlines them), builds the `browser` input guarded by `typeof navigator` / `typeof window`, and passes
an adapter over the real `posthog` whose `init(token, host)` calls `posthog.init` with the existing
config unchanged (`api_host`, `defaults: "2026-01-30"`, `capture_exceptions: true`, `debug`). The
`posthog.init` options stay in `instrumentation-client.ts`, so `src/lib/analytics.ts` needs no
PostHog config types.

## Relevant Files

Use these files to implement the feature:

- `instrumentation-client.ts` - the only place PostHog is initialised; gains the webdriver condition
  and the tag step through `startAnalytics`.
- `src/lib/analytics.ts` - the pure analytics helpers (identity store, owner constants); gets
  `internalTagAction`, `startAnalytics` and their client/env/browser types.
- `src/lib/analytics.test.ts` - existing vitest tests for the identity store; extended with tests for
  the two new helpers, using the same `vi.fn()` fake-client style.
- `app_docs/analytics.md` - the feature doc (matched in `docs/conditional-docs.md`: "changing
  `instrumentation-client.ts`"); gets the automated-browser exclusion, tagging how-to, the PostHog
  filter setup and new Rules.
- `docs/conditional-docs.md` - the analytics line is extended to mention internal tagging and
  automated-browser exclusion.
- `node_modules/posthog-js/dist/module.d.ts` - `register(properties, days?)` and
  `unregister(property)` signatures (installed 1.438.7).
- `vitest.config.ts`, `knip.json` - tests run only from `src/**/*.test.ts`; knip treats
  `instrumentation-client.ts` as a Next entry, so exports used there are not dead code.

### New Files

None.

## Implementation Plan

### Phase 1: Foundation

Add the pure decision functions and their narrow types to `src/lib/analytics.ts`, with unit tests.

### Phase 2: Core Implementation

Rewrite the body of `instrumentation-client.ts` to call `startAnalytics` with the env values, the
guarded browser input and a `posthog` adapter.

### Phase 3: Integration

Document the behaviour, the owner's manual PostHog filter and the new invariants in
`app_docs/analytics.md`, update the index line, and run the negative check plus all validation
commands.

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. Add `internalTagAction` to `src/lib/analytics.ts`

- Add a commented constant `INTERNAL_PROPERTY = "internal"` next to `OWNER_EMAIL` / `LOGIN_FLAG`,
  with the same note: a literal PostHog filters match on, never rename or derive it.
- Add `export type InternalTagAction = "tag" | "untag" | null;`.
- Add `export function internalTagAction(search: string): InternalTagAction` using
  `new URLSearchParams(search).get("internal")`: `"1"` returns `"tag"`, `"0"` returns `"untag"`,
  otherwise `null`. `URLSearchParams` accepts a leading `?`, an empty string and malformed input
  without throwing.

### 2. Add `startAnalytics` to `src/lib/analytics.ts`

- Types:
  - `export interface AnalyticsEnv { vercelEnv: string | undefined; projectToken: string | undefined; host: string | undefined; }`
  - `export interface AnalyticsBrowser { webdriver: boolean | undefined; search: string; }`
  - `export interface AnalyticsClient { init(projectToken: string, host: string): void; register(properties: { internal: true }): void; unregister(property: string): void; }`
- `export function startAnalytics(env: AnalyticsEnv, browser: AnalyticsBrowser | undefined, client: AnalyticsClient): boolean`
  - Return `false` without calling anything unless `env.vercelEnv === "production"`,
    `env.projectToken` and `env.host` are truthy, `browser` is defined and
    `browser.webdriver !== true`.
  - Otherwise call `client.init(env.projectToken, env.host)`, then switch on
    `internalTagAction(browser.search)`: `"tag"` calls `client.register({ [INTERNAL_PROPERTY]: true })`
    (typed so the literal is `internal: true`), `"untag"` calls
    `client.unregister(INTERNAL_PROPERTY)`. Return `true`.
  - No `days` argument to `register`: persistent, no expiry.
- JSDoc in the file's style: why the client is injected, that tagging never opts out.
- Do not import `posthog-js` (not even as a type).

### 3. Unit tests in `src/lib/analytics.test.ts`

- `describe("internalTagAction")`: `"?internal=1"` is `"tag"`; `"?internal=0"` is `"untag"`;
  `"?internal=yes"`, `"?internal="`, `"?foo=1"` and `""` are `null`; `"?a=b&internal=1"` is
  `"tag"`.
- `describe("startAnalytics")` with a `fakeAnalyticsClient()` of three `vi.fn()`s and a
  `PROD = { vercelEnv: "production", projectToken: "phc_test", host: "https://eu.i.posthog.com" }`:
  - `webdriver: true` (production, `?internal=1`): `init`, `register`, `unregister` not called,
    returns `false`.
  - `webdriver: false`, production, `search: ""`: `init` called once with `("phc_test", host)`,
    neither `register` nor `unregister` called.
  - `webdriver: undefined` behaves like `false` (older browsers lack the property).
  - `?internal=1`: `init` then `register({ internal: true })` (assert order with
    `mock.invocationCallOrder`), no `unregister`.
  - `?internal=0`: `unregister("internal")`, no `register`.
  - `vercelEnv: "preview"`, `undefined`, missing token, missing host: `init` not called.
  - `browser` undefined (no `navigator` / `window`): `init` not called, no throw.

### 4. Wire `instrumentation-client.ts`

- Keep the existing comment and the three literal `process.env.NEXT_PUBLIC_*` reads (Next inlines
  them only when written literally); extend the comment with one sentence on automated browsers and
  the `?internal=` tag pointing to `app_docs/analytics.md`.
- Build the browser input without throwing:
  `const browser = typeof navigator !== "undefined" && typeof window !== "undefined" ? { webdriver: navigator.webdriver, search: window.location.search } : undefined;`
- Call `startAnalytics({ vercelEnv, projectToken, host: posthogHost }, browser, { init: (token, host) => { posthog.init(token, { api_host: host, defaults: "2026-01-30", capture_exceptions: true, debug: process.env.NODE_ENV === "development" }); }, register: (properties) => { posthog.register(properties); }, unregister: (property) => { posthog.unregister(property); } })`.
  The `posthog.init` options are byte-for-byte the current ones. Import `startAnalytics` via
  `@/lib/analytics`.
- `isProduction` disappears as a local (the check moves into `startAnalytics` unchanged:
  `=== "production"`).

### 5. Negative check (not committed)

- Temporarily remove `browser.webdriver !== true` from `startAnalytics`, run `yarn test`, confirm
  the `webdriver: true` test fails; restore the condition and confirm `git diff` shows no trace of
  the probe.

### 6. Update `app_docs/analytics.md`

- Add this plan to **Specifications**.
- Initialisation: the condition now also requires a browser whose `navigator.webdriver` is not
  `true`, so Playwright and other automated browsers never start PostHog; the logic lives in
  `startAnalytics` in `src/lib/analytics.ts`.
- New subsection "Internal devices":
  - Tag a browser once with `https://build.issebya.com/?internal=1`: `register({ internal: true })`
    stores a persistent super property, sent with every later event from that browser.
    `?internal=0` calls `unregister("internal")`. Any other value or no parameter does nothing.
  - Logout calls `posthog.reset()`, which clears super properties: after Logout, open
    `?internal=1` again.
  - PostHog side, set by hand: Settings, Project, Product analytics, "Filter out internal and test
    users": event property `internal` is not set; enable the filter on new insights by default.
- Rules, add:
  - Never `opt_out_capturing` (or stop capturing) for the owner or a tagged device: it stops
    `identify` and breaks flag targeting. Tag only.
  - `internal` (property name) with boolean `true` is a literal PostHog filters match on; never
    rename it; it lives only in `src/lib/analytics.ts`.
  - Never initialise PostHog when `navigator.webdriver` is `true`.
  - Keep `instrumentation-client.ts` non-throwing: no parameter, a malformed query and a missing
    `navigator` all leave it silent.
- Update `docs/conditional-docs.md`'s analytics line to add: "tagging a device as internal
  (`?internal=`) or excluding automated browsers".
- No em-dashes anywhere.

### 7. Browser coverage

- None needed: the behaviour only exists where PostHog is initialised (the production deploy, with
  `NEXT_PUBLIC_VERCEL_ENV=production`), which local dev, worktrees and the review server never are,
  so no page renders differently. The profile has no E2E code suite; no `e2e/*.md` journey is added
  because a journey could not observe PostHog locally. Evidence is the diff and the unit tests. The
  owner verifies on production after release (see Notes).

### 8. Run the Validation Commands

## Testing Strategy

### Unit Tests

Vitest in `src/lib/analytics.test.ts`, node environment, fake client of `vi.fn()`s, as described in
task 3.

### Test Coverage

- `internalTagAction` tests (vitest, `src/lib/analytics.test.ts`): catch a wrong parse of the
  `internal` parameter (tagging on `yes` or empty, ignoring it beside other parameters); the function
  does not exist today.
- `startAnalytics` tests (vitest, same file): catch an automated browser initialising PostHog, a
  lost production/variable check, and `register` / `unregister` being skipped, swapped or called with
  the wrong property; nothing tests the init condition today. The negative check in task 5 proves the
  webdriver test fails without the condition.

### Edge Cases

- `navigator.webdriver` `undefined` (initialise) versus `true` (do not).
- `navigator` or `window` missing: no init, no throw.
- `?internal=` empty, `?internal=yes`, `?internal=1&internal=0` (first value wins with `get`, so
  `"tag"`), `?a=b&internal=1`, empty search.
- Non-production env, or token or host missing: no init and no tag call even with `?internal=1`.
- Tag on a non-production deploy is a no-op (PostHog not initialised).

## Acceptance Criteria

- `instrumentation-client.ts` never calls `posthog.init` when `navigator.webdriver === true`, and
  keeps the `=== "production"` and both variable checks unchanged in meaning.
- After init, `?internal=1` calls `posthog.register({ internal: true })` with no expiry,
  `?internal=0` calls `posthog.unregister("internal")`, anything else does nothing.
- `src/lib/analytics.ts` still never imports `posthog-js`; `posthog-js` imports remain only where
  the doc allows.
- No `opt_out_capturing` anywhere; the Login / Logout button, its flag and identify/reset are
  untouched.
- Unit tests from task 3 pass; the webdriver test fails when the condition is removed.
- `app_docs/analytics.md` documents exclusion, tagging, untagging, re-tagging after Logout, the
  PostHog filter and the new Rules; `docs/conditional-docs.md` line updated.
- No new dependencies; no em-dashes; all validation commands pass.

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

- `yarn lint` - ESLint over the changed files.
- `yarn typecheck` - the adapter satisfies `AnalyticsClient` against posthog-js types.
- `yarn knip` - no unused exports or types from the new helpers.
- `yarn format:check` - Prettier formatting.
- `yarn test` - the new `internalTagAction` and `startAnalytics` tests plus all existing tests.
- `yarn build` - `instrumentation-client.ts` still bundles and the app builds.
- `yarn check:og` - the post-build metadata check still passes.
- `grep -rn "posthog-js" src instrumentation-client.ts` - imports only in client components,
  `instrumentation-client.ts` and `src/app/global-error.tsx`, not in `src/lib/analytics.ts`.
- `grep -rn "opt_out_capturing" src instrumentation-client.ts || true` - must print nothing.
- `grep -rnP "\x{2014}" instrumentation-client.ts src/lib/analytics.ts src/lib/analytics.test.ts app_docs/analytics.md docs/conditional-docs.md specs/issue-206-adw-2b58cbdf-sdlc_planner-separate-internal-automated-analytics.md || true` - must print nothing (no em-dashes).

## Notes

- No new dependencies.
- Owner checks on production after release (not covered by the pipeline): open
  `https://build.issebya.com/?internal=1` in each of her browsers; in PostHog Activity the next
  events from that browser show `internal = true`; add the test-account filter. An automated
  browser visit no longer appears in Activity.
- The `?internal=` parameter is read on the first page load only (instrumentation runs once per
  document), so the tagging URL must be opened directly, not navigated to client-side. Any page of
  the site works, `/` is just the documented one.
- Out of scope: IP filtering, consent banners, changes in PostHog itself, anything under `adws/`.
