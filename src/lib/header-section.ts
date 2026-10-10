// Answers "which header section is this pathname in?" for the root header's
// three links: the brand (the intro page at "/"), "Watch me build" (the
// summary at /watch, the project overview and every project page below it) and
// "Work with me" (/hire). Pure (a string in, a value out), so it is testable
// without a router and safe to call from anywhere.

export type HeaderSection = "home" | "watch" | "hire";

/**
 * The header section `pathname` belongs to, or `null` for a route in none.
 *
 * Home is exactly "/". The watch section is "/watch" (or "/watch/"; it has
 * no sub-routes), "/projects" and anything below "/projects/"; the slash is
 * part of the prefix, so "/projectsx" and "/watchx" match nothing. No decoding
 * is needed: the prefix is a literal ASCII segment, so an encoded spelling
 * further down never changes the answer. The hire section is exactly "/hire"
 * (or "/hire/"); "/hirex" and "/hire-me" match nothing.
 */
export function headerSection(pathname: string): HeaderSection | null {
  if (pathname === "/") return "home";
  if (pathname === "/watch" || pathname === "/watch/") return "watch";
  if (pathname === "/projects" || pathname.startsWith("/projects/")) return "watch";
  if (pathname === "/hire" || pathname === "/hire/") return "hire";
  return null;
}
