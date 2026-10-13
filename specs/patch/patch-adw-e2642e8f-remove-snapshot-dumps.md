# Patch: Remove the stray Playwright snapshot dumps

## Metadata

adw_id: `e2642e8f`
review_change_request: `Issue #2: Commit 002497b adds five files that have nothing to do with the spec: s9.yml (263 lines), s14.yml (263), s18.yml (39), s18b.yml (45) and s18c.yml (41) at the repository root. They are Playwright MCP accessibility-snapshot dumps of the running site, most likely left over from the test phase's browser journeys. Its own body says they were not staged, yet the commit contains them. The commit message is a prose paragraph ('No commit made. The working tree has no changes...') rather than a conventional-commit subject, which breaks AGENTS.md's conventional-commit rule. Merging would ship 651 lines of junk and a misleading commit into the repository. Resolution: On this branch, delete s9.yml, s14.yml, s18.yml, s18b.yml and s18c.yml (git rm) in a chore: commit, or drop commit 002497b from the branch history if the pipeline allows it. Optionally add a .gitignore pattern for root-level snapshot dumps so the test phase cannot commit them again. Severity: blocker`

## Issue Summary

**Original Spec:** specs/issue-203-adw-e2642e8f-sdlc_planner-enforce-post-og-metadata.md
**Issue:** Commit `002497b` tracks five Playwright MCP accessibility-snapshot dumps at the repository
root (`s9.yml`, `s14.yml`, `s18.yml`, `s18b.yml`, `s18c.yml`, 651 lines) that have nothing to do with
issue 203, under a prose commit message that is not a conventional-commit subject.
**Solution:** Remove the five files with `git rm` and ignore root-level snapshot dumps in
`.gitignore`, in a forward `chore:` commit made by the pipeline's commit phase. The branch is already
pushed to `origin` (`origin/chore/issue-203-...` contains `002497b`), so dropping the commit would
need a history rewrite and a force push; a forward commit avoids both. The prose commit message stays
in branch history; it disappears from `develop` if the pull request is squash-merged.

## Files to Modify

Use these files to implement the patch:

- `s9.yml`, `s14.yml`, `s18.yml`, `s18b.yml`, `s18c.yml` (delete)
- `.gitignore`

## Implementation Steps

IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Delete the five snapshot dumps

- From the worktree root: `git rm s9.yml s14.yml s18.yml s18b.yml s18c.yml`.
- Do not touch the only legitimate root YAML files, `.yarnrc.yml` and `lefthook.yml`.
- Leave the uncommitted documentation edits from the Issue #1 patch (`app_docs/writing.md`,
  `docs/conditional-docs.md`) as they are.

### Step 2: Ignore root-level snapshot dumps

- In `.gitignore`, directly under the existing `.playwright-mcp/` line and its comment, add:

  ```
  # browser_snapshot dumps saved to the repo root by a test or review journey (s9.yml, s18b.yml)
  /s[0-9]*.yml
  ```

- The leading slash anchors the pattern to the root, so it matches `s9.yml`, `s14.yml`, `s18b.yml`
  and never `.yarnrc.yml`, `lefthook.yml` or a YAML file in a subdirectory. No em-dashes.

### Step 3: Leave the commit to the commit phase

- Do not commit, amend, rebase or force push. The pipeline's commit phase records the change with a
  bare `chore:` subject (for example `chore: remove stray Playwright snapshot dumps`), the
  `adw: <agent> e2642e8f` body line and no trailers, per `.adw/project.md` Documentation.

## Validation

Execute every command to validate the patch is complete with zero regressions.

- `git ls-files | grep -E '^s[0-9]+[a-z]*\.yml$'`: prints nothing (the dumps are no longer tracked).
- `touch s99.yml && git check-ignore -v s99.yml && rm s99.yml`: shows the new `/s[0-9]*.yml` rule;
  `git check-ignore .yarnrc.yml lefthook.yml` prints nothing.
- `yarn format:check`
- `yarn lint`
- `yarn typecheck`, then confirm `next-env.d.ts` is not staged.
- `yarn knip`
- `yarn test`
- `git status --porcelain`: only the five deletions (`D`), `.gitignore`, the Issue #1 doc edits and
  the patch plans; no `.ports.env`, `next-env.d.ts`, `agents/` or `trees/`.

## Patch Scope

**Lines of code to change:** 651 lines deleted across five files, 2 lines added to `.gitignore`
**Risk level:** low
**Testing required:** None beyond the profile's commit checks: no source, config or test changes, so
`yarn build` and `yarn check:og` are unaffected and not rerun for this patch.
