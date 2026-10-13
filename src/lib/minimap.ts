// The post page's minimap: its scale and the frame maths. Pure (no window, no
// clock), so the client leaf measures and this decides where the frame goes.

/** The miniature's CSS zoom: a quarter of the post's column. */
export const MINIMAP_SCALE = 0.25;

export interface MinimapInput {
  /** window.scrollY */
  scrollY: number;
  /** window.innerHeight */
  viewportHeight: number;
  /** Document y of the top of the post content (the h1). */
  contentTop: number;
  /** Height of the post content, from the h1 to the end of the column. */
  contentHeight: number;
  /** Miniature height over contentHeight, measured. */
  scale: number;
  /** The panel's rendered height (at most 60vh); 0 when it is not displayed. */
  panelHeight: number;
}

export interface MinimapFrame {
  /** Frame top inside the panel, px. */
  top: number;
  /** Frame height, px. */
  height: number;
  /** How far the miniature is shifted up inside the panel, px (>= 0). */
  offset: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Where the frame over the visible part of the post sits in the panel, or null
 * when there is nothing to draw. A miniature taller than the panel slides
 * proportionally to the reading progress (as in VS Code): its top shows at the
 * top of the post, its bottom on the last viewport, so the frame stays inside.
 */
export function minimapFrame(input: MinimapInput): MinimapFrame | null {
  const { scrollY, viewportHeight, contentTop, contentHeight, scale, panelHeight } = input;
  if (contentHeight <= 0 || scale <= 0 || panelHeight <= 0) return null;

  const scrolled = clamp(scrollY - contentTop, 0, contentHeight);
  const visibleEnd = clamp(scrollY + viewportHeight - contentTop, 0, contentHeight);
  const frameTopInMini = scrolled * scale;
  const height = Math.min((visibleEnd - scrolled) * scale, panelHeight);

  const miniHeight = contentHeight * scale;
  let offset = 0;
  if (miniHeight > panelHeight) {
    const progress =
      contentHeight > viewportHeight
        ? clamp((scrollY - contentTop) / (contentHeight - viewportHeight), 0, 1)
        : 0;
    offset = progress * (miniHeight - panelHeight);
  }

  const top = clamp(frameTopInMini - offset, 0, Math.max(0, panelHeight - height));
  return { top, height, offset };
}
