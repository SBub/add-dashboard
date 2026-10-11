# Patch: Write the spec step 15 docs for the MDX writing blog

## Metadata

adw_id: `d5ef5a75`
review_change_request: `Issue #1: Spec step 15 (Documentation and profile) is only partly done. The .adw/project.md updates landed, but app_docs/writing.md does not exist. docs/conditional-docs.md has no writing line. app_docs/routing-and-navigation.md does not mention /writing, /writing/[slug] or the "writing" header section, even though its Rules list headerSection's answers and AGENTS.md requires a rule change in the same commit. app_docs/clock-and-prerender.md has no sentence about /writing, and README.md has neither the Documentation link nor the /writing mention. The acceptance criterion that lists these docs therefore fails. The validation command grep -rnP "\x{2014}" app_docs/writing.md ... exits 2 with 'app_docs/writing.md: No such file or directory'. next.config.ts and src/mdx-components.tsx already point readers to app_docs/writing.md, a file that does not exist. Resolution: On this branch: (1) Create app_docs/writing.md with the Specifications, Overview, How it works and Rules sections that step 15 lists. Include: how to add a post, the meta shape and why it is named meta, the slug rule, drafts, the .linkedin.md companion, the OG image at /writing/<slug>/opengraph-image/og with the title as alt, the generateImageMetadata fallback id for the slug-less build call, the Work with me mapping, the _ placeholder, and that NODE_ENV is not a new env var. (2) Add the conditional-docs line for it, and add 'the Writing link' to the routing doc's line. (3) Update app_docs/routing-and-navigation.md: Specifications, the route tree, the header link, and the Rules headerSection answers including "writing". (4) Add one sentence to app_docs/clock-and-prerender.md saying /writing reads no clock. (5) Add '- [Writing](app_docs/writing.md)' and a /writing mention to README.md. Use no em-dashes, then rerun the em-dash grep validation command. Severity: blocker`

## Issue Summary

**Original Spec:** `specs/issue-170-adw-d5ef5a75-sdlc_planner-add-mdx-writing-blog.md`
**Issue:** The code for `/writing`, `/writing/[slug]`, its OG image, the registry, `src/lib/posts.ts`
and the "writing" header section landed, and `.adw/project.md` was updated, but the rest of spec
step 15 did not: `app_docs/writing.md` is missing (while `next.config.ts` and
`src/mdx-components.tsx` already link to it), `docs/conditional-docs.md` has no line for it,
`app_docs/routing-and-navigation.md` still says `headerSection` answers `"home"`, `"watch"`,
`"hire"` or null and that `SectionNav` links to `/watch` only, `app_docs/clock-and-prerender.md`
says nothing about `/writing`, and `README.md` neither links the doc nor mentions `/writing`. The
spec's em-dash grep exits 2 on the missing file.
**Solution:** Docs-only patch. One new feature doc describing what the code already does, in-place
edits to the routing doc (including the binding `headerSection` rule), one sentence in the clock
doc, the index and the README. No source file changes.

## Files to Modify

- `app_docs/writing.md` (new)
- `docs/conditional-docs.md`
- `app_docs/routing-and-navigation.md`
- `app_docs/clock-and-prerender.md`
- `README.md`

## Implementation Steps

IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Create `app_docs/writing.md`

Follow the shape of `app_docs/home.md` (title, `**Specifications:**` list, `## Overview`,
`## How it works` with `###` subsections, `## Rules`). Describe only what the code on this branch
does (read `src/lib/posts.ts`, `src/content/posts/index.ts`, `src/content/posts/hello.mdx`,
`src/content/posts/registry.test.ts`, `src/app/writing/page.tsx`,
`src/app/writing/[slug]/page.tsx`, `src/app/writing/[slug]/opengraph-image.tsx`,
`src/components/PostMetaLine.tsx`, `src/mdx-components.tsx`, `next.config.ts`).

- Title `# Writing`. Specifications: `specs/issue-170-adw-d5ef5a75-sdlc_planner-add-mdx-writing-blog.md`.
- Overview: `/writing` (`src/app/writing/page.tsx`) lists visible posts newest first (title link,
  `DD.MM.YYYY` date, audience tag, description); `/writing/[slug]`
  (`src/app/writing/[slug]/page.tsx`) renders one post (title, date, tag, MDX body, closing Work
  with me link). Both sit outside `(dashboard)`: no sidebar, no `Providers`, no Realtime, no pill.
  Posts are MDX modules under `src/content/posts/`, compiled by `@next/mdx` (`createMDX()` in
  `next.config.ts`) and styled by `src/mdx-components.tsx` (server only).
- How it works, subsections:
  - `### Adding a post`: create `src/content/posts/<slug>.mdx` exporting `meta`, add one line
    `{ slug: "<slug>", load: () => import("./<slug>.mdx") }` to `POST_ENTRIES` in
    `src/content/posts/index.ts` (string-literal import per entry so the bundler, TypeScript and
    knip see the file); `src/content/posts/registry.test.ts` fails when the directory's `.mdx`
    files and the list disagree.
  - `### The meta export`: shape `{ title, description, date: "YYYY-MM-DD", audience:
"product-engineer" | "small-business" | "both", draft: boolean }`, checked field by field by
    `parsePostMeta`, which throws naming the post and field so a bad post fails `yarn build`. It is
    named `meta`, not `metadata`, because `metadata` is the Next.js page export name and a post is
    a module imported by a page, not a route; a separate name avoids confusing the two. `date` must
    be a real calendar date (round-trips through `Date.parse`, which reads the string, not the
    clock).
  - `### Slugs`: `isPostSlug`, lowercase letters, digits and inner hyphens (`hello`,
    `ai-at-work-2`); `getPost` rejects a malformed or unregistered slug against the registry before
    importing any module, so `/writing/does-not-exist`, `/writing/_` and `/writing/hello.linkedin`
    are 404.
  - `### Drafts`: `visiblePosts(posts, process.env.NODE_ENV)` drops `draft: true` posts when
    `NODE_ENV` is `production` (`yarn build`, `yarn start`) and keeps them in `yarn dev`. A draft is
    only recognisable from its `meta`, so its module is imported, then `getPost` returns null and
    the page calls `notFound()`. `NODE_ENV` is set and inlined by Next itself; it is not a new
    environment variable, needs no `.env*` entry and does not touch the data boundary's env list.
  - `### The LinkedIn companion`: an optional `src/content/posts/<slug>.linkedin.md` beside a post
    holds the LinkedIn text; it is never listed in the registry, imported, routed or rendered, and
    is copied into LinkedIn by hand.
  - `### Order, tag and Work with me`: `sortPostsNewestFirst` (date descending, ties by slug);
    `postAudienceLabel` gives "For product teams", "For business owners", "For everyone";
    `postHireHref` maps `product-engineer` to `/hire?offer=product-engineer`, `small-business` to
    `/hire?offer=ai-consulting` (both through `hireOfferHref`) and `both` to plain `/hire`.
  - `### Static params and the _ placeholder`: `generateStaticParams` prerenders one page per
    visible post; under `cacheComponents` an empty array fails the build, so a production build
    with only drafts returns `[{ slug: "_" }]`, which fails `isPostSlug` and lands on `notFound()`.
    `dynamicParams` cannot be exported under `cacheComponents`, so an unknown slug resolves on
    request and 404s.
  - `### Metadata and the Open Graph image`: `generateMetadata` sets `title`, `description` and
    `openGraph` (`type: "article"`, `publishedTime` from `meta.date`, author). The 1200x630 PNG is
    `src/app/writing/[slug]/opengraph-image.tsx` (`ImageResponse`, title plus author name, default
    bundled font, no fetch, no external fonts or images). It uses `generateImageMetadata` because
    that is the only way to give each image a per-post alt (the post title); that puts the image at
    `/writing/<slug>/opengraph-image/og`. Next also calls `generateImageMetadata` at build time with
    no `slug` (the image route's own static params do not inherit the page's); that call only
    collects ids and an empty list errors the build under `cacheComponents`, so it returns the one
    id `og` with the fallback alt "Sviatlana Buben, writing"; `Image` still 404s for a slug that is
    no post.
  - `### Clock and prerendering`: both pages and the image read no clock and nothing at request
    time; dates are `meta.date` through the pure `formatDay` in `PostMetaLine`.
- Rules (bullets, each an invariant):
  - Posts are read only through `getPosts` and `getPost` in `src/lib/posts.ts`.
  - No `fs` at runtime (only `registry.test.ts` reads the directory).
  - Never set `pageExtensions` for `md`/`mdx`: posts are modules, never routes.
  - No client components, data fetching or env reads in a post; `src/mdx-components.tsx` stays
    server only.
  - No clock reads in `/writing`, a post page, the OG image or `src/lib/posts.ts`.
  - Never import a `.linkedin.md` file from `src/`, and never list one in the registry.
  - `generateStaticParams` in `src/app/writing/[slug]/page.tsx` never returns an empty array (keep
    the `_` placeholder), and `generateImageMetadata` never returns an empty list for the
    slug-less build call (keep the `og` fallback id).
  - Every post is registered in `POST_ENTRIES` with a string-literal import.

### Step 2: Update `docs/conditional-docs.md`

- Append after the `home.md` line:
  ``- `app_docs/writing.md`: read when adding or changing a post under `src/content/posts/`, the registry, `src/lib/posts.ts`, `/writing`, a post page, its Open Graph image or `src/mdx-components.tsx`.``
- In the `app_docs/routing-and-navigation.md` line, change "the header's links or their
  current-section marking" to "the header's links, the Writing link or their current-section
  marking".

### Step 3: Update `app_docs/routing-and-navigation.md`

- Specifications: append `- specs/issue-170-adw-d5ef5a75-sdlc_planner-add-mdx-writing-blog.md`.
- Overview route tree: insert `/writing`, `/writing/[slug]` after `/hire` in
  `(`/`, `/watch`, `/projects`, `/projects/[owner]/[repo]`, `/hire`, the `/summary` redirect)`.
- How it works, header paragraph: after the "Watch me build" sentence add that a "Writing" link
  goes to `/writing` and is emphasised on `/writing` and every post below it.
- How it works, Routing section: after the `/hire` sentence add that `/writing`
  (`src/app/writing/page.tsx`) and `/writing/[slug]` (`src/app/writing/[slug]/page.tsx`) also sit
  outside `(dashboard)`, are static (prerendered from the post registry), with no `Providers`, no
  Realtime and no pill; an empty production post list yields the placeholder slug `_`, which 404s
  (see `app_docs/writing.md`).
- Rules, `headerSection` bullet: add `"Writing" (section key "writing") is active on `/writing`,
`/writing/`and every path below`/writing/`(never`/writingx`or`/writing-old`)`, and change
  "So `headerSection` answers `"home"`, `"watch"`, `"hire"` or null" to
  "answers `"home"`, `"watch"`, `"writing"`, `"hire"` or null".
- Rules, `/summary` bullet's tail: change "the header's `SectionNav` links to `/watch` only" to
  "the header's `SectionNav` links to `/watch` and `/writing`".

### Step 4: Update `app_docs/clock-and-prerender.md` and `README.md`

- `app_docs/clock-and-prerender.md`: add the spec to Specifications; after the paragraph ending
  "(see `app_docs/home.md`)." (line 55) add one sentence: `/writing` and its post pages read no
  clock either (a post's date is its `meta.date` through `formatDay`), so the blog leaves the
  count of clock sites unchanged (see `app_docs/writing.md`).
- `README.md`: in the opening paragraph after the `/watch` sentence add "`/writing` is the blog."
  (or equivalent short route mention); append `- [Writing](app_docs/writing.md)` to the
  Documentation list after `- [Home page](app_docs/home.md)`.

### Step 5: Format and check

- Run `yarn format` so Prettier settles the new and edited Markdown, then the validation below.
- Confirm no em-dash in any touched file.

## Validation

Execute every command to validate the patch is complete with zero regressions.

- `grep -rnP "\x{2014}" app_docs/writing.md app_docs/routing-and-navigation.md src/lib/posts.ts src/app/writing src/content/posts e2e/test_writing.md .adw/project.md README.md`: no output (exit 1, not 2).
- `grep -nP "\x{2014}" app_docs/clock-and-prerender.md docs/conditional-docs.md`: no output.
- `grep -n "writing" docs/conditional-docs.md app_docs/routing-and-navigation.md app_docs/clock-and-prerender.md README.md`: the new line, route tree, header rule (`"writing"`), sentence and README link all present.
- `yarn format:check`
- `yarn lint && yarn typecheck && yarn knip && yarn test`: unchanged and passing (no source touched).

## Patch Scope

**Lines of code to change:** about 120 lines of Markdown (about 100 new in `app_docs/writing.md`, about 20 across the four edited files); 0 lines of code.
**Risk level:** low
**Testing required:** em-dash grep, `yarn format:check`, and the commit hooks' lint, typecheck, knip and test as a regression check; no build or browser check needed for a docs-only change.
