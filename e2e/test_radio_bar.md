# E2E Test: Radio Bar

Checks the NTS Slow Focus bar, a footer fixed to the bottom of the viewport: it is on every route
with the NTS credit link, pinned to the bottom at every width and scroll position, shows no live
label and no red, has a rounded box, never covers the end of a page or the floating Work with me
button, is silent on load, plays and stops on click, keeps playing on the same `<audio>` element
across client-side navigation, and shows a polite error in place of the title when the stream
fails, cleared by a successful retry. The hosted database is read only; this journey never writes.
Use `browser_evaluate` for DOM reads and `browser_run_code_unsafe` for `page.route`,
`page.unroute` and `page.emulateMedia({ colorScheme })`.

## User Story

As a visitor reading the site
I want to start and stop a calm background stream from any page, with the stop button always in reach
So that I can listen to NTS Slow Focus while I browse, without it stopping each time I change page

## Test Steps

1. Use the pages `/`, `/projects/log`, `/writing` and `/writing/my-moat`, the viewports 1920x1080,
   1024x768, 390x844 and 320x568, and the colour schemes `light` and `dark`. For each, resize,
   emulate the scheme, navigate, and with `browser_evaluate` read
   `bar = document.querySelector('[role="region"][aria-label="NTS Slow Focus radio"]')`:
   - **Verify** the bar contains `NTS · SLOW FOCUS` and its link's `href` is
     `https://www.nts.live/infinite-mixtapes/slow-focus` with `target="_blank"`.
   - **Verify** at scroll 0, and again after `window.scrollTo(0, document.documentElement.scrollHeight)`,
     that the bar's computed `position` is `fixed`, `rect.bottom` equals `innerHeight` within 1,
     `rect.left` is 0 and `rect.width` equals `document.documentElement.clientWidth` within 1.
   - **Verify** `bar.textContent` does not match `/live/i`, and no element in the bar (the bar
     included) has a computed `background-color` with a dominant red (`rgb(r, g, b)` with
     `r > 150 && g < 100 && b < 100`).
   - **Verify** the box (`bar.querySelector('button').parentElement`) has a computed
     `border-radius` other than `0px`; at 1024x768 it equals the computed `border-radius` of the
     `a[href="/hire"]` link.
   - After scrolling to the bottom, **Verify**
     `document.querySelector('main').lastElementChild.getBoundingClientRect().bottom <= bar.getBoundingClientRect().top + 1`
     and `document.querySelector('body > header').getBoundingClientRect().top === 0`.
   - Below 640 wide: with `link = document.querySelector('a[href="/hire"]')`, **Verify**
     `link.getBoundingClientRect().bottom <= bar.getBoundingClientRect().top - 8`, and after
     scrolling to the bottom the last child of `main` ends at or above `link.getBoundingClientRect().top`.
2. Resize to 1024x768 and navigate to `/projects/log`. Scroll to the bottom. **Verify** the sidebar
   `aside`'s `getBoundingClientRect().bottom <= bar.getBoundingClientRect().top`. Scroll the
   sidebar's project list to its end and **Verify** its last link is inside the `aside` and its
   bottom is above the bar's top.
3. Resize to 1920x1080, emulate the light colour scheme and navigate to `/`. **Verify**
   `document.querySelector('audio').paused === true`, the element has no `src` attribute, and the
   network request list contains no request to `ntslive.net`. Take a screenshot (idle).
4. Click the button named `Play NTS Slow Focus`. **Verify** within 10 seconds that `audio.paused` is
   `false` and the button's accessible name is `Stop NTS Slow Focus` with `aria-pressed="true"`.
   Tag the element (`window.__radio = document.querySelector('audio')`). Take a screenshot
   (playing).
5. Click the header link to `/writing`, then reach `/projects/log` (the `Watch me build` header
   link, then the sidebar's `Daily log`), then click the brand link back to `/`. After each,
   **Verify** `document.querySelector('audio') === window.__radio`, `paused === false`, and
   `currentTime` read twice 2 seconds apart increases.
6. Click `Stop NTS Slow Focus`. **Verify** `paused === true`, the button's name is back to
   `Play NTS Slow Focus` and `aria-pressed="false"`.
7. Run `page.route('**/stream-mixtape-geo.ntslive.net/**', r => r.abort())` and click play.
   **Verify** within 10 seconds the bar is still in the DOM and visible, its live region reads
   `Can't reach NTS right now`, the link still points at the mixtape page, and the button's name is
   `Play NTS Slow Focus`. Take a screenshot (error).
8. Run `page.unroute('**/stream-mixtape-geo.ntslive.net/**')` and click play. **Verify** within 10
   seconds `paused === false` and `NTS · SLOW FOCUS` is back in place of the error. Click stop.
9. Emulate the dark colour scheme and take the idle, playing and error screenshots again (steps 3,
   4, 7 and 8).
10. Resize to 390x844 and repeat steps 3, 4, 6, 7 and 8, in light and in dark. In the idle,
    playing and error states **Verify** `document.documentElement.scrollWidth <= innerWidth` and the
    bar's height is under 40px plus the safe-area inset (one row).

## Success Criteria

- The bar is fixed to the bottom of the viewport, full width, on every tested route, width and
  scroll position, with the credit link to the Slow Focus page in a new tab.
- Its text never contains `live` and nothing in it is red; its box has rounded corners matching
  the Work with me button.
- The end of `main` clears the bar when scrolled to the bottom; below 640px the floating Work with
  me button sits at least 8px above it and the end of `main` clears the button.
- The sidebar ends above the bar at 1024x768, and its last project link is reachable above it.
- The header stays pinned at `top: 0` after scrolling.
- On load the audio is paused, has no `src`, and nothing was requested from `ntslive.net`.
- Play and stop work, and the button's accessible name and `aria-pressed` follow the state.
- Playback survives client-side navigation on the same `<audio>` element.
- No horizontal scroll at 390px; the bar stays one row.
- A failing stream shows `Can't reach NTS right now` in the bar with the link kept, and a successful
  retry clears it.
- 12 screenshots are taken (idle, playing and error, at 2 widths, in 2 colour schemes).
