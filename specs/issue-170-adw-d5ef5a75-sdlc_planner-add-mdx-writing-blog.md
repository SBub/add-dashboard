# Feature: Writing, an MDX blog at /writing with LinkedIn-ready post pages

## Metadata

issue_number: `170`
adw_id: `d5ef5a75`
issue_json: `{"number":170,"title":"Writing: an MDX blog at /writing with LinkedIn-ready post pages", ...}` (body as filed in issue #170)

## Feature Description

A blog at `/writing`. Posts are MDX files committed to `src/content/posts/`, written by the owner and
shipped through ADW like any other change. `/writing` lists the published posts newest first (title
link, date, audience tag, description). Each post is its own static, LinkedIn-shareable page at
`/writing/<slug>`: its own `<title>`, description, Open Graph tags (`type: "article"`,
`publishedTime`) and a generated 1200x630 Open Graph PNG with the post title and "Sviatlana Buben",
ending with a "Work with me" call to action into `/hire` (with the matching `?offer=` when the
post's audience is one of the two offers). The header gains a "Writing" section link. An optional
`<slug>.linkedin.md` beside each post holds the LinkedIn companion text the owner copies by hand;
it is never imported, routed or rendered.

## User Story

As the site owner (Sviatlana Buben)
I want to publish short essays as MDX files in this repository, each with its own shareable page
So that I can post a link on LinkedIn that previews well (title, description, image) and leads
readers to the Work with me form

## Problem Statement

The site has an intro page, the ADW ledger (`/watch`, `/projects`) and `/hire`, but no place for
long-form writing. LinkedIn is the owner's distribution channel, and a LinkedIn share needs a page
with its own title, description and Open Graph image. There is no MDX support, no post registry and
no header entry for writing.

## Solution Statement

- Add `@next/mdx` (pinned to the installed `next` 16.3.8) with its loader and React provider, wrap
  `next.config.ts` with `createMDX()` (no plugins), and add the required `src/mdx-components.tsx`
  mapping MDX elements to the site's typography (server components only).
- Posts carry metadata as an MDX `export const meta = {...}` (no YAML frontmatter, which `@next/mdx`
  does not support without a remark plugin).
- An explicit typed registry `src/content/posts/index.ts` lists every post: slug plus a lazy
  static `import()` of its module. No `fs` at runtime; knip and TypeScript see every post.
- `src/lib/posts.ts` holds the pure core (`parsePostMeta`, `isPostSlug`, `sortPostsNewestFirst`,
  `visiblePosts(posts, nodeEnv)`, `postAudienceLabel`, `postHireHref`) and two thin loaders
  (`getPosts()`, `getPost(slug)`) that read the registry and pass `process.env.NODE_ENV` into the
  pure functions. The index page, `generateStaticParams`, the post page, its metadata and its OG
  image read posts only through these loaders.
- Routes `src/app/writing/page.tsx`, `src/app/writing/[slug]/page.tsx` and
  `src/app/writing/[slug]/opengraph-image.tsx`, all outside `(dashboard)` (no sidebar, no
  `Providers`, no Realtime), all fully static, no clock reads.
- `headerSection` gains a `"writing"` key (`/writing`, `/writing/`, anything under `/writing/`;
  never `/writingx`), and `SectionNav` gains a Writing `HeaderLink` in its own `Suspense`, like
  Watch me build.

## Relevant Files

Use these files to implement the feature:

- `README.md`: human-facing overview; its Documentation list links each feature doc, so the new
  `app_docs/writing.md` gets a line there.
- `AGENTS.md`: rules (Yarn only, no em-dashes, one doc per feature, conventional commits, read the
  installed Next docs first).
- `.adw/project.md`: the ADW profile. Add `src/content/posts/` as a source location, the new e2e
  journey to the Tests list, and `/writing` plus `/writing/hello` to the Review section. Keep the
  nine `##` headings and their order.
- `docs/conditional-docs.md`: add one line for `app_docs/writing.md`.
- `app_docs/routing-and-navigation.md`: route tree, header links, current-section rules,
  `generateStaticParams` placeholder rule. Must describe `/writing`, `/writing/[slug]` and the
  `"writing"` header section; its Rules section lists `headerSection`'s answers and must gain
  `"writing"` in the same change.
- `app_docs/clock-and-prerender.md`: the three allowed clock reads; this feature adds none (post
  dates come from `meta.date` via the pure `formatDay`). Read to stay inside it; add one sentence
  saying `/writing` reads no clock.
- `app_docs/hire.md` and `app_docs/home.md`: the `?offer=` preselect and `hireOfferHref`, reused by
  the post call to action.
- `app_docs/screens-and-components.md`: typography and colour conventions the MDX mapping and the
  pages follow.
- `next.config.ts`: wrap with `createMDX()`, keeping every option and comment.
- `package.json` / `yarn.lock`: the four new dependencies.
- `knip.json`: `src/mdx-components.tsx` is a Next convention knip's Next plugin does not know
  (its entries are `app/**`, `middleware`, `instrumentation`, `proxy`), so it must be listed as an
  `entry`.
- `src/lib/header-section.ts` and `src/lib/header-section.test.ts`: add the `writing` section and its
  test cases.
- `src/components/SectionNav.tsx` and `src/components/HeaderLink.tsx`: the header nav and the one
  `usePathname` reader; Writing joins Watch me build in `SectionNav`.
- `src/lib/format-date.ts`: `formatDay("YYYY-MM-DD")` formats a plain date as `DD.MM.YYYY` through
  `Date.parse` and UTC getters, no clock read. Use it for post dates.
- `src/lib/hire-request.ts` and `src/content/hire.ts`: `hireOfferHref(offer)` and the `Offer` union
  (`"Product engineer"`, `"AI consulting"`), giving `/hire?offer=product-engineer` and
  `/hire?offer=ai-consulting`.
- `src/app/page.tsx` and `src/app/hire/page.tsx`: the static page pattern outside `(dashboard)`
  (container `mx-auto max-w-6xl px-4 py-6`, `TEXT_LINK` style, metadata export, comment style).
- `src/app/layout.tsx`: root header; unchanged except that `SectionNav` now renders Writing.
- `src/app/(dashboard)/projects/[owner]/[repo]/page.tsx`: the `generateStaticParams` placeholder
  pattern (`_` / `none`) and the comment explaining why `dynamicParams` is not exported under
  `cacheComponents`.
- `e2e/test_home_page.md` and `e2e/test_header_section_active.md`: the shape of an agent-driven
  journey, the model for `e2e/test_writing.md`.
- `vitest.config.ts`: tests are `src/**/*.test.ts` only, with the `@` alias.
- `eslint.config.mjs`: `security/detect-non-literal-fs-filename` and
  `security/detect-unsafe-regex` are errors; the registry test must pass a literal path to `fs`
  and the slug and date checks must use simple, non-nested regexes.
- Next docs to read before coding: `node_modules/next/dist/docs/01-app/02-guides/mdx.md`
  ("Using dynamic imports", "Frontmatter", "Using Plugins with Turbopack"),
  `01-app/03-api-reference/03-file-conventions/mdx-components.md`,
  `01-app/03-api-reference/04-functions/generate-static-params.md` ("With Cache Components"),
  `01-app/03-api-reference/03-file-conventions/dynamic-routes.md` ("With Cache Components"),
  `01-app/03-api-reference/03-file-conventions/01-metadata/opengraph-image.md` and
  `01-app/03-api-reference/04-functions/generate-image-metadata.md`.

### New Files

- `src/mdx-components.tsx`: `useMDXComponents()` mapping `h1`, `h2`, `h3`, `p`, `a`, `ul`, `ol`,
  `li`, `blockquote`, `code`, `pre` to Tailwind classes. No `"use client"`.
- `src/content/posts/index.ts`: the registry (`PostEntry` type, `POST_ENTRIES` array).
- `src/content/posts/hello.mdx`: the seed post.
- `src/content/posts/registry.test.ts`: registry versus directory test (uses `fs`, test only).
- `src/lib/posts.ts`: pure validation, sort, draft filter, labels, hire link, plus the loaders.
- `src/lib/posts.test.ts`: unit tests for the pure functions.
- `src/app/writing/page.tsx`: the index.
- `src/app/writing/[slug]/page.tsx`: the post page with `generateStaticParams` and
  `generateMetadata`.
- `src/app/writing/[slug]/opengraph-image.tsx`: the generated OG image.
- `app_docs/writing.md`: the feature doc.
- `e2e/test_writing.md`: the agent-driven journey the issue requires.

## Implementation Plan

### Phase 1: Foundation

Dependencies, MDX config, `mdx-components.tsx`, knip entry, and the pure `src/lib/posts.ts` with
its tests. Nothing is routed yet; lint, typecheck, knip and test pass at the end of this phase.

### Phase 2: Core Implementation

The registry and seed post, the registry test, the loaders, then the `/writing` index, the post
page (static params, metadata, body, call to action) and the OG image.

### Phase 3: Integration

The header's Writing link through `headerSection`, docs (`app_docs/writing.md`, routing doc, clock
doc, conditional-docs, README list, `.adw/project.md`), the e2e journey, the served-HTML checks and
the draft probe.

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. Read the installed Next docs

- Read the docs listed under Relevant Files. Confirm: `mdx-components.tsx` lives in `src/` when the
  app is under `src/app`; `createMDX()` from `@next/mdx` wraps the config; with
  `generateStaticParams` under `cacheComponents` params of prerendered slugs need no `Suspense`, and
  a slug outside the list renders at request time; `export const alt` in `opengraph-image` is
  static, so a per-post alt needs `generateImageMetadata`.

### 2. Add the dependencies

- `yarn add @next/mdx@16.3.8 @mdx-js/loader@3.1.1 @mdx-js/react@3.1.1`
- `yarn add -D @types/mdx@2.0.14`
- `@next/mdx` is pinned to the installed `next` (16.3.8), not its latest 16.4.0. Commit
  `package.json` and `yarn.lock` together.

### 3. Wrap `next.config.ts` with `createMDX()`

- `import createMDX from "@next/mdx";`, `const withMDX = createMDX();` (no options, no remark or
  rehype plugins: Turbopack only accepts serializable plugin options and none are needed), and
  `export default withMDX(nextConfig);`.
- Keep every existing option and comment verbatim. Do not add `pageExtensions`: posts are imported,
  never routed as files, so `.mdx` must not become a page extension (it would also expose
  `.linkedin.md` if `md` were added).
- Add one short comment above `withMDX` saying why it is there (posts under `src/content/posts/`
  are imported as modules; see `app_docs/writing.md`).

### 4. Create `src/mdx-components.tsx`

- `import type { MDXComponents } from "mdx/types";` and export `useMDXComponents(): MDXComponents`
  returning a module-level `components` object (the shape in the Next doc).
- Map: `h1` (`text-2xl font-semibold tracking-tight`), `h2` (`mt-8 text-xl font-semibold
tracking-tight`), `h3` (`mt-6 text-lg font-semibold`), `p` (`mt-4 text-base text-neutral-700
dark:text-neutral-300`), `a` (the site's `TEXT_LINK` classes from `src/app/page.tsx`; use
  `next/link` for an `href` starting with `/`, a plain `<a>` otherwise), `ul` / `ol` (`mt-4
list-disc` / `list-decimal`, `space-y-1 pl-6`), `li`, `blockquote` (left border, muted text),
  `code` (`rounded bg-neutral-100 px-1 py-0.5 font-mono text-sm dark:bg-neutral-900`), `pre`
  (`mt-4 overflow-x-auto rounded-md bg-neutral-100 p-4 text-sm dark:bg-neutral-900`; the
  `overflow-x-auto` keeps a wide code block from causing page-level horizontal scroll at 375px).
- No `"use client"`, no hooks beyond the conventional `useMDXComponents` name. A short header
  comment: required by `@next/mdx` with the App Router; server only; posts may not import client
  components.

### 5. Add the knip entry

- `knip.json`: add `"entry": ["src/mdx-components.tsx"]`. Knip's Next plugin entries stay in force;
  knip's built-in MDX compiler activates because `@mdx-js/loader` / `@mdx-js/react` are
  dependencies and marks them referenced. `@next/mdx` is referenced from `next.config.ts`,
  `@types/mdx` from the `mdx/types` import.
- If `yarn knip` still reports any of the four packages as unused, fix it with the narrowest knip
  option (an `ignoreDependencies` entry with a comment-free reason in the doc), never by removing a
  package the issue requires.

### 6. Write `src/lib/posts.ts` (pure core)

- Header comment in the style of `src/lib/header-section.ts`: pure, no clock, no `fs`, no
  request-time reads; `date` is never compared with the clock.
- Types:
  - `export const POST_AUDIENCES = ["product-engineer", "small-business", "both"] as const;`
    `export type PostAudience = (typeof POST_AUDIENCES)[number];`
  - `export interface PostMeta { title: string; description: string; date: string; audience:
PostAudience; draft: boolean }`
  - `export interface Post { slug: string; meta: PostMeta; Content: MDXContent }` (`MDXContent`
    from `mdx/types`).
- `isPostSlug(slug: string): boolean`: non-empty, `/^[a-z0-9-]+$/`, does not start or end with `-`
  (simple regex plus two string checks, so `security/detect-unsafe-regex` stays quiet).
- `parsePostMeta(slug: string, raw: unknown): PostMeta`: throws `Error` whose message names the post
  (`Post "hello": ...`) and the field, for: `raw` not a plain object; `title` or `description` not a
  non-empty string; `date` not matching `/^\d{4}-\d{2}-\d{2}$/` or not a real calendar date (round
  trip through `Date.parse(date)` and `toISOString().slice(0, 10)`, a parse of a given string, not a
  clock read); `audience` not in `POST_AUDIENCES`; `draft` not a boolean. Returns a fresh object
  with exactly the five fields.
- `sortPostsNewestFirst<T extends { slug: string; meta: { date: string } }>(posts: T[]): T[]`: a
  copy sorted by `meta.date` descending (string compare is correct for `YYYY-MM-DD`), ties by slug
  ascending so the order is deterministic.
- `visiblePosts<T extends { meta: { draft: boolean } }>(posts: T[], nodeEnv: string | undefined): T[]`:
  drops drafts only when `nodeEnv === "production"`.
- `postAudienceLabel(audience)`: `"For product teams"`, `"For business owners"`, `"For everyone"`
  (a `Record<PostAudience, string>`).
- `postHireHref(audience)`: `product-engineer` gives `hireOfferHref("Product engineer")`
  (`/hire?offer=product-engineer`), `small-business` gives `hireOfferHref("AI consulting")`
  (`/hire?offer=ai-consulting`), `both` gives `/hire`.

### 7. Unit tests `src/lib/posts.test.ts`

- `parsePostMeta`: a valid meta parses to exactly the five fields; each of missing `title`, empty
  `description`, missing `date`, `date: "2026-1-2"`, `date: "2026-02-30"`, `date: "12.10.2026"`,
  `audience: "everyone"`, `draft: "false"`, missing `draft`, `raw` of `undefined` and of a string
  throws, and every message contains `"hello"` (the slug passed in) and the field name.
- `isPostSlug`: accepts `hello`, `ai-at-work-2`; rejects `Hello`, `a_b`, `-a`, `a-`, `a.linkedin`,
  `_`, `""`, `../x`.
- `sortPostsNewestFirst`: three posts out of order come back newest first; equal dates order by
  slug; input not mutated.
- `visiblePosts`: a draft and a published post: both kept for `"development"`, `"test"` and
  `undefined`; only the published one for `"production"`. The environment is passed as an
  argument; the test never touches `process.env`.
- `postAudienceLabel` and `postHireHref` for all three audiences, the hrefs asserted as literal
  strings.

### 8. The registry and the seed post

- `src/content/posts/index.ts`:
  ```ts
  // Every post, listed by hand: slug plus a lazy import of its module. ...
  export interface PostEntry {
    slug: string;
    load: () => Promise<{ default: MDXContent; meta?: unknown }>;
  }
  export const POST_ENTRIES: PostEntry[] = [{ slug: "hello", load: () => import("./hello.mdx") }];
  ```
  The import path is a string literal per entry (never a template), so the bundler, TypeScript and
  knip see each file. The comment says: add one line per post; the registry test fails when a file
  and the list disagree; `.linkedin.md` files are never listed or imported.
- `src/content/posts/hello.mdx`:
  ```mdx
  export const meta = {
    title: "[Placeholder] Writing starts here",
    description:
      "[Placeholder] Notes on product engineering and AI that takes work off your plate.",
    date: "2026-10-10",
    audience: "both",
    draft: false,
  };

  [Placeholder] Real posts are coming. This one exists so the site always has a post to show; replace or delete it.
  ```
  Published on purpose (`draft: false`). No imports, no JSX components, no env reads.
- No `hello.linkedin.md` is required; the optional companion format is documented in
  `app_docs/writing.md`.

### 9. Registry test `src/content/posts/registry.test.ts`

- `readdirSync("src/content/posts")` (literal path, vitest runs from the root), keep names ending in
  `.mdx`, strip the extension, sort; compare with `POST_ENTRIES.map((e) => e.slug)` sorted:
  every `.mdx` file is registered and every entry has a file.
- Also assert every registry slug passes `isPostSlug`, slugs are unique, and no entry slug ends in
  `.linkedin`.
- The test imports `POST_ENTRIES` but never calls `load()`, so vitest never has to compile MDX.
- **Negative check (manual, not committed):** create `src/content/posts/stray.mdx`, run `yarn test`,
  confirm `registry.test.ts` fails naming `stray`, delete the file, rerun and confirm it passes.

### 10. The loaders in `src/lib/posts.ts`

- `import { POST_ENTRIES } from "@/content/posts";` (a type-only `PostEntry` import as needed;
  `src/content/posts/index.ts` imports nothing from `src/lib/posts.ts`, so `import/no-cycle` holds).
- `async function loadPost(entry): Promise<Post>`: `const mod = await entry.load();` then
  `{ slug: entry.slug, meta: parsePostMeta(entry.slug, mod.meta), Content: mod.default }`. A post
  with a bad `meta` throws, which fails `yarn build` on purpose.
- `export async function getPosts(): Promise<Post[]>`: load all entries, then
  `sortPostsNewestFirst(visiblePosts(loaded, process.env.NODE_ENV))`.
- `export async function getPost(slug: string): Promise<Post | null>`: `null` when the slug is not
  `isPostSlug` or not in `POST_ENTRIES` (decided before any `import()`); otherwise load that one
  entry and return `null` when `visiblePosts([post], process.env.NODE_ENV)` is empty (a draft in
  production).
- `NODE_ENV` is not a new environment variable (Next inlines it), so `app_docs/data-boundary.md`'s
  env rule is unaffected; say so in `app_docs/writing.md`.

### 11. The index `src/app/writing/page.tsx`

- `export const metadata: Metadata = { title: "Writing", description: "..." }`.
- `export default async function WritingPage()`: `const posts = await getPosts();` Container and
  heading like `src/app/page.tsx`: `h1` "Writing", one line intro (`[Placeholder] ...` copy in the
  page is acceptable, or a `WRITING_INTRO` constant at the top of the file), then a `ul` of posts:
  title as a `Link` to `/writing/<slug>` (`text-base font-semibold`), a meta line with
  `formatDay(meta.date)` in a `<time dateTime={meta.date}>` and the audience tag
  (`postAudienceLabel`, a small neutral pill), and the description.
- Empty list (production with only drafts): render "No posts yet." so the page never breaks.
- Comment: static, no request-time reads, no clock; outside `(dashboard)`.

### 12. The post page `src/app/writing/[slug]/page.tsx`

- Props `{ params: Promise<{ slug: string }> }`.
- `generateStaticParams`: `const posts = await getPosts();` if empty return
  `[{ slug: "_" }]` with the comment mirroring the project page (`_` fails `isPostSlug`, so it is no
  post and `getPost` answers `null`); else `posts.map((p) => ({ slug: p.slug }))`.
- No `dynamicParams` export; copy the one-line reason from the project page comment.
- `generateMetadata`: `getPost(slug)`; `null` returns `{}` (the page body's `notFound()` decides the
  404). Otherwise `{ title: meta.title, description: meta.description, openGraph: { type: "article",
title: meta.title, description: meta.description, publishedTime: meta.date, authors:
["Sviatlana Buben"] } }`. The OG image comes from the file convention, not from here.
- Body: `const post = await getPost(slug); if (!post) notFound();` then an `article`
  (`mx-auto max-w-6xl px-4 py-6`, text column `max-w-[70ch]`): `h1` title, the date and audience tag
  line (same markup as the index), `<post.Content />`, then a closing section separated by a top
  border with a one-line prompt and a `Link` "Work with me" to `postHireHref(meta.audience)`, styled
  with `HIRE_ACCENT` from `src/lib/accent.ts` like the header button.
- The unknown slug, the placeholder `_` and `/writing/hello.linkedin` all fail `getPost` before any
  module import and call `notFound()`, served by the root `src/app/not-found.tsx` with 404.

### 13. The OG image `src/app/writing/[slug]/opengraph-image.tsx`

- `export const size = { width: 1200, height: 630 }; export const contentType = "image/png";`
- `export async function generateImageMetadata({ params })`: `getPost(slug)`; for a post return
  `[{ id: "og", alt: post.meta.title, size, contentType }]`; for `null` return `[]`. This is how
  the alt carries the post title (a static `alt` export cannot). The image URL is then
  `/writing/<slug>/opengraph-image/og`; Next writes it into `og:image`.
- `export default async function Image({ params })`: `getPost(slug)`, `notFound()` when `null`;
  return `new ImageResponse(<div ...>)` from `next/og`: plain `#ffffff` background, dark text, the
  title large (about 64px, wrapping, `display: "flex"` containers as Satori requires) and
  "Sviatlana Buben" smaller at the bottom. Default bundled font only; no `fetch`, no `fonts`
  option, no external images.
- If `generateImageMetadata` turns out to be rejected under `cacheComponents` at build, fall back
  to a plain `opengraph-image.tsx` with a static `alt = "Sviatlana Buben, writing"` and note the
  deviation in `app_docs/writing.md`; do not add a clock read or a `Suspense` to work around it.

### 14. Header: the Writing section

- `src/lib/header-section.ts`: `HeaderSection = "home" | "watch" | "writing" | "hire"`; add
  `if (pathname === "/writing" || pathname.startsWith("/writing/")) return "writing";` and update
  the doc comment (`/writingx` and `/writing-old` match nothing).
- `src/lib/header-section.test.ts`: cases for `/writing`, `/writing/`, `/writing/hello`, and null for
  `/writingx`, `/writing-old`; assert `/writing` is never `watch`, `home` or `hire`.
- `src/components/SectionNav.tsx`: after Watch me build, a second `Suspense` whose fallback is the
  inactive `Link href="/writing"` and whose child is
  `<HeaderLink href="/writing" section="writing" ...>Writing</HeaderLink>` with the same three
  class constants. Update the file's header comment (the nav now holds two sections).

### 15. Documentation and profile

- `app_docs/writing.md` (Specifications list with this spec, Overview, How it works, Rules): how to
  add a post (create `<slug>.mdx`, add the registry line, the test enforces both), the `meta` shape
  and why it is `meta` not `metadata`, the slug rule, drafts (shown in `yarn dev`, dropped from
  `yarn build`/`yarn start`), the `.linkedin.md` companion (never imported, routed or rendered;
  copied into LinkedIn by hand), the OG image (`generateImageMetadata`, URL
  `/writing/<slug>/opengraph-image/og`, alt is the title, no external fonts), the Work with me
  mapping, the `_` placeholder. Rules: posts are read only through `getPosts`/`getPost`; no `fs` at
  runtime; never `pageExtensions` for `md`/`mdx`; no client components, data fetching or env reads in
  a post; no clock reads; never import a `.linkedin.md` file from `src/`; `generateStaticParams`
  never returns an empty array.
- `docs/conditional-docs.md`: `- \`app_docs/writing.md\`: read when adding or changing a post under
  \`src/content/posts/\`, the registry, \`src/lib/posts.ts\`, \`/writing\`, a post page, its Open
  Graph image or \`src/mdx-components.tsx\`.` Also extend the routing doc's line with "the Writing
  link".
- `app_docs/routing-and-navigation.md`: add this spec to Specifications; add `/writing` and
  `/writing/[slug]` to the Overview's route tree and How it works (outside `(dashboard)`, static,
  placeholder slug `_`); describe the Writing header link; in Rules change "`headerSection` answers
  `"home"`, `"watch"`, `"hire"` or null" to include `"writing"` (active on `/writing`, `/writing/`
  and below, never `/writingx`), and note `SectionNav` now links `/watch` and `/writing`.
- `app_docs/clock-and-prerender.md`: one sentence that `/writing` and its posts read no clock (dates
  are `meta.date` through `formatDay`), so the count of clock sites is unchanged.
- `README.md`: add `- [Writing](app_docs/writing.md)` to the Documentation list, and mention
  `/writing` in the opening paragraph's route summary.
- `.adw/project.md`: under Identity (or Documentation), one bullet "Blog posts:
  `src/content/posts/<slug>.mdx`, registered in `src/content/posts/index.ts`"; under Tests add
  `e2e/test_writing.md` to the journey list; under Review add `/writing` (heading, intro, the seed
  post with its audience tag; no sidebar, no pill) and `/writing/hello` (title, date, tag, body,
  Work with me link). Keep the nine `##` headings and their order.
- No em-dashes anywhere. Do not edit `specs/` beyond this plan.

### 16. E2E journey `e2e/test_writing.md`

- Required by the issue and the only browser check available (the profile's E2E code suite is
  `none`). Model on `e2e/test_home_page.md`, with `## User Story`, `## Test Steps` (numbered,
  `**Verify**` lines) and `## Success Criteria`:
  1. 1920x1080, navigate to `/writing`. **Verify** heading `Writing`, a link to `/writing/hello`
     with text `[Placeholder] Writing starts here`, the tag `For everyone`, and the `Writing` link in
     the `Sections` navigation has `aria-current="page"` while `Watch me build` has none.
  2. **Verify** no element with role `status` and no `navigation` named `Projects`.
  3. Click the post. **Verify** URL `/writing/hello`, heading level 1 is the title, the `Writing`
     header link still has `aria-current="page"`, and the last link in the `article` is
     `Work with me` with `href="/hire"`. Screenshot.
  4. With `browser_evaluate`, **Verify** `document.querySelector('meta[property="og:title"]')`
     content is the title and `meta[property="og:image"]` content is non-empty.
  5. Resize to 375x667 on `/writing` and on `/writing/hello`: **Verify**
     `document.documentElement.scrollWidth <= 375` on both. Screenshot each.
- Never submit the `/hire` form.

### 17. Served HTML checks and the draft probe

- Source `.ports.env` for `PORT` (fall back to 3000 only if absent); never touch a server this run
  did not start.
- `yarn build && PORT=$PORT yarn start` in the background, then:
  - `curl -s http://localhost:$PORT/writing | grep -c "Writing starts here"` is at least 1.
  - `curl -s http://localhost:$PORT/writing/hello` contains `<meta property="og:title"` with the seed
    title, a `<meta property="og:image"` URL, and `href="/hire"`.
  - `curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/writing/does-not-exist` is `404`;
    the same for `/writing/hello.linkedin` and `/writing/_`.
  - `curl -s -D - -o /dev/null <og:image URL>` answers `200` with `content-type: image/png`.
  - Stop the server this run started.
- Draft probe: add `src/content/posts/probe-draft.mdx` (`draft: true`, valid meta) and its registry
  line; `yarn build && yarn start`: `/writing` does not list it and `/writing/probe-draft` is 404;
  stop; `yarn dev` on `$PORT`: `/writing` lists it and `/writing/probe-draft` is 200; stop. Delete
  both the file and the registry line; `git status --porcelain src/content/posts` shows only the
  intended files (`index.ts`, `hello.mdx`, `registry.test.ts`); the probe is not in the diff.

### 18. Run the validation commands

- Run every command in `Validation Commands`; all must pass with zero errors.

## Testing Strategy

### Unit Tests

- `src/lib/posts.test.ts`: `parsePostMeta` (valid, each bad field with the post's slug in the
  message), `isPostSlug`, `sortPostsNewestFirst`, `visiblePosts` with an injected environment,
  `postAudienceLabel`, `postHireHref`.
- `src/content/posts/registry.test.ts`: directory versus registry, slug validity, uniqueness.
- `src/lib/header-section.test.ts`: the new `writing` cases and near misses.

### Test Coverage

- `src/lib/posts.test.ts` (vitest, `src/**/*.test.ts`): catches a post with malformed metadata, a
  draft leaking into production, a wrong sort, or a call to action pointing at the wrong offer;
  fails without this feature because `src/lib/posts.ts` does not exist.
- `src/content/posts/registry.test.ts` (vitest): catches a post file committed without its registry
  line (it would never be routed) or a registry line without a file; proven by the `stray.mdx`
  negative check.
- `src/lib/header-section.test.ts` (vitest, extended): catches the Writing link not being current on
  `/writing/*` or matching `/writingx`; fails today because `headerSection("/writing")` is `null`.
- The routes, MDX rendering and OG image have no test layer in this project (no component tests, no
  Playwright code suite); they are proven by `yarn build` (a bad `meta` or a broken MDX fails it),
  the served-HTML curl checks in step 17, and the `e2e/test_writing.md` journey plus review
  screenshots.

### Edge Cases

- Empty published list in production: `generateStaticParams` returns `[{ slug: "_" }]`, `/writing/_`
  is 404, `/writing` shows "No posts yet.", the build passes.
- Draft in production: absent from `/writing` and from static params; `/writing/<draft>` is 404.
- Draft in development: listed and rendered.
- Unknown slug, uppercase slug, `hello.linkedin`, `../hello`: 404 with no module import.
- Two posts on the same date: deterministic order by slug.
- `date: "2026-02-30"`: rejected (not a real date).
- A long title in the OG image wraps within 1200x630.
- A wide code block at 375px scrolls inside its `pre`, not the page.
- `/writingx` and `/writing-old` mark no header section.

## Acceptance Criteria

- `yarn lint`, `yarn typecheck`, `yarn knip`, `yarn format:check`, `yarn test` and `yarn build` pass.
- `/writing` lists the seed post newest first with title link, `DD.MM.YYYY` date, the tag
  `For everyone` and its description; no sidebar, no connection pill.
- `/writing/hello` has `<title>` and `og:title` equal to `[Placeholder] Writing starts here`,
  `og:type` `article`, `article:published_time`, an `og:image` URL answering 200 `image/png`
  (1200x630, alt the title), the MDX body styled by `src/mdx-components.tsx`, and ends with a Work
  with me link to `/hire`.
- `product-engineer` posts link `/hire?offer=product-engineer`, `small-business` posts
  `/hire?offer=ai-consulting`, `both` plain `/hire` (unit tested).
- `/writing/does-not-exist`, `/writing/_` and `/writing/hello.linkedin` answer 404.
- A draft is hidden and 404 under `yarn build && yarn start`, visible under `yarn dev`; the probe is
  not in the final diff.
- The header shows Writing, current (`aria-current="page"`) on `/writing` and `/writing/*` only.
- No new clock read; no `fs` outside the registry test; no file under `src/app/` imports a
  `.linkedin.md`; existing routes, cache tags and `/api/revalidate` unchanged.
- `app_docs/writing.md`, its `docs/conditional-docs.md` line, `app_docs/routing-and-navigation.md`,
  `app_docs/clock-and-prerender.md`, `README.md` and `.adw/project.md` updated; no em-dashes.

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

- `yarn install --immutable`: the lockfile matches `package.json` after the `yarn add` calls.
- `yarn lint`: ESLint, including the security rules on the new `fs` and regex use.
- `yarn typecheck`: `next typegen` then `tsc --noEmit`; proves the `*.mdx` module types, the
  registry's `load` type and the route prop types.
- `yarn knip`: no unused files, exports or dependencies (the four new packages and
  `src/mdx-components.tsx` included).
- `yarn format:check`: Prettier over the new `.ts`, `.tsx`, `.mdx` and `.md` files.
- `yarn test`: the posts, registry and header-section unit tests plus every existing test.
- `yarn build`: compiles the MDX, validates every post's `meta`, prerenders `/writing`,
  `/writing/hello` and its OG image under `cacheComponents`.
- `PORT=$PORT yarn start` (background, this run's port from `.ports.env`) followed by the curl
  checks in step 17 (`/writing`, `/writing/hello` meta tags and `/hire` link, 404 for
  `/writing/does-not-exist`, `/writing/_` and `/writing/hello.linkedin`, `200 image/png` for the
  `og:image` URL); stop the server afterwards.
- `git status --porcelain src/content/posts`: only `index.ts`, `hello.mdx` and `registry.test.ts`,
  no probe or stray file.
- `grep -rn "linkedin.md" src/app src/lib src/content/posts/index.ts`: no match.
- `grep -rnP "\x{2014}" app_docs/writing.md app_docs/routing-and-navigation.md src/lib/posts.ts src/app/writing src/content/posts e2e/test_writing.md .adw/project.md README.md`: no em-dash.

## Notes

- New dependencies (added with `yarn add` as the profile requires): `@next/mdx@16.3.8`,
  `@mdx-js/loader@3.1.1`, `@mdx-js/react@3.1.1`, dev `@types/mdx@2.0.14`. `@next/mdx` is pinned to
  the installed `next` 16.3.8 on purpose; bump it together with `next`.
- "notFound before any import": unknown, malformed and placeholder slugs are rejected against the
  registry without importing a module. A draft can only be recognised from its `meta`, so its
  module is imported, then `notFound()` runs before anything renders.
- The OG image URL is `/writing/<slug>/opengraph-image/og` because `generateImageMetadata` is the
  only way to give each image a per-post alt. The issue allows checking "the URL the `og:image`
  meta names".
- Browser surface: `/writing` and `/writing/hello` at 1920x1080 and 375x667 for the review phase,
  via the `.adw/project.md` Review section update and `e2e/test_writing.md`.
- Out of scope: real posts, LinkedIn texts, RSS, tag pages, search, comments, analytics, sitemap.
- Commit messages: conventional, bare type (`feat: add the MDX writing blog`), no trailers, per the
  profile.
