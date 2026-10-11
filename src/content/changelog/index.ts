import type { MDXContent } from "mdx/types";

// Every changelog entry, listed by hand: id plus a lazy import of its module.
// The import path is a string literal per entry (never a template), so the
// bundler, TypeScript and knip see each file. Add one line per entry;
// registry.test.ts fails when a file in this directory and this list disagree.

export interface ChangelogEntry {
  id: string;
  load: () => Promise<{ default: MDXContent; meta?: unknown }>;
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  { id: "2026-10-03-pr8", load: () => import("./2026-10-03-pr8.mdx") },
  { id: "2026-10-05-pr16", load: () => import("./2026-10-05-pr16.mdx") },
  { id: "2026-10-05-pr37", load: () => import("./2026-10-05-pr37.mdx") },
  { id: "2026-10-05-pr65", load: () => import("./2026-10-05-pr65.mdx") },
  { id: "2026-10-06-pr77", load: () => import("./2026-10-06-pr77.mdx") },
  { id: "2026-10-06-pr79", load: () => import("./2026-10-06-pr79.mdx") },
  { id: "2026-10-06-pr96", load: () => import("./2026-10-06-pr96.mdx") },
  { id: "2026-10-07-pr115", load: () => import("./2026-10-07-pr115.mdx") },
  { id: "2026-10-07-pr118", load: () => import("./2026-10-07-pr118.mdx") },
  { id: "2026-10-09-pr163", load: () => import("./2026-10-09-pr163.mdx") },
];
