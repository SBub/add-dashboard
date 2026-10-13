# Patch: Document the `login` feature flag and the header Login / Logout button

## Metadata

adw_id: `dd62c7aa`
review_change_request: `Issue #1: Step 8 (Documentation) and the acceptance criterion 'Docs, the index and the profile are updated' are not implemented. git diff origin/develop touches none of app_docs/analytics.md, app_docs/routing-and-navigation.md, app_docs/screens-and-components.md or docs/conditional-docs.md. Only the profile (.adw/project.md) was updated. The feature's rules (the literal flag key and email, the only identify property, null until the flag is true) are recorded nowhere. Severity: blocker`

## Issue Summary

**Original Spec:** `specs/issue-195-adw-dd62c7aa-sdlc_planner-login-logout-header-flag.md`
**Issue:** Step 8 of the spec was skipped. The code (`src/lib/analytics.ts`, `src/components/IdentifyButton.tsx`, `src/app/layout.tsx`) and the profile are in place, but no feature doc, no header description, no `"use client"` entry and no index line mention the `login` flag, `identify`, `reset` or the button, so the feature's invariants are recorded nowhere.
**Solution:** Docs-only change to four files, following spec Step 8 verbatim: a "Feature flags" section plus four Rules in `app_docs/analytics.md`, one sentence in the header paragraph of `app_docs/routing-and-navigation.md`, one entry in the `"use client"` list of `app_docs/screens-and-components.md`, and an extended `app_docs/analytics.md` line in `docs/conditional-docs.md`. No code changes.

## Files to Modify

- `app_docs/analytics.md`
- `app_docs/routing-and-navigation.md`
- `app_docs/screens-and-components.md`
- `docs/conditional-docs.md`

## Implementation Steps

IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Add "Feature flags" and its Rules to `app_docs/analytics.md`

- Insert a `### Feature flags` subsection under `## How it works`, directly after the `### Events` subsection (after the `global-error.tsx` paragraph, before `## Rules`). Content, in prose matching the file's style (wrapped near 80 columns):
  - The `login` flag: a boolean flag created and targeted by hand in PostHog (by the owner's email). It gates the header's Login / Logout button, `src/components/IdentifyButton.tsx`, whose store is `createIdentityStore` in `src/lib/analytics.ts` (a `useSyncExternalStore` store; `posthog` is passed in as an `IdentityClient`).
  - Login calls `identify(OWNER_EMAIL, { email: OWNER_EMAIL })`; Logout calls `reset()`. The label comes from `get_distinct_id()` (Logout when it equals `OWNER_EMAIL`, Login otherwise), so it survives a reload. The store re-reads on `onFeatureFlags`.
  - The button renders `null` on the server, on the first (hydration) render, and wherever PostHog is not initialised (local dev, worktrees, e2e, preview deploys), where the flag reads `undefined`.
  - It is not authentication: Login only tells PostHog who the visitor is so flags can target the owner; it unlocks nothing in the app.
- Append to `## Rules`, keeping the existing four rules untouched (including the posthog-js import rule):
  - `login` (the flag key) and `sveta@issebya.com` (the owner's email) are literal strings PostHog matches on. Never rename or derive them; they live only in `src/lib/analytics.ts`.
  - The only property sent with `identify` is `email`.
  - The Login / Logout button returns `null` until the `login` flag is `true`.
  - `src/lib/analytics.ts` never imports `posthog-js`, not even as a type: the client is passed in.

### Step 2: Mention the button in the header paragraph of `app_docs/routing-and-navigation.md`

- In the paragraph at lines 21 to 27, before "At the header's right, on every route, the Work with me button", add a sentence such as: "Just before it, a small neutral Login / Logout button (`IdentifyButton`) appears only when the `login` PostHog flag is on (see `app_docs/analytics.md`); it is absent from the prerendered HTML." Adjust the following sentence's wording only as needed so it still reads naturally.

### Step 3: Add `IdentifyButton` to the `"use client"` list in `app_docs/screens-and-components.md`

- In the rule starting "Server components by default; `"use client"` only where the browser must hold state" (line 145), add an entry alongside `ConnectionIndicator` and `WorkerStatus`: "`IdentifyButton`, which subscribes to PostHog's feature flags and distinct id". Keep the list's existing comma and "and" pattern intact.

### Step 4: Extend the analytics line in `docs/conditional-docs.md`

- Change the `app_docs/analytics.md` line to end: "read when adding, renaming or removing a PostHog event, changing `instrumentation-client.ts` or `src/app/global-error.tsx`, or touching the PostHog environment variables; when reading or adding a PostHog feature flag, calling `identify` or `reset`, or changing the header's Login / Logout button."

### Step 5: Format and check for em-dashes

- Run `yarn format` if `yarn format:check` reports any of the four files, then confirm no em-dash was introduced.

## Validation

Execute every command to validate the patch is complete with zero regressions.

- `yarn format:check`: Prettier passes on the four docs.
- `grep -n -i "login\|identify\|feature flag" app_docs/analytics.md app_docs/routing-and-navigation.md app_docs/screens-and-components.md docs/conditional-docs.md`: every one of the four files matches.
- `grep -rnP "\x{2014}" app_docs docs specs/patch .adw`: no em-dashes.
- `yarn lint && yarn typecheck && yarn knip && yarn test`: unchanged and passing (docs-only patch; never stage the rewritten `next-env.d.ts`).
- `git diff --stat`: only the four docs (and this patch plan) changed.

## Patch Scope

**Lines of code to change:** about 30 lines of Markdown, no code
**Risk level:** low
**Testing required:** Prettier and an em-dash grep on the docs; the commit hook's lint, typecheck and knip, and the push hook's unit tests, must still pass.
