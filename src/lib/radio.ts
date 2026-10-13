// The radio footer plays NTS Radio's Slow Focus infinite
// mixtape. This file holds its URLs, its error text and the state machine
// every click and media event goes through. It is plain (no React, no
// posthog-js, no DOM), so every transition is testable in node.

/** The stream; it redirects to a radiomast edge serving audio/mpeg. */
export const RADIO_STREAM_URL = "https://stream-mixtape-geo.ntslive.net/mixtape";

/** The mixtape page on nts.live, the credit link the bar always renders. */
export const RADIO_PAGE_URL = "https://www.nts.live/infinite-mixtapes/slow-focus";

/** Replaces the title text when the stream cannot be reached. */
export const RADIO_ERROR_TEXT = "Can't reach NTS right now";

export type RadioStatus = "idle" | "loading" | "playing";

/**
 * `attempt` counts the visitor's clicks; a media event or a `play()` rejection
 * carries the attempt it belongs to, so a late one from a stream the visitor
 * already stopped is dropped.
 */
export interface RadioState {
  status: RadioStatus;
  error: boolean;
  attempt: number;
}

type RadioEvent =
  | { type: "play"; attempt: number }
  | { type: "stop"; attempt: number }
  | { type: "playing"; attempt: number }
  | { type: "fail"; attempt: number };

export const INITIAL_RADIO_STATE: RadioState = { status: "idle", error: false, attempt: 0 };

/**
 * Play only starts from idle and keeps the error text while the retry loads;
 * only a successful play clears it. Stop is the visitor's own action, never an
 * error. `playing` and `fail` count only for the current attempt while the
 * stream is loading or playing: the AbortError a `play()` promise rejects with
 * after a stop, or the error event of a dropped stream, is stale.
 */
export function radioReducer(state: RadioState, event: RadioEvent): RadioState {
  switch (event.type) {
    case "play":
      if (state.status !== "idle") return state;
      return { status: "loading", error: state.error, attempt: event.attempt };
    case "stop":
      if (state.status === "idle") return state;
      return { status: "idle", error: false, attempt: event.attempt };
    case "playing":
      if (event.attempt !== state.attempt || state.status === "idle") return state;
      return { status: "playing", error: false, attempt: state.attempt };
    case "fail":
      if (event.attempt !== state.attempt || state.status === "idle") return state;
      return { status: "idle", error: true, attempt: state.attempt };
  }
}

/** The button's accessible name; pressing it while loading stops the attempt. */
export function radioButtonLabel(status: RadioStatus): string {
  return status === "idle" ? "Play NTS Slow Focus" : "Stop NTS Slow Focus";
}
