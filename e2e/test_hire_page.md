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

1. Navigate to the `Application URL` (`/`).
2. **Verify** the header has a `Work with me` link with `href="/hire"` and no `aria-current`.
3. Navigate to `/projects` and **Verify** the same `Work with me` link is in the header.
4. Click the first project link in the sidebar's `Projects` navigation and **Verify** the same
   `Work with me` link is in the header.
5. Click the header's `Work with me` link.
6. **Verify** the URL is `/hire` and the `Work with me` link has `aria-current="page"`.
7. **Verify** the heading `Work with me`, the intro paragraphs, and a `LinkedIn profile` link with
   `target="_blank"` and `rel="noreferrer"`.
8. **Verify** the `offer` select is labelled `What brings you here?` and has exactly two options.
   With `browser_evaluate`, return each option's `value` and `text`. **Verify** the first is value
   `Product engineer` with text `I need a product engineer (contract or full-time)`, and the second
   is value `AI consulting` with text `I want to take work off my own plate`. **Verify** the select's
   `value` is `Product engineer` (the default with no `?offer=`).
9. **Verify** the motivation textarea is labelled
   `What's eating your time, or what are you building?`.
10. With `browser_evaluate`, collect the `bg-fuchsia-*` classes of the `Send` button and of the
    header's `Work with me` link. **Verify** the two lists are identical and not empty.
11. **Verify** the page has no connection indicator and no `Projects` sidebar navigation.
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
17. Navigate to `/hire?offer=ai-consulting` and with `browser_evaluate` **Verify** the select's
    `value` is `AI consulting`. Navigate to `/hire?offer=<script>` and **Verify** the select's
    `value` is `Product engineer` and the text `<script>` appears nowhere on the page.
18. Navigate to `/hire` and take a full-page screenshot at 1920x1080.
19. Resize to 375x667 and take a full-page screenshot.
20. **Verify** at 375 that the header shows `Sviatlana Buben`, `Watch me build` and
    `Work with me`, does not show `building in public` (that part of the brand is hidden below
    `sm`), and with `browser_evaluate` that `document.documentElement.scrollWidth <= 375`.

## Success Criteria

- The `Work with me` link is in the header on `/`, `/projects`, a project page and `/hire`, and is
  marked `aria-current="page"` only on `/hire`.
- `/hire` shows the `Work with me` heading, intro, LinkedIn link and a form whose select
  (`What brings you here?`) has exactly the two offers, labelled
  `I need a product engineer (contract or full-time)` and `I want to take work off my own plate`
  with values `Product engineer` and `AI consulting`, with no sidebar and no connection indicator.
- The Send button and the header link share the same fuchsia classes.
- An empty motivation is blocked by the browser; nothing is posted.
- `?sent=1` shows the confirmation in place of the form, `?error=verification` shows its message
  above the form, and an unknown `?error=` shows the plain form without echoing the query.
- `?offer=ai-consulting` preselects `AI consulting`; no or an unknown `?offer=` preselects
  `Product engineer` without echoing the query.
- The header fits at 375px with no horizontal overflow and shows the short brand
  `Sviatlana Buben`.
- 2 screenshots are taken.
