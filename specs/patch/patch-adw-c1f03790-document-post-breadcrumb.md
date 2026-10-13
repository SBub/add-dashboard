# Patch: Document the post page breadcrumb

## Metadata

adw_id: `c1f03790`
review_change_request: `Issue #1: Spec step 4 (Update docs) was not done, and neither was the acceptance criterion 'Docs and the conditional-docs line updated'. app_docs/writing.md has no breadcrumb sentence in its Overview and no new Rule; app_docs/routing-and-navigation.md has no sentence on the in-page breadcrumb; the writing.md line in docs/conditional-docs.md has not been extended. Resolution: three doc edits, no em-dashes, then re-run yarn format:check and the spec's em-dash grep. Severity: blocker`

## Issue Summary

**Original Spec:** specs/issue-200-adw-c1f03790-sdlc_planner-add-post-breadcrumb.md
**Issue:** The branch ships `src/components/Breadcrumb.tsx` and wires it into
`src/app/writing/[slug]/page.tsx`, but spec step 4 (Update docs) was skipped: `grep -rni breadcrumb
app_docs docs README.md` returns nothing. The feature doc, the routing doc and the index line do not
mention the breadcrumb.
**Solution:** Three documentation-only edits: an Overview sentence and a Rule in
`app_docs/writing.md`, one sentence in the `/writing` paragraph of
`app_docs/routing-and-navigation.md`, and an extended `writing.md` line in `docs/conditional-docs.md`.
No code changes.

## Files to Modify

Use these files to implement the patch:

- `app_docs/writing.md`
- `app_docs/routing-and-navigation.md`
- `docs/conditional-docs.md`

## Implementation Steps

IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Update `app_docs/writing.md`

- In `## Overview`, directly after the sentence ending "(no call to action is added after it)."
  (line 12), add: "Above the title the post page renders a breadcrumb (`src/components/Breadcrumb.tsx`,
  server only): `Writing`, linking to `/writing`, then the post title as the current page, truncated
  to one line on narrow screens. `/writing` has no breadcrumb." Keep the following "Both sit outside
  `(dashboard)`..." sentence as is.
- In `## Rules`, append a final bullet:
  `- The breadcrumb on a post page is a server component; its link is \`/writing\` and its last item is \`meta.title\` with \`aria-current="page"\`. \`/writing\` has no breadcrumb, and the \`h1\` stays the post's only \`h1\`.`
  (wrap at about 100 columns with two-space continuation indent, like the neighbouring bullets).

### Step 2: Update `app_docs/routing-and-navigation.md`

- In the paragraph starting "`/writing` (`src/app/writing/page.tsx`) and `/writing/[slug]`" (lines
  94 to 98, ending "which 404s (see `app_docs/writing.md`)."), append one sentence: "A post page
  carries an in-page breadcrumb back to `/writing` (see `app_docs/writing.md`); it does not change
  the header's current-section marking."
- Do not touch the `## Rules` section or any header rule.

### Step 3: Update `docs/conditional-docs.md`

- On line 18 (the `app_docs/writing.md` line), change the ending
  "... a post page, its Open Graph image or `src/mdx-components.tsx`." to
  "... a post page, its Open Graph image, `src/mdx-components.tsx` or the post page's breadcrumb."

### Step 4: Format and check

- Run `yarn format` only if `yarn format:check` flags one of the three files, then re-check.
- Use commas, colons, semicolons or parentheses only; no em-dashes.

## Validation

Execute every command to validate the patch is complete with zero regressions.

- `grep -rni breadcrumb app_docs docs`: prints the new lines in `app_docs/writing.md` (Overview and
  Rules), `app_docs/routing-and-navigation.md` and `docs/conditional-docs.md`.
- `yarn format:check`: passes.
- `grep -rn "—" src/components/Breadcrumb.tsx src/components/Breadcrumb.test.ts src/app/writing app_docs/writing.md app_docs/routing-and-navigation.md docs/conditional-docs.md e2e/test_writing.md`:
  prints nothing.
- `yarn lint && yarn typecheck && yarn knip && yarn test`: still pass (the commit hooks run them;
  no code changed).

## Patch Scope

**Lines of code to change:** about 8 lines of markdown across 3 files, no code.
**Risk level:** low
**Testing required:** Documentation only: the breadcrumb grep, `yarn format:check` and the
em-dash grep; the commit hooks cover lint, typecheck and knip.
