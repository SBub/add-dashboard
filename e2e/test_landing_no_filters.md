# E2E Test: Landing Page Without Filters

Checks that the summary at `/projects/log` has no Project or Window filter: it shows the heading, the
intro and the day cards for all projects over the fixed
30-day window, ignores `?days` and `?project`, and that the old `/summary` and `/watch` addresses
render the not-found page (no redirect).

## User Story

As a visitor reading the ADW daily log
I want the summary to show every project's finished runs without a form to fill in
So that the report reads straight through and ignores old filter parameters

## Test Steps

1. Navigate to `/projects/log` under the `Application URL`.
2. **Verify** the `Daily log` heading (level 1) is present, followed
   by the intro paragraph `What my AI developer workflow shipped each day, and what it cost.`
3. **Verify** the page has no text `Times are UTC` and no text `published metrics` outside the day
   cards: the intro paragraph is followed directly by the report.
4. **Verify** at least one past day card is present (an `article` with a level-2 date heading,
   below the today card whose heading starts `Today,`) and that it holds a per-project table whose `Project` cells are plain text (no links in the Project
   column).
5. **Verify** the window line above the day cards ends with `all projects`.
6. **Verify** the snapshot contains no `combobox`, no `button` named `Apply` and no `form`.
7. Take a screenshot of the summary page.
8. Navigate directly (full page load) to `/projects/log?days=7&project=x`.
9. **Verify** the same content as in steps 2 to 6: the window line says `30 days`, there is no
   error panel and no `No public project named` text.
10. Take a screenshot of the summary page with ignored parameters.
11. Navigate directly (full page load) to `/summary?days=7`, then to `/watch`.
12. **Verify** on each that the URL is unchanged (no redirect), the not-found page renders (the
    `Not found` heading and the text `There is nothing at this address.`) and the
    `Daily log` heading (level 1) is absent.
13. Take a screenshot of the not-found page at `/watch`.

## Success Criteria

- `/projects/log` shows the heading, the intro and the day cards, with no reading note.
- No `<select>`, no Apply button and no form on `/projects/log`.
- Project names in the per-project tables are plain text.
- `/projects/log?days=7&project=x` renders the same 30-day, all-projects report as `/projects/log`.
- `/summary?days=7` and `/watch` render the not-found page, with no redirect.
- 3 screenshots are taken.
