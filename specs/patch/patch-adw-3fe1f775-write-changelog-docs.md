# Patch: Write the changelog docs and fix the sidebar wording in existing docs

## Metadata

adw_id: `3fe1f775`
review_change_request: `Issue #1: Spec step 10 (Documentation) and the acceptance criterion 'Docs updated in the same change: app_docs/changelog.md, its line in docs/conditional-docs.md, app_docs/routing-and-navigation.md, app_docs/summary.md (sidebar wording), README.md (doc link)' are not in the diff. git diff origin/develop touches no file under app_docs/, docs/ or README.md. As a result: (a) there is no app_docs/changelog.md; (b) docs/conditional-docs.md has no changelog line; (c) README.md has no Changelog link; (d) app_docs/routing-and-navigation.md:74 still says the Daily log entry sits 'below the project list and above the worker widget' and does not list the /projects/changelog routes or the static-segment rule; app_docs/summary.md:271 and app_docs/screens-and-components.md:33 and :157 still name the deleted DailyLogLink component. Resolution: create app_docs/changelog.md, add its conditional-docs line and README link, update routing-and-navigation.md, replace DailyLogLink with SidebarEntryLink and fix the wording in summary.md and screens-and-components.md, no em-dashes, run yarn format. Severity: blocker`

## Issue Summary

**Original Spec:** specs/issue-173-adw-3fe1f775-sdlc_planner-production-changelog-backfill.md
**Issue:** Step 10 of the spec (Documentation) was never carried out. The branch adds the
changelog code, entries, script, e2e journey and the `.adw/project.md` lines, but no file under
`app_docs/`, `docs/` or `README.md` changed: there is no feature doc, no index line, no README
link, and three existing docs still describe the removed `DailyLogLink` component and a sidebar
with a single entry above the worker widget.
**Solution:** Docs only, no code change. Write `app_docs/changelog.md` from the code as it stands
on the branch, add its index line and README link, and correct the stale sentences in
`app_docs/routing-and-navigation.md`, `app_docs/summary.md` and
`app_docs/screens-and-components.md`. `.adw/project.md` and `e2e/test_changelog.md` already carry
their step 10/11 changes and are not touched.

## Files to Modify

Use these files to implement the patch:

- `app_docs/changelog.md` (new)
- `docs/conditional-docs.md`
- `README.md`
- `app_docs/routing-and-navigation.md`
- `app_docs/summary.md`
- `app_docs/screens-and-components.md`

## Implementation Steps

IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Create `app_docs/changelog.md` in the house format

Model the layout on `app_docs/writing.md`: `# Changelog`, `**Specifications:**` with the bullet
`- specs/issue-173-adw-3fe1f775-sdlc_planner-production-changelog-backfill.md`, then
`## Overview`, `## How it works` (with `###` subsections), `## Rules`. Wrap prose near 100
columns like the sibling docs. Every fact below is taken from the branch's code; check each
against the file named before writing it.

- **Overview:** `/projects/changelog` (`src/app/(dashboard)/projects/changelog/page.tsx`) lists
  every production push newest first, each with its date, title and counts label;
  `/projects/changelog/[id]` (`.../changelog/[id]/page.tsx`) renders one entry: date, title, a
  link to its production PR, the opening paragraph and the Features, Fixes and Chores lists
  (or Reverted). Both sit inside `(dashboard)`: sidebar, pill, worker widget; both are static,
  prerendered from the registry. Entries are MDX modules under `src/content/changelog/`, read
  through `src/lib/changelog.ts`.
- **How it works / What an entry is:** one entry per merged PR into `master`; file and id
  `<YYYY-MM-DD>-pr<N>` with the UTC merge date (`utcDate`, `entryId` in
  `src/lib/changelog-backfill.ts`); `export const meta = { date, pr, title, kind, counts }`, with
  `kind` `"release"` or `"revert"` and `counts` `{ features, fixes, chores }`;
  `parseChangelogMeta` checks each field and that the id equals `entryId(date, pr)`, throwing so a
  bad entry fails `yarn build`. Order is `sortChangelogNewestFirst` (date desc, then PR desc). The
  index label comes from `changelogCountsLabel`: "N features, N fixes, N chores", "Branch sync"
  when all three are 0, "Revert" for a revert. `getChangelogEntry` rejects an id that fails
  `isChangelogId` or is not in the registry before importing anything.
- **How it works / How it was generated:** `node scripts/backfill-changelog.ts` after
  `git fetch origin master develop`, then `yarn format`. It lists merged PRs into `master` with
  `gh`, and for each merge commit `M` reads `git log --first-parent M^2 ^M^1`, keeping the
  `Merge pull request #N` subjects: the develop PRs that first reached `master` with that push.
  Each develop PR title is split by `parsePrTitle`: conventional prefix (optional scope and `!`)
  then a leading `#N - ` is stripped and becomes the issue link; the rest is kept verbatim.
  Prefix map (`sectionForPrefix`): `feat` to Features, `fix` and `bug` to Fixes, anything else
  (including none) to Chores; each list ordered by PR number, each line linking its issue and PR.
  The opening paragraph is the production PR body's leading prose up to the first heading, list
  item or `PR #N` line (`openingParagraph`), copied verbatim with only `{`, `}`, `<` escaped. A
  production PR titled `revert:` becomes a `revert` entry with a `## Reverted` line naming the
  reverted issue and PR (`parseRevert`). A release with no develop PRs gets the line
  "No new pull requests; branch sync." and zero counts. The script stops when a merge commit is
  missing locally, when any target `.mdx` already exists (it refuses to overwrite), and on an
  em-dash in the opening text; it rewrites `src/content/changelog/index.ts` from the folder.
- **How it works / Adding an entry by hand** (until a release script exists): write
  `src/content/changelog/<YYYY-MM-DD>-pr<N>.mdx` in the same shape, add one string-literal line
  to `CHANGELOG_ENTRIES` in `src/content/changelog/index.ts`, add the PR number to
  `PRODUCTION_PRS` in `src/content/changelog/registry.test.ts`, and keep `counts` equal to the
  number of lines under each heading (the registry test checks files against registry, every
  production PR has exactly one entry, and counts against lines).
- **How it works / Pages and sidebar:** the `changelog` static segment outranks `[owner]`; its own
  `not-found.tsx` ("There is no changelog entry at this address." with a link back to the index)
  renders for an unknown id. `generateStaticParams` returns the placeholder `{ id: "_" }` when the
  registry is empty, which fails `isChangelogId` and 404s. The sidebar's Changelog entry is a
  `SidebarEntryLink` with `nested`, below Daily log and above the worker widget, current on
  `/projects/changelog` and every entry (`isSidebarEntryCurrent` in `src/lib/nav-entry.ts`); in
  the header, Watch me build is current there.
- **Rules** (each a "do not"/"never" invariant): the site build never calls GitHub or git (only
  the offline script does); no `fs` at runtime (only `registry.test.ts` and the script read the
  folder); no clock reads in `src/lib/changelog.ts` or the pages (a date is a string from `meta`,
  never compared with the clock); every merged PR into `master` has exactly one entry and no line
  is invented or reworded; entries are read only through `getChangelog`/`getChangelogEntry`;
  registry imports are string literals, never templates; `generateStaticParams` never returns an
  empty array; no em-dashes in entries (the script stops on one rather than rewriting public
  text); `changelog` stays a static segment and no project page gets a one-segment URL.

### Step 2: Index line and README link

- `docs/conditional-docs.md`: append after the `app_docs/writing.md` line exactly:
  ``- `app_docs/changelog.md`: read when adding or changing a changelog entry under `src/content/changelog/`, its registry, `src/lib/changelog.ts`, `src/lib/changelog-backfill.ts`, `scripts/backfill-changelog.ts`, `/projects/changelog` or the sidebar's Changelog entry.``
- `README.md`: append `- [Changelog](app_docs/changelog.md)` after `- [Writing](app_docs/writing.md)`
  in the `## Documentation` list. Nothing else in README changes.

### Step 3: Update `app_docs/routing-and-navigation.md`

- Specifications: append
  `- specs/issue-173-adw-3fe1f775-sdlc_planner-production-changelog-backfill.md`.
- Overview route tree: insert `/projects/changelog`, `/projects/changelog/[id]` after
  `/projects/log`.
- How it works, header paragraph: "Watch me build" emphasised on `/projects`, `/projects/log`,
  `/projects/changelog` and its entries, and every project page.
- How it works, Routing (the paragraph at lines ~71-81): replace "the sidebar's Daily log entry,
  below the project list and above the worker widget, links to it and is current only there" with
  the sidebar carrying two static entries between the project list and the worker widget, Daily
  log then Changelog (`SidebarEntryLink`), Daily log current only on `/projects/log`. Add a
  sentence: the changelog, `/projects/changelog` and `/projects/changelog/[id]`
  (`src/app/(dashboard)/projects/changelog/`), is static, prerendered from the registry, inside
  the group; `changelog` is a static segment that outranks `[owner]` as `log` does; an unknown
  entry id renders the segment's own `not-found.tsx`, not the project not-found; see
  `app_docs/changelog.md`.
- Rules: extend the `/projects/log` rule to "The summary is `/projects/log` and the changelog is
  `/projects/changelog`, both static segments inside `(dashboard)`. Do not give a project page a
  one-segment URL; the two-segment project route is what keeps `log` and `changelog` from clashing
  with a project." In the `headerSection` rule, add `/projects/changelog` beside the daily log in
  the "every path below `/projects/`" list.

### Step 4: Fix the stale component name and wording

- `app_docs/summary.md:271`: "The sidebar's Daily log entry (`SidebarEntryLink`, the same
  component as the Changelog entry below it) is static and reads no query: ..." and the fallback
  is `SidebarEntryLinkFallback`, the same link inactive.
- `app_docs/screens-and-components.md:33-35`: "the Daily log and Changelog entries
  (`SidebarEntryLink`, links to `/projects/log` and `/projects/changelog` styled like a project
  entry; Daily log current only on its page, Changelog on its index and every entry) and the
  worker status widget sit at its bottom, always visible."
- `app_docs/screens-and-components.md:157-158`: replace "`DailyLogLink`, which reads the pathname
  to mark the sidebar's Daily log entry" with "`SidebarEntryLink`, which reads the pathname to mark
  the sidebar's Daily log and Changelog entries".
- `grep -rn DailyLogLink app_docs docs README.md` must then print nothing.

### Step 5: Format

- Run `yarn format`, then confirm `git diff --stat` touches only the six files above (plus this
  patch plan).

## Validation

Execute every command to validate the patch is complete with zero regressions.

- `grep -rn $'—' src/content/changelog app_docs/changelog.md scripts src/lib/changelog*.ts e2e/test_changelog.md app_docs/routing-and-navigation.md app_docs/summary.md app_docs/screens-and-components.md docs/conditional-docs.md README.md`: prints nothing.
- `grep -rn 'DailyLogLink\|above the worker widget' app_docs docs README.md`: prints nothing; `grep -c changelog docs/conditional-docs.md README.md`: at least 1 each.
- `yarn lint && yarn typecheck && yarn knip && yarn format:check && yarn test`
- `yarn build`

## Patch Scope

**Lines of code to change:** about 120 lines of Markdown (about 100 new in `app_docs/changelog.md`, about 20 edited across five files); no source code.
**Risk level:** low
**Testing required:** docs only: em-dash and stale-name greps, `yarn format:check`, and the full lint, typecheck, knip, test and build chain to confirm the tree still passes the commit and push hooks.
