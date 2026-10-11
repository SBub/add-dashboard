import type { ReactNode } from "react";
import { type ChangelogStats as Stats, pullUrl } from "@/lib/changelog-backfill";
import { STATUS_COLORS } from "@/lib/status-colors";

// The production pull request's summary under a changelog title, like
// GitHub's: the pull request link, lines added and removed, then commits,
// files and comments. Numbers come from the entry's meta, written once when
// the entry was generated; nothing here calls GitHub. Two rows that wrap, so
// it fits 375px. Server only. The diff reuses the status map's green and red
// (running, failed) rather than adding hues outside it.

const ICON = "size-4 shrink-0 text-neutral-400 dark:text-neutral-500";
const ITEM = "inline-flex items-center gap-1.5";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={ICON}
    >
      {children}
    </svg>
  );
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

interface ChangelogStatsProps {
  pr: number;
  stats: Stats;
  className?: string;
}

export function ChangelogStats({ pr, stats, className = "" }: ChangelogStatsProps) {
  const { additions, deletions, commits, files, comments } = stats;
  return (
    <div
      data-testid="changelog-stats"
      className={`space-y-1 text-sm text-neutral-600 tabular-nums dark:text-neutral-400 ${className}`}
    >
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <a
          href={pullUrl(pr)}
          aria-label={`Production pull request #${pr}`}
          className={`${ITEM} underline-offset-2 hover:text-neutral-900 hover:underline dark:hover:text-neutral-100`}
        >
          <Icon>
            <circle cx="4" cy="3.5" r="1.75" />
            <circle cx="4" cy="12.5" r="1.75" />
            <circle cx="12" cy="12.5" r="1.75" />
            <path d="M4 5.25v5.5M12 10.75V6.5a2 2 0 0 0-2-2H7.5M9 3 7.5 4.5 9 6" />
          </Icon>
          <span>#{pr}</span>
        </a>
        <span
          className={ITEM}
          role="img"
          aria-label={`${plural(additions, "line", "lines")} added, ${deletions} removed`}
        >
          <Icon>
            <path d="M8 2.5v5M5.5 5h5M5.5 12.5h5" />
          </Icon>
          <span className={STATUS_COLORS.running.text}>+{additions}</span>
          <span className={STATUS_COLORS.failed.text}>&minus;{deletions}</span>
        </span>
      </p>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className={ITEM}>
          <Icon>
            <circle cx="8" cy="8" r="2.25" />
            <path d="M1.5 8h4.25M10.25 8h4.25" />
          </Icon>
          {plural(commits, "commit", "commits")}
        </span>
        <span className={ITEM}>
          <Icon>
            <path d="M9 1.75H4.5a1 1 0 0 0-1 1v10.5a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V5.25Z" />
            <path d="M9 1.75v3.5h3.5" />
          </Icon>
          {plural(files, "file", "files")}
        </span>
        <span className={ITEM}>
          <Icon>
            <path d="M2.5 3.5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v6.5a1 1 0 0 1-1 1H7l-3 2.5V11H3.5a1 1 0 0 1-1-1Z" />
          </Icon>
          {plural(comments, "comment", "comments")}
        </span>
      </p>
    </div>
  );
}
