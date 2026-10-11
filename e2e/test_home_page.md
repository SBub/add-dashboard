# E2E Test: Home Page

Checks the intro page at `/`: its heading, the role line, the `Remote, Lisbon` line, intro, and the two door cards into `/hire`, each opening its offer through `?offer=`;
that the header marks the brand on `/` and `Watch me build` on `/projects`; and that the doors sit side by
side at desktop and stack at 375px with no horizontal scroll. It never submits the `/hire` form.

## User Story

As a hiring manager or a small-business owner landing on the site
I want the first screen to tell me who the owner is and offer me a direct door for my situation
So that I can reach the right contact form in one click, and still watch the ADW ledger when I
want proof

## Test Steps

1. Resize the browser to 1920x1080 and navigate to the `Application URL` (`/`).
2. **Verify** the heading (level 1) `Sviatlana Buben`, the text `Product Engineer, AI Consultant`
   directly under it, then `Remote, Lisbon`, the intro line `Offline: running guest house issebya.com`, whose `issebya.com` is a link with
   `href="https://www.issebya.com"`, then `Love forest bathing, NTS, PostHog`. **Verify** the
   page has no text `[Placeholder]` and no `Online:` line.
3. **Verify** two door links: one with `href="/hire?offer=product-engineer"` whose text starts
   `Building a product?`, and one with `href="/hire?offer=ai-consulting"` whose text starts
   `Want to automate your processes with AI?`.
4. **Verify** the page has no `table`, no heading starting `Today,`, no element with role `status`
   (no connection indicator) and no `navigation` named `Projects`.
5. **Verify** the header's brand link (`href="/"`) has `aria-current="page"` and the `Watch me build`
   link in the `Sections` navigation has none.
6. Take a full-page screenshot at 1920x1080. With `browser_evaluate`, **Verify** the two door links'
   `getBoundingClientRect().top` are equal (one row).
7. **Verify** each door shows only its title (no description line). Click the first door.
   **Verify** the URL is `/hire?offer=product-engineer`, there is no `select`, with
   `browser_evaluate` the hidden `offer` input's `value` is `Product engineer`, the textarea is
   labelled `What are you building?`, and there is no offer block
   (no level-2 heading on the page).
8. Go back, click the second door. **Verify** the URL is `/hire?offer=ai-consulting`,
   there is no `select`, the hidden `offer` input's `value` is `AI consulting`, the textarea is
   labelled `Tell me about your business`, and there is no offer block (no text
   `Structure and automate your processes with AI`).
9. Navigate to `/` and click the header's `Watch me build` link. **Verify** the URL is `/projects`,
   the `Building now` heading (level 2) is present, the header's `Watch me build`
   link has `aria-current="page"` and the brand link has none.
10. Navigate to `/` and resize to 375x667. With `browser_evaluate`, **Verify** the doors are stacked
    (the second door's `top` is greater than the first door's `bottom`) and
    `document.documentElement.scrollWidth <= 375`, and that `Remote, Lisbon` is visible. Take a
    full-page screenshot.

## Success Criteria

- `/` shows the heading `Sviatlana Buben`, `Product Engineer, AI Consultant` under it, `Remote, Lisbon`, the intro with the `issebya.com` link, and both
  doors with the exact hrefs `/hire?offer=product-engineer` and `/hire?offer=ai-consulting`.
- Each door lands on `/hire` with the form set to that offer: no select, the offer in a hidden
  input and the offer's prompt as the textarea label; no offer block.
- The brand is current on `/`; `Watch me build` is current on `/projects`.
- `/` has no run rows, no sidebar and no connection indicator.
- The doors sit side by side at 1920px and stack at 375px with no horizontal scroll.
- 2 screenshots are taken.
