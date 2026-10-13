# Patch: Document the post page minimap in the feature docs

## Metadata

adw_id: `5be2aec6`
review_change_request: `Issue #1: Spec step 8 (Docs) and the acceptance criterion 'Docs updated: app_docs/writing.md (Minimap section, rules), app_docs/screens-and-components.md ("use client" list), docs/conditional-docs.md, .adw/project.md' are only partly done. Only .adw/project.md is in the diff. app_docs/writing.md still has the Rules line 'No client components, data fetching or env reads in a post' with no exception for PostMinimapViewport, no Minimap section and no spec path. The "use client" list in app_docs/screens-and-components.md does not name PostMinimapViewport, and no stateless-component list names PostMinimap. The writing.md line in docs/conditional-docs.md does not mention the minimap. AGENTS.md requires a feature doc's rules to change in the same change that alters them. Severity: blocker`

## Issue Summary

**Original Spec:** specs/issue-204-adw-5be2aec6-sdlc_planner-post-minimap.md
**Issue:** The minimap code (`src/components/PostMinimap.tsx`, `src/components/PostMinimapViewport.tsx`, `src/lib/minimap.ts`, `src/app/writing/[slug]/page.tsx`) shipped without its documentation. `app_docs/writing.md` still forbids client components on a post page with no exception, has no Minimap section and does not list the spec; `app_docs/screens-and-components.md` does not name `PostMinimapViewport` as a client component nor `PostMinimap` as stateless; `docs/conditional-docs.md` does not route minimap work to `app_docs/writing.md`.
**Solution:** Docs-only edits to three files, in the same branch as the code: add the spec path, an Overview sentence, a `### Minimap` section and the amended plus new Rules to `app_docs/writing.md`; extend the two component lists in `app_docs/screens-and-components.md`; extend the `app_docs/writing.md` line in `docs/conditional-docs.md`. No code changes. No em-dashes.

## Files to Modify

Use these files to implement the patch:

- `app_docs/writing.md`
- `app_docs/screens-and-components.md`
- `docs/conditional-docs.md`

## Implementation Steps

IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Update `app_docs/writing.md` (spec path, Overview, Minimap section, Rules)

- Under `**Specifications:**`, append `- specs/issue-204-adw-5be2aec6-sdlc_planner-post-minimap.md` after the issue-203 line.
- In `## Overview`, after the breadcrumb sentences (ending "`/writing` has no breadcrumb."), add one sentence: "From the `xl` breakpoint the post page also shows a minimap in the right gutter, outside the article: a scaled-down copy of the post with a frame around the part in the viewport (`src/components/PostMinimap.tsx`, see Minimap below)."
- Under `## How it works`, add a `### Minimap` section (place it after `### Screenshots and typography`, before `### The LinkedIn companion`) covering, in prose matching the doc's style:
  - Shown from `xl` only (`hidden xl:block`); below `xl` (375x667 included) there is no minimap.
  - It sits in the right gutter beside the post column, outside the `article`, as a sibling in `src/app/writing/[slug]/page.tsx`.
  - `PostMinimap` (server component) renders a second, server-rendered copy of the post's MDX `Content` with the `MINIMAP_COMPONENTS` overrides, which replace links, headings and other focusable or landmark elements with plain inert markup.
  - The copy is a `w-[62ch]` column scaled with CSS `zoom` at `MINIMAP_SCALE` (0.25, in `src/lib/minimap.ts`); `zoom`, unlike a transform, shrinks the layout box too, so the panel's height is the scaled height.
  - The panel is sticky below the header (`top-[calc(var(--header-height)+1.5rem)]`) and capped at `60vh` (`max-h-[60vh] overflow-hidden`).
  - When the miniature is taller than the panel it slides proportionally: as the reader scrolls from the top of the post to its end, the miniature's offset moves from 0 to its overflow, so the frame stays inside the panel.
  - `PostMinimapViewport` (`src/components/PostMinimapViewport.tsx`) is the one client leaf: it reads `window.scrollY`, `innerHeight`, the column's box (from its `h1` to its bottom) and the panel's height on scroll, resize and column resize (images loading), and passes them to the pure `minimapFrame` in `src/lib/minimap.ts`, which returns the frame's top and height and the slide offset (unit-tested in `src/lib/minimap.test.ts`). The frame starts null, so the server markup and the first client render match and nothing shifts on hydration.
  - Visual only: the panel is `aria-hidden="true"`, `inert`, `pointer-events-none` and `select-none`; no click-to-jump, no drag, no keyboard behaviour, no focus stop.
- In `## Rules`, replace the bullet "No client components, data fetching or env reads in a post; `src/mdx-components.tsx` stays server only (no `\"use client\"`)." with: "No client components, data fetching or env reads in a post; `src/mdx-components.tsx` stays server only (no `\"use client\"`). The post page's one client component is `PostMinimapViewport`, a leaf outside the `article`."
- Append to `## Rules`:
  - "The minimap stays outside the `article`, `aria-hidden` and `inert`, with no links, headings or focusable elements (its copy renders through `MINIMAP_COMPONENTS`)."
  - "Never add click-to-jump, drag or keyboard stops to the minimap: it is visual only."
  - "The minimap appears only on `/writing/[slug]`: never on `/writing` or any other route."

### Step 2: Update `app_docs/screens-and-components.md` (component lists)

- In the `"use client"` list (bullet starting "Server components by default; `\"use client\"` only where the browser must hold state", around line 145), change "`SubmitButton`, which reads its form's pending state, and `TurnstileScript`, which renders the Turnstile widget on mount)" to "`SubmitButton`, which reads its form's pending state, `TurnstileScript`, which renders the Turnstile widget on mount, and `PostMinimapViewport`, which reads the window's scroll to frame the visible part of a post's minimap)".
- In the stateless list that follows, change "`ClassDistributionBar`, `ProjectBreakdownTable`, `Skeleton` and the skeletons in `LoadingSkeletons.tsx` are components with no state" to "`ClassDistributionBar`, `ProjectBreakdownTable`, `PostMinimap`, `Skeleton` and the skeletons in `LoadingSkeletons.tsx` are components with no state".

### Step 3: Update `docs/conditional-docs.md` (index line)

- In the `app_docs/writing.md` line, change "the post page's breadcrumb or the post metadata check (`yarn check:og`)." to "the post page's breadcrumb, the post page's minimap or the post metadata check (`yarn check:og`)."

### Step 4: Format and check for em-dashes

- Run `yarn format` if `yarn format:check` reports any of the three files, then re-run `yarn format:check`.
- Run the spec's em-dash grep (below) and confirm it prints nothing.

## Validation

Execute every command to validate the patch is complete with zero regressions.

- `yarn format:check`: Prettier passes on the three edited docs (and the rest of the tree).
- `grep -rnP "\x{2014}" src/lib/minimap.ts src/lib/minimap.test.ts src/components/PostMinimap.tsx src/components/PostMinimap.test.ts src/components/PostMinimapViewport.tsx "src/app/writing/[slug]/page.tsx" app_docs/writing.md app_docs/screens-and-components.md docs/conditional-docs.md .adw/project.md e2e/test_post_minimap.md specs/patch/patch-adw-5be2aec6-document-post-minimap.md`: must print nothing.
- `git diff origin/develop --stat`: now lists `app_docs/writing.md`, `app_docs/screens-and-components.md` and `docs/conditional-docs.md`.
- `grep -n "issue-204\|### Minimap\|PostMinimapViewport" app_docs/writing.md`, `grep -n "PostMinimapViewport\|PostMinimap," app_docs/screens-and-components.md` and `grep -n "minimap" docs/conditional-docs.md`: each prints the new lines.
- `yarn lint`, `yarn typecheck`, `yarn knip`, `yarn test`: still pass (docs only, run because lefthook runs them on commit and push).

## Patch Scope

**Lines of code to change:** about 30 lines of Markdown across three docs; no code.
**Risk level:** low
**Testing required:** Formatting and em-dash checks on the edited docs; the commit-hook checks (lint, typecheck, knip, test) to confirm nothing else moved.
