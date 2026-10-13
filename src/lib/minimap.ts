// The post page's minimap: a map of the post's shape (headings, lines of text,
// images, blocks) in a narrow strip, with a frame over the part in the
// viewport. Pure (no window, no DOM, no clock): the client leaf measures the
// real article and these functions decide where every shape and the frame go.

/** The strip's largest share of the viewport's height. */
export const MINIMAP_MAX_VIEWPORT_SHARE = 0.7;

/** The largest vertical scale: a short post is drawn no bigger than this. */
export const MINIMAP_MAX_SCALE = 0.25;

/** A box in px. In a measurement, relative to the content origin (the h1's
 * top, the column's left edge); in a shape, relative to the strip's inner box. */
export interface MinimapRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export type MinimapShapeKind = "heading" | "text" | "image" | "block";

/** One top-level block of the article, as measured in the browser. */
export interface MinimapBlock {
  kind: MinimapShapeKind;
  /** The block's own box: its bottom is where the block ends. */
  rect: MinimapRect;
  /**
   * The parts drawn: for headings and text, one rect per rendered line; for
   * an image block, one rect per image (with its caption); empty for a block
   * drawn whole.
   */
  parts: MinimapRect[];
}

export interface MinimapShape extends MinimapRect {
  kind: MinimapShapeKind;
}

export interface MinimapLayout {
  /** Strip px per article px, vertically. */
  scale: number;
  /** The strip's inner height, px: the whole article. */
  height: number;
  shapes: MinimapShape[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Merges the client rects of a block's text (one or more per line, one per
 * inline fragment) into one rect per rendered line. Rects whose vertical
 * centre falls inside the current line join it; empty rects are dropped.
 */
export function groupLineRects(rects: readonly MinimapRect[]): MinimapRect[] {
  const sorted = rects
    .filter((r) => r.width > 0 && r.height > 0)
    .toSorted((a, b) => a.top - b.top || a.left - b.left);
  const lines: MinimapRect[] = [];
  for (const r of sorted) {
    const line = lines.at(-1);
    const centre = r.top + r.height / 2;
    if (line && centre >= line.top && centre <= line.top + line.height) {
      const left = Math.min(line.left, r.left);
      const right = Math.max(line.left + line.width, r.left + r.width);
      const top = Math.min(line.top, r.top);
      const bottom = Math.max(line.top + line.height, r.top + r.height);
      lines[lines.length - 1] = { top, left, width: right - left, height: bottom - top };
    } else {
      lines.push({ ...r });
    }
  }
  return lines;
}

/** The article's height: from the origin (the h1's top) to the lowest block's bottom. */
export function minimapContentHeight(blocks: readonly MinimapBlock[]): number {
  let bottom = 0;
  for (const { rect } of blocks) bottom = Math.max(bottom, rect.top + rect.height);
  return bottom;
}

/**
 * The vertical scale that fits the whole article into the available height,
 * never above MINIMAP_MAX_SCALE (a short post stays small and the strip
 * shrinks to it). 0 when there is nothing to draw.
 */
export function minimapScale(contentHeight: number, availableHeight: number): number {
  if (contentHeight <= 0 || availableHeight <= 0) return 0;
  return Math.min(availableHeight / contentHeight, MINIMAP_MAX_SCALE);
}

// How much of a line's height its bar takes: text reads as thin lines,
// headings as thicker bars.
const BAR_SHARE: Record<"heading" | "text", number> = { heading: 1, text: 0.6 };

/**
 * Maps the measured blocks into the strip. Vertically every y is multiplied
 * by the scale that fits the whole article; horizontally the column's width
 * maps onto the strip's width. A line keeps its vertical centre, and every
 * shape is at least 1px tall so a far-zoomed post still shows.
 */
export function minimapLayout(input: {
  blocks: readonly MinimapBlock[];
  columnWidth: number;
  stripWidth: number;
  availableHeight: number;
}): MinimapLayout {
  const { blocks, columnWidth, stripWidth, availableHeight } = input;
  const contentHeight = minimapContentHeight(blocks);
  const scale = minimapScale(contentHeight, availableHeight);
  if (scale === 0 || columnWidth <= 0 || stripWidth <= 0) {
    return { scale: 0, height: 0, shapes: [] };
  }
  const height = contentHeight * scale;
  const scaleX = stripWidth / columnWidth;

  const shapes: MinimapShape[] = [];
  const place = (kind: MinimapShapeKind, r: MinimapRect, share = 1) => {
    const left = clamp(r.left * scaleX, 0, stripWidth);
    const width = clamp(r.width * scaleX, 1, stripWidth - left);
    const h = Math.max(r.height * scale * share, 1);
    const centre = (r.top + r.height / 2) * scale;
    const top = clamp(centre - h / 2, 0, Math.max(0, height - h));
    shapes.push({ kind, top, left, width, height: h });
  };

  for (const block of blocks) {
    if (block.kind === "heading" || block.kind === "text") {
      for (const line of block.parts) place(block.kind, line, BAR_SHARE[block.kind]);
    } else if (block.kind === "image") {
      for (const image of block.parts) place("image", image);
    } else {
      place("block", block.rect);
    }
  }
  return { scale, height, shapes };
}

export interface MinimapFrameInput {
  /** window.scrollY */
  scrollY: number;
  /** window.innerHeight */
  viewportHeight: number;
  /** Document y of the content origin (the h1's top). */
  contentTop: number;
  /** From minimapContentHeight. */
  contentHeight: number;
  /** From minimapLayout. */
  scale: number;
}

export interface MinimapFrame {
  /** Frame top inside the strip's inner box, px. */
  top: number;
  /** Frame height, px. */
  height: number;
}

/**
 * The frame over the part of the article in the viewport, in strip px, or
 * null when there is nothing to draw. The whole article is in the strip, so
 * the frame only moves: its top is at the strip's top while the h1 is at or
 * below the viewport's top, its bottom at the last block's bottom once that
 * block is in view.
 */
export function minimapFrame(input: MinimapFrameInput): MinimapFrame | null {
  const { scrollY, viewportHeight, contentTop, contentHeight, scale } = input;
  if (contentHeight <= 0 || scale <= 0) return null;
  const start = clamp(scrollY - contentTop, 0, contentHeight);
  const end = clamp(scrollY + viewportHeight - contentTop, start, contentHeight);
  return { top: start * scale, height: (end - start) * scale };
}
