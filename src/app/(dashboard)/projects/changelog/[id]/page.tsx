import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChangelogStats } from "@/components/ChangelogStats";
import { getChangelog, getChangelogEntry } from "@/lib/changelog";
import { formatDay } from "@/lib/format-date";

interface ChangelogEntryPageProps {
  params: Promise<{ id: string }>;
}

const TEXT_LINK = "underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100";

// One static page per entry. An id outside this list is resolved on request
// and, being no entry, hits notFound(). (dynamicParams cannot be exported
// under cacheComponents.)
export async function generateStaticParams() {
  const entries = await getChangelog();
  // Under cacheComponents an empty array errors the build. "_" fails
  // isChangelogId, so getChangelogEntry returns null and the page 404s.
  if (entries.length === 0) return [{ id: "_" }];
  return entries.map(({ id }) => ({ id }));
}

export async function generateMetadata({ params }: ChangelogEntryPageProps): Promise<Metadata> {
  const entry = await getChangelogEntry((await params).id);
  if (!entry) return {};
  return { title: `Changelog: ${entry.meta.title} (${formatDay(entry.meta.date)})` };
}

export default async function ChangelogEntryPage({ params }: ChangelogEntryPageProps) {
  const entry = await getChangelogEntry((await params).id);
  if (!entry) notFound();
  const { meta, Content } = entry;
  return (
    <article className="max-w-[70ch] min-w-0 break-words">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        <time dateTime={meta.date}>{formatDay(meta.date)}</time>
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{meta.title}</h1>
      <ChangelogStats pr={meta.pr} stats={meta.stats} className="mt-3" />
      <Content />
      <p className="mt-10 border-t border-neutral-200 pt-6 text-sm dark:border-neutral-800">
        <Link href="/projects/changelog" className={TEXT_LINK}>
          All changelog entries
        </Link>
      </p>
    </article>
  );
}
