import { formatDay } from "@/lib/format-date";
import { type PostMeta, postAudienceLabel } from "@/lib/posts";

// A post's date and audience tag, shared by the /writing list and the post
// page. The date is the post's own meta.date through the pure formatDay; no
// clock.
export function PostMetaLine({ meta }: { meta: PostMeta }) {
  return (
    <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
      <time dateTime={meta.date}>{formatDay(meta.date)}</time>
      <span className="rounded-full border border-neutral-200 px-2 py-0.5 text-xs text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
        {postAudienceLabel(meta.audience)}
      </span>
    </p>
  );
}
