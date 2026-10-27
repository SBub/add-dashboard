import { formatDay } from "@/lib/format-date";
import { type PostMeta, postAudienceLabel, postKindLabel } from "@/lib/posts";

// A post's date, audience tag and, when its meta sets a kind, the kind's
// badge, shared by the /writing list and the post page. The badge is a light
// tint of the site's one accent (fuchsia, src/lib/accent.ts) so it stands
// apart from the neutral audience tag; data-post-kind is the hook a filter can
// select on. The date is the post's own meta.date through the pure formatDay;
// no clock.
export function PostMetaLine({ meta }: { meta: PostMeta }) {
  return (
    <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
      <time dateTime={meta.date}>{formatDay(meta.date)}</time>
      <span className="rounded-full border border-neutral-200 px-2 py-0.5 text-xs text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
        {postAudienceLabel(meta.audience)}
      </span>
      {meta.kind ? (
        <span
          data-post-kind={meta.kind}
          className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-2 py-0.5 text-xs font-medium text-fuchsia-700 dark:border-fuchsia-900 dark:bg-fuchsia-950/60 dark:text-fuchsia-300"
        >
          {postKindLabel(meta.kind)}
        </span>
      ) : null}
    </p>
  );
}
