# Feature: Changelog in Watch me build, backfilled with every push to production

## Metadata

issue_number: `173`
adw_id: `3fe1f775`
issue_json: `{"number":173,"title":"Changelog in Watch me build: backfill every push to production"}`

## Feature Description

A **Changelog** inside Watch me build (`/projects/changelog`, inside the `(dashboard)` layout) with
one entry per merged pull request into `master` (a push to production), backfilled for every such
pull request so far. Each entry lists what shipped with it: the pull requests merged into `develop`
that first reached `master` with that push, grouped under Features, Fixes and Chores by their
conventional prefix, each linking to its issue and its pull request on GitHub. A revert pushed
straight to `master` gets a revert entry naming what it reverted. The promotion pull request's own
opening prose (already public on GitHub) is shown verbatim under the entry title; nothing else is
written as rationale.

The content is static MDX committed to the repository, generated once by a committed, reproducible
script (`scripts/backfill-changelog.ts`) that reads `gh` and `git`. The site build never calls
GitHub. The sidebar gains a `Changelog` entry directly after `Daily log`.

## User Story

As a visitor watching the ADW builds (a hiring manager or a small-business owner)
I want a changelog of every push to production, listing the pull requests each one shipped
So that I can see what this workflow actually delivered to production, and when, without reading
git history

## Problem Statement

Production pushes exist only as merged pull requests into `master`, and their bodies are
inconsistent (some list features and fixes, some list `PR #n` lines, several list nothing), so
they cannot be read as a record of what shipped. The dashboard shows runs and a daily log, but
nothing that answers "what reached production, and when".

## Solution Statement

1. **Derive, do not transcribe.** For each merged PR into `master` (merge commit `M`), the develop
   pull requests that shipped with it are the first-parent merge commits
   `Merge pull request #N` reachable from `M^2` and not from `M^1`
   (`git log --first-parent --format=%H%x09%s M^2 ^M^1`). Verified at planning time: this yields
   #1 to #7 for #8, #11 to #24 for #16 (includes #24), #59/#64 for #65, #68/#71/#74/#75 for #77,
   nothing for #79 (the revert), #78 to #94 for #96, #98 to #113 for #115, #117 for #118 and #121
   to #162 for #163 (includes #161 and #162). Each develop PR's title comes from `gh`; its
   conventional prefix picks the section (`feat` to Features; `fix`, `bug` to Fixes; everything
   else to Chores) and the line text is the title without the prefix and without the leading
   `#N - ` (the issue number, which becomes the issue link).
2. **One MDX module per production push**, `src/content/changelog/<YYYY-MM-DD>-pr<N>.mdx`, with a
   `meta` export and a markdown body, registered in a hand-readable typed registry
   `src/content/changelog/index.ts` with string-literal lazy imports: exactly the pattern of
   `src/content/posts/`. A pure validator and the loaders live in `src/lib/changelog.ts`, the pure
   derivation and rendering used by the script in `src/lib/changelog-backfill.ts`. Both are unit
   tested.
3. **Two static pages** inside `(dashboard)`: the index and one page per entry
   (`generateStaticParams` from the registry, `notFound()` for an unknown id, no `dynamicParams`).
4. **A sidebar entry** `Changelog` after `Daily log`, current on `/projects/changelog` and below.
   The header already marks Watch me build current on every path under `/projects/`.

## Relevant Files

Use these files to implement the feature:

- `README.md`: human-facing overview; its Documentation list gets a link to the new doc (no
  feature description).
- `AGENTS.md`: repository rules (Yarn only, no em-dashes, docs in the same change, conventional
  commits with no trailers).
- `.adw/project.md`: ADW profile. Add the changelog source location under Identity (next to the
  blog posts line), the new journey to the Tests list of `e2e/*.md`, and the two changelog routes
  to Review. Keep the nine `##` headings and their order.
- `docs/conditional-docs.md`: add one line for `app_docs/changelog.md`; widen the
  `routing-and-navigation.md` line if needed.
- `app_docs/writing.md`: the MDX content pattern this feature copies (registry with string-literal
  imports, `meta` validated field by field, `registry.test.ts` reading the folder, no `fs` at
  runtime, `generateStaticParams` never empty, `notFound()` for unknown ids).
- `app_docs/routing-and-navigation.md`: the route tree, the static-segment precedence argument
  (`log` outranks `[owner]`), the header's current-section rules. Must gain the changelog routes
  and the sidebar entry.
- `app_docs/clock-and-prerender.md`: no clock reads; dates are strings from `meta` through the
  pure `formatDay`.
- `app_docs/summary.md`: documents the sidebar's Daily log entry as sitting "below the project
  list and above the worker widget"; update the wording so Changelog now sits between Daily log
  and the widget.
- `app_docs/screens-and-components.md`: read for the sidebar's column layout section; update it
  if it names the entries below the project list.
- `src/content/posts/index.ts`, `src/content/posts/registry.test.ts`, `src/content/posts/hello.mdx`:
  the registry, its folder test and a module with a `meta` export, to mirror.
- `src/lib/posts.ts`, `src/lib/posts.test.ts`: `parsePostMeta`, `isCalendarDate`,
  `sortPostsNewestFirst`, `getPosts`/`getPost`; the validator and loader shape to mirror.
- `src/app/writing/page.tsx`, `src/app/writing/[slug]/page.tsx`: list page and entry page over
  MDX modules, including the `generateStaticParams` placeholder rule and `notFound()`.
- `src/app/(dashboard)/layout.tsx`: the sidebar; the new `Changelog` link goes in the same
  `shrink-0` block as Daily log, after it, before the worker widget block.
- `src/app/(dashboard)/projects/log/page.tsx`: a static segment under `/projects` inside the
  dashboard group (its `metadata` export pattern).
- `src/app/(dashboard)/projects/[owner]/[repo]/page.tsx`: the `cacheComponents` pattern
  (`generateStaticParams`, no `dynamicParams`, `notFound()`), and the two-segment route the new
  `changelog/[id]` segment must outrank.
- `src/app/(dashboard)/not-found.tsx`: the dashboard not-found whose copy is about projects; the
  changelog gets its own segment-level not-found.
- `src/components/DailyLogLink.tsx`: the sidebar entry with a `usePathname` read and a
  no-pathname fallback for the layout's plain `Suspense`. Generalised so Daily log and Changelog
  share one component.
- `src/lib/nav-entry.ts`: shared sidebar entry classes; gains the pure "is this entry current"
  helper.
- `src/lib/header-section.ts`, `src/lib/header-section.test.ts`: already answer `watch` for any
  path under `/projects/`; add test cases for the changelog paths (the routing doc says every
  change around it goes with a test case).
- `src/components/PostMetaLine.tsx`, `src/lib/format-date.ts`: `formatDay` renders a `YYYY-MM-DD`
  meta date as `DD.MM.YYYY` without the clock.
- `src/mdx-components.tsx`: styles `h2`, `ul`, `li`, `a`, `p`, `code` for MDX bodies; the entry
  body renders through it unchanged (external links render as plain `<a>`).
- `next.config.ts`: `createMDX()` already compiles any `.mdx` the app imports; no change.
- `tsconfig.json`: needs `"allowImportingTsExtensions": true` so `scripts/backfill-changelog.ts`
  can import `../src/lib/changelog-backfill.ts` with the explicit extension Node's type stripping
  requires (allowed because `noEmit` is already on).
- `knip.json`: add `scripts/backfill-changelog.ts` as an entry (and `scripts/**/*.ts` to
  `project`) so the script's imports count and it is not reported unused.
- `eslint.config.mjs`: lints `scripts/`; the security rules apply to the script (see Notes).
- `vitest.config.ts`: only `src/**/*.test.ts` run; all new tests live under `src/`.
- `e2e/test_daily_log_sidebar.md`: the existing journey to model the new one on, and whose
  "Daily log, then the worker widget" order check must still hold (Changelog sits between them, so
  the `compareDocumentPosition` and `top` checks there remain true).

### New Files

- `scripts/backfill-changelog.ts`: the one-off generator (`node scripts/backfill-changelog.ts`).
- `src/lib/changelog-backfill.ts`: pure derivation and rendering (no `@/` imports, no Node APIs,
  so Node can import it directly from the script).
- `src/lib/changelog-backfill.test.ts`: unit tests for the derivation (prefix mapping, `#N - `
  stripping, opening paragraph, revert parsing, MDX escaping, rendering, the three spot checks on
  fixture data).
- `src/lib/changelog.ts`: `ChangelogMeta`, `parseChangelogMeta`, `isChangelogId`, ordering,
  `changelogCountsLabel`, `getChangelog`, `getChangelogEntry`.
- `src/lib/changelog.test.ts`: unit tests for the validator, id check, ordering and the counts
  label.
- `src/lib/nav-entry.test.ts`: unit tests for the sidebar's current-entry helper.
- `src/content/changelog/index.ts`: the registry (written by the script, then maintained by hand).
- `src/content/changelog/<YYYY-MM-DD>-pr<N>.mdx`: one per merged PR into `master` (10 at planning
  time: `2026-10-03-pr8`, `2026-10-05-pr16`, `2026-10-05-pr37`, `2026-10-05-pr65`,
  `2026-10-06-pr77`, `2026-10-06-pr79`, `2026-10-06-pr96`, `2026-10-07-pr115`,
  `2026-10-07-pr118`, `2026-10-09-pr163`, plus any merged before implementation).
- `src/content/changelog/registry.test.ts`: folder and registry agree; completeness against the
  committed production PR list; counts in `meta` match the body; the three derivation spot checks
  against the committed files.
- `src/app/(dashboard)/projects/changelog/page.tsx`: the index.
- `src/app/(dashboard)/projects/changelog/[id]/page.tsx`: one entry.
- `src/app/(dashboard)/projects/changelog/not-found.tsx`: "There is no changelog entry at this
  address." inside the dashboard shell (so an unknown id does not show the project-specific copy).
- `src/components/SidebarEntryLink.tsx`: the generalised sidebar link (replaces
  `src/components/DailyLogLink.tsx`).
- `app_docs/changelog.md`: the feature doc.
- `e2e/test_changelog.md`: agent-driven journey (the issue's Verification 6; see Notes for why a
  journey and not a code spec).

## Implementation Plan

### Phase 1: Foundation

The pure modules and their tests: the derivation the script uses (`changelog-backfill.ts`) and the
runtime validator and loaders the pages use (`changelog.ts`). The type of an entry is fixed here:

```ts
// src/lib/changelog-backfill.ts (no imports)
export const CHANGELOG_KINDS = ["release", "revert"] as const;
export type ChangelogKind = (typeof CHANGELOG_KINDS)[number];
export const CHANGELOG_SECTIONS = ["features", "fixes", "chores"] as const;
export type ChangelogSection = (typeof CHANGELOG_SECTIONS)[number];
export interface ChangelogCounts {
  features: number;
  fixes: number;
  chores: number;
}

// src/lib/changelog.ts
export interface ChangelogMeta {
  date: string; // merge date, UTC, YYYY-MM-DD
  pr: number; // the production PR into master
  title: string; // that PR's title without its conventional prefix
  kind: ChangelogKind; // "release" | "revert"
  counts: ChangelogCounts; // lines under each section, for the index; zeros for a revert or a sync
}
```

`counts` is an addition to the issue's `{ date, pr, title, kind }`: the index must show
`3 features, 2 fixes, 4 chores` and the pages read no `fs` at runtime, so the numbers travel in
`meta`; `registry.test.ts` asserts they equal the list items in each body, so they cannot drift.

### Phase 2: Core Implementation

The script, then running it once to generate and commit the entries and the registry; then the two
pages.

### Phase 3: Integration

The sidebar entry, the segment not-found, the header test cases, the docs, the profile, the
journey, and the full validation run.

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. Read the framework docs that apply

- Read the installed Next guides for `generateStaticParams`, `notFound` and Cache Components under
  `node_modules/next/dist/docs/` (the AGENTS.md rule), and `app_docs/writing.md`,
  `app_docs/routing-and-navigation.md`, `app_docs/clock-and-prerender.md`.

### 2. Pure derivation: `src/lib/changelog-backfill.ts` and its test

No imports (not even `@/`), no Node APIs, no clock: the script imports it with a relative `.ts`
path under Node's type stripping, so only erasable syntax (no enums, no parameter properties) and
`import type` for types elsewhere. Exports:

- `REPO_URL = "https://github.com/SBub/adw-dashboard"`, plus `issueUrl(n)` and `pullUrl(n)`.
- `sectionForPrefix(prefix: string | null): ChangelogSection`: `feat` to `features`; `fix`,
  `bug` to `fixes`; `chore`, `ci`, `docs`, `refactor`, `test`, `style`, anything else and `null`
  to `chores`. Case-insensitive.
- `parsePrTitle(title): { prefix: string | null; issue: number | null; text: string }`: strips a
  leading conventional prefix (`/^([a-z]+)(?:\([^)]*\))?!?:\s*/i`, optional scope and `!`), then a
  leading `#N - ` (`/^#(\d+)\s+-\s+/`), which becomes `issue`. Keep regexes simple and anchored
  (`security/detect-unsafe-regex` is an error). The text is otherwise verbatim (no capitalisation
  changes).
- `entryId(date, pr)`: `${date}-pr${pr}`.
- `utcDate(iso)`: the `YYYY-MM-DD` of a `mergedAt` ISO string by slicing the string (it is UTC
  `Z`); no `Date` construction from the clock.
- `openingParagraph(body: string | null): string | null`: normalise `\r\n` to `\n`, take the
  leading lines up to the first line that starts a heading (`#`) or a list item (`- `, `* `,
  `1. `), trim; empty means `null`. For #163 this is the two prose paragraphs before
  `## Features` (it mentions `halted`); for #16 the one sentence before its bullets.
- `parseRevert(title, body)`: from `revert: <text> (#66, PR #75) on master` returns
  `{ text, issue: 66, pr: 75 }` (`text` is the title without the prefix and without the
  `(#N, PR #M)` group, whitespace collapsed); `issue` or `pr` may be null when the group is
  absent.
- `escapeMdxText(s)`: backslash-escapes `\ { } < > [ ] * _` for a single line of text inside a
  list item, so a title such as `/projects/[owner]/[repo]` or one with `<`/`{` cannot break MDX
  compilation or render as a link.
- `escapeMdxProse(s)`: backslash-escapes only `{`, `}` and `<` in the verbatim opening paragraph
  (it keeps its own markdown such as backticks and links). Throws if the text contains an
  em-dash (U+2014): the no-em-dash rule applies to committed files, and the script must stop
  rather than silently rewrite public text (none of the 10 bodies contains one at planning time).
- `groupPullRequests(prs: { number: number; title: string }[])`:
  `Record<ChangelogSection, { text, issue, pr }[]>`, each section ordered by PR number ascending.
- `countsOf(groups): ChangelogCounts`.
- `changelogLine({ text, issue, pr })`:
  `- <escaped text> ([#158](issueUrl), [PR #162](pullUrl))`, or `- <text> ([PR #106](pullUrl))`
  when there is no issue.
- `renderEntryMdx(input)` where input is
  `{ date, pr, title, kind, opening: string | null, groups } | { ..., kind: "revert", reverted }`:
  returns the file text: `export const meta = {...};` (JSON-serialised values, so titles with
  quotes are safe), a blank line, the escaped opening paragraph when present, then for a release
  each non-empty section as `## Features` / `## Fixes` / `## Chores` with its lines, or the single
  paragraph `No new pull requests; branch sync.` when all three are empty; for a revert a
  `## Reverted` section with one line built from `parseRevert` (links to the issue and the PR when
  known). Ends with a newline and is Prettier-stable (run `yarn format` on the output anyway).
- `renderRegistry(ids: string[])`: the full text of `src/content/changelog/index.ts`, ids sorted
  ascending, one `{ id: "<id>", load: () => import("./<id>.mdx") }` per line with a string-literal
  path, under the same header comment style as the posts registry.

`src/lib/changelog-backfill.test.ts` (fixture data only, no `gh`, no `git`):

- Every prefix maps to its section: `feat`, `fix`, `bug`, `chore`, `ci`, `docs`, `refactor`,
  `test`, `style`; an unknown prefix (`revert`, `release`, `perf`) and a title with no prefix go
  to `chores`; `FEAT:` and `feat(scope)!:` parse.
- `#N - ` is stripped and becomes the issue: `fix: #153 - History order: sort by finished_at, not updated_at`
  gives issue 153 and that text; `ci: Vercel build-skip rule and GitHub check job` gives no issue;
  `chore: remove the clock-dependent run labels pending issue #3` keeps its trailing `#3`.
- Spot check #163 on fixture titles of #161 and #162 (plus a chore such as #156): #162
  (`Sidebar: worker status widget ...`) is under `features` and #161 under `fixes`; the rendered
  MDX has `[PR #162](https://github.com/SBub/adw-dashboard/pull/162)` before `## Fixes` and
  `PR #161` after it; `openingParagraph` of a fixture copy of #163's body (first two paragraphs and
  the `## Features` heading) contains `halted` and stops before `## Features`.
- Spot check #79: `parseRevert` of `revert: summary run detail and daily aggregate charts (#66, PR #75) on master`
  gives issue 66 and PR 75; the rendered revert MDX has `kind: "revert"` in its meta, a
  `## Reverted` heading and links to issue 66 and PR 75.
- Spot check #16: grouping a fixture including
  `chore: #22 - Route project pages as /projects/[owner]/[repo] instead of a catch-all slug` (PR
  #24) yields a chores line whose escaped text contains `/projects/\[owner\]/\[repo\]` and links
  `PR #24`.
- An empty release range renders `No new pull requests; branch sync.` and zero counts.
- `escapeMdxText` escapes each special character; `escapeMdxProse` throws on an em-dash.
- `renderRegistry` sorts and uses string-literal imports.

### 3. Runtime module: `src/lib/changelog.ts` and its test

Mirror `src/lib/posts.ts`; pure functions above the loaders, no clock, no `fs`:

- `isChangelogId(id)`: `/^\d{4}-\d{2}-\d{2}-pr\d+$/`.
- `parseChangelogMeta(id, raw): ChangelogMeta`: field by field, throwing
  `Changelog entry "<id>": <field> <rule>` so a bad entry fails `yarn build`. `date` a real
  calendar date (round-trip through `Date.parse`, as `isCalendarDate` in posts; extract that
  helper to a shared place such as `src/lib/format-date.ts` only if it stays tidy, otherwise
  duplicate the four lines), `pr` a positive integer, `title` non-empty, `kind` one of
  `CHANGELOG_KINDS`, `counts` three non-negative integers, and `id === entryId(date, pr)` (the
  file name and the meta agree).
- `sortChangelogNewestFirst(entries)`: date descending, then PR number descending (two pushes on
  one day: #65 after #37 on 2026-10-05, #79 after #77 on 2026-10-06), without mutating.
- `changelogCountsLabel(meta)`: `"3 features, 2 fixes, 4 chores"` with singulars (`1 feature`,
  `1 fix`, `1 chore`), all three always shown for a release with any line; `"Branch sync"` for a
  release with all zeros; `"Revert"` for a revert.
- `getChangelog()`: every entry loaded through the registry, metas parsed, newest first.
- `getChangelogEntry(id)`: rejects a malformed or unregistered id before importing any module,
  returns `{ id, meta, Content } | null`.

`src/lib/changelog.test.ts`: a valid meta parses to exactly the five fields; each bad field throws
naming the entry and the field (including an id that disagrees with `date`/`pr`); `isChangelogId`
accepts `2026-10-09-pr163` and rejects `2026-10-09`, `pr163`, `../x`, `_`, `2026-10-09-pr163.mdx`;
sorting orders by date then PR descending; the counts label covers plural, singular, sync and
revert.

### 4. The generator: `scripts/backfill-changelog.ts`

- Plain TypeScript runnable as `node scripts/backfill-changelog.ts` (Node 24 type stripping):
  imports `node:child_process` (`execFileSync` with argument arrays only, never a shell string),
  `node:fs`, and the pure module via `../src/lib/changelog-backfill.ts` (`import type` for types).
- Add `"allowImportingTsExtensions": true` to `tsconfig.json` so `yarn typecheck` accepts the
  `.ts` import (the script is under `**/*.ts`, so it is type-checked).
- Steps:
  1. `gh pr list --state merged --base master --limit 200 --json number,title,body,mergedAt,mergeCommit`.
  2. `gh pr list --state merged --base develop --limit 1000 --json number,title` for the title
     map; a number missing from it is fetched with `gh pr view <n> --json title`.
  3. Check every merge commit exists locally (`git cat-file -e <oid>`); if not, exit non-zero
     with "run `git fetch origin master develop` first".
  4. For each production PR: id from `utcDate(mergedAt)` and the number; kind `revert` when its
     title's prefix is `revert`, else `release`. For a release, run
     `git log --first-parent --format=%H%x09%s <oid>^2 ^<oid>^1`, keep subjects matching
     `^Merge pull request #(\d+) `, look up titles, `groupPullRequests`. For a revert, take
     `parseRevert(title, body)`. `opening = openingParagraph(body)`. Title = `parsePrTitle(title).text`.
  5. Before writing anything: if any target `src/content/changelog/<id>.mdx` already exists, exit
     non-zero naming it (refuses to overwrite). Then write each file and rewrite
     `src/content/changelog/index.ts` with `renderRegistry` over every `.mdx` id in the folder.
  6. Print a summary per entry (id, counts) for the PR description.
- Lint: `security/detect-child-process` and `security/detect-non-literal-fs-filename` are errors
  in `eslint.config.mjs`. Use `execFileSync` with literal command names; if
  `detect-non-literal-fs-filename` still reports the computed paths, add a line-level
  `// eslint-disable-next-line security/detect-non-literal-fs-filename -- one-off offline script; paths are src/content/changelog/<validated id>.mdx`
  on those lines only. Do not change `eslint.config.mjs` and do not disable the rule for the file
  or the folder (see Notes).
- Add to `knip.json`: `"entry": ["scripts/backfill-changelog.ts"]` and `"scripts/**/*.ts"` to
  `project`. Confirm `yarn knip` still applies the Next plugin's entries (it adds to them) and
  reports nothing.

### 5. Generate and commit the entries

- `git fetch origin master develop`, then `node scripts/backfill-changelog.ts`, then
  `yarn format` (Prettier formats `.mdx` and the registry).
- Read every generated file. Check by eye: #163 has #162 under Features, #161 under Fixes and the
  opening paragraph mentioning `halted`; #79 is `kind: "revert"` naming #66 and PR #75; #16 has
  PR #24; no file contains an em-dash (`grep -rn $'—' src/content/changelog` is empty); a
  release with an empty range (none expected at planning time) reads
  `No new pull requests; branch sync.`.
- Run the script a second time and confirm it refuses (non-zero, names an existing entry), then
  continue.

### 6. Folder test: `src/content/changelog/registry.test.ts`

Test only; the one place that reads the folder with `fs`:

- The registry's ids equal the folder's `.mdx` basenames (sorted), and each id passes
  `isChangelogId`; ids are unique.
- `PRODUCTION_PRS`: a committed constant in this file, the numbers from
  `gh pr list --state merged --base master --limit 50` at implementation time, with a comment
  naming the command and the date (`[8, 16, 37, 65, 77, 79, 96, 115, 118, 163]` at planning time,
  plus any merged since). Asserts every number has exactly one entry (ids ending `-pr<N>`) and no
  entry exists for a number outside the list.
- For each file: read the text, parse the `meta` object literal (the script writes it as
  JSON-compatible values, so a slice between `export const meta = ` and the first `;` followed by
  a newline parses with `JSON.parse` after the keys are quoted, or simply match the fields with
  anchored regexes), and assert `counts.features`/`fixes`/`chores` equal the number of `- ` lines
  under `## Features`/`## Fixes`/`## Chores`, and that `meta.pr`/`meta.date` agree with the file
  name.
- Spot checks on the committed files: `2026-10-09-pr163.mdx` has `PR #162` between `## Features`
  and the next heading, `PR #161` between `## Fixes` and the next heading, and `halted` before the
  first `##`; `2026-10-06-pr79.mdx` has `"revert"` as its kind and names `#66` and `PR #75`;
  `2026-10-05-pr16.mdx` contains `PR #24`.
- **Negative check (manual, during implementation):** delete one entry file (for example
  `src/content/changelog/2026-10-07-pr118.mdx`), run `yarn test`, confirm the registry test fails,
  then restore it with `git checkout -- src/content/changelog/2026-10-07-pr118.mdx` (or by
  re-creating it if it is not yet committed). Record the failing output in the PR description.

### 7. Index page: `src/app/(dashboard)/projects/changelog/page.tsx`

- `export const metadata = { title: "Changelog", description: ... }`.
- `<h1>Changelog</h1>`, one line intro (for example "Every push to production, with the pull
  requests it shipped."), then an `<ol>` of entries from `getChangelog()`, newest first: the
  `formatDay(meta.date)` date in a `<time dateTime>`, the title as a `Link` to
  `/projects/changelog/<id>`, and `changelogCountsLabel(meta)`. Wrap text so 375px has no
  horizontal scroll (`min-w-0`, `break-words` on titles).
- Static: no request-time reads, no clock.

### 8. Entry page: `src/app/(dashboard)/projects/changelog/[id]/page.tsx`

- `generateStaticParams` returns `getChangelog()` mapped to `{ id }`; keep a placeholder
  `[{ id: "_" }]` for an empty registry (an empty array fails the build under `cacheComponents`;
  `_` fails `isChangelogId` and 404s). No `dynamicParams` export.
- `generateMetadata`: title from the entry, or `{}` for an unknown id.
- Body: `getChangelogEntry((await params).id)`, `notFound()` when null; then the date, the title
  as `<h1>`, a link `Production pull request #<pr>` to `pullUrl(pr)`, then `<Content />` (the
  opening paragraph and the lists, styled by `src/mdx-components.tsx`), and a link back to
  `/projects/changelog`.
- `src/app/(dashboard)/projects/changelog/not-found.tsx`: the same card as the dashboard
  not-found with "There is no changelog entry at this address." and a link to the index. Confirm
  in the served HTML that an unknown id renders it with a 404 status.
- Route precedence: `changelog` is a static segment, so it outranks `[owner]`;
  `/projects/changelog/<anything>` always resolves to this page (see Notes on the shadowed owner).

### 9. Sidebar entry

- Replace `src/components/DailyLogLink.tsx` with `src/components/SidebarEntryLink.tsx`:
  `SidebarEntryLink({ href, label, nested })` (client, `usePathname`) and
  `SidebarEntryLinkFallback({ href, label })` (no pathname read), using the `NAV_ENTRY*` classes.
- Add to `src/lib/nav-entry.ts` the pure
  `isSidebarEntryCurrent(pathname, href, nested)`: exact match, or (when `nested`) a path under
  `href + "/"`. Daily log uses `nested: false` (current only on `/projects/log`, as now);
  Changelog uses `nested: true` (current on `/projects/changelog` and every entry, never on
  `/projects/changelogx`).
- `src/lib/nav-entry.test.ts`: Daily log is current only on `/projects/log`; Changelog is current
  on `/projects/changelog` and `/projects/changelog/2026-10-09-pr163`, not on `/projects`,
  `/projects/log`, `/projects/changelogx` or a project page; Daily log is not current on the
  changelog routes.
- In `src/app/(dashboard)/layout.tsx`, inside the existing `shrink-0` block below the project
  list, render Daily log and then Changelog, each in its own plain `Suspense` with its fallback
  (the same reason as today: `usePathname` suspends while prerendering a project page outside
  `generateStaticParams`), stacked with the same gap as the aside (`flex flex-col gap-2`). Update
  the layout's comments to name both entries. The worker widget block stays last and unchanged.
- Add changelog cases to `src/lib/header-section.test.ts` (`/projects/changelog` and an entry are
  `watch`); `headerSection` itself needs no change.

### 10. Documentation

- New `app_docs/changelog.md` in the house format (Specifications link to this plan, Overview,
  How it works, Rules): what an entry is (one per merged PR into `master`, id
  `<YYYY-MM-DD>-pr<N>` with the UTC merge date, the `meta` fields including `counts`, kinds
  `release` and `revert`); how it was generated (the `git log --first-parent M^2 ^M^1` range, the
  prefix to section map, the `#N - ` stripping, the verbatim opening paragraph, the revert entry,
  the sync line; `node scripts/backfill-changelog.ts`, which refuses to overwrite); how to add one
  by hand until a release script exists (write the `.mdx` in the same shape, add the registry
  line, add the PR number to `PRODUCTION_PRS` in `registry.test.ts`, keep `counts` equal to the
  lines); the pages and the sidebar entry. Rules: the site build never calls GitHub; no `fs` at
  runtime (only `registry.test.ts` reads the folder); no clock reads; every merged PR into
  `master` has exactly one entry and nothing is invented; entries are read only through
  `getChangelog`/`getChangelogEntry`; string-literal imports in the registry; `generateStaticParams`
  never returns an empty array; no em-dashes in entries (the script stops on one).
- `docs/conditional-docs.md`: add
  `` `app_docs/changelog.md`: read when adding or changing a changelog entry under `src/content/changelog/`, its registry, `src/lib/changelog.ts`, `src/lib/changelog-backfill.ts`, `scripts/backfill-changelog.ts`, `/projects/changelog` or the sidebar's Changelog entry. ``
- `app_docs/routing-and-navigation.md`: add `/projects/changelog` and `/projects/changelog/[id]`
  to the route tree and How it works (static, inside `(dashboard)`, the `changelog` static segment
  outranks `[owner]` as `log` does, its own not-found); the sidebar now has Daily log then
  Changelog between the project list and the worker widget; Watch me build is current there; add
  this plan to Specifications; add a Rule that the changelog stays a static segment and no project
  page gets a one-segment URL (extend the existing `log` rule).
- `app_docs/summary.md` and, if it describes the sidebar's entries, `app_docs/screens-and-components.md`:
  update the "below the project list and above the worker widget" wording and the `DailyLogLink`
  name to `SidebarEntryLink`.
- `README.md`: add `- [Changelog](app_docs/changelog.md)` to the Documentation list only.
- `.adw/project.md`: under Identity, after the blog posts line, add
  `- Changelog entries: \`src/content/changelog/<YYYY-MM-DD>-pr<N>.mdx\`, registered in \`src/content/changelog/index.ts\`; generated once by \`node scripts/backfill-changelog.ts\`.`;
add `e2e/test_changelog.md`to the journey list in Tests; add`/projects/changelog`(heading,
intro, entries newest first with date, title and counts, the sidebar with Changelog current) and
one entry page (date, title, production PR link, opening paragraph, the lists) to Review. Do not
rename or reorder any`##` heading.
- Do not edit anything under `specs/` other than this plan.

### 11. Agent-driven journey: `e2e/test_changelog.md`

Modelled on `e2e/test_daily_log_sidebar.md` (`## User Story`, `## Test Steps` with `**Verify**`
lines, `## Success Criteria`):

1. 1920x1080, open `/projects`. **Verify** the sidebar order: last project link, `Daily log`,
   `Changelog` (`href="/projects/changelog"`), then the worker widget (`compareDocumentPosition`
   and increasing `getBoundingClientRect().top`); `Changelog` has no `aria-current`.
2. Click `Changelog`. **Verify** URL `/projects/changelog`, the level-1 heading `Changelog`, at
   least 10 entries, dates non-increasing from top to bottom, `Changelog` has
   `aria-current="page"`, `Daily log` and every project link have none, and the header's
   `Watch me build` has `aria-current="page"`. Screenshot.
3. Click the first (newest) entry. **Verify** URL `/projects/changelog/<id>`, a link to
   `https://github.com/SBub/adw-dashboard/pull/<n>`, at least one of the `Features`, `Fixes`,
   `Chores` (or `Reverted`) level-2 headings with list items linking to GitHub pull requests,
   and `Changelog` still `aria-current="page"`. Screenshot.
4. Open `/projects/log`. **Verify** `Daily log` is current and `Changelog` is not.
5. Navigate to `/projects/changelog/does-not-exist`. **Verify** the not-found copy
   `There is no changelog entry at this address.` Screenshot.
6. Resize to 375x667 on the newest entry page and on `/projects/changelog`. **Verify**
   `document.documentElement.scrollWidth <= window.innerWidth` on both. Screenshot.

Browser evidence for the review phase (profile Review section, desktop 1920x1080 and mobile
375x667, full page): `/projects/changelog`, `/projects/changelog/2026-10-09-pr163` (opening
paragraph mentioning `halted`, Features with the worker status widget, Fixes with History ordered
by `finished_at`, Chores), `/projects/changelog/2026-10-06-pr79` (the revert entry), and `/projects/log`
showing the sidebar with Daily log current and Changelog below it.

### 12. Validate

- Run every command in `Validation Commands`, then the served-HTML checks after
  `yarn build && yarn start` on this run's port (source `.ports.env`; fall back to 3000 only when
  absent; never touch a server this run did not start).

## Testing Strategy

### Unit Tests

- `src/lib/changelog-backfill.test.ts`: prefix to section mapping, unknown prefix to Chores,
  `#N - ` stripping, opening paragraph extraction, revert parsing, MDX escaping (and the em-dash
  guard), entry and registry rendering, the three derivation spot checks on fixture data.
- `src/lib/changelog.test.ts`: meta validation (each field, id agreement), id check, newest-first
  order with same-day ties, the counts label.
- `src/lib/nav-entry.test.ts`: which sidebar entry is current for which path.
- `src/lib/header-section.test.ts`: changelog paths are in the `watch` section.
- `src/content/changelog/registry.test.ts`: folder and registry agree; completeness against the
  committed production PR list; `counts` match the bodies; spot checks on the committed #163, #79
  and #16 entries.

### Test Coverage

- `src/content/changelog/registry.test.ts` (unit layer, vitest): fails when a production PR has no
  entry or two, when a file is missing from the registry or the registry names a missing file, or
  when an entry's counts disagree with its lists; nothing checks the changelog's completeness
  today.
- `src/lib/changelog-backfill.test.ts` (unit layer): catches a wrong section for a prefix, an
  unstripped `#N - `, a lost opening paragraph or an MDX-breaking title before any file is
  generated.
- `src/lib/changelog.test.ts` (unit layer): catches a malformed `meta` reaching the build silently
  and a wrong index order or counts label.
- `src/lib/nav-entry.test.ts` (unit layer): catches the Changelog entry being current on the
  wrong routes, or Daily log losing its exact-match rule after the generalisation.
- The pages themselves have no component test layer in this project (profile Tests); their
  evidence is the served-HTML checks in Validation Commands, the `e2e/test_changelog.md` journey
  and the review screenshots.

### Edge Cases

- Two production pushes on the same UTC day (2026-10-05: #16, #37, #65; 2026-10-06: #77, #79,
  #96): distinct ids by PR number, ordered by PR number descending within the day.
- The revert pushed straight to `master` (#79): empty develop range, `kind: "revert"`, a
  `## Reverted` line naming issue #66 and PR #75, counts all zero, index label `Revert`.
- A sync push with no develop PRs: `No new pull requests; branch sync.`, label `Branch sync`
  (none at planning time; covered by a unit test).
- A production PR from a branch other than `develop` that still carries develop merges (#96 from
  `release/sync-master-20261006`): the `M^2 ^M^1` range handles it (yields #78 to #94).
- The first production push (#8): `M^1` is master's pre-PR history; the range yields #1 to #7.
- Develop PR titles with no `#N - ` (#1 to #7, #11, #14, #98, #106), with `#N` later in the text
  (#5), with brackets (`/projects/[owner]/[repo]`, #24), quotes (#71, #157) or underscores
  (`finished_at`, #161).
- A body with no prose before its first list or heading (opening is `null`), a body that is all
  prose (#8, #65, #96, #118 have no list: the whole leading prose block is the opening), Windows
  line endings, an em-dash (the script stops).
- An unknown id (`/projects/changelog/does-not-exist`), a malformed id (`/projects/changelog/_`),
  `/projects/changelogx` (no route: the root 404) and `/projects/changelog/a/b` (no route).
- The script run twice: refuses on the second run; the build never runs it.

## Acceptance Criteria

- `src/content/changelog/` holds exactly one `<YYYY-MM-DD>-pr<N>.mdx` per merged PR into `master`
  at implementation time (10 at planning time), each with a valid `meta`
  (`date`, `pr`, `title`, `kind`, `counts`), all listed in `src/content/changelog/index.ts` with
  string-literal imports.
- Each release entry lists the develop PRs in its `M^2 ^M^1` range under Features / Fixes / Chores
  by prefix, each line the title without prefix and `#N - `, linking the issue (when known) and
  the PR on GitHub; the production PR's opening prose is included verbatim when it has one; a
  revert entry names what it reverted; nothing else is written.
- #163's entry has PR #162 under Features, PR #161 under Fixes and an opening paragraph mentioning
  `halted`; #79's entry is `kind: "revert"` and names #66 / PR #75; #16's entry contains PR #24.
- `scripts/backfill-changelog.ts` is committed, runs with `node scripts/backfill-changelog.ts`,
  refuses to overwrite an existing entry, and nothing in the build or the runtime calls GitHub.
- `/projects/changelog` (inside the dashboard shell) shows `Changelog`, a one-line intro and every
  entry newest first with date, title, counts label and link; `/projects/changelog/<id>` shows the
  date, title, production PR link, opening paragraph and lists; an unknown id is a 404 with the
  changelog not-found copy.
- The sidebar shows `Changelog` directly after `Daily log` and before the worker widget, with
  `aria-current="page"` on `/projects/changelog` and its entries only; Daily log is still current
  only on `/projects/log`; the header's Watch me build is current on the changelog routes.
- `/projects/[owner]/[repo]`, `/projects/log`, `/projects` and the existing sidebar entries behave
  as before.
- No clock reads and no request-time reads in the changelog pages or `src/lib/changelog.ts`.
- No em-dash in any added or changed file. Docs updated in the same change: `app_docs/changelog.md`,
  its line in `docs/conditional-docs.md`, `app_docs/routing-and-navigation.md`,
  `app_docs/summary.md` (sidebar wording), `README.md` (doc link), `.adw/project.md` (nine headings
  intact).
- At 375px neither changelog page scrolls horizontally.

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

- `yarn lint`: ESLint over the app and the new script (security rules included).
- `yarn typecheck`: `next typegen` then `tsc --noEmit`, including the script's `.ts` import.
- `yarn knip`: no unused files or exports (the script is a knip entry).
- `yarn format:check`: Prettier, including the generated `.mdx` files and the registry.
- `yarn test`: all unit tests, including the registry completeness and derivation spot checks.
- `yarn build`: compiles every entry's MDX, validates every `meta` and prerenders both changelog
  routes (needs `.env.local`).
- `grep -rn $'—' src/content/changelog app_docs/changelog.md scripts src/lib/changelog*.ts e2e/test_changelog.md`:
  must print nothing (no em-dashes).
- `set -a; [ -f .ports.env ] && . ./.ports.env; set +a; PORT=${PORT:-3000} yarn start` in the
  background (this run's server only), then:
  - `curl -s http://localhost:${PORT:-3000}/projects/changelog | grep -o 'href="/projects/changelog/[0-9-]*pr[0-9]*"' | sort -u | wc -l`:
    10 or more entries; check by eye in the HTML that their dates are in non-increasing order.
  - `curl -s http://localhost:${PORT:-3000}/projects/changelog/2026-10-09-pr163 | grep -c 'github.com/SBub/adw-dashboard/pull/163'`:
    at least 1 (links to its PR).
  - `curl -s -o /dev/null -w '%{http_code}' http://localhost:${PORT:-3000}/projects/changelog/does-not-exist`:
    `404`.
  - `curl -s http://localhost:${PORT:-3000}/projects/changelog | grep -o '<a[^>]*href="/projects/changelog"[^>]*>'`:
    carries `aria-current="page"` (or, if the shell carries the fallback, the streamed HTML does);
    the same grep on `/projects/log` and `/projects` shows no `aria-current` on the Changelog link.
  - `curl -s -o /dev/null -w '%{http_code}' http://localhost:${PORT:-3000}/projects/log` and
    `/projects`: `200` (unchanged).
  - Stop the server this run started.

## Notes

- **Count discrepancy with the issue.** The issue says 11 merged PRs into `master`, but its own
  list has 10 numbers, and `gh pr list --state merged --base master` on 2026-10-11 returns
  exactly those 10 (#8, #16, #37, #65, #77, #79, #96, #115, #118, #163). The fixture list is
  whatever `gh` returns at implementation time; the index check is "10 or more", and the PR
  description should say so.
- **Why `counts` in `meta`.** The index needs per-section counts, the pages may not read `fs`, and
  parsing compiled MDX for list lengths is fragile; the counts are written by the script and the
  registry test keeps them honest.
- **Why `src/lib/changelog-backfill.ts` is separate from `src/lib/changelog.ts`.** The script runs
  under plain Node, which cannot resolve `@/` or import MDX; the runtime module imports the
  registry (`@/content/changelog`). The backfill module has no imports, and the runtime module
  imports its types and constants.
- **Lint exception, flag for the reviewer.** `eslint-plugin-security` reports
  `detect-non-literal-fs-filename` on computed paths. If it fires on the script, the plan allows
  only line-level `eslint-disable-next-line` comments with a reason on those writes, in this one
  offline script; the shared config is not changed. If the owner prefers none, the alternative is
  a `scripts/**` override in `eslint.config.mjs`, which is an owner decision.
- **Shadowed owner.** Because `changelog` is a static segment, a project whose GitHub owner is
  literally `changelog` could not be reached at `/projects/changelog/<repo>`. Same trade-off as
  `log`; documented in the routing doc.
- **Why a journey and not a code spec.** The profile has no E2E code suite (no
  `@playwright/test`); the issue's Verification 6 asks for the click-through and the 375px check,
  which only a browser can show, so `e2e/test_changelog.md` follows the existing journey pattern.
  The existing `e2e/test_daily_log_sidebar.md` order checks (Daily log before the widget) still
  hold with Changelog between them.
- No new dependency. `package.json` `version` stays `0.1.0`; no git tags.
- Deferred (out of scope): semantic versions and tags, a release script for future promotions,
  drafted rationale, a Decisions section, a draft flag, RSS, a header link, links from `/writing`.
