# E2E Test: Radio Bar

Checks the NTS Slow Focus bar above the root header: it is on every route with the NTS credit link,
silent on load, plays and stops on click, keeps playing on the same `<audio>` element across
client-side navigation, scrolls away while the header stays pinned, fits one row at 375px, and
shows a polite error in place of the title when the stream fails, cleared by a successful retry.
The hosted database is read only; this journey never writes. Use `browser_evaluate` for DOM reads
and `browser_run_code_unsafe` for `page.route`, `page.unroute` and
`page.emulateMedia({ colorScheme })`.

## User Story

As a visitor reading the site
I want to start and stop a calm background stream from any page
So that I can listen to NTS Slow Focus while I browse, without it stopping each time I change page

## Test Steps

1. Resize the browser to 1280x800, emulate the light colour scheme and navigate to `/`.
   **Verify** `document.querySelector('body > header').previousElementSibling` is the bar
   (`role="region"`, named `NTS Slow Focus radio`), it contains `LIVE NOW` and `NTS · SLOW FOCUS`,
   and its link's `href` is `https://www.nts.live/infinite-mixtapes/slow-focus` with
   `target="_blank"`.
2. **Verify** `document.querySelector('audio').paused === true`, the element has no `src`
   attribute, and the network request list contains no request to `ntslive.net`. Take a screenshot
   (idle).
3. Click the button named `Play NTS Slow Focus`. **Verify** within 10 seconds that `audio.paused` is
   `false` and the button's accessible name is `Stop NTS Slow Focus` with `aria-pressed="true"`.
   Tag the element (`window.__radio = document.querySelector('audio')`). Take a screenshot
   (playing).
4. Click the header link to `/writing`, then reach `/projects/log` (the `Watch me build` header
   link, then the sidebar's `Daily log`), then click the brand link back to `/`. After each,
   **Verify** `document.querySelector('audio') === window.__radio`, `paused === false`, and
   `currentTime` read twice 2 seconds apart increases.
5. Click `Stop NTS Slow Focus`. **Verify** `paused === true`, the button's name is back to
   `Play NTS Slow Focus` and `aria-pressed="false"`.
6. Navigate to `/projects/log` and scroll to the bottom. **Verify**
   `document.querySelector('body > header').getBoundingClientRect().top === 0` and the bar's
   `getBoundingClientRect().bottom <= 0`.
7. Run `page.route('**/stream-mixtape-geo.ntslive.net/**', r => r.abort())`, scroll to the top and
   click play. **Verify** within 10 seconds the bar is still in the DOM and visible, its live
   region reads `Can't reach NTS right now`, the link still points at the mixtape page, and the
   button's name is `Play NTS Slow Focus`. Take a screenshot (error).
8. Run `page.unroute('**/stream-mixtape-geo.ntslive.net/**')` and click play. **Verify** within 10
   seconds `paused === false` and `NTS · SLOW FOCUS` is back in place of the error. Click stop.
9. Emulate the dark colour scheme and take the idle, playing and error screenshots again (steps 2,
   3, 7 and 8).
10. Resize to 375x812 and repeat steps 1 to 3, 5, 7 and 8, in light and in dark. In the idle,
    playing and error states **Verify** `document.documentElement.scrollWidth <= innerWidth` and the
    bar's height is under 40px (one row).

## Success Criteria

- The bar is the element before `body > header` on every route, with the credit link to the Slow
  Focus page in a new tab.
- On load the audio is paused, has no `src`, and nothing was requested from `ntslive.net`.
- Play and stop work, and the button's accessible name and `aria-pressed` follow the state.
- Playback survives client-side navigation on the same `<audio>` element.
- After scrolling, the header is pinned at `top: 0` and the bar is out of view.
- No horizontal scroll at 375px; the bar stays one row.
- A failing stream shows `Can't reach NTS right now` in the bar with the link kept, and a successful
  retry clears it.
- 12 screenshots are taken (idle, playing and error, at 2 widths, in 2 colour schemes).
