# E2E Test: Header Mobile

Checks that the root header is one row (57px) at every width from 320px, that the single
`Work with me` link floats in the bottom-right corner below 640px and sits in the header from
640px, that it is hidden on `/hire` below 640px, that the tagline shows only from 1024px, and that
no width overflows horizontally, in light and dark. The radio bar above the header is out of scope:
every check reads `body > header`. The hosted database is read only; this journey never writes.

## User Story

As a visitor reading the site on a phone or a tablet
I want a compact one-row header and a "Work with me" button that is always under my thumb
So that the header takes less of the screen and the contact entry point is one tap away

## Test Steps

1. Use the viewports 320x568, 375x667, 390x844, 430x932, 640x800, 768x1024, 1024x768 and
   1920x1080, the color schemes `light` and `dark` (set with `browser_run_code_unsafe` and
   `page.emulateMedia({ colorScheme })`), and the pages `/`, `/projects/log`, `/writing` and
   `/writing/my-moat`.
2. For each color scheme, viewport and page: resize, navigate, and with `browser_evaluate` read
   `header = document.querySelector('body > header')`, `links = document.querySelectorAll('a[href="/hire"]')`
   and the tagline element (the `span` with text `Built with ADW, my AI developer workflow`).
   - **Verify** `header.getBoundingClientRect().height` is 57 within 1.
   - **Verify** `links.length` is 1 and its accessible name is `Work with me`.
   - Below 640 wide: **Verify** the link's computed `position` is `fixed`, its rect is inside the
     viewport, `innerWidth - rect.right` and `innerHeight - rect.bottom` are each 16 within 2, and
     `rect.height >= 44`. Then run `window.scrollTo(0, document.documentElement.scrollHeight)` and
     **Verify** `document.querySelector('main').lastElementChild.getBoundingClientRect().bottom`
     is at most the link's `getBoundingClientRect().top`.
   - From 640 wide: **Verify** the link's rect is inside the header's rect and its computed
     `position` is not `fixed`.
   - **Verify** the tagline is not visible (computed `display` is `none`) below 1024 wide and
     visible at 1024 and 1920.
   - **Verify** `document.documentElement.scrollWidth <= innerWidth`.
3. Resize to 390x844 and navigate to `/hire`. **Verify** the `Work with me` link's computed
   `display` is `none` (not visible).
4. Resize to 1024x768 on `/hire`. **Verify** the `Work with me` link is visible, its rect is inside
   `body > header`'s rect and it has `aria-current="page"`.
5. Take screenshots of `/` showing the header and the floating button at 390x844 and of the header
   at 768x1024, each in light and dark.

## Success Criteria

- `body > header` is 57px (within 1px) at every tested width, page and color scheme.
- Exactly one `Work with me` link at every width.
- Below 640px it is fixed 16px from the right and bottom edges, at least 44px tall, and the end of
  `main` clears it when scrolled to the bottom; from 640px it is inside the header and not fixed.
- On `/hire` it is hidden at 390px and marked `aria-current="page"` in the header at 1024px.
- The tagline is hidden below 1024px and visible from 1024px.
- No horizontal overflow at any tested width.
- 4 screenshots are taken.
