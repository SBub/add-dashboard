# Analytics

**Specifications:**

- specs/issue-195-adw-dd62c7aa-sdlc_planner-login-logout-header-flag.md

## Overview

PostHog runs in the browser on every page. It is initialised once in
`instrumentation-client.ts` (repository root), which Next loads before the app
hydrates. There is no server-side tracking.

## How it works

### Initialisation

`posthog.init` runs only on the production deploy: when
`NEXT_PUBLIC_VERCEL_ENV` is `production` and both
`NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` are set.
`NEXT_PUBLIC_VERCEL_ENV` is a Vercel system variable, absent in local builds,
so local dev, ADW worktrees, e2e and preview deploys never send events, even
with a token in `.env.local`. All three are inlined at build time, so a change
needs a new deploy. Elsewhere every `posthog.capture` is a no-op.

`defaults: "2026-01-30"` turns on PostHog's default capture: pageviews and
page leaves on client-side navigation, and autocapture of clicks.
`capture_exceptions: true` sends unhandled browser errors.

### Events

| event                     | sent from                            | properties                                |
| ------------------------- | ------------------------------------ | ----------------------------------------- |
| `hire_request_submitted`  | `src/components/HireRequestForm.tsx` | `offer` (the `OFFERS` value), `from_door` |
| `run_history_searched`    | `src/components/HistorySearch.tsx`   | `query_length`                            |
| `today_summary_refreshed` | `src/components/TodaySummary.tsx`    | `trigger` (`button` or `retry`)           |

`hire_request_submitted` fires on submit, before the server action validates
the form, so it counts attempts, not delivered emails. `from_door` is true when
the offer came from `?offer=` rather than the select.

`src/app/global-error.tsx` sends an error that takes down the root layout with
`posthog.captureException`.

### Feature flags

The `login` flag is a boolean flag created and targeted by hand in PostHog (by
the owner's email). It gates the header's Login / Logout button,
`src/components/IdentifyButton.tsx`, whose store is `createIdentityStore` in
`src/lib/analytics.ts`: a `useSyncExternalStore` store, with `posthog` passed
in as an `IdentityClient`.

Login calls `identify(OWNER_EMAIL, { email: OWNER_EMAIL })`; Logout calls
`reset()`. The label comes from `get_distinct_id()` (Logout when it equals
`OWNER_EMAIL`, Login otherwise), so it survives a reload. The store re-reads
on `onFeatureFlags`.

The button renders `null` on the server, on the first (hydration) render, and
wherever PostHog is not initialised (local dev, worktrees, e2e, preview
deploys), where the flag reads `undefined`.

It is not authentication: Login only tells PostHog who the visitor is so flags
can target the owner; it unlocks nothing in the app.

## Rules

- Never send what a visitor typed: no email, name, message or search text. Send
  lengths, counts and enum values only.
- `posthog-js` is imported only in client components, `instrumentation-client.ts`
  and `src/app/global-error.tsx`.
- `instrumentation-client.ts` never throws when a variable is missing.
- Never initialise PostHog outside the production deploy: keep the
  `NEXT_PUBLIC_VERCEL_ENV === "production"` check.
- `login` (the flag key) and `sveta@issebya.com` (the owner's email) are
  literal strings PostHog matches on. Never rename or derive them; they live
  only in `src/lib/analytics.ts`.
- The only property sent with `identify` is `email`.
- The Login / Logout button returns `null` until the `login` flag is `true`.
- `src/lib/analytics.ts` never imports `posthog-js`, not even as a type: the
  client is passed in.
