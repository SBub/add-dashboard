import { PostMinimapViewport } from "@/components/PostMinimapViewport";

// A post page's minimap, from xl up: a narrow sticky strip beside the column
// with a map of the whole post's shape (headings, lines of text, images,
// blocks) and a frame over the part in the viewport, drawn by the client leaf
// from measurements of the real article. No copy of the post's text: the
// content ships once. A reading-position aid only: outside the article,
// hidden from assistive tech and inert, with no text, links or focus stops.
export function PostMinimap({ columnId }: { columnId: string }) {
  return (
    <div
      aria-hidden="true"
      inert
      data-minimap=""
      className="pointer-events-none sticky top-[calc(var(--header-height)+1.5rem)] hidden w-[120px] shrink-0 self-start select-none xl:block"
    >
      <PostMinimapViewport columnId={columnId} />
    </div>
  );
}
