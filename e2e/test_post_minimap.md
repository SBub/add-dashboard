# E2E Test: Post Minimap

Checks the minimap on a post page: from 1280px up, a narrow sticky strip in the right gutter,
outside the `article`, hidden from assistive tech and inert, maps the shape of the whole post
(headings, lines of text, images) drawn from measurements of the real article, with a frame that
follows the part of the post in the viewport; below 1280px the page is laid out as before and no
other page has a minimap. Run it in Chromium and again in WebKit (Safari's engine, where the old
`zoom`-based minimap broke). The hosted database is read only; this journey never writes.

## User Story

As a reader of a long post on a wide screen
I want to see a small map of the whole post with the part I am reading framed
So that I know how far I am and how much is left without leaving the text

## Test Steps

1. Resize the browser to 1440x900 and navigate to `/writing/feature-flags`; wait a moment for the
   strip to be drawn. With `browser_evaluate`, find the strip (`[data-minimap]`) and its inner box
   (the element with the class `relative` inside it). **Verify** the strip is
   `aria-hidden="true"` and `inert`, is outside the `article` (`!el.closest("article")`), is
   visible, its left edge is to the right of the `article`'s right edge, its top is at or below the
   bottom of `body > header`, its width is at most 140px and its height at most 70% of
   `innerHeight` (plus 1px).
2. **Verify** the strip contains no `a`, `img`, `h1`, `h2`, `h3` or `nav`, no text nodes (a
   `document.createTreeWalker(strip, NodeFilter.SHOW_TEXT)` finds none), and no element inside it
   (the strip included) has a computed `zoom` other than `1` or `normal`.
3. **Verify** the number of `[data-minimap-shape="image"]` elements equals the number of `img`
   in the `article` (3), there is at least one `[data-minimap-shape="heading"]` and
   `[data-minimap-shape="text"]`, and the largest `getBoundingClientRect().bottom` over all
   `[data-minimap-shape]` elements is at or above the inner box's bottom (plus 1px): the whole
   post fits in the strip.
4. At scroll 0, **Verify** the frame (`[data-minimap-frame]`) exists and its top is within 1px of
   the inner box's top. Take a screenshot.
5. Scroll to the end (`window.scrollTo(0, document.documentElement.scrollHeight)`) and wait a
   moment. **Verify** the strip is inside the viewport with its top at or below the header's
   bottom, and the frame's bottom is within 1px of the inner box's bottom, which is the last
   block's bottom. Take a screenshot.
6. Scroll to the middle (`window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) / 2)`)
   and wait a moment. **Verify** the frame's top is strictly between its tops in steps 4 and 5,
   and the strip has not moved (same top as in step 1). Take a screenshot.
7. **Verify** `document.querySelectorAll("h1").length === 1`. Navigate to `/writing/my-moat` and
   **Verify** the last link inside the `article` has text `Watch me build live`.
8. Resize to 1024x768 and reload `/writing/feature-flags`. **Verify** the strip's
   `getBoundingClientRect().width === 0` (not displayed) and it holds no `[data-minimap-shape]`.
   Take a screenshot.
9. Resize to 390x844 and reload. **Verify** the same, and
   `document.documentElement.scrollWidth <= 390`. Take a screenshot.
10. Resize to 1440x900 and navigate to `/writing`. **Verify** no `[data-minimap]` element exists.

## Success Criteria

- At 1440x900 the strip is in the right gutter, below the header, outside the `article`,
  `aria-hidden="true"` and `inert`, at most 140px wide and 70% of the viewport tall.
- The strip holds only shapes: no text nodes, links, images, headings or navigation, and no
  computed `zoom` anywhere inside it.
- One image rectangle per `img` in the article, and the last block's bottom is inside the strip.
- The frame is at the strip's top at scroll 0, between in the middle, and ends at the last block's
  bottom at the end of the page; the strip stays in view while scrolling.
- The page keeps one `h1`, and `/writing/my-moat`'s article still ends with `Watch me build live`.
- At 1024x768 and 390x844 no minimap is displayed and nothing scrolls sideways.
- `/writing` has no minimap.
- 5 screenshots are taken, per browser (Chromium and WebKit).
