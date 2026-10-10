# Patch: Write the spec step 12 docs for the who-you-are home page and `/watch`

## Metadata

adw_id: `98e70d08`
review_change_request: `Issue #1: Spec step 12 (Docs) and the acceptance criterion 'All docs listed in task 12 updated, app_docs/home.md added and indexed' are not in the diff. git diff origin/develop touches no file under app_docs/, docs/ or README.md, and app_docs/home.md does not exist. Resolution: on this branch, do all of spec step 12 (create app_docs/home.md; edit routing-and-navigation, summary, history-revalidation, clock-and-prerender, hire, screens-and-components, realtime, data-boundary and error-and-loading-boundaries so every summary reference says /watch; index home.md, repoint summary.md and extend hire.md in docs/conditional-docs.md; update README.md's opening paragraph and Documentation list; fix the stale '`/` shows public projects only' comment in src/app/api/revalidate/route.ts). No em-dashes, rerun yarn format:check. Severity: blocker`

## Issue Summary

**Original Spec:** `specs/issue-169-adw-98e70d08-sdlc_planner-who-you-are-home-page.md`
**Issue:** The code moved the summary from `/` to `/watch`, added the static intro page at `/` and the `?offer=` preselect on `/hire`, but no doc under `app_docs/`, `docs/conditional-docs.md` or `README.md` was touched. `app_docs/home.md` does not exist, every feature doc still calls `/` the summary (`src/app/page.tsx`), the index still routes "changing `/`" to `summary.md`, and `src/app/api/revalidate/route.ts:19` still says "`/` shows public projects only". AGENTS.md requires docs in the same change.
**Solution:** Docs-only patch (plus one comment line) that executes spec step 12 verbatim: one new feature doc, in-place edits to nine existing docs, the index and the README. No code behaviour changes.

## Files to Modify

- `app_docs/home.md` (new)
- `app_docs/routing-and-navigation.md`
- `app_docs/summary.md`
- `app_docs/history-revalidation.md`
- `app_docs/clock-and-prerender.md`
- `app_docs/hire.md`
- `app_docs/screens-and-components.md`
- `app_docs/realtime.md`
- `app_docs/data-boundary.md`
- `app_docs/error-and-loading-boundaries.md`
- `docs/conditional-docs.md`
- `README.md`
- `src/app/api/revalidate/route.ts` (comment only)

## Implementation Steps

IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Create `app_docs/home.md`

- Read `src/app/page.tsx`, `src/content/home.ts` and `hireOfferHref` in `src/lib/hire-request.ts` first so the doc describes what shipped. Copy the shape of an existing doc (e.g. `app_docs/hire.md`): `# Home page` title, `**Specifications:**` list with `specs/issue-169-adw-98e70d08-sdlc_planner-who-you-are-home-page.md`, `## Overview`, `## How it works`, `## Rules`.
- Overview: `/` (`src/app/page.tsx`) is a static intro page outside `(dashboard)`: an `h1`, the intro, the ADW line with its "Watch me build" link to `/watch`, and two door cards into `/hire?offer=product-engineer` and `/hire?offer=ai-consulting`. No sidebar, no pill.
- How it works: all copy comes from `src/content/home.ts`; door hrefs are built by `hireOfferHref` (the slug table lives in `src/lib/hire-request.ts`, see `app_docs/hire.md`); there is no live figure on purpose, since it would be a third argument-less clock read (see `app_docs/clock-and-prerender.md`); the page is prerendered whole.
- Rules (exactly these four): "`src/app/page.tsx` never reads anything at request time: no `connection()`, no `searchParams`, no clock, no `cookies()`/`headers()`, no `@/data` import." "The page's copy lives only in `src/content/home.ts`." "Door hrefs come only from `hireOfferHref`." "Never mount `Providers` or Realtime on `/`."

### Step 2: Repoint the summary docs to `/watch`

- `app_docs/summary.md`: line 10 "The summary at `/` (`src/app/page.tsx`)" becomes `/watch` (`src/app/watch/page.tsx`); line 49 "`/` is the landing page" becomes "`/watch` is the summary page (the landing page is the intro at `/`, `app_docs/home.md`)"; line 108 `src/app/page.tsx` becomes `src/app/watch/page.tsx`; line 125 `src/app/summary-providers.tsx` becomes `src/app/watch/summary-providers.tsx`; Rules line 153 "The summary is the root route `/`, `src/app/page.tsx`, outside" becomes "The summary is `/watch`, `src/app/watch/page.tsx`, outside `(dashboard)`". Sweep the file for any other `/` meaning the summary. Add the spec link.
- `app_docs/routing-and-navigation.md`: Overview route tree lists `/`, `/watch`, `/projects`, `/projects/[owner]/[repo]`, `/hire` and the `/summary` redirect. How it works (around line 62): the brand links to `/` (the intro page, `app_docs/home.md`); "Watch me build" links to `/watch` and is current on `/watch`, `/projects` and every project page; the summary is `src/app/watch/page.tsx` outside `(dashboard)`; `/` is `src/app/page.tsx`, static, outside `(dashboard)`; `/summary` is a 308 to bare `/watch`. Rules: `headerSection` answers `"home"` (exactly `/`), `"watch"` (`/watch`, `/watch/`, `/projects` and below `/projects/`, never `/watchx` or `/projectsx`), `"hire"` or null; the `/summary` rule says `/watch`; `SectionNav` links to `/watch` only. Read `src/lib/header-section.ts` and `src/components/SectionNav.tsx` to match the shipped names. Add the spec link.
- `app_docs/history-revalidation.md`: lines 31, 209, 286, 402 (and any other "summary page's (`/`)" / "summary (`/`)") say `/watch`. Add a sentence in the Webhook revalidation section: revalidation is by tag, not path, so the move to `/watch` needed no `revalidatePath`, and none may be added (also as a Rules bullet). Add the spec link.
- `app_docs/clock-and-prerender.md`: lines 47 and 77 say `requestToday` lives in `src/app/watch/page.tsx`; add that `/` (`src/app/page.tsx`) reads no clock and the count of argument-less clock sites does not change. Add the spec link.

### Step 3: `/hire` preselect, and the remaining `/` references

- `app_docs/hire.md`: in "The page", `HireStatus` also maps `?offer=` through `hireOfferFromSlug` into the select's `defaultValue`: `product-engineer` to `Product engineer`, `ai-consulting` to `AI consulting`, anything else (missing, unknown, array, prototype key, an option value) the first option. The slugs are deliberately not the `OFFERS` values. `hireOfferHref` builds the `/` doors' links. Add two Rules: "Never render the raw `?offer` value; the page only ever uses the `Offer` `hireOfferFromSlug` returns." and "Every change to the slug table goes with a test case in `src/lib/hire-request.test.ts`." Add the spec link.
- `app_docs/data-boundary.md` line 122 and `app_docs/error-and-loading-boundaries.md` line 97: "The summary page (`/`)" becomes `/watch`.
- `app_docs/screens-and-components.md` line 155: `src/app/summary-providers.tsx` becomes `src/app/watch/summary-providers.tsx`; any "summary (`/`)" becomes `/watch`.
- `app_docs/realtime.md` line 247: "the summary page `src/app/page.tsx`" becomes `src/app/watch/page.tsx`; the Realtime rule that names routes without the channel covers `/`, `/watch` and `/hire`.
- Before finishing, `grep -n "(\`/\`)\|src/app/page.tsx\|src/app/summary-providers" app_docs/*.md`and fix any remaining summary meaning; only`home.md`and the routing/clock lines about the intro page may still name`src/app/page.tsx`.

### Step 4: Index, README and the stale comment

- `docs/conditional-docs.md`: add ``- `app_docs/home.md`: read when changing `/`, its copy in `src/content/home.ts` or its two doors into `/hire`.``; change the `summary.md` line to "read when changing `/watch`, its charts, its today card or its cache scopes; ..."; append "or the `?offer=` preselect" to the `hire.md` line's list of triggers.
- `README.md` opening paragraph: replace "`/` is the summary of finished runs per UTC day across projects." with "`/` introduces the owner and leads to `/hire`. `/watch` is the summary of finished runs per UTC day across projects." Add `- [Home page](app_docs/home.md)` to the Documentation list.
- `src/app/api/revalidate/route.ts` line 19: "`/` shows public projects only." becomes "`/watch` shows public projects only." Comment only.

### Step 5: Format and check

- `yarn format` then the validation below. No em-dashes in any touched file.

## Validation

Execute every command to validate the patch is complete with zero regressions.

- `grep -rn "—" src app_docs docs e2e README.md AGENTS.md .adw/project.md`: must print nothing.
- `grep -n "summary.*(\`/\`)\|\`/\` is the\|root route\|src/app/summary-providers" app_docs/*.md README.md src/app/api/revalidate/route.ts`: must print nothing; `test -f app_docs/home.md && grep -c "app_docs/home.md" docs/conditional-docs.md README.md`: each at least 1.
- `grep -rn "revalidatePath" src`: must print nothing.
- `yarn lint && yarn typecheck && yarn knip && yarn format:check && yarn test`
- `yarn build`

## Patch Scope

**Lines of code to change:** ~150 (one new doc of ~50 lines, ~80 lines of edits across nine docs, index and README; one comment line)
**Risk level:** low
**Testing required:** Docs and one comment only: the grep checks above, `yarn format:check`, and the commit-hook suite (`yarn lint`, `yarn typecheck`, `yarn knip`, `yarn test`) plus `yarn build` to confirm nothing regressed.
