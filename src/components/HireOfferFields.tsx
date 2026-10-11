"use client";

import { useState } from "react";
import { type Offer, OFFER_LABELS, OFFER_PROMPTS, OFFERS } from "@/content/hire";
import { EMAIL_MAX, MOTIVATION_MAX, MOTIVATION_MIN, NAME_MAX } from "@/lib/hire-request";

const LABEL = "block text-sm font-medium";
const FIELD =
  "mt-1 block w-full rounded-md border border-neutral-300 bg-background px-3 py-2 text-sm dark:border-neutral-700";

// The hire form's fields. A client leaf only so the textarea's question
// follows the offer: with a fixed offer (from ?offer=) it is sent in a hidden
// input; with none, the visitor picks one in the select and the question
// changes with the selection. The server action validates every field.
export function HireOfferFields({ fixedOffer }: { fixedOffer: Offer | null }) {
  const [picked, setPicked] = useState<Offer>(fixedOffer ?? OFFERS[0]);
  const offer = fixedOffer ?? picked;

  return (
    <>
      {fixedOffer === null ? (
        <div>
          <label htmlFor="hire-offer" className={LABEL}>
            What brings you here?
          </label>
          <select
            id="hire-offer"
            name="offer"
            required
            value={picked}
            onChange={(event) => setPicked(event.target.value as Offer)}
            className={FIELD}
          >
            {OFFERS.map((option) => (
              <option key={option} value={option}>
                {OFFER_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input type="hidden" name="offer" value={fixedOffer} />
      )}
      <div>
        <label htmlFor="hire-email" className={LABEL}>
          Your email
        </label>
        <input
          id="hire-email"
          type="email"
          name="email"
          required
          maxLength={EMAIL_MAX}
          autoComplete="email"
          className={FIELD}
        />
      </div>
      <div>
        <label htmlFor="hire-name" className={LABEL}>
          Your name <span className="font-normal text-neutral-500">(optional)</span>
        </label>
        <input
          id="hire-name"
          name="name"
          maxLength={NAME_MAX}
          autoComplete="name"
          className={FIELD}
        />
      </div>
      <div>
        <label htmlFor="hire-motivation" className={LABEL}>
          {OFFER_PROMPTS[offer]}
        </label>
        <textarea
          id="hire-motivation"
          name="motivation"
          required
          minLength={MOTIVATION_MIN}
          maxLength={MOTIVATION_MAX}
          rows={6}
          className={FIELD}
        />
      </div>
    </>
  );
}
