"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  isSidebarEntryCurrent,
  NAV_ENTRY,
  NAV_ENTRY_ACTIVE,
  NAV_ENTRY_INACTIVE,
} from "@/lib/nav-entry";

interface SidebarEntryLinkProps {
  href: string;
  label: string;
  /** Also current on every path below href (an index and its pages). */
  nested?: boolean;
}

function Label({ label }: { label: string }) {
  return <span className="block truncate text-sm font-semibold">{label}</span>;
}

// A static sidebar entry below the project list (Daily log, Changelog),
// styled like a project entry. It reads no query; the layout wraps it in a
// plain Suspense whose fallback is SidebarEntryLinkFallback, because
// usePathname suspends while prerendering a project page outside
// generateStaticParams (as in SectionNav).
export function SidebarEntryLink({ href, label, nested = false }: SidebarEntryLinkProps) {
  const active = isSidebarEntryCurrent(usePathname(), href, nested);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`${NAV_ENTRY} ${active ? NAV_ENTRY_ACTIVE : NAV_ENTRY_INACTIVE}`}
    >
      <Label label={label} />
    </Link>
  );
}

// The same entry inactive, with no pathname read.
export function SidebarEntryLinkFallback({ href, label }: Omit<SidebarEntryLinkProps, "nested">) {
  return (
    <Link href={href} className={`${NAV_ENTRY} ${NAV_ENTRY_INACTIVE}`}>
      <Label label={label} />
    </Link>
  );
}
