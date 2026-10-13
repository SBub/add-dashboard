/**
 * The section tooltip's z-index class (the detail popover of
 * `SectionHeading`), the topmost layer of the page. Every other `z-<n>` in
 * `src/` stays below it, pinned by `layers.test.ts`. Written out in full so
 * Tailwind sees it.
 */
export const TOOLTIP_LAYER = "z-50";

/**
 * The sticky root header's z-index class. One step below `TOOLTIP_LAYER`, so a
 * section tooltip opened near the top of the page draws over the header, and
 * above every other `z-<n>` in `src/`, so content (the queue rail markers, the
 * chart value tooltip) scrolls under it. Pinned by `layers.test.ts`. Written
 * out in full so Tailwind sees it.
 */
export const HEADER_LAYER = "z-40";

/**
 * The z-index class of the phone-only floating buttons (Work with me, and the
 * owner's Login / Logout above it) below `sm`. Below `HEADER_LAYER`, so the
 * header and the section tooltip draw over them, and above every other `z-<n>`
 * in `src/`, so content scrolls under them. Pinned by `layers.test.ts`.
 * Written out in full so Tailwind sees it.
 */
export const FLOATING_LAYER = "z-30";
