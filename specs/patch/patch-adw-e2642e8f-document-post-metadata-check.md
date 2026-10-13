# Patch: Document the post metadata check

## Metadata

adw_id: `e2642e8f`
review_change_request: `Issue #1: Step 8 (Documentation) is not implemented. Neither app_docs/writing.md nor docs/conditional-docs.md appears in git diff origin/develop, and grepping both for check:og finds nothing. Add the spec link under Specifications, a "### The metadata check" subsection after "Metadata and the Open Graph image", a Rules line, and extend the index line with "or the post metadata check (yarn check:og)". No em-dashes; run yarn format:check afterwards. Severity: blocker`

## Issue Summary

**Original Spec:** specs/issue-203-adw-e2642e8f-sdlc_planner-enforce-post-og-metadata.md
**Issue:** Step 8 of the spec was skipped for the feature doc and the index. `app_docs/writing.md` does
not mention `yarn check:og`, so the header comment in `vitest.og.config.ts` ("See
app_docs/writing.md") points at a doc that does not describe the check, and
`docs/conditional-docs.md` does not route a reader to that doc for the check. `.adw/project.md`
already has its Step 8 edits and needs nothing.
**Solution:** Documentation only. Add the spec link, a `### The metadata check` subsection and one
Rules bullet to `app_docs/writing.md`, and extend the `app_docs/writing.md` line in
`docs/conditional-docs.md`. No code, config or test changes.

## Files to Modify

Use these files to implement the patch:

- `app_docs/writing.md`
- `docs/conditional-docs.md`

## Implementation Steps

IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Add the spec link in `app_docs/writing.md`

- Under `**Specifications:**`, after the line
  `- specs/issue-200-adw-c1f03790-sdlc_planner-add-post-breadcrumb.md`, add:
  `- specs/issue-203-adw-e2642e8f-sdlc_planner-enforce-post-og-metadata.md`

### Step 2: Add `### The metadata check` in `app_docs/writing.md`

- Insert it after the last paragraph of `### Metadata and the Open Graph image` (the one ending
  "`Image` still answers 404 for a slug that is no post.") and before `### Clock and prerendering`.
- Content (wrap at about 100 columns like the rest of the doc; no em-dashes):

  ```md
  ### The metadata check

  `yarn check:og` (`vitest run --config vitest.og.config.ts`) runs
  `scripts/check-post-metadata.test.ts` after `yarn build`. For every non-draft post it reads the
  prerendered `.next/server/app/writing/<slug>.html`, exactly what production serves, and asserts
  `<title>` and the description equal `meta.title` and `meta.description`; the canonical link and
  `og:url` end in `/writing/<slug>`; `og:title`, `og:description`, `og:type` (`article`) and
  `og:site_name` (`SITE_NAME`); `og:image` points at `/writing/<slug>/opengraph-image/` with
  `og:image:width` 1200, `og:image:height` 630, `og:image:type` `image/png` and a non-empty
  `og:image:alt`; and `twitter:card` is `summary_large_image`. URLs are checked by suffix, so the
  check passes for any host (`SITE_URL` unset in CI gives `http://localhost:3000`). A missing HTML
  file fails with "run yarn build first". It reads local files only: no fetch, no server, no port.

  Posts come from `POST_ENTRIES` through `getPosts()`, with drafts skipped (vitest runs with
  `NODE_ENV=test`, where `getPosts()` keeps drafts, so the check filters them itself). A new post is
  covered with no edit to the check, and a first test asserts the count of checked posts equals the
  count of non-draft entries and prints it (`check:og: <n> posts checked`).

  The check has its own `vitest.og.config.ts`, with `@mdx-js/rollup` so it can load each post's
  `meta` through the registry and the `@/` alias mirrored from `tsconfig.json`.
  `vitest.config.ts` includes only `src/**/*.test.ts`, so `yarn test` never runs it and stays
  build-free.

  It checks the built HTML rather than calling `generateMetadata` because several of the tags are
  produced by Next, not by the function: there is no `twitter` key in `generateMetadata` (the
  twitter tags are Next's fallback from `openGraph`), and the `og:image*` tags come from the
  `opengraph-image.tsx` file convention. A unit test of the function could not assert them.

  CI (`.github/workflows/ci.yml`) runs `yarn check:og` right after `yarn build`.
  ```

### Step 3: Add the Rules line in `app_docs/writing.md`

- Append to the end of `## Rules` (after the breadcrumb bullet):

  ```md
  - Every non-draft post must pass `yarn check:og`. Never hardcode a slug list in
    `scripts/check-post-metadata.test.ts` (posts come only from `getPosts()`), and a change to what
    a post's metadata tags contain changes the check in the same commit.
  ```

### Step 4: Extend the index line in `docs/conditional-docs.md`

- Replace the end of the `app_docs/writing.md` line,
  `` `src/mdx-components.tsx` or the post page's breadcrumb. ``, with
  `` `src/mdx-components.tsx`, the post page's breadcrumb or the post metadata check (`yarn check:og`). ``
  (the Oxford-comma list stays one sentence, and the line keeps its single trailing period).

### Step 5: Format

- Run `yarn format` if `yarn format:check` flags either file, then re-check.

## Validation

Execute every command to validate the patch is complete with zero regressions.

- `yarn format:check`: both Markdown files are Prettier-clean.
- `grep -n "check:og" app_docs/writing.md docs/conditional-docs.md`: hits in the new subsection, the
  Rules line and the index line.
- `grep -n "issue-203-adw-e2642e8f" app_docs/writing.md`: the spec link is listed.
- `grep -n "$(printf '\342\200\224')" app_docs/writing.md docs/conditional-docs.md`: no output (no
  em-dashes).
- `git diff --stat origin/develop -- app_docs/writing.md docs/conditional-docs.md`: both files now
  appear in the branch diff.

## Patch Scope

**Lines of code to change:** about 35 lines of Markdown, 0 lines of code
**Risk level:** low
**Testing required:** Prettier and grep checks only; no code changes, so lint, typecheck, knip,
unit tests, build and `yarn check:og` are unaffected.
