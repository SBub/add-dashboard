"use client";

import posthog from "posthog-js";
import { useReducer, useRef } from "react";
import {
  INITIAL_RADIO_STATE,
  RADIO_ERROR_TEXT,
  RADIO_PAGE_URL,
  RADIO_STREAM_URL,
  radioButtonLabel,
  type RadioStatus,
  radioReducer,
} from "@/lib/radio";

/**
 * The NTS Slow Focus bar. The root layout renders it before the header, and
 * client-side navigation never remounts the root layout, so the one `<audio>`
 * keeps playing between pages. Nothing autoplays: `src` is set only by the
 * play click and removed on stop, which drops the connection. The NTS credit
 * link is rendered in every state; on an error only its text changes. The
 * live region is `aria-live` without `role="status"`: the connection pill is
 * the one status element.
 */
export function RadioBar() {
  const [state, dispatch] = useReducer(radioReducer, INITIAL_RADIO_STATE);
  const audioRef = useRef<HTMLAudioElement>(null);
  const attemptRef = useRef(0);

  function play() {
    const audio = audioRef.current;
    if (!audio) return;
    const attempt = ++attemptRef.current;
    dispatch({ type: "play", attempt });
    posthog.capture("radio_played");
    audio.src = RADIO_STREAM_URL;
    audio.play().catch(() => dispatch({ type: "fail", attempt }));
  }

  function stop() {
    const audio = audioRef.current;
    if (!audio) return;
    const attempt = ++attemptRef.current;
    dispatch({ type: "stop", attempt });
    posthog.capture("radio_stopped");
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }

  return (
    <div
      role="region"
      aria-label="NTS Slow Focus radio"
      className="border-b border-neutral-200 dark:border-neutral-800"
    >
      <div className="mx-auto flex h-9 max-w-6xl items-center gap-3 px-4 text-[11px] font-medium tracking-wider uppercase">
        <span className="flex shrink-0 items-center gap-1.5">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-red-600" />
          <span className="text-neutral-500 dark:text-neutral-400">LIVE NOW</span>
        </span>
        <div className="flex min-w-0 items-center gap-2 border border-neutral-300 px-2 py-0.5 dark:border-neutral-700">
          <span aria-hidden="true">∞</span>
          <button
            type="button"
            aria-label={radioButtonLabel(state.status)}
            aria-pressed={state.status !== "idle"}
            aria-busy={state.status === "loading"}
            onClick={state.status === "idle" ? play : stop}
            className="flex size-5 shrink-0 items-center justify-center focus-visible:outline-2 focus-visible:outline-neutral-500"
          >
            <RadioIcon status={state.status} />
          </button>
          <span aria-live="polite" className="min-w-0 truncate">
            <a
              href={RADIO_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`block truncate hover:underline ${
                state.error ? "text-neutral-500 dark:text-neutral-400" : ""
              }`}
            >
              {state.error ? RADIO_ERROR_TEXT : "NTS · SLOW FOCUS"}
            </a>
          </span>
        </div>
      </div>
      <audio
        ref={audioRef}
        preload="none"
        onPlaying={() => dispatch({ type: "playing", attempt: attemptRef.current })}
        onError={() => dispatch({ type: "fail", attempt: attemptRef.current })}
      />
    </div>
  );
}

function RadioIcon({ status }: { status: RadioStatus }) {
  if (status === "loading") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 12 12"
        className="size-3 animate-spin fill-none stroke-current motion-reduce:animate-none"
      >
        <path d="M6 1.5a4.5 4.5 0 1 0 4.5 4.5" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (status === "playing") {
    return (
      <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3 fill-current">
        <rect x="2" y="2" width="8" height="8" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className="size-3 fill-current">
      <path d="M3 1.5v9l7.5-4.5z" />
    </svg>
  );
}
