// The /hire page's copy, the one place it lives. The owner edits it here; no
// copy for the page belongs anywhere else, except LOCATION, shared with / from
// src/content/site.ts.

export const OFFERS = ["Product engineer", "AI consulting"] as const;

export type Offer = (typeof OFFERS)[number];

// The value is what the action validates and the subject carries; the label is only the visible text.
export const OFFER_LABELS: Record<Offer, string> = {
  "Product engineer": "I need a product engineer",
  "AI consulting": "I want to structure and automate my processes with AI",
};

// The textarea label when the form is for a picked offer.
export const OFFER_PROMPTS: Record<Offer, string> = {
  "Product engineer": "What are you building?",
  "AI consulting": "Tell me about your business",
};

// The owner's LinkedIn profile, linked below the heading.
export const LINKEDIN_URL = "https://www.linkedin.com/in/sviatlana-buben-42662566";
