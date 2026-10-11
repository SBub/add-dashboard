"use client";

import {
  type ReactNode,
  type RefObject,
  type TransitionStartFunction,
  createContext,
  use,
  useRef,
  useState,
  useTransition,
} from "react";

interface HistoryTransitionValue {
  isPending: boolean;
  startTransition: TransitionStartFunction;
  /**
   * Runs a page-turn navigation inside the transition and first holds the
   * list at least as tall as it is now, so a shorter page cannot shorten the
   * document and clamp the window's scroll position.
   */
  startPageTurn: (navigate: () => void) => void;
  /** Drops the held height (a search shows its results at their own height). */
  releaseHeight: () => void;
  listRef: RefObject<HTMLDivElement | null>;
  minHeight: number | null;
}

const HistoryTransitionContext = createContext<HistoryTransitionValue | null>(null);

/**
 * The one transition the History search and page arrows navigate in, shared by
 * the box and the arrows that start it (HistorySearch, HistoryPageLink) and the
 * list wrapper that shows it (HistoryResults).
 * Renders its children and nothing else, and reads no request data, so the
 * History section it wraps stays in the static shell.
 */
export function HistoryTransition({ children }: { children: ReactNode }) {
  const [isPending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);
  const [minHeight, setMinHeight] = useState<number | null>(null);

  function startPageTurn(navigate: () => void) {
    const height = listRef.current?.offsetHeight ?? 0;
    setMinHeight((held) => Math.max(held ?? 0, height));
    startTransition(navigate);
  }

  function releaseHeight() {
    setMinHeight(null);
  }

  return (
    <HistoryTransitionContext
      value={{ isPending, startTransition, startPageTurn, releaseHeight, listRef, minHeight }}
    >
      {children}
    </HistoryTransitionContext>
  );
}

/** The shared History transition; only valid inside HistoryTransition. */
export function useHistoryTransition(): HistoryTransitionValue {
  const value = use(HistoryTransitionContext);
  if (value === null) throw new Error("useHistoryTransition must be used inside HistoryTransition");
  return value;
}

/**
 * Dims the History list while a search or page-turn navigation is pending, so
 * the old rows stay on screen until the new ones stream in. After a page turn
 * it keeps the height the list had before it (startPageTurn), so the window
 * keeps its scroll position when the new page is shorter.
 */
export function HistoryResults({ children }: { children: ReactNode }) {
  const { isPending, listRef, minHeight } = useHistoryTransition();
  return (
    <div
      ref={listRef}
      aria-busy={isPending}
      style={minHeight === null ? undefined : { minHeight }}
      className={isPending ? "opacity-50 transition-opacity" : "transition-opacity"}
    >
      {children}
    </div>
  );
}
