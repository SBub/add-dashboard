import { describe, expect, it } from "vitest";
import {
  INITIAL_RADIO_STATE,
  RADIO_PAGE_URL,
  RADIO_STREAM_URL,
  type RadioState,
  radioButtonLabel,
  radioReducer,
} from "./radio";

const loading = (attempt: number, error = false): RadioState => ({
  status: "loading",
  error,
  attempt,
});
const playing = (attempt: number): RadioState => ({ status: "playing", error: false, attempt });

describe("radioReducer", () => {
  it("starts idle, with no error and no attempt", () => {
    expect(INITIAL_RADIO_STATE).toEqual({ status: "idle", error: false, attempt: 0 });
  });

  it("loads the new attempt on play from idle", () => {
    expect(radioReducer(INITIAL_RADIO_STATE, { type: "play", attempt: 1 })).toEqual(loading(1));
  });

  it("plays on a playing event of the current attempt", () => {
    expect(radioReducer(loading(1), { type: "playing", attempt: 1 })).toEqual(playing(1));
  });

  it("ignores a playing event of an older attempt", () => {
    const state = loading(3);
    expect(radioReducer(state, { type: "playing", attempt: 1 })).toBe(state);
  });

  it.each([
    ["playing", playing(1)],
    ["loading", loading(1)],
  ])("stops from %s to idle with no error and the new attempt", (_name, state) => {
    expect(radioReducer(state, { type: "stop", attempt: 2 })).toEqual({
      status: "idle",
      error: false,
      attempt: 2,
    });
  });

  it.each([
    ["loading", loading(1)],
    ["playing", playing(1)],
  ])("fails from %s to idle with the error", (_name, state) => {
    expect(radioReducer(state, { type: "fail", attempt: 1 })).toEqual({
      status: "idle",
      error: true,
      attempt: 1,
    });
  });

  it("does not show an error for the rejection a stop causes", () => {
    const stopped = radioReducer(loading(1), { type: "stop", attempt: 2 });
    expect(radioReducer(stopped, { type: "fail", attempt: 1 })).toEqual({
      status: "idle",
      error: false,
      attempt: 2,
    });
  });

  it("ignores a stale fail from an earlier attempt while a later one loads", () => {
    const state = loading(3);
    expect(radioReducer(state, { type: "fail", attempt: 1 })).toBe(state);
  });

  it("keeps the error while a retry loads and clears it once playing", () => {
    const failed: RadioState = { status: "idle", error: true, attempt: 1 };
    const retrying = radioReducer(failed, { type: "play", attempt: 2 });
    expect(retrying).toEqual(loading(2, true));
    expect(radioReducer(retrying, { type: "playing", attempt: 2 })).toEqual(playing(2));
  });

  it.each([
    ["loading", loading(1)],
    ["playing", playing(1)],
  ])("ignores play while %s", (_name, state) => {
    expect(radioReducer(state, { type: "play", attempt: 2 })).toBe(state);
  });

  it("ignores stop while idle", () => {
    expect(radioReducer(INITIAL_RADIO_STATE, { type: "stop", attempt: 1 })).toBe(
      INITIAL_RADIO_STATE,
    );
  });
});

describe("radioButtonLabel", () => {
  it("offers play when idle and stop while loading or playing", () => {
    expect(radioButtonLabel("idle")).toBe("Play NTS Slow Focus");
    expect(radioButtonLabel("loading")).toBe("Stop NTS Slow Focus");
    expect(radioButtonLabel("playing")).toBe("Stop NTS Slow Focus");
  });
});

describe("radio URLs", () => {
  it("streams from NTS and credits the Slow Focus mixtape page", () => {
    expect(new URL(RADIO_STREAM_URL).host).toBe("stream-mixtape-geo.ntslive.net");
    expect(RADIO_PAGE_URL).toBe("https://www.nts.live/infinite-mixtapes/slow-focus");
  });
});
