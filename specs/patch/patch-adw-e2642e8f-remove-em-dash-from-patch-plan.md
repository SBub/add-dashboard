# Patch: Remove the literal em-dash from the post metadata patch plan

## Metadata

adw_id: `e2642e8f`
review_change_request: `Issue #1: Spec step 8 requires 'No em-dash characters anywhere (a grep for U+2014 over the changed files returns nothing)', and AGENTS.md forbids em-dashes in any file. The new untracked patch plan specs/patch/patch-adw-e2642e8f-document-post-metadata-check.md line 104 contains a literal U+2014 inside its validation command. Edit line 104 so it no longer contains the character (write the command with the octal UTF-8 bytes \342\200\224, or reword it as 'a grep for U+2014'), then rerun the U+2014 grep over the branch's changed and new files and confirm it prints nothing. Severity: blocker`

## Issue Summary

**Original Spec:** `specs/issue-203-adw-e2642e8f-sdlc_planner-enforce-post-og-metadata.md`
**Issue:** Line 104 of `specs/patch/patch-adw-e2642e8f-document-post-metadata-check.md` holds a
literal U+2014 inside the `printf` argument of its no-em-dash validation command. It is the only
U+2014 among the branch's changed and new files, so the spec's own "no em-dash anywhere" check and
the AGENTS.md rule both fail once the plan is committed.
**Solution:** Replace the literal character in that `printf` argument with its octal UTF-8 bytes
(`\342\200\224`). The command keeps the exact same behaviour (`printf` expands the escapes to
U+2014 at run time) while the file itself no longer contains the character.

## Files to Modify

- `specs/patch/patch-adw-e2642e8f-document-post-metadata-check.md` (line 104 only)

## Implementation Steps

IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Rewrite the validation command on line 104

- In `specs/patch/patch-adw-e2642e8f-document-post-metadata-check.md`, line 104 currently reads
  ``- `grep -n "$(printf '<U+2014>')" app_docs/writing.md docs/conditional-docs.md`: no output (no``
  where `<U+2014>` is the literal em-dash character.
- Replace only the character between the single quotes with the eight ASCII characters
  `\342\200\224`, so the line reads:
  ``- `grep -n "$(printf '\342\200\224')" app_docs/writing.md docs/conditional-docs.md`: no output (no``
- Leave line 105 (`  em-dashes).`) and every other line of the file unchanged. Use an exact
  string edit (for example `perl -CSD -pi -e 's/\x{2014}/\\342\\200\\224/ if $. == 104'` or the
  Edit tool), not a reflow of the paragraph.

### Step 2: Confirm the file is still Prettier-clean

- Run `yarn format:check`. If it flags the plan, run `yarn format` and recheck; the edit changes
  no line lengths beyond 100 columns, so no reflow is expected.

## Validation

Execute every command to validate the patch is complete with zero regressions.

- `grep -rn $'\u2014' specs/patch/patch-adw-e2642e8f-* specs/issue-203-* app_docs/writing.md docs/conditional-docs.md .adw/project.md scripts/check-post-metadata.test.ts vitest.og.config.ts .gitignore`:
  prints nothing (exit status 1).
- `sed -n 104p specs/patch/patch-adw-e2642e8f-document-post-metadata-check.md`: shows
  `printf '\342\200\224'` in the command.
- `grep -n "$(printf '\342\200\224')" app_docs/writing.md docs/conditional-docs.md`: no output,
  proving the rewritten command still runs and still finds no em-dash in the docs.
- `yarn format:check`: every file is Prettier-clean.
- `git status --porcelain`: no `next-env.d.ts` or `.ports.env` staged.

## Patch Scope

**Lines of code to change:** 1 (one line in a Markdown patch plan)
**Risk level:** low
**Testing required:** the U+2014 grep over the branch's changed and new files returns nothing, and
`yarn format:check` passes. No code, test or build change, so lint, typecheck, knip, unit tests,
build and `yarn check:og` are unaffected.
