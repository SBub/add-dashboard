# E2E Test: Hire Page

Checks the header's Work with me button on every route, the `/hire` page's static shell, its
form, the shared accent of the two buttons, the browser-side validation and the status states
read from the URL. It never submits a valid form: the review server runs with the owner's real
keys, and a valid submit would email `hire@issebya.com`.

## User Story

As a recruiter or prospective client visiting the dashboard
I want a visible "Work with me" entry point and a short form to send a request
So that I can contact the owner about product engineering or AI consulting work without leaving
the site

## Test Steps

1. Resize the browser to 1920x1080 (steps 1 to 20 run at this width; below 640px the button
   floats outside the header) and navigate to the `Application URL` (`/`).
2. **Verify** the header has a `Work with me` link with `href="/hire"` and no `aria-current`.
3. Navigate to `/projects` and **Verify** the same `Work with me` link is in the header.
4. Click the first project link in the sidebar's `Projects` navigation and **Verify** the same
   `Work with me` link is in the header.
5. Click the header's `Work with me` link.
6. **Verify** the URL is `/hire` and the `Work with me` link has `aria-current="page"`.
7. **Verify** the heading `Work with me`, the text `Remote, Lisbon` directly under it, and a
   `LinkedIn profile` link with `target="_blank"` and `rel="noreferrer"`. **Verify** no text
   `[Placeholder]` on the page.
8. **Verify** the page has no offer blocks: no level-2 or level-3 heading, and no text
   `Structure and automate your processes with AI`. The heading, the location line and the
   LinkedIn link are followed directly by the form.
9. **Verify** the `offer` select is labelled `What brings you here?` and has exactly two options.
   With `browser_evaluate`, return each option's `value` and `text`. **Verify** the first is value
   `Product engineer` with text `I need a product engineer`, and the second is value
   `AI consulting` with text `I want to structure and automate my processes with AI`. **Verify** the
   select's `value` is `Product engineer` (the default with no `?offer=`), and the motivation
   textarea is labelled `What are you building?`. Select the second option and **Verify** the
   textarea's label changes to `Tell me about your business`; select the first again and **Verify**
   it is `What are you building?` again.
10. With `browser_evaluate`, collect the `bg-fuchsia-*` classes of the `Send` button and of the
    header's `Work with me` link. **Verify** the two lists are identical and not empty.
11. **Verify** the accessibility snapshot has no connection indicator (no `status` element, no
    `connecting`, `live` or `reconnecting` text) and no `Projects` sidebar navigation. Judge this
    from `browser_snapshot`, never from a raw DOM query such as
    `document.querySelector('nav[aria-label="Projects"]')`: with `cacheComponents`, Next keeps the
    project page from step 4 in the document inside a hidden React `Activity` (`display: none`).
    That subtree is not rendered, is absent from the accessibility snapshot and does not count as
    present.
12. Choose an offer, fill the email with `visitor@example.com`, leave the motivation empty and
    click `Send`.
13. **Verify** the URL is still `/hire` with no query, and with `browser_evaluate` that the
    motivation textarea's `validity.valueMissing` is `true` (the browser blocked the submit).
14. Navigate to `/hire?sent=1` and **Verify** the confirmation `Thanks, your message was sent.`
    shows and there is no form.
15. Navigate to `/hire?error=verification` and **Verify** the message
    `We could not verify you are human. Please try again.` shows above the form.
16. Navigate to `/hire?error=<script>` and **Verify** the plain form shows with no error message,
    and the text `<script>` appears nowhere on the page.
17. Navigate to `/hire?offer=product-engineer`. **Verify** no offer block shows (no level-2 or
    level-3 heading), the page has no `select`, and with `browser_evaluate` the form has one `input[type=hidden][name=offer]` whose
    `value` is `Product engineer`. **Verify** the textarea is labelled
    `What are you building?`.
18. Navigate to `/hire?offer=ai-consulting`. **Verify** no offer block shows (no level-2 or
    level-3 heading, no text `Structure and automate your processes with AI`), the page has no
    `select`, the hidden `offer` input's `value` is `AI consulting`, and the
    textarea is labelled `Tell me about your business`.
19. Navigate to `/hire?offer=nope`, then to `/hire?offer=<script>`. **Verify** each shows no offer block,
    the select with `value` `Product engineer`, and the text `<script>` appears nowhere
    on the page.
20. Navigate to `/hire` and take a full-page screenshot at 1920x1080.
21. Resize to 375x667 and take a full-page screenshot.
22. **Verify** at 375 that the header shows `Sviatlana Buben` and `Watch me build`, does not
    show `building in public` (that part of the brand is hidden below `sm`), that
    `Remote, Lisbon` is visible, and with `browser_evaluate` that
    `document.documentElement.scrollWidth <= 375`. **Verify** that on `/hire` the `Work with me`
    link is not visible (computed `display` is `none`) and its box is not inside
    `body > header`'s box.
23. Navigate to `/` at 375x667. With `browser_evaluate`, **Verify** the `Work with me` link
    (`a[href="/hire"]`) is visible, its computed `position` is `fixed`, and
    `innerWidth - rect.right` and `innerHeight - rect.bottom` are each 16px within 2px
    (bottom-right corner).

## Success Criteria

- At 1920x1080 the `Work with me` link is in the header on `/`, `/projects`, a project page and
  `/hire`, and is marked `aria-current="page"` only on `/hire`.
- At 375x667 the `Work with me` link floats in the bottom-right corner on `/` and is hidden on
  `/hire`.
- `/hire` shows the `Work with me` heading, `Remote, Lisbon`, the LinkedIn link and a form whose select (`What brings you here?`) has exactly the two
  offers, labelled `I need a product engineer` and
  `I want to structure and automate my processes with AI` with values `Product engineer` and
  `AI consulting`, with no sidebar and no connection indicator.
- The Send button and the header link share the same fuchsia classes.
- An empty motivation is blocked by the browser; nothing is posted.
- `?sent=1` shows the confirmation in place of the form, `?error=verification` shows its message
  above the form, and an unknown `?error=` shows the plain form without echoing the query.
- `?offer=product-engineer` and `?offer=ai-consulting` each show no offer block, no
  select, a hidden `offer` input with that offer's value and that offer's prompt as the textarea
  label; no or an unknown `?offer=` shows the select, with the textarea label following the selected offer, without echoing the query.
- The page fits at 375px with no horizontal overflow and shows the short brand
  `Sviatlana Buben`.
- 2 screenshots are taken.
