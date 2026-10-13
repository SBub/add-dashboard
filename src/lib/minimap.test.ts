import { describe, expect, it } from "vitest";
import {
  MINIMAP_MAX_SCALE,
  type MinimapBlock,
  type MinimapShape,
  groupLineRects,
  minimapContentHeight,
  minimapFrame,
  minimapLayout,
  minimapScale,
} from "./minimap";

const rect = (top: number, height: number, left = 0, width = 600) => ({ top, left, width, height });

// A 4000px post (from the h1's top to the last block's bottom) in a 600px
// column: a title, a paragraph of three lines, an image with its caption, a
// code block and a last heading.
const blocks: MinimapBlock[] = [
  { kind: "heading", rect: rect(0, 32), parts: [rect(4, 24, 0, 300)] },
  {
    kind: "text",
    rect: rect(100, 96),
    parts: [rect(104, 24), rect(136, 24), rect(168, 24, 0, 200)],
  },
  { kind: "image", rect: rect(300, 400), parts: [rect(300, 400)] },
  { kind: "block", rect: rect(800, 200), parts: [] },
  { kind: "heading", rect: rect(3968, 32), parts: [rect(3972, 24, 0, 240)] },
];

function expectShape(actual: MinimapShape | undefined, expected: MinimapShape) {
  expect(actual?.kind).toBe(expected.kind);
  for (const key of ["top", "left", "width", "height"] as const) {
    expect(actual?.[key]).toBeCloseTo(expected[key]);
  }
}

describe("groupLineRects", () => {
  it("merges the fragments of one line and keeps lines apart", () => {
    const lines = groupLineRects([
      rect(40, 24, 0, 100),
      rect(8, 24, 0, 120),
      rect(10, 20, 130, 50), // inline code on the first line
      rect(40, 24, 110, 90),
      rect(70, 0, 0, 10), // empty
    ]);
    expect(lines).toEqual([rect(8, 24, 0, 180), rect(40, 24, 0, 200)]);
  });
});

describe("minimapContentHeight", () => {
  it("ends at the lowest block's bottom", () => {
    expect(minimapContentHeight(blocks)).toBe(4000);
  });

  it("is 0 for no blocks", () => {
    expect(minimapContentHeight([])).toBe(0);
  });
});

describe("minimapScale", () => {
  it("fits the whole article into the available height", () => {
    expect(minimapScale(4000, 600)).toBe(0.15);
  });

  it("never draws a short article larger than the cap", () => {
    expect(minimapScale(1000, 600)).toBe(MINIMAP_MAX_SCALE);
  });

  it("is 0 with nothing to draw", () => {
    expect(minimapScale(0, 600)).toBe(0);
    expect(minimapScale(4000, 0)).toBe(0);
  });
});

describe("minimapLayout", () => {
  const layout = minimapLayout({ blocks, columnWidth: 600, stripWidth: 100, availableHeight: 600 });

  it("fits the whole article: the strip is the article times the scale", () => {
    expect(layout.scale).toBe(0.15);
    expect(layout.height).toBe(600);
    for (const s of layout.shapes) {
      expect(s.top).toBeGreaterThanOrEqual(0);
      expect(s.top + s.height).toBeLessThanOrEqual(600 + 1e-9);
      expect(s.left + s.width).toBeLessThanOrEqual(100 + 1e-9);
    }
  });

  it("draws one bar per line, one rectangle per image and a block whole", () => {
    expect(layout.shapes.map((s) => s.kind)).toEqual([
      "heading",
      "text",
      "text",
      "text",
      "image",
      "block",
      "heading",
    ]);
  });

  it("maps rects into the strip", () => {
    const [title, line1, , line3, image, code, last] = layout.shapes;
    // A heading bar is its line's full height, centred on the line.
    expectShape(title, { kind: "heading", top: 0.6, left: 0, width: 50, height: 3.6 });
    // A text bar is thinner, centred on its line; a short last line stays short.
    expect(line1?.top).toBeCloseTo(116 * 0.15 - 1.08);
    expect(line1?.height).toBeCloseTo(24 * 0.15 * 0.6);
    expect(line3?.width).toBeCloseTo(200 / 6);
    expectShape(image, { kind: "image", top: 45, left: 0, width: 100, height: 60 });
    expectShape(code, { kind: "block", top: 120, left: 0, width: 100, height: 30 });
    // The last heading's bar ends where its line ends, inside the strip.
    expect((last?.top ?? 0) + (last?.height ?? 0)).toBeCloseTo(3996 * 0.15);
  });

  it("shrinks the strip to an article shorter than the strip", () => {
    const short = minimapLayout({
      blocks: [{ kind: "text", rect: rect(0, 400), parts: [rect(0, 24)] }],
      columnWidth: 600,
      stripWidth: 100,
      availableHeight: 600,
    });
    expect(short.scale).toBe(MINIMAP_MAX_SCALE);
    expect(short.height).toBe(100);
  });

  it("draws nothing for a zero-height article", () => {
    expect(
      minimapLayout({
        blocks: [{ kind: "text", rect: rect(0, 0), parts: [] }],
        columnWidth: 600,
        stripWidth: 100,
        availableHeight: 600,
      }),
    ).toEqual({ scale: 0, height: 0, shapes: [] });
  });

  it("keeps a far-zoomed line at least 1px tall", () => {
    const long = minimapLayout({
      blocks: [{ kind: "text", rect: rect(0, 100_000), parts: [rect(0, 24)] }],
      columnWidth: 600,
      stripWidth: 100,
      availableHeight: 600,
    });
    expect(long.shapes[0]?.height).toBe(1);
  });
});

describe("minimapFrame", () => {
  // The 4000px post above, its h1 100px down the document, read through a
  // 1000px viewport, drawn at 0.15 (the strip is 600px).
  const base = { viewportHeight: 1000, contentTop: 100, contentHeight: 4000, scale: 0.15 };

  it("sits at the strip's top at scroll 0", () => {
    const frame = minimapFrame({ ...base, scrollY: 0 });
    expect(frame?.top).toBe(0);
    expect(frame?.height).toBeCloseTo(900 * 0.15);
  });

  it("frames the visible part in the middle", () => {
    const frame = minimapFrame({ ...base, scrollY: 1600 });
    expect(frame?.top).toBeCloseTo(1500 * 0.15);
    expect(frame?.height).toBeCloseTo(1000 * 0.15);
  });

  it("ends at the last block's bottom at the end of the page", () => {
    // The page runs on below the article (padding, footer).
    const frame = minimapFrame({ ...base, scrollY: 3300 });
    expect((frame?.top ?? 0) + (frame?.height ?? 0)).toBeCloseTo(600);
    expect(frame?.top).toBeCloseTo(3200 * 0.15);
  });

  it("frames the whole strip for an article shorter than the viewport", () => {
    expect(minimapFrame({ ...base, contentHeight: 600, scale: 0.25, scrollY: 0 })).toEqual({
      top: 0,
      height: 150,
    });
  });

  it("returns null for a zero-height article", () => {
    expect(minimapFrame({ ...base, contentHeight: 0, scrollY: 0 })).toBeNull();
    expect(minimapFrame({ ...base, scale: 0, scrollY: 0 })).toBeNull();
  });
});
