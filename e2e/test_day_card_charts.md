# E2E Test: Day Card Chart Cards

Checks that every day card on the summary at `/watch` shows three separate chart cards directly under
its header, "What I worked on", "Tokens by model" and "What each step cost", in one row on desktop
and stacked on mobile; that classes, models and phases come in a fixed order; that a bar's value
sits inside it in white (or just above a bar too short for it); that labels under the bars are text
with a colour dot; that the tooltips show the token split with cost, the phase usage with time and
runs, and the class count with its share; and that the per-project table keeps its compact class bars.

## User Story

As a visitor reading the ADW public ledger on `/watch`
I want each day's class split, model split and cost by pipeline phase shown as three clearly
separated, consistently ordered charts with the numbers on the bars
So that I can read a day at a glance and compare days without hunting for which label belongs to
which column

## Test Steps

1. Navigate to `/watch` under the `Application URL`. Take the first day card that has runs (the today card
   when it has runs, else the first past card).
2. **Verify** directly below its header there are three `figure`s, captioned `What I worked on` with
   the subtitle `Runs finished that day`, `Tokens by model` with the subtitle
   `All tokens, including cache reads`, and `What each step cost` with the subtitle
   `What each pipeline step cost that day`, in one row at 1920x1080 (with `browser_evaluate`, the
   same `getBoundingClientRect().top` for all three). **Verify** with `browser_evaluate` that each
   `figcaption` holds only text, no decorative marker before the title
   (`figcaption.querySelector('[aria-hidden="true"]') === null` for every figure), and that the
   title's and the subtitle's `getBoundingClientRect().left` are equal.
3. **Verify** with `browser_evaluate` that the `aria-label`s of the class figure's `li`s (like
   `feature: 3 runs`) start with exactly `feature`, `chore`, `bug` in that order (zeros included,
   e.g. `bug: 0 runs`), optionally followed by `patch` then `other`, and that their counts add up to
   the header's `N runs`.
4. Find a day card whose classes are only chores (its per-project class bars show only chore, or
   its `What I worked on` figure has `feature: 0 runs` and `bug: 0 runs`). **Verify** that figure's
   labels are exactly `feature`, `chore`, `bug`, and that the zero columns show `0` above the
   baseline (`[data-value-placement="above"]`). If no such day exists in the 30-day window, note it
   and check the three-label rule on the first card instead.
5. **Verify** the model figure's labels are a subsequence of `Haiku`, `Sonnet`, `Opus`, followed by
   any other model, or the figure says `No per-model usage published.`
6. **Verify** the phase figure's labels are a subsequence of `Plan`, `Build`, `Test`, `Review`,
   `Docs` in that order, never `CI`, never `Document`, and each column's value text matches
   `^(\$\d+\.\d{2}|<\$0\.01)$`; or the figure says `No per-phase usage published.`
7. **Verify** the tallest bar of any chart has its value inside: a
   `[data-value-placement="inside"]` element inside the bar whose computed `color` is
   `rgb(255, 255, 255)`; and any `[data-value-placement="above"]` element sits outside its bar
   (not a descendant of the coloured bar).
8. **Verify** with `browser_evaluate`, for each of the three figures of the card that has two or
   more columns, that the bars (each `li`'s coloured bar, the element with an inline `height` style
   inside the plot) all have the same `getBoundingClientRect().width` within 1px, and that the
   distances between the centres (`left + width / 2`) of adjacent bars are equal within 1px. Note
   which column counts (2, 3, 5) the page offered. When the phase figure has `Docs`, **Verify** with
   `browser_evaluate` that the `Docs` name row (`li > span.mt-2`) has the same
   `getBoundingClientRect().height` as the `Plan` name row (within 0.5px), i.e. it sits on one line.
9. When the model figure has a column, hover it (`browser_hover`) or focus it (`browser_press_key`
   Tab) and **Verify** the tooltip shows `Model`, `Input`, `Cache read`, `Cache write`, `Output`
   and `Cost` with a `$` value. When the phase figure has a column, hover it and then focus it with
   Tab and **Verify** in both cases the tooltip shows `Input`, `Cache read`, `Cache write`,
   `Output`, `Time` and `Runs`. Hover a class column and **Verify** the tooltip shows `Runs` and
   `Share` with a `%` value.
10. **Verify** each label under a bar is text with a colour dot (no `img` or `svg` in the label
    row) and is shown in full (with `browser_evaluate`, its `scrollWidth <= clientWidth`).
11. **Verify** the per-project table below still has its compact class bars (an `svg` with an
    `aria-label` starting `Issue classes:` inside the table).
12. **Verify** the server-rendered HTML (`browser_evaluate` `fetch("/watch").then((r) => r.text())`)
    contains `What I worked on`, `Tokens by model` and `What each step cost`.
13. Take a screenshot at 1920x1080.
14. Resize to 1024x768 and **Verify** the three cards still share one row (the same `top`) with no
    horizontal page overflow (`document.documentElement.scrollWidth <= window.innerWidth`).
    **Verify** with `browser_evaluate` that the `What each step cost` figure's `ul` and every one of
    its `li`s and name rows (`li > span.mt-2`) lie inside the figure's content box (the figure's
    `getBoundingClientRect()` inset by its border and padding: each `left >=` the content left and
    each `right <=` the content right, 0.5px tolerance), and that no two name rows overlap (each
    one's `right <=` the next one's `left`). **Verify** the same bar width and centre-distance check
    as in step 8 for every figure with two or more columns. Take a screenshot at 1024x768.
15. Resize to 375x667 and **Verify** the three cards are stacked (each figure's `top` is at or
    below the previous figure's `bottom`) with no horizontal page overflow
    (`document.documentElement.scrollWidth <= window.innerWidth`). **Verify** the same
    `What each step cost` containment and no-overlap check as in step 14, and the same bar width and
    centre-distance check as in step 8 for every figure with two or more columns. When the phase
    figure has `Docs`, **Verify** the same one-line `Docs` name row check as in step 8.
16. Take a screenshot at 375x667. The colour scheme follows the OS; note which one the screenshots
    show, no toggle is needed.

## Success Criteria

- Every day card with runs shows a `What I worked on`, a `Tokens by model` and a
  `What each step cost` chart card under its header, each with its subtitle, in one row from
  1024px and stacked without overflow on mobile.
- Chart card titles have no marker before them and align with their subtitles.
- Classes are feature, chore, bug always (zeros included, a zero shown as `0` above the baseline),
  then patch, other when present; models Haiku, Sonnet, Opus, other; and phases Plan, Build, Test,
  Review, Docs (never CI, never Document); absent models, phases and optional classes are omitted.
- The `Docs` phase label sits on one line, like `Plan`, at 1920 and at 375 wide.
- Phase values are dollar amounts with two decimals (or `<$0.01`).
- The tallest bar shows its value in white inside it; a short bar shows it above.
- Labels under the bars are text with a colour dot, shown in full.
- The bars in each chart have equal widths and equally spaced centres (within 1px) at 1920, 1024
  and 375 wide, whatever the names under them.
- Model tooltips show the token split and the cost; phase tooltips show the token split, the time
  and the runs, on hover and on keyboard focus; class tooltips show the runs and the share.
- The phase chart's five columns and their names stay inside their card's content box, without
  overlapping, at 1024px and at 375px.
- The per-project table keeps its compact class bars.
- All three charts are in the server HTML.
- 3 screenshots are taken.
