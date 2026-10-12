# Analytics

## Overview

PostHog runs in the browser on every page. It is initialised once in
`instrumentation-client.ts` (repository root), which Next loads before the app
hydrates. There is no server-side tracking.

## How it works

### Initialisation

`posthog.init` runs only when both `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and
`NEXT_PUBLIC_POSTHOG_HOST` are set. Both are public and inlined at build time,
so a change to either needs a new deploy. Without them (local dev, ADW
worktrees, e2e) nothing is initialised and every `posthog.capture` is a no-op.

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

## Rules

- Never send what a visitor typed: no email, name, message or search text. Send
  lengths, counts and enum values only.
- `posthog-js` is imported only in client components, `instrumentation-client.ts`
  and `src/app/global-error.tsx`.
- `instrumentation-client.ts` never throws when a variable is missing.
