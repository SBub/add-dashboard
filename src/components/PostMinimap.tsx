import { PostMinimapViewport } from "@/components/PostMinimapViewport";

// A post page's minimap, from xl up: a narrow strip in the right gutter's
// sticky row (to the right of the table of contents) with a map of the whole
// post's shape (headings, lines of text, images, blocks) and a frame over the part in the viewport, drawn by the client leaf
// from measurements of the real article. No copy of the post's text: the
// content ships once. A reading-position aid only: outside the article,
// hidden from assistive tech and inert, with no text, links or focus stops.
export function PostMinimap({ columnId }: { columnId: string }) {
  return (
    <div
      aria-hidden="true"
      inert
      data-minimap=""
      className="pointer-events-none hidden w-[120px] shrink-0 select-none xl:block"
    >
      <PostMinimapViewport columnId={columnId} />
    </div>
  );
}
