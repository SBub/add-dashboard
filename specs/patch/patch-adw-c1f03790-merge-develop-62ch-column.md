# Patch: Merge develop and keep its 62ch post column under the breadcrumb

## Metadata

adw_id: `c1f03790`
review_change_request: `Issue #2: The branch forked from develop at eecc254, before PR #199 (e8821f3) merged. PR #199 changed the post page's column in src/app/writing/[slug]/page.tsx from max-w-[70ch] to max-w-[62ch], and also changed mdx-components.tsx and added the feature-flags post. git merge-tree --write-tree HEAD origin/develop reports CONFLICT (content): Merge conflict in src/app/writing/[slug]/page.tsx, so the PR cannot merge cleanly. The branch also still carries 70ch, against spec step 3. Because of this, git diff origin/develop also shows the branch as deleting the feature-flags post, its images, the img MDX mapping and a lefthook change. Resolution: Merge origin/develop into this branch (no rebase or force-push needed) and resolve the page.tsx conflict by keeping develop's <div className="max-w-[62ch]"> with <Breadcrumb title={meta.title} /> as its first child, directly above the h1. Then confirm git diff origin/develop --stat shows only the breadcrumb, test, page, e2e, docs and spec changes, and re-run yarn build to confirm /writing/my-moat and /writing/feature-flags prerender as static. Severity: blocker`

## Issue Summary

**Original Spec:** specs/issue-200-adw-c1f03790-sdlc_planner-add-post-breadcrumb.md
**Issue:** The branch's base is `eecc254`; `origin/develop` is now `e8821f3` (PR #199). Both sides
changed the column `div` in `src/app/writing/[slug]/page.tsx` (develop: `max-w-[70ch]` to
`max-w-[62ch]`; this branch: inserted `<Breadcrumb title={meta.title} />` right after it), so
`git merge-tree --write-tree HEAD origin/develop` reports a content conflict in that one file. The
branch still renders `max-w-[70ch]`, against spec step 3, and `git diff origin/develop --stat`
wrongly shows the branch deleting `src/content/posts/feature-flags.mdx`, its registry entry in
`src/content/posts/index.ts`, `public/writing/feature-flags/*.png`, the `img` mapping in
`src/mdx-components.tsx`, the "Screenshots and typography" section of `app_docs/writing.md` and a
`lefthook.yml` line. Those are artefacts of the stale base, not edits made here.
**Solution:** Commit the pending doc work from the first patch so the tree is clean, then
`git merge origin/develop` (a merge commit, no rebase, no force-push). Resolve the single conflict by
taking develop's `max-w-[62ch]` `div` and keeping the `Breadcrumb` as its first child above the
`h1`. Every other file (including `app_docs/writing.md`, whose develop and branch hunks are in
different places) merges automatically.

## Files to Modify

- `src/app/writing/[slug]/page.tsx`: conflict resolution only; the column becomes `max-w-[62ch]`,
  the `Breadcrumb` line stays.
- The merge itself brings in develop's `src/content/posts/feature-flags.mdx`,
  `src/content/posts/index.ts`, `public/writing/feature-flags/*`, `src/mdx-components.tsx`,
  `lefthook.yml` and `app_docs/writing.md` hunks unchanged. Do not hand-edit any of them.

## Implementation Steps

IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Leave a clean working tree

- `git status --short` currently shows uncommitted edits to `app_docs/writing.md`,
  `app_docs/routing-and-navigation.md`, `docs/conditional-docs.md` (the first patch's doc work) and
  the untracked `specs/patch/patch-adw-c1f03790-document-post-breadcrumb.md`, plus this patch file.
  `git merge` refuses to run while `app_docs/writing.md` is dirty, because develop also changes it.
- Commit them first (lefthook runs; never `--no-verify`), for example
  `git add app_docs/writing.md app_docs/routing-and-navigation.md docs/conditional-docs.md specs/patch/patch-adw-c1f03790-document-post-breadcrumb.md specs/patch/patch-adw-c1f03790-merge-develop-62ch-column.md`
  then `git commit -m "docs: document the post page breadcrumb"`. No trailers. Never stage
  `next-env.d.ts`, `.ports.env`, `.env*`, `agents/` or `trees/`. Do not use `git stash`.

### Step 2: Merge origin/develop

- `git fetch origin develop` then `git merge origin/develop --no-edit`.
- Expect exactly one conflict: `src/app/writing/[slug]/page.tsx`. If any other file conflicts,
  resolve it by taking develop's content plus this branch's breadcrumb addition only; never drop a
  develop change.

### Step 3: Resolve the page.tsx conflict

- Replace the conflict block so the component's return reads exactly:

  ```tsx
  <article className="mx-auto max-w-6xl px-4 py-6">
    <div className="max-w-[62ch]">
      <Breadcrumb title={meta.title} />
      <h1 className="text-2xl font-semibold tracking-tight">{meta.title}</h1>
      <PostMetaLine meta={meta} />
      <Content />
    </div>
  </article>
  ```

- Keep the `import { Breadcrumb } from "@/components/Breadcrumb";` line. No other edit to the file.
- `grep -n "<<<<<<<\|>>>>>>>\|=======" "src/app/writing/[slug]/page.tsx"` must print nothing.
- `git add "src/app/writing/[slug]/page.tsx"` then `git commit --no-edit` (conventional default
  merge message is fine; lefthook runs, do not bypass it).

### Step 4: Confirm the diff against develop

- `git diff origin/develop --stat` must list only: `src/components/Breadcrumb.tsx`,
  `src/components/Breadcrumb.test.ts`, `src/app/writing/[slug]/page.tsx` (one added line),
  `e2e/test_writing.md`, `app_docs/writing.md`, `app_docs/routing-and-navigation.md`,
  `docs/conditional-docs.md`, `specs/issue-200-adw-c1f03790-sdlc_planner-add-post-breadcrumb.md` and
  the two `specs/patch/patch-adw-c1f03790-*.md` files.
- It must not list `src/content/posts/feature-flags.mdx`, `src/content/posts/index.ts`,
  `public/writing/feature-flags/*`, `src/mdx-components.tsx` or `lefthook.yml`.
- `git diff origin/develop -- "src/app/writing/[slug]/page.tsx"` shows only the `Breadcrumb` import
  and the `<Breadcrumb title={meta.title} />` line; `git diff origin/develop -- app_docs/writing.md`
  shows only additions (the breadcrumb Overview sentence and Rule), with the "Screenshots and
  typography" section intact.

## Validation

Execute every command to validate the patch is complete with zero regressions.

- `git merge-tree --write-tree HEAD origin/develop`: prints a tree id and no `CONFLICT` line.
- `git diff origin/develop --stat`: matches the list in Step 4, with no deletions of the
  feature-flags post, its images, the registry entry, the `img` mapping or the lefthook change.
- `yarn lint`, `yarn typecheck`, `yarn knip`, `yarn format:check`, `yarn test` (includes
  `Breadcrumb.test.ts`): all pass.
- `yarn build`: succeeds, and the route list shows both `/writing/my-moat` and
  `/writing/feature-flags` as prerendered static (under `/writing/[slug]`).
- `grep -rn "—" src/components/Breadcrumb.tsx src/components/Breadcrumb.test.ts src/app/writing app_docs/writing.md app_docs/routing-and-navigation.md docs/conditional-docs.md e2e/test_writing.md specs/patch/patch-adw-c1f03790-merge-develop-62ch-column.md`:
  prints nothing (no em-dashes).

## Patch Scope

**Lines of code to change:** 1 line by hand (the column class in the conflict); the rest arrives
through the merge.
**Risk level:** low
**Testing required:** Clean merge-tree against develop, the scoped diff check, the full lint,
typecheck, knip, format, unit test and build chain, and the build's route list showing both posts
static.
