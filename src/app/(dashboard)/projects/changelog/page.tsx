import type { Metadata } from "next";
import Link from "next/link";
import { ChangelogStats } from "@/components/ChangelogStats";
import { changelogCountsLabel, getChangelog } from "@/lib/changelog";
import { formatDay } from "@/lib/format-date";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Every push to production of the ADW dashboard, with the pull requests it shipped.",
};

// Static: the entries are modules in the repository (src/content/changelog/),
// read through getChangelog at build time; no request-time reads, no clock.
// Inside (dashboard), beside the sidebar, like the daily log.
export default async function ChangelogPage() {
  const entries = await getChangelog();
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Changelog</h1>
      <p className="mt-2 max-w-[70ch] text-base text-neutral-700 dark:text-neutral-300">
        Every push to production, with the pull requests it shipped.
      </p>
      <ol className="mt-6 max-w-[70ch] space-y-6">
        {entries.map(({ id, meta }) => (
          <li key={id} className="min-w-0">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              <time dateTime={meta.date}>{formatDay(meta.date)}</time>
            </p>
            <Link
              href={`/projects/changelog/${id}`}
              className="text-base font-semibold break-words hover:underline hover:underline-offset-2"
            >
              {meta.title}
            </Link>
            <ChangelogStats pr={meta.pr} stats={meta.stats} className="mt-1" />
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {changelogCountsLabel(meta)}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
