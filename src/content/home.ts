// The / page's copy, the one place it lives. The owner edits it here; no copy
// for the page belongs anywhere else. Every string below is placeholder text,
// marked "[Placeholder]", until the owner replaces it.
import type { Offer } from "@/content/hire";

export const HOME_HEADING = "Sviatlana Buben, product engineer";

export const HOME_INTRO: string[] = [
  "[Placeholder] I am a product engineer: I take products from the first sketch to the release and keep them running after it.",
  "[Placeholder] I build my own products in public, with ADW, an autonomous development workflow that turns a GitHub issue into a reviewed, merged pull request.",
];

// Rendered followed by the "Watch me build" link to /projects.
export const HOME_ADW_LINE =
  "[Placeholder] Every run ADW finishes lands in a public ledger: what it built, how long it took and what it cost.";

// The two doors into /hire, each preselecting its offer.
export const HOME_DOORS: { offer: Offer; title: string; body: string }[] = [
  {
    offer: "Product engineer",
    title: "Hiring a product engineer?",
    body: "[Placeholder] Contract or full-time: tell me about the product and the team.",
  },
  {
    offer: "AI consulting",
    title: "Want work off your plate?",
    body: "[Placeholder] Tell me what eats your time and I will tell you what AI can take over.",
  },
];
