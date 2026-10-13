"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MINIMAP_MAX_VIEWPORT_SHARE,
  type MinimapBlock,
  type MinimapFrame,
  type MinimapLayout,
  type MinimapRect,
  type MinimapShapeKind,
  groupLineRects,
  minimapContentHeight,
  minimapFrame,
  minimapLayout,
} from "@/lib/minimap";

// The strip's border (1px each side) and padding (p-2 each side), px.
const STRIP_CHROME = 18;

const SHAPE_CLASS: Record<MinimapShapeKind, string> = {
  heading: "rounded-[1px] bg-neutral-500 dark:bg-neutral-400",
  text: "rounded-[1px] bg-neutral-300 dark:bg-neutral-700",
  image: "rounded-[2px] bg-neutral-200 dark:bg-neutral-800",
  block:
    "rounded-[2px] bg-neutral-100 ring-1 ring-neutral-200 ring-inset dark:bg-neutral-900 dark:ring-neutral-800",
};

function relative(r: DOMRect, top: number, left: number): MinimapRect {
  return { top: r.top - top, left: r.left - left, width: r.width, height: r.height };
}

// One rect per rendered line of an element's text, from its text nodes'
// client rects (element boxes such as an li would span several lines).
function textLines(el: Element, top: number, left: number): MinimapRect[] {
  const rects: MinimapRect[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim()) continue;
    range.selectNodeContents(node);
    for (const r of range.getClientRects()) rects.push(relative(r, top, left));
  }
  return groupLineRects(rects);
}

// The article's top-level blocks from its h1 on (the breadcrumb above it is
// not the post), relative to the h1's top and the column's left edge.
function measureBlocks(column: HTMLElement, heading: HTMLElement): MinimapBlock[] {
  const top = heading.getBoundingClientRect().top;
  const left = column.getBoundingClientRect().left;
  const children = Array.from(column.children);
  const blocks: MinimapBlock[] = [];
  for (const el of children.slice(children.indexOf(heading))) {
    const box = el.getBoundingClientRect();
    if (box.height === 0) continue;
    const rect = relative(box, top, left);
    const images = Array.from(el.querySelectorAll("img"));
    if (images.length > 0) {
      // An image with its caption: the span the MDX img renders around both.
      const parts = images.map((img) => {
        const wrapper = img.parentElement?.tagName === "SPAN" ? img.parentElement : img;
        return relative(wrapper.getBoundingClientRect(), top, left);
      });
      blocks.push({ kind: "image", rect, parts });
    } else if (/^H[1-6]$/.test(el.tagName)) {
      blocks.push({ kind: "heading", rect, parts: textLines(el, top, left) });
    } else if (["PRE", "BLOCKQUOTE", "TABLE", "HR"].includes(el.tagName)) {
      blocks.push({ kind: "block", rect, parts: [] });
    } else {
      const parts = textLines(el, top, left);
      blocks.push(
        parts.length > 0 ? { kind: "text", rect, parts } : { kind: "block", rect, parts },
      );
    }
  }
  return blocks;
}

// The minimap's one client leaf. It measures the real article (each
// top-level block's box and, for text, each rendered line) and maps it into
// the strip through the pure functions in src/lib/minimap.ts: re-measured on
// resize and whenever the column's size changes (images loading, fonts), the
// frame moved on scroll. Layout and frame start null, so the server markup and
// the first client render match (an empty strip) and nothing shifts on
// hydration. Visual only: no click, drag or keyboard behaviour, no focus stop,
// no text nodes.
export function PostMinimapViewport({ columnId }: { columnId: string }) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<MinimapLayout | null>(null);
  const [frame, setFrame] = useState<MinimapFrame | null>(null);

  useEffect(() => {
    const column = document.getElementById(columnId);
    const heading = column?.querySelector("h1");
    const strip = stripRef.current;
    if (!column || !heading || !strip) return;

    let pending = 0;
    let relayout = true;
    let contentHeight = 0;
    let scale = 0;

    const update = () => {
      pending = 0;
      // Below xl the strip is not displayed: nothing to measure or draw.
      if (strip.getClientRects().length === 0) {
        relayout = true;
        contentHeight = 0;
        scale = 0;
        setLayout(null);
        setFrame(null);
        return;
      }
      if (relayout) {
        relayout = false;
        const blocks = measureBlocks(column, heading);
        const next = minimapLayout({
          blocks,
          columnWidth: column.getBoundingClientRect().width,
          stripWidth: strip.getBoundingClientRect().width - STRIP_CHROME,
          availableHeight: window.innerHeight * MINIMAP_MAX_VIEWPORT_SHARE - STRIP_CHROME,
        });
        contentHeight = minimapContentHeight(blocks);
        scale = next.scale;
        setLayout(next.scale > 0 ? next : null);
      }
      const { scrollY, innerHeight } = window;
      setFrame(
        minimapFrame({
          scrollY,
          viewportHeight: innerHeight,
          contentTop: heading.getBoundingClientRect().top + scrollY,
          contentHeight,
          scale,
        }),
      );
    };
    const schedule = () => {
      if (pending === 0) pending = requestAnimationFrame(update);
    };
    const remeasure = () => {
      relayout = true;
      schedule();
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", remeasure, { passive: true });
    const observer = new ResizeObserver(remeasure);
    observer.observe(column);
    void document.fonts.ready.then(remeasure);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", remeasure);
      observer.disconnect();
      if (pending !== 0) cancelAnimationFrame(pending);
      pending = -1;
    };
  }, [columnId]);

  // Shapes change only on a re-measure, not on every scroll frame.
  const shapes = useMemo(
    () =>
      layout?.shapes.map((s, i) => (
        <div
          key={i}
          data-minimap-shape={s.kind}
          className={`absolute ${SHAPE_CLASS[s.kind]}`}
          style={{ top: s.top, left: s.left, width: s.width, height: s.height }}
        />
      )),
    [layout],
  );

  return (
    <div
      ref={stripRef}
      className={
        layout ? "rounded-md border border-neutral-200 p-2 dark:border-neutral-800" : undefined
      }
    >
      {layout ? (
        <div className="relative" style={{ height: layout.height }}>
          {shapes}
          {frame ? (
            <div
              data-minimap-frame=""
              className="absolute -inset-x-1 rounded-sm bg-neutral-900/10 ring-1 ring-neutral-400 dark:bg-neutral-100/10 dark:ring-neutral-500"
              style={{ top: frame.top, height: frame.height }}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
