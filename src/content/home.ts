// The / page's copy, the one place it lives. The owner edits it here; no copy
// for the page belongs anywhere else, except LOCATION, shared with /hire from
// src/content/site.ts. Strings marked "[Placeholder]" are placeholder text
// until the owner replaces them.
import type { Offer } from "@/content/hire";

export const HOME_HEADING = "Sviatlana Buben";

// The line directly under the heading.
export const HOME_ROLE = "Product Engineer, AI Consultant";

// The intro: the offline line ends with a link to the guest house's site.
export const HOME_OFFLINE = "Offline: running guest house";
export const HOME_GUEST_HOUSE = { label: "issebya.com", href: "https://www.issebya.com" };
export const HOME_INTERESTS = "Love forest bathing, NTS, PostHog";

// The two doors into /hire, each preselecting its offer.
export const HOME_DOORS: { offer: Offer; title: string }[] = [
  {
    offer: "Product engineer",
    title: "Building a product?",
  },
  {
    offer: "AI consulting",
    title: "Want to automate your processes with AI?",
  },
];
