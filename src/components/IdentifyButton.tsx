"use client";

import posthog from "posthog-js";
import { useSyncExternalStore } from "react";
import { createIdentityStore } from "@/lib/analytics";
import { FLOATING_LAYER } from "@/lib/layers";

// The server snapshot is null, so the server HTML and the hydration render
// carry no button (no layout shift, no hydration mismatch). The `login` flag
// is the only gate; posthog is not initialised outside production, where the
// flag reads undefined and the button never appears. Below `sm` it floats
// bottom-right, stacked above the floating Work with me button (1rem offset,
// its 2.75rem box, a 0.5rem gap), opaque because it sits over content.
const store = createIdentityStore(posthog);

export function IdentifyButton() {
  const action = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  if (action === null) return null;

  return (
    <button
      type="button"
      onClick={action === "login" ? store.login : store.logout}
      className={`rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium whitespace-nowrap text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 ${FLOATING_LAYER} max-sm:fixed max-sm:right-4 max-sm:bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] max-sm:min-h-11 max-sm:bg-background max-sm:shadow-lg`}
    >
      {action === "login" ? "Login" : "Logout"}
    </button>
  );
}
