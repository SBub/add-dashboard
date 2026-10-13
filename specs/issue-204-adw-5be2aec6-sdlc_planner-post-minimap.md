# Feature: Minimap on post pages

## Metadata

issue_number: `204`
adw_id: `5be2aec6`
issue_json: `{"number":204,"title":"Minimap on post pages: a shrunk copy of the post with the visible part framed"}`

## Feature Description

On `/writing/[slug]`, from the `xl` breakpoint (1280px) up, the empty right-hand gutter inside the
page's `max-w-6xl` frame shows a minimap, as in VS Code: a small copy of the whole post (title,
date line, paragraphs and screenshots), about 140px wide, in a sticky panel just below the header.
A translucent frame over the miniature marks the part of the post currently in the viewport and
follows scrolling. When the miniature is taller than the panel (the panel is capped at `60vh`), the
miniature slides inside the panel so the frame always stays visible.

It is a reading-position aid only. The miniature is rendered on the server from the same MDX module
as the post, sits outside the `article`, is `aria-hidden="true"` and `inert`, contains no links,
headings or focusable elements, and does nothing on click, drag or keyboard. Below `xl` the page is
exactly as today. One small client leaf computes and draws the frame; before hydration the panel
renders without the frame.

## User Story

As a reader of a long post on a wide screen
I want to see a small map of the whole post with the part I am reading framed
So that I know how far I am and how much is left, and where the screenshots are, without leaving the text

## Problem Statement

Posts are long-form (`feature-flags` has three screenshots between long passages) and the post page
gives no sense of position or length. On wide screens the right side of the `max-w-6xl` frame next
to the `62ch` column is empty space that could carry that information without competing with the
text.

## Solution Statement

- Restructure `src/app/writing/[slug]/page.tsx`: an outer `div` keeps
  `mx-auto max-w-6xl px-4 py-6` and becomes a flex row from `xl`; the `article` becomes the
  `62ch` column (same children as today: `Breadcrumb`, `h1`, `PostMetaLine`, `<Content />`); a new
  server component `PostMinimap` sits after the `article`, outside it, `hidden xl:block`.
- `PostMinimap` (server) renders the post a second time at a small scale: the title as a `div`
  styled like the `h1`, `PostMetaLine`, and `<Content components={MINIMAP_COMPONENTS} />`, where
  `MINIMAP_COMPONENTS` overrides only the elements that would add semantics or behaviour: `a`
  becomes a `span` with the same text styling (no `next/link`, so no prefetch and no focus stop),
  `h1`/`h2`/`h3` become `div`s with the same classes, `img` gets `loading="lazy"` and `alt=""`
  (same `src`, so the browser cache serves it; lazy keeps it from loading while the panel is
  `display: none` below `xl`). MDX merges `props.components` over the provider's
  `useMDXComponents`, so every other element keeps the post's typography. `src/mdx-components.tsx`
  is not touched.
- The scale is CSS `zoom` (constant `MINIMAP_SCALE = 0.25` in `src/lib/minimap.ts`) on a `62ch`
  wide copy. `zoom`, unlike `transform: scale()`, shrinks the layout box too, so the panel's
  natural height is the miniature's real height (a short post gets a short panel) with no
  client-side sizing and no layout shift. The issue allows "for example" a transform; `zoom` is
  the same visual result with a correct box.
- The panel: `sticky top-[calc(var(--header-height)+1.5rem)]` (the dashboard sidebar's offset),
  `max-h-[60vh] overflow-hidden`, a light border, rounded. No `z-<n>` class anywhere: the panel is
  in normal flow under the sticky `z-40` header.
- One client leaf `PostMinimapViewport` (`"use client"`, `src/components/PostMinimapViewport.tsx`)
  wraps the miniature (passed as server-rendered `children`), measures, and renders the frame.
  The maths is a pure function `minimapFrame` in `src/lib/minimap.ts`, unit tested.

## Relevant Files

Use these files to implement the feature:

- `README.md`: repository overview (read only; it does not describe features, do not add one).
- `AGENTS.md`: rules (Yarn only, no em-dashes, docs layout, profile upkeep).
- `.adw/project.md`: the ADW profile. Its Tests section lists every `e2e/*.md` journey and its
  Review section names `/writing/my-moat`; both are updated in this change (no heading renamed or
  reordered).
- `docs/conditional-docs.md`: the `app_docs/writing.md` line gains the minimap; the
  `screens-and-components.md` line already covers adding `"use client"`.
- `app_docs/writing.md`: the feature doc for posts. Gains a "Minimap" section and updated Rules
  (the client-component rule is narrowed to allow exactly this one leaf on the post page).
- `app_docs/screens-and-components.md`: the `"use client"` list (around line 145) gains
  `PostMinimapViewport`; `PostMinimap` is listed as stateless.
- `app_docs/clock-and-prerender.md`: read to confirm the client leaf reads no clock (it reads only
  `scrollY`, `innerHeight` and element rects after mount).
- `src/app/writing/[slug]/page.tsx`: the post page; layout restructure and the minimap mount.
- `src/mdx-components.tsx`: the post typography the miniature inherits. Read only; stays server
  only and unchanged.
- `src/components/Breadcrumb.tsx`, `src/components/PostMetaLine.tsx`: the column's children;
  `PostMetaLine` is reused inside the miniature (no links, no ids).
- `src/components/Breadcrumb.test.ts`: the pattern for a server-markup unit test with
  `renderToStaticMarkup` and `createElement`.
- `src/lib/layers.ts`, `src/lib/layers.test.ts`: the z-index guard; the new files must not add any
  `z-<n>`.
- `src/app/globals.css`: `--header-height`.
- `src/app/(dashboard)/layout.tsx`: the existing sticky offset idiom
  `top-[calc(var(--header-height)+1.5rem)]`.
- `src/app/layout.tsx`: the sticky header with `HEADER_LAYER`, `<main>` wrapping the page.
- `src/content/posts/feature-flags.mdx`, `src/content/posts/my-moat.mdx`: the two posts the
  minimap is verified on (three images in `feature-flags`).
- `e2e/test_writing.md`: must still pass unchanged (single `h1`, links inside the `article`).
- `e2e/test_sticky_header.md`: model for a sticky, scrolling journey.
- `vitest.config.ts`: `src/**/*.test.ts` only, no MDX loader (so the component test uses a stub
  `Content`).
- `knip.json`: every new export must be used.
- `node_modules/next/dist/docs/01-app/`: check the MDX guide for how `components` passed to an
  imported MDX component merge with `mdx-components.tsx`.

### New Files

- `src/lib/minimap.ts`: `MINIMAP_SCALE` and the pure `minimapFrame` function.
- `src/lib/minimap.test.ts`: unit tests for `minimapFrame`.
- `src/components/PostMinimap.tsx`: server component; the panel and the miniature.
- `src/components/PostMinimap.test.ts`: server-markup test of the panel's a11y and inertness.
- `src/components/PostMinimapViewport.tsx`: the one client leaf; measures, slides the miniature,
  draws the frame.
- `e2e/test_post_minimap.md`: agent-driven journey for the minimap (the issue asks for browser
  verification of scroll-driven behaviour; the project has no code E2E suite).

## Implementation Plan

### Phase 1: Foundation

The pure maths in `src/lib/minimap.ts`, with its tests written first:

```ts
export const MINIMAP_SCALE = 0.25;

export interface MinimapInput {
  scrollY: number; // window.scrollY
  viewportHeight: number; // window.innerHeight
  contentTop: number; // document y of the top of the post content (the h1)
  contentHeight: number; // height of the post content, h1 to the end of the column
  scale: number; // miniature height / contentHeight, measured
  panelHeight: number; // the panel's rendered height (at most 60vh)
}

export interface MinimapFrame {
  top: number; // frame top inside the panel, px
  height: number; // frame height, px
  offset: number; // how far the miniature is shifted up inside the panel, px (>= 0)
}
```

Formula (all document px, then times `scale`):

- `scrolled = clamp(scrollY - contentTop, 0, contentHeight)`;
  `visibleEnd = clamp(scrollY + viewportHeight - contentTop, 0, contentHeight)`.
- `frameTopInMini = scrolled * scale`; `height = (visibleEnd - scrolled) * scale`.
- `miniHeight = contentHeight * scale`. If `miniHeight <= panelHeight`, `offset = 0`. Otherwise
  `progress = contentHeight > viewportHeight ? clamp((scrollY - contentTop) / (contentHeight - viewportHeight), 0, 1) : 0`
  and `offset = progress * (miniHeight - panelHeight)` (VS Code's proportional slide: at the top
  the miniature's top shows, at the bottom its bottom).
- `top = frameTopInMini - offset`, then clamp so the frame stays inside the panel:
  `top = clamp(top, 0, max(0, panelHeight - height))`, and `height = min(height, panelHeight)`.
- Guard: `contentHeight <= 0` or `scale <= 0` or `panelHeight <= 0` returns `null` (nothing to
  draw; also the case when the panel is `display: none` below `xl`).

With the proportional slide and `height <= panelHeight`, the frame provably stays inside the panel;
the final clamp only absorbs rounding and the edge where the viewport is taller than the panel at
this scale.

### Phase 2: Core Implementation

- `PostMinimapViewport` (client): renders
  `<div ref={panel} className="relative max-h-[60vh] overflow-hidden ...">` holding
  `<div ref={mini} style={{ transform: frame ? `translateY(${-frame.offset}px)` : undefined }}>{children}</div>`
  and, only when `frame` is not null, the frame `div` (`pointer-events-none absolute inset-x-0`,
  translucent fill plus a thin ring, `style={{ top, height }}`). State starts `null`, so server and
  first client render are identical (no frame, no offset): no hydration mismatch and no layout
  shift.
- It takes one prop, `columnId` (the `article`'s id). In one `useEffect` (subscribing to an
  external system, the window, is the legitimate use): look up the column, its `h1`, the panel and
  the miniature; a `measure()` that reads `h1.getBoundingClientRect().top + scrollY` as
  `contentTop`, `column.getBoundingClientRect().bottom + scrollY - contentTop` as `contentHeight`,
  `mini.offsetHeight / contentHeight` as `scale` (measured, so any small height drift between the
  copy and the real column is absorbed), `panel.clientHeight` as `panelHeight`, calls
  `minimapFrame` and sets state. Schedule it through `requestAnimationFrame` (one pending frame at
  a time). Listen to `scroll` and `resize` on `window` with `{ passive: true }`, plus one
  `ResizeObserver` on the column (images loading change its height with no scroll event). Cleanup
  removes both listeners, disconnects the observer and cancels the pending frame.
- No clock reads, no `onClick`, no `tabIndex`, no keyboard handlers, no `z-<n>`.
- `PostMinimap` (server): props `{ meta: PostMeta; Content: MDXContent-like component; columnId: string }`.
  Renders

  ```tsx
  <div
    aria-hidden="true"
    inert
    className="sticky top-[calc(var(--header-height)+1.5rem)] hidden shrink-0 select-none self-start rounded-md border border-neutral-200 pointer-events-none xl:block dark:border-neutral-800"
  >
    <PostMinimapViewport columnId={columnId}>
      <div className="w-[62ch]" style={{ zoom: MINIMAP_SCALE }}>
        <div className="text-2xl font-semibold tracking-tight">{meta.title}</div>
        <PostMetaLine meta={meta} />
        <Content components={MINIMAP_COMPONENTS} />
      </div>
    </PostMinimapViewport>
  </div>
  ```

  `MINIMAP_COMPONENTS` lives in `PostMinimap.tsx` and is not exported (knip): `a` to a `span` with
  the same underline styling, `h1`/`h2`/`h3` to `div`s with the classes from
  `src/mdx-components.tsx`, `img` to the same bordered `img` with `alt=""` and `loading="lazy"`
  (keep the caption span so screenshots look the same). A short comment says why each override
  exists. The panel padding (for example `p-2`) sits outside the zoomed copy.

- Type for `Content`: use the MDX module's content type already used by `src/lib/posts.ts`
  (`MDXContent` from `mdx/types` or the type `getPost` returns); do not widen to `any`.

### Phase 3: Integration

- `src/app/writing/[slug]/page.tsx`:

  ```tsx
  <div className="mx-auto max-w-6xl px-4 py-6 xl:flex xl:items-start xl:justify-between xl:gap-12">
    <article id={POST_COLUMN_ID} className="min-w-0 max-w-[62ch]">
      <Breadcrumb title={meta.title} />
      <h1 ...>{meta.title}</h1>
      <PostMetaLine meta={meta} />
      <Content />
    </article>
    <PostMinimap meta={meta} Content={Content} columnId={POST_COLUMN_ID} />
  </div>
  ```

  `POST_COLUMN_ID` (`"post"`) is a local constant in the page. Below `xl` the outer `div` is a
  block, the `article` is the same `62ch` column at the same position as today, and the minimap is
  `display: none`. The `article` keeps one `h1` and exactly its current links; the minimap follows
  it in document order, so `document.querySelector("h1")` and every article-scoped selector in
  `e2e/test_writing.md` are unaffected (and the miniature has no `h1`, `a` or `nav` anyway).

- `/writing`, `/projects`, the changelog and `/hire` import nothing new.
- The page stays a server component and fully prerendered: the miniature is static markup, the
  client leaf reads the window only after mount.

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### 1. Read the docs

- Read `app_docs/writing.md`, `app_docs/screens-and-components.md` (the `"use client"` list and
  the sticky header and layer sections), `app_docs/clock-and-prerender.md`.
- Read the MDX guide under `node_modules/next/dist/docs/01-app/` for the `components` prop on an
  imported MDX module.

### 2. Write the frame maths test first

- Create `src/lib/minimap.test.ts` (vitest, `describe`/`it`/`expect` as in the other `src/lib`
  tests). Use `contentTop: 100`, `contentHeight: 4000`, `viewportHeight: 1000`, `scale: 0.25`:
  - top of the post (`scrollY: 0`): `top 0`, `height 225` (900 visible px of content, the first
    100 px are above it), `offset 0` with `panelHeight: 1200` (miniature 1000 fits).
  - middle (`scrollY: 1600`): `top 375`, `height 250`, `offset 0` with a tall panel.
  - bottom (`scrollY: 3100`, last viewport): frame bottom equals the miniature bottom
    (`top + height === 1000`).
  - content shorter than the viewport (`contentHeight: 600`): `height === 150` (the whole
    miniature), `top 0`, `offset 0`, at `scrollY: 0` and at `scrollY: 100` (the whole post
    stays in view).
  - miniature taller than the panel (`panelHeight: 500`): at the top `offset 0` and `top 0`; at
    the bottom `offset 500` and `top + height === 500`; in the middle `offset` strictly between
    and the frame inside `[0, 500]`. Add a sweep over `scrollY` from 0 to 3100 in steps asserting
    `0 <= top` and `top + height <= panelHeight` every time.
  - `contentHeight 0` or `panelHeight 0` returns `null`.
- Run `yarn test` and see it fail (module missing).

### 3. Implement `src/lib/minimap.ts`

- `MINIMAP_SCALE`, the two interfaces, `minimapFrame` per Phase 1, a small local `clamp`. A short
  doc comment on `minimapFrame` stating the proportional slide.
- `yarn test` passes.
- Negative check: temporarily change the slide (for example drop `* (miniHeight - panelHeight)` or
  the `- offset`), run `yarn test`, confirm the taller-than-panel cases fail, restore the formula.
  The probe must not appear in the diff (`git diff src/lib/minimap.ts` shows only the intended
  file).

### 4. Create the client leaf `src/components/PostMinimapViewport.tsx`

- `"use client"` first line; component per Phase 2. Imports `minimapFrame` and its types only.
- A header comment: why it is a client component (it reads the window's scroll), that it renders
  no frame before hydration, and that it has no click, drag or keyboard behaviour by design.

### 5. Create the server component `src/components/PostMinimap.tsx`

- Per Phase 2, with `MINIMAP_COMPONENTS`. No `"use client"`. `aria-hidden="true"`, `inert`,
  `pointer-events-none`, `select-none`, `hidden xl:block`, sticky offset from `--header-height`,
  `self-start`, light border. No `z-<n>`.

### 6. Server-markup test `src/components/PostMinimap.test.ts`

- Modelled on `Breadcrumb.test.ts`: `renderToStaticMarkup(createElement(PostMinimap, { meta, Content: Stub, columnId: "post" }))`
  where `Stub` is a function component that renders, through its `components` prop, an `a` with
  `href="/projects"`, an `h2`, and an `img` with `src="/writing/x.png"` and an alt.
- Assert: the root carries `aria-hidden="true"` and `inert`; the markup contains no `<a`, no
  `<h1`/`<h2`, no `<nav`, no `href=`, no `tabindex`; the image keeps its `src`, has `alt=""` and
  `loading="lazy"`; the root has `hidden` and `xl:block`; no frame element is rendered (server
  output has no frame, matching the pre-hydration contract).
- This fails without the feature (module missing) and would catch a future change that lets a
  link or heading leak into the copy.

### 7. Mount it on the post page

- Restructure `src/app/writing/[slug]/page.tsx` per Phase 3. Keep `generateStaticParams`,
  `generateMetadata` and their comments untouched.

### 8. Docs

- `app_docs/writing.md`: add the spec path under Specifications; add a "### Minimap" section under
  How it works (what it is, from `xl` only, where it sits, server-rendered copy with
  `MINIMAP_COMPONENTS` overrides, `zoom` scale, sticky panel capped at `60vh`, the proportional
  slide, the one client leaf `PostMinimapViewport` and `minimapFrame` in `src/lib/minimap.ts`,
  visual only: `aria-hidden`, `inert`, outside the `article`, no click, drag or keyboard). In the
  Overview mention the minimap in one sentence. Rules: replace "No client components, data
  fetching or env reads in a post; `src/mdx-components.tsx` stays server only" with a rule that
  keeps that and adds: the post page's one client component is `PostMinimapViewport`, a leaf
  outside the `article`; add rules: the minimap stays outside the `article`, `aria-hidden` and
  `inert`, with no links, headings or focusable elements; never add click-to-jump, drag or
  keyboard stops; the minimap appears only on `/writing/[slug]`.
- `app_docs/screens-and-components.md`: add `PostMinimapViewport`, which reads the window's scroll
  to frame the visible part of a post's minimap, to the `"use client"` list; add `PostMinimap` to
  the list of stateless components.
- `docs/conditional-docs.md`: extend the `app_docs/writing.md` line with "the post page's
  minimap".
- `.adw/project.md`: add `e2e/test_post_minimap.md` to the Tests section's journey list; in Review,
  extend the `/writing/my-moat` description with "at 1920x1080 the minimap in the right gutter,
  none at 375x667". Do not rename or reorder headings.
- No em-dashes anywhere (`grep -rn "—"` over the changed files returns nothing).

### 9. E2E journey `e2e/test_post_minimap.md`

- Why a journey: the frame's position under real scrolling, stickiness under the header and
  breakpoint visibility need a browser; the project has no code E2E suite, and the issue asks for
  this verification. Modelled on `e2e/test_sticky_header.md`, with `## User Story`,
  `## Test Steps`, `## Success Criteria`.
- Steps:
  1. Resize to 1920x1080, navigate to `/writing/feature-flags`. **Verify** with `browser_evaluate`
     an element `[aria-hidden="true"][inert]` that contains `img` exists outside `article`
     (`!el.closest("article")`), is visible (`getBoundingClientRect().width > 0`), its left edge is
     to the right of the `article`'s right edge, its top is at or below the header's bottom, and it
     contains exactly 3 `img` and no `a`, `h1` or `nav`.
  2. **Verify** a frame element inside the panel exists and its top is within 2px of the panel's
     top. Take a screenshot.
  3. Scroll to the bottom (`window.scrollTo(0, document.documentElement.scrollHeight)`), wait a
     moment. **Verify** the panel is still in the viewport and its top is at or below the header's
     bottom; the frame's bottom is within 2px of the panel's bottom. Take a screenshot.
  4. Scroll to the middle. **Verify** the frame's top is strictly between the two previous
     positions.
  5. **Verify** `document.querySelectorAll("h1").length === 1` and the last link inside the
     `article` on `/writing/my-moat` (navigate there) is `Watch me build live`.
  6. Resize to 1024x768 and reload `/writing/feature-flags`. **Verify** the minimap's
     `getBoundingClientRect().width === 0` (not displayed). Take a screenshot.
  7. Resize to 390x844, reload. **Verify** the same and
     `document.documentElement.scrollWidth <= 390`. Take a screenshot.
  8. Resize to 1920x1080, navigate to `/writing`. **Verify** no `[inert][aria-hidden="true"]`
     element containing an `img` exists.
- Success Criteria mirror the steps; 4 screenshots.
- `e2e/test_writing.md` is left unchanged and must still pass.

### 10. Validate

- Run every command in Validation Commands.

## Testing Strategy

### Unit Tests

- `src/lib/minimap.test.ts`: `minimapFrame` at the top, middle and bottom of a post; content
  shorter than the viewport; miniature taller than the panel (offset at top, bottom, middle, and a
  sweep keeping the frame inside the panel); degenerate inputs returning `null`.
- `src/components/PostMinimap.test.ts`: the server markup is `aria-hidden` and `inert`, contains no
  link, heading, nav, href or tabindex even when the post's MDX renders them, keeps image `src`,
  hides below `xl`, and renders no frame before hydration.
- `src/lib/layers.test.ts` (existing) already scans the new files for `z-<n>`.

### Test Coverage

- `src/lib/minimap.test.ts` (unit, vitest): catches a wrong frame position or a frame that leaves
  the panel when the miniature is taller than it; nothing tests this today, fails without the
  module.
- `src/components/PostMinimap.test.ts` (unit, vitest, server markup): catches a link, heading or
  focus stop leaking from the post into the duplicated copy, or the panel losing `aria-hidden`/
  `inert`; fails without the component.
- The client leaf's DOM wiring (listeners, rAF, ResizeObserver) has no unit test: there is no
  component test layer or DOM environment in this project. Its browser evidence is the
  `e2e/test_post_minimap.md` journey (listed as a task above) and the review screenshots.

### Edge Cases

- Content shorter than the viewport: the frame covers the whole miniature, no slide.
- Miniature shorter than `60vh` (a short post): panel shrinks to the miniature, no slide.
- Viewport taller than the panel at this scale: frame height capped at the panel height.
- Images finishing loading after first paint: the `ResizeObserver` on the column re-measures.
- Window resized across `xl`: below it the panel is `display: none`, `panelHeight` is 0, the
  function returns `null` and no frame is drawn; above it the next `resize` re-measures.
- Dark mode: border and frame colours use the existing neutral `dark:` pairs.
- Below `xl` the hidden copy's images are `loading="lazy"` and do not load.
- A post with no images (`my-moat`): the miniature is text only.
- Before hydration (or with JS disabled): the panel shows the miniature from its top, no frame.

## Acceptance Criteria

- At 1920x1080 on `/writing/feature-flags` the minimap is in the right gutter, below the header,
  with three images, `aria-hidden="true"` and `inert`; the frame is at the top at scroll 0 and at
  the bottom after scrolling to the end; the panel stays visible while scrolling.
- At 1024x768 and 390x844 no minimap is visible and the page is laid out as before.
- `/writing`, `/projects`, the changelog and `/hire` have no minimap.
- The `article` has exactly one `h1` and the same links as before; `e2e/test_writing.md` passes
  unchanged.
- The minimap has no links, headings, nav, focusable elements, click, drag or keyboard behaviour.
- No `z-<n>` added; `layers.test.ts` passes.
- `yarn build` lists `/writing/my-moat` and `/writing/feature-flags` as static (prerendered).
- No new dependencies; no em-dashes; `src/mdx-components.tsx` unchanged and server only.
- Docs updated: `app_docs/writing.md` (Minimap section, rules), `app_docs/screens-and-components.md`
  (`"use client"` list), `docs/conditional-docs.md`, `.adw/project.md` (journey list, Review).

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

- `yarn lint`: ESLint over the new components and page.
- `yarn typecheck`: `next typegen` plus `tsc --noEmit`, covers the `Content` prop type and `inert`.
- `yarn knip`: no unused exports (only `MINIMAP_SCALE`, `minimapFrame` and the two components are
  exported, all used).
- `yarn format:check`: Prettier on the new and changed files.
- `yarn test`: the new `minimap.test.ts` and `PostMinimap.test.ts`, plus `layers.test.ts` and the
  existing suite.
- `yarn build`: the post pages still build and are listed as static (check the route table for
  `/writing/[slug]` with `my-moat` and `feature-flags` prerendered).
- `yarn check:og`: the post metadata check still passes on the rebuilt HTML.
- `grep -rn "—" src/lib/minimap.ts src/lib/minimap.test.ts src/components/PostMinimap.tsx src/components/PostMinimap.test.ts src/components/PostMinimapViewport.tsx "src/app/writing/[slug]/page.tsx" app_docs/writing.md app_docs/screens-and-components.md docs/conditional-docs.md .adw/project.md e2e/test_post_minimap.md`: must print nothing (no em-dashes).

## Notes

- No new dependencies. `zoom` and `inert` are platform features (React 19 renders `inert` as a
  boolean attribute; `zoom` is in React's `CSSProperties`).
- Why `zoom` rather than `transform: scale()`: a transform leaves the unscaled layout box, so the
  panel would be `60vh` tall for any post and its size would need client measurement (a layout
  shift after hydration). `zoom` gives the panel its true height from the server markup. If a
  reviewer finds a rendering issue with `zoom`, fall back to `transform: scale(MINIMAP_SCALE)`
  with `transform-origin: top left` inside a fixed `h-[60vh]` panel; the maths is unchanged
  because `scale` is measured.
- The miniature reuses the post's `src`s; the browser cache serves them, and `loading="lazy"`
  keeps the hidden copy from fetching below `xl`.
- Rendering `<Content />` twice is safe: the posts are pure MDX modules with no side effects, ids
  or client components.
- Out of scope: click or drag to jump, a table of contents, progress bars, the minimap on any other
  page, anything under `adws/`.
