import type { Metadata } from "next";
import { HireOfferFields } from "@/components/HireOfferFields";
import { SectionBoundary } from "@/components/SectionBoundary";
import { SubmitButton } from "@/components/SubmitButton";
import { TurnstileScript } from "@/components/TurnstileScript";
import { LINKEDIN_URL, type Offer } from "@/content/hire";
import { LOCATION } from "@/content/site";
import { HIRE_ERROR_MESSAGES, hireOfferFromSlug, hireStatus } from "@/lib/hire-request";
import { sendHireRequest } from "../actions/send-hire-request";

export const metadata: Metadata = {
  title: "Work with me",
  description:
    "Work with Sviatlana Buben: product engineering, or structuring and automating business processes with AI.",
};

type SearchParams = Promise<{
  sent?: string | string[];
  error?: string | string[];
  offer?: string | string[];
}>;

const TEXT_LINK = "underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100";
// The form. It posts to the server action, which redirects back here with
// ?sent=1 or ?error=<code>; the browser's own validation mirrors the server's
// bounds, which are the ones that count. `offer` comes from ?offer= through
// hireOfferFromSlug, always an OFFERS member or null, never the raw query
// value. HireOfferFields sends a fixed offer in a hidden input, or lets the
// visitor pick one, and asks the picked offer's prompt either way. HireStatus
// keys the form by the offer: cacheComponents keeps a visited /hire mounted,
// and a mounted form keeps its picked offer and typed text, so a second door would
// otherwise land on the first door's form.
function HireForm({ offer }: { offer: Offer | null }) {
  return (
    <form action={sendHireRequest} className="mt-4 max-w-xl space-y-4">
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

// The request-time island: awaiting searchParams makes it the hole under its
// SectionBoundary. ?offer=<slug> picks the offer through hireOfferFromSlug:
// a form for it, or with no valid slug a form with the select. A sent request
// shows only the thank-you; an error sits above the form.
async function HireStatus({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const status = hireStatus(params);
  const offer = hireOfferFromSlug(params.offer);

  if (status?.kind === "sent") {
    return (
      <p role="status" className="mt-6 max-w-[70ch] text-base">
        Thanks, your message was sent. I will reply to the email you gave.
      </p>
    );
  }

  return (
    <div className="mt-6">
      {status?.kind === "error" && (
        <p role="alert" className="text-sm font-medium text-fuchsia-700 dark:text-fuchsia-400">
          {HIRE_ERROR_MESSAGES[status.code]}
        </p>
      )}
      <HireForm key={offer ?? "choose"} offer={offer} />
    </div>
  );
}

// Not async: the heading, the location line and the LinkedIn link are the
// static shell; the status and the form are the hole. Outside (dashboard),
// like "/" and "/writing": no Providers, no Realtime, no sidebar.
export default function HirePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-semibold tracking-tight">Work with me</h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{LOCATION}</p>
      <p className="mt-3 text-sm">
        <a href={LINKEDIN_URL} target="_blank" rel="noreferrer" className={TEXT_LINK}>
          LinkedIn profile
        </a>
      </p>
      <SectionBoundary
        fallback={
          <p className="mt-6 text-sm text-neutral-500 dark:text-neutral-400">Loading form...</p>
        }
        detail="The form did not load."
      >
        <HireStatus searchParams={searchParams} />
      </SectionBoundary>
    </div>
  );
}
