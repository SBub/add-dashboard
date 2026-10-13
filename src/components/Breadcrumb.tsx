import Link from "next/link";

// The post page's way back to the list: Writing, then the post title as the
// current page. Rendered above the post's h1, never on /writing itself. The
// title truncates to one line on narrow screens; the h1 keeps it whole. No
// clock.
export function Breadcrumb({ title }: { title: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
      <ol className="flex min-w-0 items-center gap-2">
        <li className="shrink-0">
          <Link href="/writing" className="hover:underline hover:underline-offset-2">
            Writing
          </Link>
        </li>
        <li className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="truncate">
            {title}
          </span>
        </li>
      </ol>
    </nav>
  );
}
