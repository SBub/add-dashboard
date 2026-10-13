# Writing

**Specifications:**

- specs/issue-170-adw-d5ef5a75-sdlc_planner-add-mdx-writing-blog.md
- specs/issue-200-adw-c1f03790-sdlc_planner-add-post-breadcrumb.md

## Overview

`/writing` (`src/app/writing/page.tsx`) lists the visible posts newest first: each with its title
linking to the post, its `DD.MM.YYYY` date, its audience tag and its description.
`/writing/[slug]` (`src/app/writing/[slug]/page.tsx`) renders one post: title, date, tag and the MDX
body, which ends with the post's own last line (no call to action is added after it). Above the title the post page renders a breadcrumb
(`src/components/Breadcrumb.tsx`, server only): `Writing`, linking to `/writing`, then the post
title as the current page, truncated to one line on narrow screens. `/writing` has no breadcrumb. Both sit outside `(dashboard)`: no sidebar, no `Providers`, no
Realtime, no pill. Posts are MDX modules under `src/content/posts/`, compiled by `@next/mdx`
(`createMDX()` in `next.config.ts`) and styled by `src/mdx-components.tsx` (server only).

## How it works

### Adding a post

Create `src/content/posts/<slug>.mdx` exporting `meta`, then add one line
`{ slug: "<slug>", load: () => import("./<slug>.mdx") }` to `POST_ENTRIES` in
`src/content/posts/index.ts`. Each entry's import path is a string literal (never a template), so
the bundler, TypeScript and knip see the file. `src/content/posts/registry.test.ts` fails when the
directory's `.mdx` files and the list disagree.

### The meta export

A post exports
`meta = { title, description, date: "YYYY-MM-DD", audience: "product-engineer" | "small-business" | "both", draft: boolean }`.
`parsePostMeta` (`src/lib/posts.ts`) checks it field by field and throws an error naming the post
and the field, so a bad post fails `yarn build`. `date` must be a real calendar date: it has to
round-trip through `Date.parse`, which reads the string, not the clock (`2026-02-30` is rejected).

It is named `meta`, not `metadata`, because `metadata` is the Next.js page export name and a post
is a module imported by a page, not a route; a separate name keeps the two apart.

### Slugs

`isPostSlug` accepts lowercase letters, digits and inner hyphens (`my-moat`, `ai-at-work-2`).
`getPost` rejects a malformed or unregistered slug against the registry before importing any
module, so `/writing/does-not-exist`, `/writing/_` and `/writing/my-moat.linkedin` are 404.

### Drafts

`visiblePosts(posts, process.env.NODE_ENV)` drops `draft: true` posts when `NODE_ENV` is
`production` (`yarn build`, `yarn start`) and keeps them in `yarn dev`. A draft is only
recognisable from its `meta`, so its module is imported, then `getPost` returns null and the page
calls `notFound()`. `NODE_ENV` is set and inlined by Next itself: it is not a new environment
variable, needs no `.env*` entry and does not touch the data boundary's list of variables.

### Screenshots and typography

A post's images live under `public/writing/<slug>/` and are written as
`![alt](/writing/<slug>/<file>.png "caption")`. `src/mdx-components.tsx` renders the image full
width with a border and generous space above and below, and shows the markdown title as a visible
caption under it. It uses spans, not `figure`/`figcaption`, because MDX wraps a lone image in a
`<p>` and a figure inside a paragraph is invalid HTML. The alt says what the image shows; the
caption names its source (for example "PostHog: ..."). The post column is `max-w-[62ch]` and
paragraphs use `leading-8` with `mt-6`, for long-form reading.

### The LinkedIn companion

An optional `src/content/posts/<slug>.linkedin.md` beside a post holds its LinkedIn text. It is
never listed in the registry, imported, routed or rendered; it is copied into LinkedIn by hand.

### Order and tag

`sortPostsNewestFirst` orders by date descending, equal dates by slug. `postAudienceLabel` gives
"For product teams", "For business owners" or "For everyone". The audience only picks the tag: the
post page links nowhere after the body, so a post that wants a next step writes it as its own last
line (`my-moat` ends with `[Watch me build live](/projects)`), or links in context
(`feature-flags` links "Watch me build" inline).

### Static params and the \_ placeholder

`generateStaticParams` prerenders one page per visible post. Under `cacheComponents` an empty array
fails the build, so a production build with only drafts returns `[{ slug: "_" }]`, which fails
`isPostSlug` and lands on `notFound()`. `dynamicParams` cannot be exported under
`cacheComponents`, so an unknown slug resolves on request and 404s.

### Metadata and the Open Graph image

`generateMetadata` sets `title`, `description`, `alternates.canonical` and `openGraph`
(`type: "article"`, `url`, `siteName`, `publishedTime` from `meta.date`, the author). The canonical
link and `og:url` are the relative `/writing/<slug>`; `/writing` sets the canonical `/writing`.

Every relative metadata URL (these, and the Open Graph image's) becomes absolute through
`metadataBase` in the root layout (`src/app/layout.tsx`), which is `siteUrl` (given `SITE_URL` and `VERCEL_PROJECT_PRODUCTION_URL`) from
`src/lib/site-url.ts`. `siteUrl` is pure: it trims `SITE_URL`, strips trailing commas and slashes
(a pasted `https://build.issebya.com,` works) and keeps it when it is an `http(s)` URL; otherwise
it uses `https://${VERCEL_PROJECT_PRODUCTION_URL}` when Vercel sets that, else
`http://localhost:3000`. The layout also sets `openGraph.siteName` to `SITE_NAME`
("Sviatlana Buben", the header's brand). Metadata merges shallowly, so a page that sets its own
`openGraph` (a post) replaces the layout's whole and repeats `siteName`. `SITE_URL` is read when
the layout module is evaluated, so for a prerendered page (`/writing`, a post) it is the value in
the build's environment; it is server only and needs no `NEXT_PUBLIC_` prefix. The 1200x630 PNG comes from
`src/app/writing/[slug]/opengraph-image.tsx` (`ImageResponse`, the title plus the author's name,
default bundled font, no fetch, no external fonts or images). It uses `generateImageMetadata`
because that is the only way to give each image a per-post alt (the post title), and that puts the
image at `/writing/<slug>/opengraph-image/og`.

Next also calls `generateImageMetadata` at build time with no `slug` (the image route's own static
params do not inherit the page's). That call only collects ids, and an empty list errors the build
under `cacheComponents`, so it returns the one id `og` with the fallback alt "Sviatlana Buben,
writing". `Image` still answers 404 for a slug that is no post.

### Clock and prerendering

Both pages and the image read no clock and nothing at request time. A post's date is its
`meta.date` through the pure `formatDay` in `PostMetaLine` (`src/components/PostMetaLine.tsx`),
shared by the list and the post page (see `app_docs/clock-and-prerender.md`).

## Rules

- Posts are read only through `getPosts` and `getPost` in `src/lib/posts.ts`.
- No `fs` at runtime; only `registry.test.ts` reads the directory.
- Never set `pageExtensions` for `md` or `mdx`: posts are modules, never routes.
- No client components, data fetching or env reads in a post; `src/mdx-components.tsx` stays
  server only (no `"use client"`).
- No clock reads in `/writing`, a post page, the Open Graph image or `src/lib/posts.ts`.
- Never import a `.linkedin.md` file from `src/`, and never list one in the registry.
- `generateStaticParams` in `src/app/writing/[slug]/page.tsx` never returns an empty array (keep
  the `_` placeholder), and `generateImageMetadata` never returns an empty list for the slug-less
  build call (keep the `og` fallback id).
- Every post is registered in `POST_ENTRIES` with a string-literal import.
- Metadata URLs (`canonical`, `openGraph.url`, images) are relative paths; never hardcode a host.
  The host comes only from `metadataBase`, that is from `siteUrl` in `src/lib/site-url.ts`.
- A page that sets its own `openGraph` repeats `siteName: SITE_NAME`.
- A post page never adds a call to action (a Work with me link, a hire box) after the MDX body: a
  post ends with its own last line.
- The breadcrumb on a post page is a server component; its link is `/writing` and its last item is
  `meta.title` with `aria-current="page"`. `/writing` has no breadcrumb, and the `h1` stays the
  post's only `h1`.
