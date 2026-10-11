import Link from "next/link";

// Rendered inside the two-pane shell when a changelog entry page calls
// notFound(), so an unknown id does not show the project not-found copy.
export default function ChangelogNotFound() {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Not found</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          There is no changelog entry at this address.{" "}
          <Link href="/projects/changelog" className="underline underline-offset-2">
            See every entry
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
