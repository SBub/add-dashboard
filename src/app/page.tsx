import type { Metadata } from "next";
import Link from "next/link";
import { HOME_ADW_LINE, HOME_DOORS, HOME_HEADING, HOME_INTRO } from "@/content/home";
import { hireOfferHref } from "@/lib/hire-request";

export const metadata: Metadata = {
  title: "Sviatlana Buben, product engineer",
  description:
    "Product engineer building her products in public with ADW. Hire her, or hand her work off your plate.",
};

const TEXT_LINK = "underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100";
const DOOR =
  "block h-full rounded-lg border border-neutral-200 p-4 hover:border-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:border-neutral-800 dark:hover:border-neutral-600 dark:focus-visible:outline-neutral-100";

// Not async and no props: the whole page is the static shell. It reads nothing
// at request time (no request API, no query string, no clock, no data), and
// has no live ADW figure, which would be a third argument-less clock read
// (app_docs/clock-and-prerender.md); the static link to /watch is the teaser.
// Outside (dashboard), like /watch and /hire: no Providers, no Realtime, no pill.
export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight">{HOME_HEADING}</h1>
      <div className="mt-2 max-w-[70ch] space-y-2 text-base text-neutral-700 dark:text-neutral-300">
        {HOME_INTRO.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <p className="mt-3 max-w-[70ch] text-base text-neutral-700 dark:text-neutral-300">
        {HOME_ADW_LINE}{" "}
        <Link href="/watch" className={TEXT_LINK}>
          Watch me build
        </Link>
      </p>
      <ul className="mt-6 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {HOME_DOORS.map((door) => (
          <li key={door.offer}>
            <Link href={hireOfferHref(door.offer)} className={DOOR}>
              <span className="block text-base font-semibold">{door.title}</span>
              <span className="mt-1 block text-sm text-neutral-600 dark:text-neutral-400">
                {door.body}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
