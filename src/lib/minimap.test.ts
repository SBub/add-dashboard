import { describe, expect, it } from "vitest";
import { type MinimapInput, minimapFrame } from "./minimap";

// A 4000px post starting 100px down the document, read through a 1000px
// viewport, drawn at a quarter: the miniature is 1000px tall.
const base: MinimapInput = {
  scrollY: 0,
  viewportHeight: 1000,
  contentTop: 100,
  contentHeight: 4000,
  scale: 0.25,
  panelHeight: 1200,
};

describe("minimapFrame, miniature inside the panel", () => {
  it("frames the visible part at the top of the post", () => {
    expect(minimapFrame(base)).toEqual({ top: 0, height: 225, offset: 0 });
  });

  it("frames the visible part in the middle", () => {
    expect(minimapFrame({ ...base, scrollY: 1600 })).toEqual({ top: 375, height: 250, offset: 0 });
  });

  it("ends the frame at the miniature's bottom on the last viewport", () => {
    const frame = minimapFrame({ ...base, scrollY: 3100 });
    expect(frame?.offset).toBe(0);
    expect((frame?.top ?? 0) + (frame?.height ?? 0)).toBe(1000);
  });
});

describe("minimapFrame, content shorter than the viewport", () => {
  for (const scrollY of [0, 100]) {
    it(`frames the whole miniature at scrollY ${scrollY}`, () => {
      expect(minimapFrame({ ...base, contentHeight: 600, scrollY })).toEqual({
        top: 0,
        height: 150,
        offset: 0,
      });
    });
  }
});

describe("minimapFrame, miniature taller than the panel", () => {
  const tall = { ...base, panelHeight: 500 };

  it("shows the miniature's top at the top of the post", () => {
    const frame = minimapFrame(tall);
    expect(frame?.offset).toBe(0);
    expect(frame?.top).toBe(0);
  });

  it("shows the miniature's bottom on the last viewport", () => {
    const frame = minimapFrame({ ...tall, scrollY: 3100 });
    expect(frame?.offset).toBe(500);
    expect((frame?.top ?? 0) + (frame?.height ?? 0)).toBe(500);
  });

  it("slides part of the way in the middle", () => {
    const frame = minimapFrame({ ...tall, scrollY: 1600 });
    expect(frame?.offset).toBeGreaterThan(0);
    expect(frame?.offset).toBeLessThan(500);
    expect(frame?.top).toBeGreaterThanOrEqual(0);
    expect((frame?.top ?? 0) + (frame?.height ?? 0)).toBeLessThanOrEqual(500);
  });

  it("keeps the frame inside the panel at every scroll position", () => {
    for (let scrollY = 0; scrollY <= 3100; scrollY += 50) {
      const frame = minimapFrame({ ...tall, scrollY });
      expect(frame).not.toBeNull();
      expect(frame?.top).toBeGreaterThanOrEqual(0);
      expect((frame?.top ?? 0) + (frame?.height ?? 0)).toBeLessThanOrEqual(500 + 1e-9);
    }
  });
});

describe("minimapFrame, nothing to draw", () => {
  it("returns null for empty content", () => {
    expect(minimapFrame({ ...base, contentHeight: 0 })).toBeNull();
  });

  it("returns null for a hidden panel", () => {
    expect(minimapFrame({ ...base, panelHeight: 0 })).toBeNull();
  });
});
