import type { MDXComponents } from "mdx/types";
import Link from "next/link";

// Required by @next/mdx with the App Router: maps the elements a post's MDX
// compiles to onto the site's typography. Server only (no "use client"), so a
// post may not import a client component; see app_docs/writing.md.

const TEXT_LINK = "underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100";

const components: MDXComponents = {
  h1: (props) => <h1 className="text-2xl font-semibold tracking-tight" {...props} />,
  h2: (props) => <h2 className="mt-8 text-xl font-semibold tracking-tight" {...props} />,
  h3: (props) => <h3 className="mt-6 text-lg font-semibold" {...props} />,
  p: (props) => <p className="mt-4 text-base text-neutral-700 dark:text-neutral-300" {...props} />,
  // A site path is a client-side navigation; anything else is a plain link.
  a: ({ href, ...props }) =>
    href?.startsWith("/") ? (
      <Link href={href} className={TEXT_LINK} {...props} />
    ) : (
      <a href={href} className={TEXT_LINK} {...props} />
    ),
  ul: (props) => (
    <ul
      className="mt-4 list-disc space-y-1 pl-6 text-base text-neutral-700 dark:text-neutral-300"
      {...props}
    />
  ),
  ol: (props) => (
    <ol
      className="mt-4 list-decimal space-y-1 pl-6 text-base text-neutral-700 dark:text-neutral-300"
      {...props}
    />
  ),
  li: (props) => <li className="pl-1" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="mt-4 border-l-2 border-neutral-300 pl-4 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400"
      {...props}
    />
  ),
  code: (props) => (
    <code
      className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-sm dark:bg-neutral-900"
      {...props}
    />
  ),
  // overflow-x-auto keeps a wide code block scrolling inside itself, not the
  // page, at 375px.
  pre: (props) => (
    <pre
      className="mt-4 overflow-x-auto rounded-md bg-neutral-100 p-4 text-sm dark:bg-neutral-900"
      {...props}
    />
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
