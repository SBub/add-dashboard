// The identity store behind the header's Login / Logout button. It never
// imports posthog-js: the client is passed in, so this file stays plain and
// testable in node, and the posthog-js import rule in app_docs/analytics.md
// holds. This is not authentication: Login only tells PostHog who the visitor
// is, so feature flags can target the owner by email.

// Both are literal strings PostHog conditions match on (the flag key and the
// identified distinct id). Never rename or derive them.
const OWNER_EMAIL = "sveta@issebya.com";
const LOGIN_FLAG = "login";

// The super property a tagged browser sends with every event; the PostHog
// test-account filter matches on this literal. Never rename or derive it.
const INTERNAL_PROPERTY = "internal";

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

/** What the `internal` query parameter asks for: tag, untag, or nothing. */
export type InternalTagAction = "tag" | "untag" | null;

/** `?internal=1` tags, `?internal=0` untags, anything else (or nothing) is null. */
export function internalTagAction(search: string): InternalTagAction {
  const value = new URLSearchParams(search).get(INTERNAL_PROPERTY);
  if (value === "1") return "tag";
  if (value === "0") return "untag";
  return null;
}

/** The three public variables instrumentation-client.ts reads literally. */
export interface AnalyticsEnv {
  vercelEnv: string | undefined;
  projectToken: string | undefined;
  host: string | undefined;
}

/** What the browser tells us; undefined when there is no navigator or window. */
export interface AnalyticsBrowser {
  webdriver: boolean | undefined;
  search: string;
}

/** The three PostHog calls start-up needs; an adapter over posthog satisfies it. */
export interface AnalyticsClient {
  init(projectToken: string, host: string): void;
  register(properties: { [INTERNAL_PROPERTY]: true }): void;
  unregister(property: string): void;
}

/**
 * Initialises PostHog on production, with both variables set, in a browser
 * that is not automated (`navigator.webdriver` is not true), then applies the
 * `?internal=` tag. The client is passed in, as with createIdentityStore, so
 * the whole condition is testable in node. Tagging only adds a super property
 * the PostHog filter hides; it never opts out, so identify and flag targeting
 * keep working. Returns whether PostHog was initialised.
 */
export function startAnalytics(
  env: AnalyticsEnv,
  browser: AnalyticsBrowser | undefined,
  client: AnalyticsClient,
): boolean {
  if (
    env.vercelEnv !== "production" ||
    !env.projectToken ||
    !env.host ||
    browser === undefined ||
    browser.webdriver === true
  ) {
    return false;
  }
  client.init(env.projectToken, env.host);
  const action = internalTagAction(browser.search);
  if (action === "tag") client.register({ [INTERNAL_PROPERTY]: true });
  if (action === "untag") client.unregister(INTERNAL_PROPERTY);
  return true;
}
