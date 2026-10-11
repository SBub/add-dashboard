# E2E Test: Home Page

Checks the intro page at `/`: its heading, intro, the ADW line with a `Watch me build` link to
`/projects`, and the two door cards into `/hire`, each preselecting its offer through `?offer=`;
that the header marks the brand on `/` and `Watch me build` on `/projects`; and that the doors sit side by
side at desktop and stack at 375px with no horizontal scroll. It never submits the `/hire` form.

## User Story

As a hiring manager or a small-business owner landing on the site
I want the first screen to tell me who the owner is and offer me a direct door for my situation
So that I can reach the right contact form in one click, and still watch the ADW ledger when I
want proof

## Test Steps

1. Resize the browser to 1920x1080 and navigate to the `Application URL` (`/`).
2. **Verify** the heading (level 1) `Sviatlana Buben, product engineer`, the intro paragraphs, and
   the ADW line ending with a `Watch me build` link with `href="/projects"`.
3. **Verify** two door links: one with `href="/hire?offer=product-engineer"` whose text starts
   `Hiring a product engineer?`, and one with `href="/hire?offer=ai-consulting"` whose text starts
   `Want to automate your processes with AI?`.
4. **Verify** the page has no `table`, no heading starting `Today,`, no element with role `status`
   (no connection indicator) and no `navigation` named `Projects`.
5. **Verify** the header's brand link (`href="/"`) has `aria-current="page"` and the `Watch me build`
   link in the `Sections` navigation has none.
6. Take a full-page screenshot at 1920x1080. With `browser_evaluate`, **Verify** the two door links'
   `getBoundingClientRect().top` are equal (one row).
7. Click the first door. **Verify** the URL is `/hire?offer=product-engineer` and, with
   `browser_evaluate`, the select's `value` is `Product engineer`.
8. Go back, click the second door. **Verify** the URL is `/hire?offer=ai-consulting` and the
   select's `value` is `AI consulting`.
9. Navigate to `/` and click the ADW line's `Watch me build` link. **Verify** the URL is `/projects`,
   the `Building now` heading (level 2) is present, the header's `Watch me build`
   link has `aria-current="page"` and the brand link has none.
10. Navigate to `/` and resize to 375x667. With `browser_evaluate`, **Verify** the doors are stacked
    (the second door's `top` is greater than the first door's `bottom`) and
    `document.documentElement.scrollWidth <= 375`. Take a full-page screenshot.

## Success Criteria

- `/` shows the heading, the intro, the ADW line with `Watch me build` linking to `/projects`, and both
  doors with the exact hrefs `/hire?offer=product-engineer` and `/hire?offer=ai-consulting`.
- Each door lands on `/hire` with its offer preselected.
- The brand is current on `/`; `Watch me build` is current on `/projects`.
- `/` has no run rows, no sidebar and no connection indicator.
- The doors sit side by side at 1920px and stack at 375px with no horizontal scroll.
- 2 screenshots are taken.
