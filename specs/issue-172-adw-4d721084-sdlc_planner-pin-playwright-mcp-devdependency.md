# Chore: run Playwright MCP from a pinned devDependency instead of yarn dlx on every call

## Metadata

issue_number: `172`
adw_id: `4d721084`
issue_json: `{"number":172,"title":"chore: run Playwright MCP from a pinned devDependency instead of yarn dlx on every call"}`

## Chore Description

`.mcp.json` starts the Playwright MCP server with `yarn dlx --quiet @playwright/mcp@0.0.81 --isolated --config ./playwright-mcp-config.json`. `yarn dlx` installs the package into a fresh temp directory on every call, so every agent invocation in an ADW run (33 E2E runner calls alone in run `cf1087b2`) pays a download and unpack.

The fix installs `@playwright/mcp` as a devDependency pinned to exactly `0.0.81` (its `bin` is `playwright-mcp` -> `cli.js`) and has `.mcp.json` run the installed binary through `yarn playwright-mcp`. The version and every remaining flag stay identical: `--isolated` and `--config ./playwright-mcp-config.json` (headless chromium, 1920x1080) are what the E2E journeys and review screenshots depend on. `playwright-mcp-config.json` is not touched. Because the package is referenced only from `.mcp.json` (knip scans `src/**`), knip may flag it as unused; if so it goes in `ignoreDependencies` in `knip.json`. The ADW profile's line about the Playwright MCP server is updated to say it is a pinned devDependency run from `node_modules`.

Out of scope: upgrading past `0.0.81`, toolkit changes (SBub/adw-toolkit#104), other projects' `.mcp.json`.

## Relevant Files

Use these files to resolve the chore:

- `.mcp.json` - declares the `playwright` MCP server; its `args` switch from `dlx --quiet @playwright/mcp@0.0.81 ...` to `playwright-mcp ...`.
- `package.json` - gains `"@playwright/mcp": "0.0.81"` in `devDependencies` (exact, no caret).
- `yarn.lock` - updated by `yarn add`; committed with the change (prettier ignores it).
- `knip.json` - may need `"ignoreDependencies": ["@playwright/mcp"]`, only if `yarn knip` reports it as unused.
- `.adw/project.md` - Review section, lines 164-165 ("Browser automation is the Playwright MCP server in `.mcp.json` ..."); state it is the pinned devDependency `@playwright/mcp@0.0.81` run from `node_modules` via `yarn playwright-mcp`. Keep the nine `##` headings untouched.
- `playwright-mcp-config.json` - read only; must not change.
- `README.md` - lines 58-60 mention `.mcp.json`; read only, it describes no install mechanism so no change is needed (README holds no feature descriptions).
- `AGENTS.md` - rules: Yarn only, no em-dashes, conventional commits with no trailers, update `.adw/project.md` in the same change.
- `.yarnrc.yml` - `nodeLinker: node-modules`, so the bin lands in `node_modules/.bin/playwright-mcp` and `yarn playwright-mcp` resolves it.
- `lefthook.yml` - pre-commit runs prettier on staged `json`/`md`, lint, typecheck and knip (knip triggers on `*.json`); pre-push runs `yarn test`.

No `docs/conditional-docs.md` entry matches: this is tooling, not a feature, and the profile says a dependency change needs no documentation in `app_docs/`.

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. Add the pinned devDependency

- Run `yarn add -D -E @playwright/mcp@0.0.81`.
- Confirm `package.json` reads exactly `"@playwright/mcp": "0.0.81"` under `devDependencies` (no `^` or `~`), and that `yarn.lock` changed accordingly. Do not touch any other dependency.

### 2. Point `.mcp.json` at the installed binary

- Replace the `args` array with `["playwright-mcp", "--isolated", "--config", "./playwright-mcp-config.json"]`. Keep `"command": "yarn"` and the server name `playwright`.
- Remove only `dlx`, `--quiet` and `@playwright/mcp@0.0.81`; every other flag stays in the same order.
- Do not edit `playwright-mcp-config.json`.

### 3. Prove the binary resolves

- `yarn playwright-mcp --help` prints the server's usage.
- Negative check: temporarily set the `.mcp.json` binary name to `playwright-mcp-x`, run `yarn playwright-mcp-x --help` and confirm it fails (command not found), then revert `.mcp.json` to `playwright-mcp` and confirm with `git diff .mcp.json` that only the intended change remains.

### 4. Keep knip green

- Run `yarn knip`. If it reports `@playwright/mcp` as an unused devDependency, add `"ignoreDependencies": ["@playwright/mcp"]` to `knip.json` (reason: it is used only by `.mcp.json` to run the Playwright MCP server for ADW agents, never imported from `src/**`). Do not reference it from code. If knip does not report it, leave `knip.json` unchanged.

### 5. Update the ADW profile

- In `.adw/project.md`, Review section, rewrite the last bullet so it says the Playwright MCP server in `.mcp.json` is the devDependency `@playwright/mcp`, pinned to exactly `0.0.81`, run from `node_modules` through `yarn playwright-mcp` (no `yarn dlx`), configured by `playwright-mcp-config.json` (headless chromium, 1920x1080), and that an upgrade is a `package.json` pin change.
- Do not rename, reorder or add any `##` heading. No em-dashes.

### 6. Run the Validation Commands

- Run every command below; all must pass. Then confirm `git status` shows only `package.json`, `yarn.lock`, `.mcp.json`, `.adw/project.md`, optionally `knip.json`, and this spec (never `next-env.d.ts`, `.ports.env`, `.env*`, `agents/` or `trees/`).

## Test Coverage

No test needed: this is a pure dependency and tool-configuration change. Nothing under `src/` changes, and the only test layer (`src/**/*.test.ts`, vitest) cannot load `.mcp.json` or start an MCP server. The proof is the binary check (`yarn playwright-mcp --help` succeeds, the `playwright-mcp-x` negative check fails), the grep checks below, and the E2E phase of this run still driving the browser and saving review screenshots under `agents/4d721084/`.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

- `yarn install --immutable` - the lockfile is consistent with `package.json` after the add.
- `yarn playwright-mcp --help` - the pinned binary resolves from `node_modules` without `dlx`.
- `grep -n '"dlx"' .mcp.json` - must print nothing.
- `grep -n '"@playwright/mcp": "0.0.81"' package.json` - must print exactly one line (exact pin).
- `git diff --exit-code playwright-mcp-config.json` - the config is unchanged.
- `grep -c '^## ' .adw/project.md` - still prints `9`.
- `grep -rn $'\xe2\x80\x94' .mcp.json package.json knip.json .adw/project.md specs/issue-172-adw-4d721084-sdlc_planner-pin-playwright-mcp-devdependency.md` - must print nothing (no em-dashes).
- `yarn lint` - lint passes.
- `yarn typecheck` - types still check (do not stage the rewritten `next-env.d.ts`).
- `yarn knip` - no unused dependency reported for `@playwright/mcp`.
- `yarn format:check` - `package.json`, `.mcp.json`, `knip.json` and the markdown are Prettier-clean.
- `yarn test` - unit tests pass (pre-push gate).
- `yarn build` - the app still builds (needs `.env.local` copied during install).

## Notes

- The run implementing this still launches its own agents with the old `.mcp.json` until the change is on the branch, so the binary checks above are the proof, not the run's own agents.
- `yarn install --immutable` in the profile's Install step will fail for this run's worktree until `yarn add` updates `yarn.lock`; the lockfile change is intended and must be committed with `package.json`.
- `knip.json` is plain JSON, so the reason for an `ignoreDependencies` entry cannot be a comment there; put it in the commit message body.
- Commit as `chore: run Playwright MCP from a pinned devDependency`, no trailers.
