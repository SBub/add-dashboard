// The identity store behind the header's Login / Logout button. It never
// imports posthog-js: the client is passed in, so this file stays plain and
// testable in node, and the posthog-js import rule in app_docs/analytics.md
// holds. This is not authentication: Login only tells PostHog who the visitor
// is, so feature flags can target the owner by email.

// Both are literal strings PostHog conditions match on (the flag key and the
// identified distinct id). Never rename or derive them.
const OWNER_EMAIL = "sveta@issebya.com";
const LOGIN_FLAG = "login";

/** The five PostHog methods the store uses; the real posthog instance satisfies it. */
export interface IdentityClient {
  isFeatureEnabled(key: string): boolean | undefined;
  onFeatureFlags(callback: () => void): () => void;
  get_distinct_id(): string | undefined;
  identify(distinctId: string, properties: { email: string }): void;
  reset(): void;
}

/** What the button offers: Login, Logout, or nothing (flag off, unknown, or on the server). */
export type IdentityAction = "login" | "logout" | null;

/**
 * A useSyncExternalStore store over `client`. The flag is the only gate and is
 * read first, so nothing else is read while it is off or PostHog is not
 * initialised. The label comes from the distinct id, so it survives a reload.
 * Login and Logout notify local listeners at once; PostHog's own flag reload
 * after identify or reset fires onFeatureFlags again later.
 */
export function createIdentityStore(client: IdentityClient) {
  const listeners = new Set<() => void>();

  function notify() {
    listeners.forEach((l) => l());
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      const unsubscribe = client.onFeatureFlags(() => listener());
      return () => {
        listeners.delete(listener);
        unsubscribe();
      };
    },
    getSnapshot(): IdentityAction {
      if (client.isFeatureEnabled(LOGIN_FLAG) !== true) return null;
      return client.get_distinct_id() === OWNER_EMAIL ? "logout" : "login";
    },
    getServerSnapshot(): IdentityAction {
      return null;
    },
    login() {
      client.identify(OWNER_EMAIL, { email: OWNER_EMAIL });
      notify();
    },
    logout() {
      client.reset();
      notify();
    },
  };
}
