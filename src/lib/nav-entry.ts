// The sidebar entry classes, shared by a project entry (ProjectNavItem) and
// the static entries below the list (SidebarEntryLink) so they can never
// drift apart.

export const NAV_ENTRY = "block rounded-lg border px-3 py-2.5 transition-colors";
export const NAV_ENTRY_ACTIVE =
  "border-neutral-900 bg-neutral-100 dark:border-neutral-100 dark:bg-neutral-900";
export const NAV_ENTRY_INACTIVE =
  "border-neutral-200 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600";

/** Exactly href, or (nested) any path below `href/`. */
export function isSidebarEntryCurrent(pathname: string, href: string, nested: boolean): boolean {
  return pathname === href || (nested && pathname.startsWith(`${href}/`));
}
