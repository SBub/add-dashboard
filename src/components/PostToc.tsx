"use client";

import { useEffect, useRef, useState } from "react";

interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

// How far below the viewport's top a section's heading may sit and still
// count as the section being read: the sticky header plus some air, px.
const ACTIVE_OFFSET = 96;

// Room kept above and below the marked entry when the list scrolls to it, px.
const SCROLL_MARGIN = 48;

// A post page's table of contents, from xl up: one link per section and
// sub-section (each h2 and h3, whose id rehype-slug sets), in document order,
// with the one being read marked. Built from the real article after
// hydration, so the post's text ships once and a post without sections shows
// none. The links are plain anchors: they work without JavaScript and keep the
// browser's own scrolling and history. A long list scrolls inside itself, ending
// 1.5rem above the fixed radio bar, and follows the marked entry without ever
// scrolling the page.
export function PostToc({ columnId }: { columnId: string }) {
  const navRef = useRef<HTMLElement>(null);
  const [entries, setEntries] = useState<TocEntry[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const column = document.getElementById(columnId);
    if (!column) return;
    const headings = Array.from(column.querySelectorAll<HTMLHeadingElement>("h2[id], h3[id]"));

    let pending = requestAnimationFrame(() => {
      setEntries(
        headings.map((h) => ({
          id: h.id,
          text: h.textContent ?? "",
          level: h.tagName === "H3" ? 3 : 2,
        })),
      );
      update();
    });
    // The last heading, of either level, that has scrolled up past the offset.
    function update() {
      pending = 0;
      let current: string | null = null;
      for (const h of headings) {
        if (h.getBoundingClientRect().top > ACTIVE_OFFSET) break;
        current = h.id;
      }
      // At the end of the page the last sections can never scroll up to the
      // offset, so the last heading is the one being read.
      const { scrollHeight, clientHeight } = document.documentElement;
      const last = headings.at(-1);
      if (last && window.scrollY + clientHeight >= scrollHeight - 2) current = last.id;
      setActive(current);
    }
    const schedule = () => {
      if (pending === 0) pending = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (pending !== 0) cancelAnimationFrame(pending);
      pending = -1;
    };
  }, [columnId]);

  // Keeps the marked entry inside the list's own scroll box. Only the nav's
  // scrollTop moves (the nav is the links' offsetParent), never the page.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || active === null) return;
    const link = nav.querySelector<HTMLElement>(`a[href="#${CSS.escape(active)}"]`);
    if (!link) return;
    const top = link.offsetTop - SCROLL_MARGIN;
    const bottom = link.offsetTop + link.offsetHeight + SCROLL_MARGIN;
    if (top < nav.scrollTop) nav.scrollTop = top;
    else if (bottom > nav.scrollTop + nav.clientHeight) nav.scrollTop = bottom - nav.clientHeight;
  }, [active, entries]);

  if (entries.length < 2) return null;
  return (
    <nav
      ref={navRef}
      aria-label="On this page"
      className="relative max-h-[calc(100vh-var(--header-height)-var(--radio-bar-height)-3rem)] w-[232px] shrink-0 overflow-y-auto overscroll-contain text-sm"
    >
      <p className="font-semibold text-neutral-900 dark:text-neutral-100">On this page</p>
      <ul className="mt-3 space-y-1 border-l border-neutral-200 dark:border-neutral-800">
        {entries.map(({ id, text, level }) => {
          const current = id === active;
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={current ? "location" : undefined}
                className={`-ml-px block border-l py-0.5 ${
                  level === 3 ? "pl-6 text-xs leading-4" : "pl-3 leading-5"
                } ${
                  current
                    ? "border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100"
                    : level === 3
                      ? "border-transparent text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                      : "border-transparent text-neutral-700 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
                }`}
              >
                {text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
