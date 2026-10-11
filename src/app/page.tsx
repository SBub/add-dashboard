import type { Metadata } from "next";
import Link from "next/link";
import {
  HOME_DOORS,
  HOME_GUEST_HOUSE,
  HOME_HEADING,
  HOME_INTERESTS,
  HOME_OFFLINE,
  HOME_ROLE,
} from "@/content/home";
import { LOCATION } from "@/content/site";
import { hireOfferHref } from "@/lib/hire-request";

export const metadata: Metadata = {
  title: "Sviatlana Buben, Product Engineer, AI Consultant",
  description:
    "Product engineer building her products in public with ADW. Hire her, or have her automate your processes with AI.",
};

const TEXT_LINK = "underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100";
const DOOR =
  "block h-full rounded-lg border border-neutral-200 p-4 hover:border-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 dark:border-neutral-800 dark:hover:border-neutral-600 dark:focus-visible:outline-neutral-100";

// Not async and no props: the whole page is the static shell. It reads nothing
// at request time (no request API, no query string, no clock, no data), and
// has no live ADW figure, which would be a third argument-less clock read
// (app_docs/clock-and-prerender.md).
// Outside (dashboard), like /writing and /hire: no Providers, no Realtime, no pill.
export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight">{HOME_HEADING}</h1>
      <p className="mt-1 text-base font-medium">{HOME_ROLE}</p>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{LOCATION}</p>
      <div className="mt-4 max-w-[70ch] space-y-3 text-base text-neutral-700 dark:text-neutral-300">
        <p>
          {HOME_OFFLINE}{" "}
          <a href={HOME_GUEST_HOUSE.href} target="_blank" rel="noreferrer" className={TEXT_LINK}>
            {HOME_GUEST_HOUSE.label}
          </a>
        </p>
        <p>{HOME_INTERESTS}</p>
      </div>
      <ul className="mt-6 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {HOME_DOORS.map((door) => (
          <li key={door.offer}>
            <Link href={hireOfferHref(door.offer)} className={DOOR}>
              <span className="block text-base font-semibold">{door.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
