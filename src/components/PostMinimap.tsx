import type { MDXComponents, MDXContent } from "mdx/types";
import { PostMetaLine } from "@/components/PostMetaLine";
import { PostMinimapViewport } from "@/components/PostMinimapViewport";
import { MINIMAP_SCALE } from "@/lib/minimap";
import type { PostMeta } from "@/lib/posts";

const TEXT_LINK = "underline underline-offset-2";

// Merged over src/mdx-components.tsx, so every other element keeps the post's
// typography. Each override drops semantics or behaviour from the copy.
const MINIMAP_COMPONENTS: MDXComponents = {
  // A span, not a link: no href, no prefetch, no focus stop.
  a: ({ children }) => <span className={TEXT_LINK}>{children}</span>,
  // Divs, not headings: the page keeps one h1 and the outline stays the post's.
  h1: ({ children }) => <div className="text-2xl font-semibold tracking-tight">{children}</div>,
  h2: ({ children }) => <div className="mt-8 text-xl font-semibold tracking-tight">{children}</div>,
  h3: ({ children }) => <div className="mt-6 text-lg font-semibold">{children}</div>,
  // The same src (the browser cache serves it), no alt (the copy is hidden
  // from assistive tech) and lazy, so the copy loads nothing below xl, where
  // the panel is not displayed.
  img: ({ alt: _alt, title, ...props }) => (
    <span className="my-12 block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        {...props}
        alt=""
        loading="lazy"
        className="w-full rounded-md border border-neutral-200 dark:border-neutral-800"
      />
      {title ? (
        <span className="mt-3 block text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          {title}
        </span>
      ) : null}
    </span>
  ),
};

// A post page's minimap, from xl up: a quarter-size copy of the post in a
// sticky panel beside the column, with the visible part framed by the client
// leaf. A reading-position aid only: outside the article, hidden from
// assistive tech and inert, with no links, headings or focusable elements.
// zoom, unlike a transform, shrinks the layout box too, so the panel's height
// is the miniature's real height straight from the server markup.
export function PostMinimap({
  meta,
  Content,
  columnId,
}: {
  meta: PostMeta;
  Content: MDXContent;
  columnId: string;
}) {
  return (
    <div
      aria-hidden="true"
      inert
      className="pointer-events-none sticky top-[calc(var(--header-height)+1.5rem)] hidden shrink-0 self-start rounded-md border border-neutral-200 p-2 select-none xl:block dark:border-neutral-800"
    >
      <PostMinimapViewport columnId={columnId}>
        <div className="w-[62ch]" style={{ zoom: MINIMAP_SCALE }}>
          <div className="text-2xl font-semibold tracking-tight">{meta.title}</div>
          <PostMetaLine meta={meta} />
          <Content components={MINIMAP_COMPONENTS} />
        </div>
      </PostMinimapViewport>
    </div>
  );
}
