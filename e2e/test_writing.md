# E2E Test: Writing

Checks the blog at `/writing`: the list with the seed post, its title link, date and audience tag;
the post page at `/writing/hello` with its title, Open Graph tags and the closing `Work with me`
link to `/hire`; that the header marks `Writing` as current on both; and that neither page scrolls
horizontally at 375px. It never submits the `/hire` form.

## User Story

As a reader arriving from a LinkedIn post
I want the post to open on its own page with a clear title and a way to get in touch
So that I can read it and reach the Work with me form in one click

## Test Steps

1. Resize the browser to 1920x1080 and navigate to `/writing`.
2. **Verify** the heading (level 1) `Writing`, a link with `href="/writing/hello"` and text
   `[Placeholder] Writing starts here`, and the tag `For everyone`.
3. **Verify** the `Writing` link in the `Sections` navigation has `aria-current="page"` and the
   `Watch me build` link has none.
4. **Verify** the page has no element with role `status` (no connection indicator) and no
   `navigation` named `Projects`. Take a full-page screenshot.
5. Click the post link. **Verify** the URL is `/writing/hello`, the heading (level 1) is
   `[Placeholder] Writing starts here`, and the `Writing` header link still has
   `aria-current="page"`.
6. With `browser_evaluate`, **Verify** the last link inside the `article` has text `Work with me`
   and `href="/hire"`. Take a full-page screenshot.
7. With `browser_evaluate`, **Verify**
   `document.querySelector('meta[property="og:title"]').content` is
   `[Placeholder] Writing starts here` and
   `document.querySelector('meta[property="og:image"]').content` is non-empty.
8. Resize to 375x667 and navigate to `/writing`. With `browser_evaluate`, **Verify**
   `document.documentElement.scrollWidth <= 375`. Take a full-page screenshot.
9. Navigate to `/writing/hello`. With `browser_evaluate`, **Verify**
   `document.documentElement.scrollWidth <= 375`. Take a full-page screenshot.

## Success Criteria

- `/writing` lists the seed post with its title link, date and the tag `For everyone`.
- `/writing/hello` shows the post title as its heading, carries `og:title` and a non-empty
  `og:image`, and ends with a `Work with me` link to `/hire`.
- `Writing` is current in the header on both pages; neither has a sidebar or connection indicator.
- Neither page scrolls horizontally at 375px.
- 4 screenshots are taken.
