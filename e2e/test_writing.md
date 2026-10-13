# E2E Test: Writing

Checks the blog at `/writing`: the list with the first post, its title link, date and audience tag;
the post page at `/writing/my-moat` with its title, Open Graph tags and its own closing
`Watch me build live` link to `/projects`, with no `Work with me` link inside the article; that the post page has a
`Breadcrumb` navigation above its heading leading back to `/writing`, and `/writing` has none; that the header marks `Writing` as current on both; and that
neither page scrolls horizontally at 390px. It never submits the `/hire` form.

## User Story

As a reader arriving from a LinkedIn post
I want the post to open on its own page with a clear title and end on its own last line
So that I can read it and follow it to the live build in one click

## Test Steps

1. Resize the browser to 1920x1080 and navigate to `/writing`.
2. **Verify** the heading (level 1) `Writing`, a link with `href="/writing/my-moat"` and text
   `My moat as a Product Engineer`, and the tag `For product teams`.
3. **Verify** the `Writing` link in the `Sections` navigation has `aria-current="page"` and the
   `Watch me build` link has none.
4. **Verify** the page has no element with role `status` (no connection indicator), no
   `navigation` named `Projects` and no `navigation` named `Breadcrumb`. Take a full-page
   screenshot.
5. Click the post link. **Verify** the URL is `/writing/my-moat`, the heading (level 1) is
   `My moat as a Product Engineer`, and the `Writing` header link still has
   `aria-current="page"`.
6. **Verify** a `navigation` named `Breadcrumb` exists. With `browser_evaluate`, **Verify** that
   `nav[aria-label="Breadcrumb"]` precedes the `h1` in document order
   (`nav.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING` is non-zero), its
   `Writing` link has `href="/writing"`, and its last list item's `[aria-current="page"]` element
   has text `My moat as a Product Engineer` (the `/` separator is `aria-hidden="true"`). Take a
   screenshot.
7. Click the breadcrumb's `Writing` link. **Verify** the URL is `/writing` and the heading
   (level 1) is `Writing`. Navigate back to `/writing/my-moat`.
8. With `browser_evaluate`, **Verify** the last link inside the `article` has text
   `Watch me build live` and `href="/projects"`, and no link inside the `article` has text
   `Work with me`. Take a full-page screenshot.
9. With `browser_evaluate`, **Verify**
   `document.querySelector('meta[property="og:title"]').content` is
   `My moat as a Product Engineer` and
   `document.querySelector('meta[property="og:image"]').content` is non-empty.
10. Resize to 390x844 and navigate to `/writing`. With `browser_evaluate`, **Verify**
    `document.documentElement.scrollWidth <= 390`. Take a full-page screenshot.
11. Navigate to `/writing/my-moat`. With `browser_evaluate`, **Verify**
    `document.documentElement.scrollWidth <= 390` and that the breadcrumb's
    `[aria-current="page"]` element has `getComputedStyle(el).whiteSpace === "nowrap"`. Take a
    full-page screenshot.

## Success Criteria

- `/writing` lists the first post with its title link, date and the tag `For product teams`.
- `/writing/my-moat` shows the post title as its heading, carries `og:title` and a non-empty
  `og:image`, and ends with its own `Watch me build live` link to `/projects`; the article has
  no `Work with me` link.
- `/writing/my-moat` has a `Breadcrumb` navigation above its heading: `Writing` linking to
  `/writing`, then the post title with `aria-current="page"`, on one line at 390px. `/writing`
  has no breadcrumb.
- `Writing` is current in the header on both pages; neither has a sidebar or connection indicator.
- Neither page scrolls horizontally at 390px.
- 5 screenshots are taken.
