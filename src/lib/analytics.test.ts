import { describe, expect, it, vi } from "vitest";
import { createIdentityStore } from "./analytics";

const ANON = "0192a1b2-anonymous";

function fakeClient(flag: boolean | undefined, distinctId: string) {
  const state = { flag, distinctId };
  const unsubscribe = vi.fn();
  const client = {
    isFeatureEnabled: vi.fn(() => state.flag),
    onFeatureFlags: vi.fn((_callback: () => void) => unsubscribe),
    get_distinct_id: vi.fn(() => state.distinctId),
    identify: vi.fn((id: string) => {
      state.distinctId = id;
    }),
    reset: vi.fn(() => {
      state.distinctId = ANON;
    }),
  };
  return { client, unsubscribe };
}

describe("createIdentityStore", () => {
  it("is null when the flag is undefined, without reading the distinct id", () => {
    const { client } = fakeClient(undefined, ANON);
    const store = createIdentityStore(client);
    expect(store.getSnapshot()).toBeNull();
    expect(client.get_distinct_id).not.toHaveBeenCalled();
  });

  it("is null when the flag is false", () => {
    const { client } = fakeClient(false, ANON);
    expect(createIdentityStore(client).getSnapshot()).toBeNull();
  });

  it("has a null server snapshot even with the flag on", () => {
    const { client } = fakeClient(true, ANON);
    expect(createIdentityStore(client).getServerSnapshot()).toBeNull();
  });

  it("offers login to an anonymous visitor and flips to logout after it", () => {
    const { client } = fakeClient(true, ANON);
    const store = createIdentityStore(client);
    const listener = vi.fn();
    store.subscribe(listener);
    expect(store.getSnapshot()).toBe("login");

    store.login();
    expect(client.identify).toHaveBeenCalledTimes(1);
    expect(client.identify).toHaveBeenCalledWith("sveta@issebya.com", {
      email: "sveta@issebya.com",
    });
    expect(listener).toHaveBeenCalled();
    expect(store.getSnapshot()).toBe("logout");
  });

  it("offers logout to the owner and flips to login after it", () => {
    const { client } = fakeClient(true, "sveta@issebya.com");
    const store = createIdentityStore(client);
    const listener = vi.fn();
    store.subscribe(listener);
    expect(store.getSnapshot()).toBe("logout");

    store.logout();
    expect(client.reset).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalled();
    expect(store.getSnapshot()).toBe("login");
  });

  it("subscribes to flag loads and releases them on unsubscribe", () => {
    const { client, unsubscribe } = fakeClient(true, ANON);
    const store = createIdentityStore(client);
    const listener = vi.fn();
    const release = store.subscribe(listener);
    expect(client.onFeatureFlags).toHaveBeenCalledTimes(1);

    const [callback] = client.onFeatureFlags.mock.calls[0] ?? [];
    callback?.();
    expect(listener).toHaveBeenCalledTimes(1);

    release();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    store.login();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
