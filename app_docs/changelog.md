# Changelog

**Specifications:**

- specs/issue-173-adw-3fe1f775-sdlc_planner-production-changelog-backfill.md

## Overview

`/projects/changelog` (`src/app/(dashboard)/projects/changelog/page.tsx`) lists every production
push newest first, each with its date, its title linking to the entry and its counts label.
`/projects/changelog/[id]` (`src/app/(dashboard)/projects/changelog/[id]/page.tsx`) renders one
entry: date, title, a link to its production pull request, the opening paragraph and the Features,
Fixes and Chores lists (or Reverted). Both sit inside `(dashboard)`, so they have the sidebar, the
pill and the worker widget; both are static, prerendered from the registry. Entries are MDX modules
under `src/content/changelog/`, read through `src/lib/changelog.ts`.

## How it works

### What an entry is

One entry per merged pull request into `master`. Its file name and id are `<YYYY-MM-DD>-pr<N>`,
with the UTC merge date (`utcDate` and `entryId` in `src/lib/changelog-backfill.ts`). An entry
exports `meta = { date, pr, title, kind, counts }`, with `kind` `"release"` or `"revert"` and
`counts` `{ features, fixes, chores }`. `parseChangelogMeta` (`src/lib/changelog.ts`) checks each
field and that the id equals `entryId(date, pr)`, and throws an error naming the entry and the
field, so a bad entry fails `yarn build`.

`sortChangelogNewestFirst` orders by date descending, then by pull request descending. The index's
label comes from `changelogCountsLabel`: "N features, N fixes, N chores", "Branch sync" when all
three are 0, "Revert" for a revert. `getChangelogEntry` rejects an id that fails `isChangelogId` or
is not in the registry before importing any module.

### How it was generated

```sh
git fetch origin master develop
node scripts/backfill-changelog.ts
yarn format
```

The script lists the merged pull requests into `master` with `gh`. For each merge commit `M` it
reads `git log --first-parent M^2 ^M^1` and keeps the `Merge pull request #N` subjects: the develop
pull requests that first reached `master` with that push. `parsePrTitle` splits each develop title:
the conventional prefix (optional scope and `!`), then a leading `#N - `, which is stripped and
becomes the issue link; the rest is kept verbatim. `sectionForPrefix` maps `feat` to Features, `fix`
and `bug` to Fixes and anything else (including no prefix) to Chores. Each list is ordered by pull
request number, and each line links its issue and its pull request.

The opening paragraph is the production pull request body's leading prose, up to the first
heading, list item or `PR #N` line (`openingParagraph`), copied verbatim with only `{`, `}` and `<`
escaped. A production pull request titled `revert:` becomes a `revert` entry with a `## Reverted`
line naming the reverted issue and pull request (`parseRevert`). A release with no develop pull
requests gets the line "No new pull requests; branch sync." and zero counts.

The script stops when a merge commit is missing locally, when any target `.mdx` already exists (it
refuses to overwrite) and on an em-dash in the opening text. It rewrites
`src/content/changelog/index.ts` from the folder.

### Adding an entry by hand

Until a release script exists, write `src/content/changelog/<YYYY-MM-DD>-pr<N>.mdx` in the same
shape, add one line with a string-literal import to `CHANGELOG_ENTRIES` in
`src/content/changelog/index.ts`, and add the pull request number to `PRODUCTION_PRS` in
`src/content/changelog/registry.test.ts`. Keep `counts` equal to the number of lines under each
heading. The registry test checks the files against the registry, that every production pull
request has exactly one entry, and the counts against the lines.

### Pages and sidebar

The `changelog` static segment outranks `[owner]`. Its own `not-found.tsx` ("There is no changelog
entry at this address." with a link back to the index) renders for an unknown id.
`generateStaticParams` returns the placeholder `{ id: "_" }` when the registry is empty, which fails
`isChangelogId` and 404s. The sidebar's Changelog entry is a `SidebarEntryLink` with `nested`,
between Daily log and the worker widget, current on `/projects/changelog` and every entry
(`isSidebarEntryCurrent` in `src/lib/nav-entry.ts`). In the header, Watch me build is current
there.

## Rules

- The site build never calls GitHub or git; only the offline script does.
- No `fs` at runtime; only `registry.test.ts` and the script read the folder.
- No clock reads in `src/lib/changelog.ts` or the pages: a date is a string from `meta`, never
  compared with the clock.
- Every merged pull request into `master` has exactly one entry; no line is invented or reworded.
- Entries are read only through `getChangelog` and `getChangelogEntry`.
- Registry imports are string literals, never templates.
- `generateStaticParams` in `src/app/(dashboard)/projects/changelog/[id]/page.tsx` never returns an
  empty array (keep the `_` placeholder).
- No em-dashes in entries: the script stops on one rather than rewriting public text.
- `changelog` stays a static segment, and no project page gets a one-segment URL.
