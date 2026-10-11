// The changelog's entries: validation, order and the index's counts label,
// plus the two loaders the /projects/changelog routes read entries through.
// The functions above the loaders are pure (no clock, no fs, no request-time
// reads); an entry's date is a string from its meta, never compared with the
// clock.

import type { MDXContent } from "mdx/types";
import { CHANGELOG_ENTRIES, type ChangelogEntry } from "@/content/changelog";
import {
  CHANGELOG_KINDS,
  CHANGELOG_STAT_FIELDS,
  type ChangelogCounts,
  type ChangelogKind,
  type ChangelogStats,
  entryId,
} from "@/lib/changelog-backfill";

export interface ChangelogMeta {
  date: string;
  pr: number;
  title: string;
  kind: ChangelogKind;
  counts: ChangelogCounts;
  stats: ChangelogStats;
}

export interface ChangelogItem {
  id: string;
  meta: ChangelogMeta;
  Content: MDXContent;
}

/** `<YYYY-MM-DD>-pr<N>`: "2026-10-09-pr163". */
export function isChangelogId(id: string): boolean {
  return /^\d{4}-\d{2}-\d{2}-pr\d+$/.test(id);
}

function isKind(value: unknown): value is ChangelogKind {
  return typeof value === "string" && (CHANGELOG_KINDS as readonly string[]).includes(value);
}

// A real calendar date: "2026-02-30" parses (it rolls over) but does not
// round-trip. Date.parse reads the given string, not the clock.
function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const ms = Date.parse(value);
  return !Number.isNaN(ms) && new Date(ms).toISOString().slice(0, 10) === value;
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

/**
 * An entry's `meta` export, checked field by field, and its id checked
 * against the date and pull request. Throws an Error naming the entry and the
 * field, so a bad entry fails `yarn build`.
 */
export function parseChangelogMeta(id: string, raw: unknown): ChangelogMeta {
  const fail = (field: string, rule: string): never => {
    throw new Error(`Changelog entry "${id}": ${field} ${rule}`);
  };
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return fail("meta", "must be an object (export const meta = {...})");
  }
  const { date, pr, title, kind, counts, stats } = raw as Record<string, unknown>;
  if (!isCalendarDate(date)) return fail("date", "must be a real date as YYYY-MM-DD");
  if (typeof pr !== "number" || !Number.isInteger(pr) || pr <= 0) {
    return fail("pr", "must be a positive integer");
  }
  if (typeof title !== "string" || title.trim() === "") {
    return fail("title", "must be a non-empty string");
  }
  if (!isKind(kind)) return fail("kind", `must be one of ${CHANGELOG_KINDS.join(", ")}`);
  if (typeof counts !== "object" || counts === null || Array.isArray(counts)) {
    return fail("counts", "must be an object { features, fixes, chores }");
  }
  const { features, fixes, chores } = counts as Record<string, unknown>;
  if (!isCount(features) || !isCount(fixes) || !isCount(chores)) {
    return fail("counts", "must hold three non-negative integers");
  }
  if (typeof stats !== "object" || stats === null || Array.isArray(stats)) {
    return fail("stats", `must be an object { ${CHANGELOG_STAT_FIELDS.join(", ")} }`);
  }
  const statsRecord = stats as Record<string, unknown>;
  for (const field of CHANGELOG_STAT_FIELDS) {
    if (!isCount(statsRecord[field]))
      return fail("stats", `${field} must be a non-negative integer`);
  }
  const { additions, deletions, commits, files, comments } =
    statsRecord as unknown as ChangelogStats;
  if (id !== entryId(date, pr)) return fail("id", `must be ${entryId(date, pr)} (date and pr)`);
  return {
    date,
    pr,
    title,
    kind,
    counts: { features, fixes, chores },
    stats: { additions, deletions, commits, files, comments },
  };
}

/** A copy, newest date first; pushes on one day by pull request, newest first. */
export function sortChangelogNewestFirst<T extends { meta: { date: string; pr: number } }>(
  entries: T[],
): T[] {
  return [...entries].sort((a, b) => {
    if (a.meta.date !== b.meta.date) return a.meta.date < b.meta.date ? 1 : -1;
    return b.meta.pr - a.meta.pr;
  });
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** "3 features, 2 fixes, 4 chores", "Branch sync" or "Revert". */
export function changelogCountsLabel(meta: Pick<ChangelogMeta, "kind" | "counts">): string {
  if (meta.kind === "revert") return "Revert";
  const { features, fixes, chores } = meta.counts;
  if (features + fixes + chores === 0) return "Branch sync";
  return [
    plural(features, "feature", "features"),
    plural(fixes, "fix", "fixes"),
    plural(chores, "chore", "chores"),
  ].join(", ");
}

async function loadEntry(entry: ChangelogEntry): Promise<ChangelogItem> {
  const mod = await entry.load();
  return { id: entry.id, meta: parseChangelogMeta(entry.id, mod.meta), Content: mod.default };
}

/** Every entry, newest first. */
export async function getChangelog(): Promise<ChangelogItem[]> {
  return sortChangelogNewestFirst(await Promise.all(CHANGELOG_ENTRIES.map(loadEntry)));
}

/**
 * One entry, or null. A malformed or unknown id is rejected against the
 * registry before any module is imported.
 */
export async function getChangelogEntry(id: string): Promise<ChangelogItem | null> {
  if (!isChangelogId(id)) return null;
  const entry = CHANGELOG_ENTRIES.find((candidate) => candidate.id === id);
  return entry ? loadEntry(entry) : null;
}
