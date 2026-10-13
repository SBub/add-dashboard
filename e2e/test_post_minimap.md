# E2E Test: Post Minimap

Checks the minimap on a post page: from 1280px up, a small copy of the whole post sits in a sticky
panel in the right gutter, outside the `article`, hidden from assistive tech and inert, with a frame
that follows the part of the post in the viewport; below 1280px the page is laid out as before and
no other page has a minimap. The hosted database is read only; this journey never writes.

## User Story

As a reader of a long post on a wide screen
I want to see a small map of the whole post with the part I am reading framed
So that I know how far I am and how much is left without leaving the text

## Test Steps

1. Resize the browser to 1920x1080 and navigate to `/writing/feature-flags`. With
   `browser_evaluate`, find the element matching `[aria-hidden="true"][inert]` that contains an
   `img` (the panel). **Verify** it exists, is outside the `article` (`!el.closest("article")`), is
   visible (`getBoundingClientRect().width > 0`), its left edge is to the right of the `article`'s
   right edge, its top is at or below the bottom of `body > header`, and it contains exactly 3 `img`
   and no `a`, `h1` or `nav`.
2. Wait a moment for the frame to be drawn. **Verify** the panel contains an element with the
   class `absolute` (the frame) and its top is within 2px of the top of its parent (the panel's
   inner box). Take a screenshot.
3. Scroll to the bottom (`window.scrollTo(0, document.documentElement.scrollHeight)`) and wait a
   moment. **Verify** the panel is inside the viewport and its top is at or below the header's
   bottom, and the frame's bottom is within 2px of the bottom of the panel's inner box. Take a
   screenshot.
4. Scroll to the middle (`window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) / 2)`)
   and wait a moment. **Verify** the frame's top relative to the panel's inner box is strictly
   between its positions in steps 2 and 3.
5. **Verify** `document.querySelectorAll("h1").length === 1`. Navigate to `/writing/my-moat` and
   **Verify** the last link inside the `article` has text `Watch me build live`.
6. Resize to 1024x768 and reload `/writing/feature-flags`. **Verify** the panel's
   `getBoundingClientRect().width === 0` (not displayed). Take a screenshot.
7. Resize to 390x844 and reload. **Verify** the same, and
   `document.documentElement.scrollWidth <= 390`. Take a screenshot.
8. Resize to 1920x1080 and navigate to `/writing`. **Verify** no `[inert][aria-hidden="true"]`
   element containing an `img` exists.

## Success Criteria

- At 1920x1080 the minimap is in the right gutter, below the header, outside the `article`,
  `aria-hidden="true"` and `inert`, with 3 images and no links, headings or navigation.
- The frame is at the top of the panel at scroll 0, at its bottom after scrolling to the end, and
  between the two in the middle; the panel stays in view while scrolling.
- The page keeps one `h1`, and `/writing/my-moat`'s article still ends with `Watch me build live`.
- At 1024x768 and 390x844 no minimap is displayed and nothing scrolls sideways.
- `/writing` has no minimap.
- 4 screenshots are taken.
