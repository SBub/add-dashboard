# Patch: Document internal tagging and automated-browser exclusion in the analytics doc

## Metadata

adw_id: `2b58cbdf`
review_change_request: `Issue #1: Spec task 6 and its acceptance criterion are missing from the diff. The criterion reads: app_docs/analytics.md documents exclusion, tagging, untagging, re-tagging after Logout, the PostHog filter and the new Rules, and the docs/conditional-docs.md line is updated. git diff origin/develop...HEAD --stat lists only instrumentation-client.ts, src/lib/analytics.ts, src/lib/analytics.test.ts and the spec. app_docs/analytics.md still names only the issue-195 spec under Specifications. Its Initialisation section does not mention navigator.webdriver, it has no Internal devices subsection, and none of the four new Rules exists. The analytics line at docs/conditional-docs.md:19 does not mention tagging or automated browsers. Those Rules are invariants in this project: never opt out, internal is a literal PostHog filter, never initialise PostHog under webdriver, keep the instrumentation non-throwing. Without them, nothing protects the behaviour this branch adds. Resolution: edit app_docs/analytics.md exactly as spec task 6 says, extend the analytics line in docs/conditional-docs.md, use no em-dashes, re-run yarn format:check and the spec's em-dash grep. Severity: blocker`

## Issue Summary

**Original Spec:** specs/issue-206-adw-2b58cbdf-sdlc_planner-separate-internal-automated-analytics.md
**Issue:** The code for this branch (`startAnalytics` and `internalTagAction` in `src/lib/analytics.ts`, the rewired `instrumentation-client.ts`) shipped without spec task 6. `app_docs/analytics.md` lists only the issue-195 spec, its Initialisation section omits the `navigator.webdriver` condition, it has no Internal devices subsection and none of the four new Rules; the analytics line in `docs/conditional-docs.md` does not route tagging or automated-browser work to the doc.
**Solution:** Docs-only edits to two files, matching spec task 6 and the code as written: add the spec path, extend Initialisation, add a `### Internal devices` subsection, add the new Rules (extending the existing non-throwing rule rather than duplicating it), and extend the index line. No code changes. No em-dashes.

## Files to Modify

Use these files to implement the patch:

- `app_docs/analytics.md`
- `docs/conditional-docs.md`

## Implementation Steps

IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Add the spec and extend Initialisation in `app_docs/analytics.md`

- Under `**Specifications:**`, append `- specs/issue-206-adw-2b58cbdf-sdlc_planner-separate-internal-automated-analytics.md` after the issue-195 line.
- In `### Initialisation`, after the first paragraph's sentence ending "...with a token in `.env.local`.", add: "It also requires a browser whose `navigator.webdriver` is not `true`, so Playwright and other automated browsers never start PostHog. The whole condition lives in `startAnalytics` in `src/lib/analytics.ts`, which takes the environment, the browser (`navigator.webdriver` and `window.location.search`, or nothing when either is missing) and a small client adapter over `posthog`, so it is testable in node." Keep the remaining sentences ("All three are inlined at build time...", "Elsewhere every `posthog.capture` is a no-op.") in place.

### Step 2: Add the `### Internal devices` subsection

- Place it under `## How it works`, after `### Feature flags` (it refers to Logout), before `## Rules`.
- Content, in the doc's prose style:
  - Tag a browser once by opening `https://build.issebya.com/?internal=1` directly (instrumentation runs once per document, so a client-side navigation does not count; any page works). Right after `init`, `startAnalytics` calls `register({ internal: true })`, a persistent super property sent with every later event from that browser.
  - `?internal=0` calls `unregister("internal")`. Any other value, or no parameter, does nothing (`internalTagAction` in `src/lib/analytics.ts`).
  - Logout calls `posthog.reset()`, which clears super properties, so after Logout open `?internal=1` again.
  - PostHog side, set by hand: Settings, Project, Product analytics, "Filter out internal and test users", with the event property `internal` is not set; enable the filter on new insights by default.
  - Tagging never opts the browser out: events are still captured, `identify` and the `login` flag keep working, and the filter hides them from insights.

### Step 3: Add the new Rules

- Replace the existing rule "`instrumentation-client.ts` never throws when a variable is missing." with: "`instrumentation-client.ts` never throws: a missing variable, no `?internal=` parameter, a malformed query and a missing `navigator` or `window` all leave it silent."
- After "Never initialise PostHog outside the production deploy: keep the `NEXT_PUBLIC_VERCEL_ENV === \"production\"` check.", add: "Never initialise PostHog when `navigator.webdriver` is `true`."
- After the `login` / owner-email literal rule, add: "`internal` (the super property name) with boolean `true` is a literal PostHog filters match on. Never rename or derive it; it lives only in `src/lib/analytics.ts`."
- Add: "Never call `opt_out_capturing` (or otherwise stop capturing) for the owner or a tagged device: it stops `identify` and breaks flag targeting. Tag only."

### Step 4: Extend the analytics line in `docs/conditional-docs.md`

- On the `app_docs/analytics.md` line (line 19), replace the final "or changing the header's Login / Logout button." with "changing the header's Login / Logout button; or tagging a device as internal (`?internal=`) or excluding automated browsers."
- Then run `yarn format` so Prettier settles both Markdown files.

## Validation

Execute every command to validate the patch is complete with zero regressions.

- `yarn format:check` - both edited Markdown files pass Prettier.
- `grep -rnP "\x{2014}" instrumentation-client.ts src/lib/analytics.ts src/lib/analytics.test.ts app_docs/analytics.md docs/conditional-docs.md specs/issue-206-adw-2b58cbdf-sdlc_planner-separate-internal-automated-analytics.md specs/patch/patch-adw-2b58cbdf-document-internal-analytics.md || true` - must print nothing (no em-dashes).
- `grep -n "issue-206\|webdriver\|### Internal devices\|opt_out_capturing\|Filter out internal and test users" app_docs/analytics.md` - shows the spec path, the Initialisation sentence, the subsection, the opt-out rule and the PostHog setting.
- `grep -n "internal (\`?internal=\`) or excluding automated browsers" docs/conditional-docs.md` - shows the extended index line.
- `yarn lint && yarn typecheck && yarn knip && yarn test` - the commit and push hooks still pass (no code changed).

## Patch Scope

**Lines of code to change:** about 30 lines of Markdown across two files, no code
**Risk level:** low
**Testing required:** formatting, the em-dash grep and content greps; the hook checks for zero regressions
