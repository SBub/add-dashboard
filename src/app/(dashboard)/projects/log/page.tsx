import { HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { DailySummaryList } from "@/components/DailySummaryList";
import { QueryBoundary } from "@/components/QueryBoundary";
import { SectionBoundary } from "@/components/SectionBoundary";
import { TodaySummary } from "@/components/TodaySummary";
import { getSummaryPast, getSummaryToday } from "@/data";
import { prefetch } from "@/data/query-client";
import { queryKeys } from "@/data/query-keys";
import { SUMMARY_DEFAULT_DAYS, utcDay } from "@/lib/daily-summary";
import { summaryPastTag, summaryTodayTag } from "@/lib/history-tags";

export const metadata: Metadata = {
  title: "Daily log",
  description: "What my AI developer workflow shipped each day, and what it cost.",
};

/**
 * The past days: every visible project over the SUMMARY_DEFAULT_DAYS days
 * strictly before `today`, read inside a "use cache" scope tagged
 * `summaryPastTag()`. `today` is an argument, so it is part of the cache key:
 * every request in one UTC day reads one entry, and the first request after
 * midnight builds a new one that includes yesterday. No cron and no tag drop
 * move it; a completion never drops this tag (past days are immutable).
 *
 * Called only from PastDays, below SummaryContent's connection() call, so it
 * is a hole resolved from the live cache handler on every request; prerendered
 * into the shell it would be read from the shell's Resume Data Cache, frozen at
 * build time (app_docs/history-revalidation.md, "What is prerendered and what is not"). `stale` stays at
 * 300 seconds because the router cache's staleTimes.dynamic must stay at or
 * under it. `revalidate` is a day: it bounds tokens and cost written after
 * midnight for a run that finished just before it. `expire` is two days.
 */
async function getPastDays(today: string) {
  "use cache";
  cacheTag(summaryPastTag());
  cacheLife({ stale: 300, revalidate: 86400, expire: 172800 });

  return getSummaryPast(today, SUMMARY_DEFAULT_DAYS);
}

/**
 * Today's card, prefetched into a dehydrated React Query cache inside a
 * "use cache" scope tagged `summaryTodayTag()`, which a completion drops (the
 * action and the webhook, through historyTags). The lifetime is short: a run
 * that finishes failed, and metrics written after a completion,
 * reach the view without any tag drop, and the 60 second `revalidate` bounds
 * how long they wait for a fresh visitor. `expire` stays at 5 minutes, not
 * under, so the scope is still a cached hole. Same request-time rule as
 * getPastDays: called only below connection().
 */
async function getTodayState(today: string) {
  "use cache";
  cacheTag(summaryTodayTag());
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });
  return prefetch(queryKeys.summaryToday(today), () => getSummaryToday(today));
}

// The today island: the server prefetch hydrated into the dashboard layout's
// Providers client, so the first paint is server-rendered and Refresh
// refetches in the browser. The Realtime listener never touches its key
// (app_docs/summary.md).
async function TodayIsland({ today }: { today: string }) {
  const { state } = await getTodayState(today);

  return (
    <HydrationBoundary state={state}>
      <QueryBoundary
        fallback={
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading today...</p>
        }
        detail="Today's figures did not load."
      >
        <TodaySummary today={today} />
      </QueryBoundary>
    </HydrationBoundary>
  );
}

// The past days island, server-rendered from its long-lived scope.
async function PastDays({ today }: { today: string }) {
  const report = await getPastDays(today);
  return <DailySummaryList report={report} />;
}

/**
 * Today's UTC day, read at request time. connection() comes first: it stops
 * the prerender here, so the clock read after it never runs in a prerender
 * pass (where it would fail the build) and never in client render. This is
 * the second and last argument-less clock read in the codebase (the other is
 * getActiveRuns's fetched_at; app_docs/clock-and-prerender.md). A plain function,
 * not a component body, so render stays pure.
 */
async function requestToday(): Promise<string> {
  await connection();
  return utcDay(Date.now());
}

// The request-time island. The page reads no searchParams (there are no
// filters, issue #97), so the connection() in requestToday is the one
// request-time marker: it makes this island's SectionBoundary the hole. It is
// required; without it both scopes would be prerendered into the shell. One
// read of the day feeds both islands, so the today card and the past days can
// never disagree on it.
async function SummaryContent() {
  const today = await requestToday();

  return (
    <div className="mt-6 space-y-4">
      <SectionBoundary
        fallback={
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading today...</p>
        }
        detail="Today's figures did not load."
      >
        <TodayIsland today={today} />
      </SectionBoundary>
      <SectionBoundary
        fallback={
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading past days...</p>
        }
        detail="The past days did not load."
      >
        <PastDays today={today} />
      </SectionBoundary>
    </div>
  );
}

// The daily log, beside the sidebar the (dashboard) layout renders, which
// also gives it width and padding. Not async: the heading and the intro are
// the static shell, the today card and the past days are the hole.
export default function SummaryPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Daily log</h1>
      <p className="mt-2 max-w-[70ch] text-base text-neutral-700 dark:text-neutral-300">
        What my AI developer workflow shipped each day, and what it cost.
      </p>
      <SectionBoundary
        fallback={
          <p className="mt-6 text-sm text-neutral-500 dark:text-neutral-400">Loading summary...</p>
        }
        detail="The summary did not load."
      >
        <SummaryContent />
      </SectionBoundary>
    </div>
  );
}
