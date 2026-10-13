# E2E Test: Header Login Hidden

Checks that the root header carries no `Login` or `Logout` button where PostHog is not initialised
(every environment but the production deploy): the button is gated by the PostHog feature flag
`login`, which reads `undefined` there, so the header renders exactly as before, with the
`Work with me` button last in its right group.

## User Story

As a visitor to the site outside the production deploy
I want the header to show no Login or Logout button
So that the owner's PostHog identify control never appears where its flag cannot be read

## Test Steps

1. Navigate to the `Application URL` (`/`).
2. **Verify** the header has no button or link named `Login` or `Logout`, and the `Work with me`
   link (`href="/hire"`) is present.
3. Take a screenshot of `/` at 1920x1080.
4. Navigate to `/projects`. **Verify** the header has no button or link named `Login` or `Logout`,
   and the `Work with me` link (`href="/hire"`) is present.
5. Navigate to `/writing`. **Verify** the header has no button or link named `Login` or `Logout`,
   and the `Work with me` link (`href="/hire"`) is present.
6. Navigate to `/hire`. **Verify** the header has no button or link named `Login` or `Logout`, and
   the `Work with me` link (`href="/hire"`) is present.

## Success Criteria

- `/`, `/projects`, `/writing` and `/hire` show no `Login` or `Logout` in the header.
- The `Work with me` link is present on each.
- 1 screenshot is taken.
