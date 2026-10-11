"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ENTRY, NAV_ENTRY_ACTIVE, NAV_ENTRY_INACTIVE } from "@/lib/nav-entry";

const LABEL = <span className="block truncate text-sm font-semibold">Daily log</span>;

// The sidebar's Daily log entry, styled like a project entry and current only
// on /projects/log. It reads no query; the layout wraps it in a plain Suspense
// whose fallback is DailyLogLinkFallback, because usePathname suspends while
// prerendering a project page outside generateStaticParams (as in SectionNav).
export function DailyLogLink() {
  const active = usePathname() === "/projects/log";
  return (
    <Link
      href="/projects/log"
      aria-current={active ? "page" : undefined}
      className={`${NAV_ENTRY} ${active ? NAV_ENTRY_ACTIVE : NAV_ENTRY_INACTIVE}`}
    >
      {LABEL}
    </Link>
  );
}

// The same entry inactive, with no pathname read.
export function DailyLogLinkFallback() {
  return (
    <Link href="/projects/log" className={`${NAV_ENTRY} ${NAV_ENTRY_INACTIVE}`}>
      {LABEL}
    </Link>
  );
}
