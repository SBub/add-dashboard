"use client";

import posthog from "posthog-js";
import { HireOfferFields } from "@/components/HireOfferFields";
import { SubmitButton } from "@/components/SubmitButton";
import { TurnstileScript } from "@/components/TurnstileScript";
import type { Offer } from "@/content/hire";

interface HireRequestFormProps {
  action: (formData: FormData) => Promise<never>;
  offer: Offer | null;
}

// The /hire form. A client component only to send hire_request_submitted to
// PostHog on submit; the server action still validates every field.
export function HireRequestForm({ action, offer }: HireRequestFormProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        posthog.capture("hire_request_submitted", {
          offer: new FormData(event.currentTarget).get("offer"),
          from_door: offer !== null,
        });
      }}
      className="mt-4 max-w-xl space-y-4"
    >
      <HireOfferFields fixedOffer={offer} />
      <div
        className="cf-turnstile"
        data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
      />
      <TurnstileScript />
      <SubmitButton />
    </form>
  );
}
