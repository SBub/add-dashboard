# E2E Test: Header Section Active

Checks that the root header marks the current section: the brand `Sviatlana Buben` on `/` (the
intro page) only, the `Watch me build` link (`href="/projects"`) on `/projects`, `/projects/log` and
on a project page, the `Work with me` button on `/hire`, and none of them on a route outside all three
sections, such as the removed `/watch`, which renders the not-found page.

## User Story

As a person using the ADW dashboard
I want the header to show which section I am in
So that I can tell at a glance whether I am on the intro page or watching the builds, and assistive
technology announces the current page link

## Test Steps

1. Navigate to the `Application URL` (`/`).
2. **Verify** the brand link in the header (text `Sviatlana Buben, building in public`, `href="/"`)
   has `aria-current="page"` and the `Watch me build` link in the `Sections` navigation has
   `href="/projects"` and no `aria-current`.
3. Navigate to `/projects/log`. **Verify** the `Watch me build` link has `aria-current="page"` and the
   `Sviatlana Buben` brand link has no `aria-current`. Then navigate to `/projects`.
4. **Verify** the `Watch me build` link in the `Sections` navigation has `aria-current="page"` and
   the `Sviatlana Buben` brand link has no `aria-current`.
5. Click the first project link in the sidebar's `Projects` navigation and note its `href`.
6. **Verify** the URL is `/projects/<owner>/<repo>` (the noted `href`) and the header's
   `Watch me build` link in the `Sections` navigation has `aria-current="page"`.
7. Take a screenshot of the project page at 1920x1080.
8. Resize to 375x667 and take a screenshot of the project page.
9. Resize back to 1920x1080 and navigate to `/projectsx`.
10. **Verify** the not-found page renders and neither the `Sviatlana Buben` brand link nor the
    `Watch me build` link has `aria-current`.
11. Navigate to `/watch`, then to `/watchx`. On each, **Verify** the not-found page renders (the
    `Not found` heading) and no header link (brand, `Watch me build`, `Work with me`) has
    `aria-current`. Then navigate to `/hire`.
12. **Verify** the header's `Work with me` link (`href="/hire"`) has `aria-current="page"` and
    neither the `Sviatlana Buben` brand link nor the `Watch me build` link has `aria-current`.

## Success Criteria

- `/` marks the brand only; `Watch me build` links to `/projects`.
- `/projects/log`, `/projects` and a project page mark `Watch me build` only.
- `/hire` marks `Work with me` only.
- `/projectsx`, `/watch` and `/watchx` render not-found and mark no link.
- 2 screenshots are taken.
