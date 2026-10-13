"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { type MinimapFrame, minimapFrame } from "@/lib/minimap";

// The minimap's one client leaf: it reads the window's scroll to frame the
// part of the post in the viewport and to slide a miniature taller than the
// panel. The frame starts null, so the server markup and the first client
// render match (no frame, no offset) and nothing shifts on hydration. Visual
// only by design: no click, drag or keyboard behaviour, no focus stop.
export function PostMinimapViewport({
  columnId,
  children,
}: {
  columnId: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const miniRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState<MinimapFrame | null>(null);

  // Subscribes to the window (scroll, resize) and to the column's size
  // (images loading change it with no scroll event).
  useEffect(() => {
    const column = document.getElementById(columnId);
    const heading = column?.querySelector("h1");
    const panel = panelRef.current;
    const mini = miniRef.current;
    if (!column || !heading || !panel || !mini) return;

    let pending = 0;
    const measure = () => {
      pending = 0;
      const { scrollY, innerHeight } = window;
      const contentTop = heading.getBoundingClientRect().top + scrollY;
      const contentHeight = column.getBoundingClientRect().bottom + scrollY - contentTop;
      setFrame(
        minimapFrame({
          scrollY,
          viewportHeight: innerHeight,
          contentTop,
          contentHeight,
          scale: contentHeight > 0 ? mini.offsetHeight / contentHeight : 0,
          panelHeight: panel.clientHeight,
        }),
      );
    };
    const schedule = () => {
      if (pending === 0) pending = requestAnimationFrame(measure);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(column);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
      if (pending !== 0) cancelAnimationFrame(pending);
    };
  }, [columnId]);

  return (
    <div ref={panelRef} className="relative max-h-[60vh] overflow-hidden">
      <div
        ref={miniRef}
        style={{ transform: frame ? `translateY(${-frame.offset}px)` : undefined }}
      >
        {children}
      </div>
      {frame ? (
        <div
          className="pointer-events-none absolute inset-x-0 rounded-sm bg-neutral-900/10 ring-1 ring-neutral-400 dark:bg-neutral-100/10 dark:ring-neutral-500"
          style={{ top: frame.top, height: frame.height }}
        />
      ) : null}
    </div>
  );
}
