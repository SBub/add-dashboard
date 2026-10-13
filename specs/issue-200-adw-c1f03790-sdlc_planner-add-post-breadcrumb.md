# Feature: Breadcrumb on post pages (Writing / post title)

## Metadata

issue_number: `200`
adw_id: `c1f03790`
issue_json: `{"number":200,"title":"Breadcrumb on post pages: Writing / post title"}`

## Feature Description

A post page (`/writing/[slug]`) gets a small breadcrumb directly above its `h1`: a `Writing` link to
`/writing`, a decorative separator, then the post title as plain text marked `aria-current="page"`.
It is a server component, muted and small, so it orients the reader without competing with the
title. On narrow screens the crumb's title truncates to one line with an ellipsis; the `h1` keeps
the full title. `/writing` itself gets no breadcrumb.

## User Story

As a reader who landed on a post from LinkedIn
I want to see that the post belongs to the Writing list and get back to it in one click
So that I can find the other posts without hunting for the header link

## Problem Statement

A post page has no in-page way back to the list. The only route to `/writing` is the header's
Writing link, which is easy to miss, especially for a reader arriving straight on a post.

## Solution Statement

Add `src/components/Breadcrumb.tsx`, a server component taking the current page's `title`. It
renders `<nav aria-label="Breadcrumb">` holding an `<ol>` with two `<li>`: a `next/link` `Writing`
to `/writing`, and a `<span aria-current="page">` with the title. The separator `/` is a
`<span aria-hidden="true">` inside the second item (so the list still has exactly two items and
screen readers read only them). The post page renders it in its column, first, above the `h1`.
No clock, no request-time read, no `"use client"`: both pages stay prerendered. Nothing changes
after the MDX body, in the header, `HeaderLink` or its current-section marking.

## Relevant Files

Use these files to implement the feature:

- `README.md`: repository overview (read first).
- `AGENTS.md`: rules (Yarn only, no em-dashes, docs layout, conventional commits without trailers).
- `.adw/project.md`: ADW profile; Tests says the only automated layer is `src/**/*.test.ts`
  (component render tests exist there via `renderToStaticMarkup`), E2E code suite is `none`,
  `e2e/*.md` journeys run in the test phase.
- `docs/conditional-docs.md`: doc index; the `writing.md` line must mention the breadcrumb.
- `app_docs/writing.md`: feature doc for `/writing` and post pages. Its Rules bind this change
  (no client components, no clock reads, nothing after the MDX body). Gets the breadcrumb in its
  Overview and a new rule.
- `app_docs/routing-and-navigation.md`: describes the `/writing/[slug]` route and the header's
  Writing link; gets one sentence on the in-page breadcrumb (without touching header rules).
- `src/app/writing/[slug]/page.tsx`: the post page, a server component; the column `div`
  (currently `max-w-[70ch]`; PR #199 may change it to `max-w-[62ch]`, keep whatever `develop` has)
  gets the breadcrumb above the `h1`.
- `src/app/writing/page.tsx`: the list; shows the site's text link style
  (`hover:underline hover:underline-offset-2`). Must not get a breadcrumb.
- `src/components/PostMetaLine.tsx`: the muted text style to match
  (`text-sm text-neutral-500 dark:text-neutral-400`).
- `src/components/RunRow.test.ts`, `src/components/LoadingSkeletons.test.ts`: the existing pattern
  for component tests (`createElement` + `renderToStaticMarkup` in a `.test.ts` file).
- `e2e/test_writing.md`: the Writing journey to extend.
- `vitest.config.ts`: confirms only `src/**/*.test.ts` is collected (no `.tsx` test files).

### New Files

- `src/components/Breadcrumb.tsx`: the breadcrumb server component.
- `src/components/Breadcrumb.test.ts`: render test for it.

## Implementation Plan

### Phase 1: Foundation

Write the `Breadcrumb` component and its render test, modelled on `RunRow.test.ts`.

### Phase 2: Core Implementation

Render the breadcrumb on the post page above the `h1`, with a small gap before the title.

### Phase 3: Integration

Update `app_docs/writing.md`, `app_docs/routing-and-navigation.md` and
`docs/conditional-docs.md`; extend `e2e/test_writing.md`; run every validation command.

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. Create `src/components/Breadcrumb.tsx`

- Server component (no `"use client"`), named export `Breadcrumb({ title }: { title: string })`,
  with a short comment in the style of `PostMetaLine.tsx` (what it is, where it renders, no clock).
- Markup:
  - `<nav aria-label="Breadcrumb" className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">`
  - `<ol className="flex min-w-0 items-center gap-2">`
  - first `<li className="shrink-0">`: `<Link href="/writing" className="hover:underline hover:underline-offset-2">Writing</Link>`
  - second `<li className="flex min-w-0 items-center gap-2">`: `<span aria-hidden="true">/</span>`
    then `<span aria-current="page" className="truncate">{title}</span>`.
- `min-w-0` on the flex chain plus `truncate` keeps the title on one line with an ellipsis and
  stops horizontal overflow at 375px. Keep the `href` a literal `/writing`.
- Do not render an `h1` or any heading.

### 2. Create `src/components/Breadcrumb.test.ts`

- `renderToStaticMarkup(createElement(Breadcrumb, { title: "My moat as a Product Engineer" }))`.
- Assert:
  - a `<nav` with `aria-label="Breadcrumb"`;
  - exactly two `<li` (count helper as in `LoadingSkeletons.test.ts`);
  - a link `<a href="/writing"` whose text is `Writing`, appearing before the title;
  - the title inside an element with `aria-current="page"`
    (`aria-current="page"[^>]*>My moat as a Product Engineer<`);
  - the separator carries `aria-hidden="true"`;
  - no `<h1`.
- Negative check: temporarily change the `href` in `Breadcrumb.tsx` to something else, run
  `yarn test` and confirm the test fails, then restore it. The probe must not appear in the diff.

### 3. Render it on the post page

- In `src/app/writing/[slug]/page.tsx`, import `Breadcrumb` and render
  `<Breadcrumb title={meta.title} />` as the first child of the column `div`, directly above the
  `h1`. Keep the column's `max-w-[...]` value exactly as on `develop` (70ch now, 62ch if #199 has
  landed). Change nothing else: the `h1`, `PostMetaLine`, `Content`, metadata and static params
  stay as they are, and nothing is added after `<Content />`.
- Do not touch `src/app/writing/page.tsx`, `SectionNav.tsx`, `HeaderLink.tsx` or
  `src/lib/header-section.ts`.

### 4. Update docs

- `app_docs/writing.md`:
  - Overview: the post page renders a breadcrumb (`src/components/Breadcrumb.tsx`, server only)
    above the title: `Writing` linking to `/writing`, then the title as the current page,
    truncated to one line on narrow screens; `/writing` has none.
  - Rules: add "The breadcrumb on a post page is a server component; its link is `/writing` and
    its last item is `meta.title` with `aria-current="page"`. `/writing` has no breadcrumb, and the
    `h1` stays the post's only `h1`."
- `app_docs/routing-and-navigation.md`: in the paragraph on `/writing` and `/writing/[slug]`, add
  one sentence that a post page carries an in-page breadcrumb back to `/writing` (see
  `app_docs/writing.md`) and that it does not change the header's current-section marking.
- `docs/conditional-docs.md`: extend the `writing.md` line with "or the post page's breadcrumb".
- No em-dashes anywhere.

### 5. Extend `e2e/test_writing.md`

- Add to the description and Success Criteria: the post page has a `Breadcrumb` navigation above
  its heading; `/writing` has none.
- In step 4 (on `/writing` at 1920x1080), also **Verify** there is no `navigation` named
  `Breadcrumb`.
- After step 5, add a step: **Verify** a `navigation` named `Breadcrumb` exists and, with
  `browser_evaluate`, that it precedes the `h1` in document order
  (`nav.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING`), its `Writing` link has
  `href="/writing"`, its last list item's text (ignoring the hidden separator) is
  `My moat as a Product Engineer` and carries `aria-current="page"`. Take a screenshot.
- Add a step: click the breadcrumb's `Writing` link, **Verify** the URL is `/writing` and the
  heading (level 1) is `Writing`; then navigate back to `/writing/my-moat`.
- Keep step 6's check valid: the last link in the `article` is still `Watch me build live`
  (the breadcrumb link comes first).
- Change the mobile steps (8 and 9) to 390x844 per the issue, with `scrollWidth <= 390`; on the
  post page also **Verify** the breadcrumb's title element is on one line
  (`getComputedStyle(el).whiteSpace === "nowrap"`). Update the screenshot count in Success
  Criteria.
- Renumber the steps.

### 6. Run the Validation Commands

- Run every command below; all must pass. Confirm the `yarn build` route list still shows
  `/writing/my-moat` as prerendered (static / SSG), not dynamic.

## Testing Strategy

### Unit Tests

`src/components/Breadcrumb.test.ts` renders the component to static markup and checks the
landmark name, the two items, the `/writing` link, the `aria-current="page"` title, the hidden
separator and the absence of an `h1`.

### Test Coverage

- `src/components/Breadcrumb.test.ts` (unit layer, `src/**/*.test.ts`, run by `yarn test`):
  catches a breadcrumb that is missing its `Breadcrumb` label, links anywhere but `/writing`,
  loses `aria-current="page"` on the title or exposes the separator to screen readers. It fails
  without this feature (the module does not exist) and with the href probe.
- Placement on the post page and absence on `/writing` have no code-test layer here (no component
  test of pages, E2E code suite `none`); they are covered by the extended `e2e/test_writing.md`
  journey (listed as a task, not a regression layer) and the review phase's screenshots.

### Edge Cases

- A long title at 390px and 375px: the crumb truncates with an ellipsis, the page does not scroll
  horizontally, the `h1` wraps in full.
- Screen readers: the list announces two items; `/` is hidden.
- Dark mode: muted `neutral-400` text stays readable.
- `/writing/does-not-exist` and `/writing/_` still 404 (the breadcrumb renders only after
  `notFound()` is passed).
- `article`'s last link remains the post's own closing link.

## Acceptance Criteria

- `/writing/my-moat` shows `Writing / My moat as a Product Engineer` above the `h1`, in small
  muted text, the `Writing` link underlined on hover and going to `/writing`.
- The breadcrumb is a `nav` named `Breadcrumb` with an `ol` of two items, the last with
  `aria-current="page"`, the separator `aria-hidden="true"`.
- `/writing` has no breadcrumb.
- The `h1` is unchanged and the only `h1`; nothing is added after the MDX body; the header and
  its current-section marking are unchanged.
- No `"use client"`, no clock, no request-time read; `yarn build` lists `/writing/my-moat` as static.
- Docs and the conditional-docs line updated; no em-dashes in any changed file.
- All validation commands pass.

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

- `yarn lint`: ESLint over the new component, test and page.
- `yarn typecheck`: `next typegen` and `tsc --noEmit` for the new props and imports.
- `yarn knip`: the new component is used and nothing is left unused.
- `yarn format:check`: Prettier formatting of code and the edited markdown.
- `yarn test`: runs `Breadcrumb.test.ts` and every existing unit test.
- `yarn build`: proves both writing pages still prerender (check `/writing/my-moat` is static in
  the route list).
- `grep -rn "—" src/components/Breadcrumb.tsx src/components/Breadcrumb.test.ts src/app/writing app_docs/writing.md app_docs/routing-and-navigation.md docs/conditional-docs.md e2e/test_writing.md`:
  must print nothing (no em-dashes).

## Notes

- No new dependency.
- If PR #199 lands first it adds `/writing/feature-flags`; the breadcrumb needs no change for it,
  and the column width must follow `develop`.
- Out of scope: breadcrumbs elsewhere, JSON-LD `BreadcrumbList`, anything under `adws/`.
- The component takes only `title` on purpose; if another section ever needs a breadcrumb, add a
  `parent: { href, label }` prop then, not now.
