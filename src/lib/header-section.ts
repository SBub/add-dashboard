// Answers "which header section is this pathname in?" for the root header's
// four links: the brand (the intro page at "/"), "Watch me build" (the
// project overview at /projects, the daily log at /projects/log and every
// project page below it),
// "Writing" (/writing and every post below it) and "Work with me" (/hire). Pure (a string in, a value out), so it is testable
// without a router and safe to call from anywhere.

export type HeaderSection = "home" | "watch" | "writing" | "hire";

/**
 * The header section `pathname` belongs to, or `null` for a route in none.
 *
 * Home is exactly "/". The watch section is "/projects", "/projects/" and
 * anything below it, which includes the daily log at "/projects/log"; the
 * slash is part of the prefix, so "/projectsx" matches nothing. No decoding
 * is needed: the prefix is a literal ASCII segment, so an encoded spelling
 * further down never changes the answer. The writing section is "/writing",
 * "/writing/" and anything below it; "/writingx" and "/writing-old" match
 * nothing. The hire section is exactly "/hire"
 * (or "/hire/"); "/hirex" and "/hire-me" match nothing.
 */
export function headerSection(pathname: string): HeaderSection | null {
  if (pathname === "/") return "home";
  if (pathname === "/projects" || pathname.startsWith("/projects/")) return "watch";
  if (pathname === "/writing" || pathname.startsWith("/writing/")) return "writing";
  if (pathname === "/hire" || pathname === "/hire/") return "hire";
  return null;
}
