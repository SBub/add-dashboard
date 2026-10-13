# Feature: Login/Logout in the header behind the login feature flag

## Metadata

issue_number: `195`
adw_id: `dd62c7aa`
issue_json: `{"number":195,"title":"Login/Logout in the header behind the login feature flag"}`

## Feature Description

A small secondary Login / Logout button in the root header's right group, before the Work with me
button, shown only when the PostHog feature flag `login` is on for the visitor. Login calls
`posthog.identify("sveta@issebya.com", { email: "sveta@issebya.com" })`; Logout calls
`posthog.reset()`. The label is read back from PostHog (`get_distinct_id()`), so it survives a
reload. This is not authentication: it only tells PostHog who the visitor is, so the owner can then
be targeted by email in other flags (for example `machine-onboarding`). The flag is the only thing
that hides the button.

PostHog is initialised only on the production deploy (`instrumentation-client.ts`). Everywhere else
`isFeatureEnabled` returns `undefined` and the button never renders. On the server and on the first
client render the component returns `null`, so the prerendered header is byte-identical to today.

## User Story

As the site owner
I want to identify myself to PostHog from the live site with one click
So that feature flags can target me by email without any real login system

## Problem Statement

Nothing in the code reads a PostHog feature flag or calls `posthog.identify`. The owner is an
anonymous distinct id like every other visitor, so a flag cannot be targeted at her by email.

## Solution Statement

Follow the existing `useSyncExternalStore` pattern (`ConnectionIndicator`, `WorkerStatus` with the
pure `src/lib/worker-state.ts`):

- `src/lib/analytics.ts` (new, no `posthog-js` import, so it stays plain and testable in node):
  the two literal constants `OWNER_EMAIL = "sveta@issebya.com"` and `LOGIN_FLAG = "login"`, a
  structural `IdentityClient` interface (the five PostHog methods used), and
  `createIdentityStore(client)` returning `{ subscribe, getSnapshot, getServerSnapshot, login, logout }`.
  - Snapshot type `IdentityAction = "login" | "logout" | null` (plain strings, so the snapshot is
    referentially stable between reads).
  - `getSnapshot()`: `null` unless `client.isFeatureEnabled(LOGIN_FLAG) === true` (checked first and
    short-circuiting, so nothing else is read when the flag is off or PostHog is not initialised);
    otherwise `"logout"` when `client.get_distinct_id() === OWNER_EMAIL`, else `"login"`.
  - `getServerSnapshot()`: always `null`, so server HTML and the hydration render are empty.
  - `subscribe(listener)`: adds the listener to a local set and calls
    `client.onFeatureFlags(() => listener())`; returns a function that removes the listener and calls
    the unsubscribe that `onFeatureFlags` returned.
  - `login()`: `client.identify(OWNER_EMAIL, { email: OWNER_EMAIL })`, then notify local listeners.
    `logout()`: `client.reset()`, then notify. Notifying locally is what flips the label at once;
    PostHog's own flag reload after identify/reset fires `onFeatureFlags` again later.
- `src/components/IdentifyButton.tsx` (new, `"use client"`): imports `posthog` from `posthog-js`,
  creates the store once at module level, reads it with
  `useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)`, returns
  `null` for a `null` snapshot, otherwise a `<button type="button">` labelled Login or Logout whose
  `onClick` is `store.login` / `store.logout`. React calls the returned unsubscribe on unmount.
- `src/app/layout.tsx`: render `<IdentifyButton />` in the right group between the "Built with ADW"
  span and `<HireLink />`.

Verified in the installed `posthog-js` (`dist/module.js`): on an uninitialised instance
`isFeatureEnabled` returns `undefined`, `get_distinct_id` returns `undefined` without throwing, and
`onFeatureFlags` calls its callback synchronously once and returns a no-op unsubscribe. So the store
is safe in local dev, worktrees, e2e and previews, and `instrumentation-client.ts` stays untouched.

## Relevant Files

Use these files to implement the feature:

- `app_docs/analytics.md`: the PostHog rules (posthog-js only in client components,
  `instrumentation-client.ts`, `global-error.tsx`; never send what a visitor typed; production-only
  init). Gets a "Feature flags" section.
- `app_docs/routing-and-navigation.md`: describes the header's right group (lines 21-27); add the
  button.
- `app_docs/screens-and-components.md`: the `"use client"` list (lines 145-165); add
  `IdentifyButton`.
- `docs/conditional-docs.md`: the `app_docs/analytics.md` line gains feature flags and the header
  button.
- `app_docs/hire.md`: owns the Work with me header button; read to keep it unchanged.
- `src/app/layout.tsx`: the root layout and header; the button goes in the right group before
  `HireLink`.
- `src/components/SectionNav.tsx`: `HireLink` and its classes (`rounded-md px-3 py-1.5 text-sm
font-medium`), the size the new button matches.
- `src/components/WorkerStatus.tsx`, `src/components/ConnectionIndicator.tsx`: the existing
  `useSyncExternalStore` store pattern to copy.
- `src/lib/worker-state.ts`, `src/lib/worker-state.test.ts`: the pure-helper-plus-node-test pattern.
- `src/components/RunRow.test.ts`: the `renderToStaticMarkup` + `createElement` component test
  pattern (no JSX, `.test.ts`, node environment).
- `instrumentation-client.ts`: read only; must not change.
- `vitest.config.ts`: `include: ["src/**/*.test.ts"]`, node environment; tests must be `.test.ts`.
- `knip.json`: dead-code scan of `src/**`; every new export must be imported somewhere.
- `node_modules/posthog-js/dist/module.d.ts`: the API signatures used.
- `e2e/test_header_section_active.md`: the journey format to model the new one on.
- `.adw/project.md`: its Tests section lists every `e2e/*.md` journey; add the new one.

### New Files

- `src/lib/analytics.ts`: constants and the pure identity store.
- `src/lib/analytics.test.ts`: unit tests of the store with a fake client.
- `src/components/IdentifyButton.tsx`: the client component.
- `src/components/IdentifyButton.test.ts`: server-render test with `posthog-js` mocked.
- `e2e/test_header_login_hidden.md`: journey proving the button is absent where PostHog is not
  initialised.

## Implementation Plan

### Phase 1: Foundation

Write `src/lib/analytics.ts` with the constants, the `IdentityClient` interface and
`createIdentityStore`, plus its unit tests.

### Phase 2: Core Implementation

Write `IdentifyButton.tsx` on top of the store, and its server-render test.

### Phase 3: Integration

Mount it in the root layout's header, update the docs, the index and the profile, add the e2e
journey, run every check.

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. Read the framework and project docs

- Read `app_docs/analytics.md`, `app_docs/screens-and-components.md` (the `"use client"` rule),
  `app_docs/routing-and-navigation.md` (header) and `app_docs/clock-and-prerender.md` (what ships in
  the prerendered shell).
- Skim `node_modules/next/dist/docs/` for client components in a root layout under
  `cacheComponents`, to confirm a client component returning `null` on the server keeps the header
  in the static shell.

### 2. Create `src/lib/analytics.ts`

- File comment in the style of `src/lib/worker-state.ts`: what it is, that it never imports
  `posthog-js` (the client is passed in), and that it is not authentication.
- `export const OWNER_EMAIL = "sveta@issebya.com";` and `export const LOGIN_FLAG = "login";` with a
  comment that both are literal strings PostHog conditions match on and must not be renamed or
  derived. Export only what another module imports (knip); if `LOGIN_FLAG` ends up used only in this
  file, drop its `export`.
- `export interface IdentityClient { isFeatureEnabled(key: string): boolean | undefined;
onFeatureFlags(callback: () => void): () => void; get_distinct_id(): string | undefined;
identify(distinctId: string, properties: { email: string }): void; reset(): void; }`. Check with
  `yarn typecheck` that the real `posthog` default export is assignable to it (adjust parameter
  types to the installed signatures if not, never with a cast).
- `export type IdentityAction = "login" | "logout" | null;`
- `export function createIdentityStore(client: IdentityClient)` as described in the Solution
  Statement. Identify properties are exactly `{ email: OWNER_EMAIL }`, nothing else.

### 3. Create `src/lib/analytics.test.ts`

Fake client: `vi.fn()` methods with a mutable `flag` (`undefined | boolean`) and `distinctId`,
`identify` setting `distinctId` to its argument, `reset` setting it to an anonymous id, and
`onFeatureFlags` returning a `vi.fn()` unsubscribe. Use the literal `"sveta@issebya.com"` in
assertions, not the constant, so a rename fails the test. Cases:

- flag `undefined`: `getSnapshot()` is `null`, and `get_distinct_id` was not called.
- flag `false`: `getSnapshot()` is `null`.
- `getServerSnapshot()` is `null` even with the flag `true`.
- flag `true`, anonymous id: snapshot `"login"`; `login()` calls `identify` exactly once with
  `("sveta@issebya.com", { email: "sveta@issebya.com" })`, a subscribed listener is called, and the
  snapshot becomes `"logout"`.
- flag `true`, id `"sveta@issebya.com"`: snapshot `"logout"`; `logout()` calls `reset` exactly
  once, the listener is called, the snapshot becomes `"login"`.
- `subscribe` calls `onFeatureFlags` once; invoking the callback passed to it calls the listener;
  calling the function `subscribe` returned calls the unsubscribe `onFeatureFlags` returned exactly
  once, and a later `login()` no longer calls that listener.

### 4. Create `src/components/IdentifyButton.tsx`

- `"use client"`, `import posthog from "posthog-js"`, `import { useSyncExternalStore } from "react"`.
- `const store = createIdentityStore(posthog);` at module level, with a short comment: server and
  hydration render `null` (no layout shift, no hydration mismatch), the flag is the only gate,
  `posthog` is a no-op outside production so the button never appears there.
- Render `null` for a `null` snapshot; otherwise
  `<button type="button" onClick={...} className="rounded-md border border-neutral-300 px-3 py-1.5
text-sm font-medium whitespace-nowrap text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700
dark:text-neutral-300 dark:hover:bg-neutral-800">`. Same padding and text size as `HIRE_LINK`
  (equal height with a 1px border; use `py-[5px]` only if the review screenshots show a height
  difference), neutral, no accent.
- Label `Login` for `"login"`, `Logout` for `"logout"`. No `posthog.capture` here; autocapture
  already records the click.

### 5. Create `src/components/IdentifyButton.test.ts`

- `vi.mock("posthog-js", ...)` with a default export whose `isFeatureEnabled` returns `true`,
  `get_distinct_id` returns an anonymous id, `onFeatureFlags` returns `vi.fn()`.
- `renderToStaticMarkup(createElement(IdentifyButton))` is `""`: the server render is empty even
  with the flag on, which pins the "header renders exactly as today" constraint.

### 6. Negative check (not committed)

- Temporarily change `getSnapshot` to skip the flag check (treat it as always `true`) and run
  `yarn test`: the flag `undefined` and `false` cases in `src/lib/analytics.test.ts` must fail.
  Restore the check, rerun `yarn test` green, and confirm `git diff` has no trace of the probe.

### 7. Mount it in `src/app/layout.tsx`

- Import `IdentifyButton` and render it in `<div className="ml-auto flex items-center gap-3">`
  between the "Built with ADW" span and `<HireLink />`. No `Suspense` needed (it never suspends),
  and no `cookies()`, `headers()` or `connection()`.

### 8. Documentation

- `app_docs/analytics.md`: add a "Feature flags" section after Events: the `login` flag (boolean,
  created and targeted by hand in PostHog), what it shows (the Login / Logout button in the header,
  `src/components/IdentifyButton.tsx`, store in `src/lib/analytics.ts`), Login =
  `identify(OWNER_EMAIL, { email: OWNER_EMAIL })`, Logout = `reset()`, the label comes from
  `get_distinct_id()` so it survives a reload, it renders `null` on the server, on first render and
  wherever PostHog is not initialised, and it is not authentication. Add Rules: the flag key `login`
  and `sveta@issebya.com` are literal strings PostHog matches on, never renamed or derived, and live
  only in `src/lib/analytics.ts`; the only identify property is `email: OWNER_EMAIL`; the button
  returns `null` until the flag is `true`. Keep the existing posthog-js import rule (the lib file
  takes the client as a parameter and never imports it).
- `app_docs/routing-and-navigation.md`: in the header paragraph, mention the small neutral
  Login / Logout button before Work with me, shown only when the `login` flag is on (see
  `app_docs/analytics.md`), absent from the prerendered HTML.
- `app_docs/screens-and-components.md`: add `IdentifyButton`, which subscribes to PostHog's feature
  flags and distinct id, to the `"use client"` list.
- `docs/conditional-docs.md`: extend the `app_docs/analytics.md` line with "reading or adding a
  PostHog feature flag, calling `identify` or `reset`, or changing the header's Login / Logout
  button".
- No em-dashes anywhere.

### 9. E2E journey and profile

- Create `e2e/test_header_login_hidden.md` modelled on `e2e/test_header_section_active.md`
  (`## User Story`, `## Test Steps` with `**Verify**` lines, `## Success Criteria`): on `/`,
  `/projects`, `/writing` and `/hire`, **Verify** the header has no button or link named `Login` or
  `Logout`, and the `Work with me` link (`href="/hire"`) is present. One screenshot of `/` at
  1920x1080. A journey because the claim is about the real served page with PostHog uninitialised,
  which the node unit layer cannot observe.
- Add `e2e/test_header_login_hidden.md` to the journey list in `.adw/project.md`'s Tests section
  (no heading changes).

### 10. Run the Validation Commands

Every command below, in order, all passing.

## Testing Strategy

### Unit Tests

- `src/lib/analytics.test.ts`: the store against a fake `IdentityClient`, covering the flag gate,
  both labels, both clicks, listener notification and unsubscribe (step 3).
- `src/components/IdentifyButton.test.ts`: the component's server render is empty with
  `posthog-js` mocked and the flag on (step 5).

### Test Coverage

- `src/lib/analytics.test.ts` (unit, vitest): catches the button showing without the flag, a wrong
  identify id or extra properties, a label that does not flip after a click, and a leaked
  `onFeatureFlags` subscription on unmount. Fails without the feature (module does not exist) and
  fails under the step 6 probe.
- `src/components/IdentifyButton.test.ts` (unit, vitest): catches anything that would put the button
  into the server or hydration HTML (layout shift, hydration mismatch).
- The journey `e2e/test_header_login_hidden.md` is listed as a task (step 9), not as a regression
  layer.

### Edge Cases

- PostHog not initialised (dev, worktrees, e2e, previews): flag `undefined`, nothing renders,
  `get_distinct_id` is never read.
- Flags not loaded yet on production: `undefined`, nothing renders until `onFeatureFlags` fires.
- `onFeatureFlags` calling its callback synchronously inside `subscribe` (it does when uninitialised
  or already loaded): the listener just triggers a re-read; no error.
- After Logout, PostHog reloads flags for the new anonymous id; if the flag is targeted at
  `email = sveta@issebya.com`, the button disappears. Expected.
- Flag switched off while the page is open: next flag reload hides the button.
- Reload after Login: `get_distinct_id()` is the email from persistence, label is Logout.

## Acceptance Criteria

- The header renders exactly as today on the server and on the first client render; the button is
  absent from the prerendered HTML.
- With `login` on and an anonymous visitor, the header shows Login before Work with me; clicking it
  calls `identify("sveta@issebya.com", { email: "sveta@issebya.com" })` once and shows Logout.
- With the visitor identified as `sveta@issebya.com`, it shows Logout; clicking calls `reset()` once
  and shows Login.
- With the flag `false` or `undefined`, nothing renders.
- Unmount calls the unsubscribe returned by `onFeatureFlags`.
- `OWNER_EMAIL` and `LOGIN_FLAG` are defined once, in `src/lib/analytics.ts`.
- `instrumentation-client.ts` is unchanged; `posthog-js` is imported only in client components,
  `instrumentation-client.ts` and `src/app/global-error.tsx`.
- Docs, the index and the profile are updated; no em-dashes.
- Every validation command passes.

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

- `yarn lint`: ESLint, including the security and no-secrets plugins.
- `yarn typecheck`: proves `posthog` satisfies `IdentityClient` and the layout compiles (never stage
  the rewritten `next-env.d.ts`).
- `yarn knip`: no unused export from `src/lib/analytics.ts` or the new component.
- `yarn format:check`: Prettier on the new files and docs.
- `yarn test`: the new unit tests and every existing one.
- `yarn build`: the header still prerenders on every route with the client button in it.
- `git diff --stat instrumentation-client.ts`: empty, the file is untouched.
- `grep -rn "posthog-js" src`: only client components and `src/app/global-error.tsx`.
- `grep -rn "sveta@issebya.com\|\"login\"" src --include=*.ts --include=*.tsx`: the literals only in
  `src/lib/analytics.ts` (and the tests).
- `grep -rn "—" src app_docs docs e2e specs .adw`: no em-dashes.

## Notes

- No new dependency. The issue asks for a component test with clicks and unmount; this project has
  no DOM test environment (vitest runs `src/**/*.test.ts` in node, and the profile says there is no
  component test layer). Instead of adding jsdom or Testing Library, all behaviour lives in the pure
  `createIdentityStore`, tested in node, and the component is a thin `useSyncExternalStore` reader
  whose server render is tested with `renderToStaticMarkup`. React itself guarantees the
  subscribe/unsubscribe pairing on mount and unmount.
- `src/lib/analytics.ts` does not import `posthog-js` (not even as a type), so the import rule in
  `app_docs/analytics.md` holds as written.
- Production check is the owner's (out of the pipeline): after release, switch `login` on, Login,
  confirm PostHog People shows `sveta@issebya.com` with `email` set, Logout resets, then retarget
  the flag to `email = sveta@issebya.com`.
- Out of scope: real authentication, `machine-onboarding`, server-side flags, changing flags in
  PostHog, anything under `adws/`.
