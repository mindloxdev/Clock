import { useCallback, useSyncExternalStore } from 'react';

/**
 * One clock source for the whole page.
 *
 * Fifteen faces each running their own `setInterval` would drift apart from
 * each other and from the wall clock, so there is a single loop here and
 * components subscribe to it at the granularity they actually redraw at.
 * `useSyncExternalStore` compares the bucketed snapshot, so a component that
 * asked for seconds does not re-render on a frame tick.
 */
export type TickRate = 'minute' | 'second' | 'frame';

let nowMs = Date.now();
const listeners = new Set<() => void>();
let frameSubscribers = 0;

let rafHandle = 0;
/** `ReturnType` rather than `number`: Node's timer types are in scope here. */
let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
let mode: 'none' | 'second' | 'frame' = 'none';

const reduceMotionQuery =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

function tick(): void {
  nowMs = Date.now();
  // Copied, because a listener may unsubscribe during the notification.
  for (const listener of [...listeners]) listener();
}

function stop(): void {
  if (rafHandle) {
    cancelAnimationFrame(rafHandle);
    rafHandle = 0;
  }
  if (timeoutHandle !== null) {
    clearTimeout(timeoutHandle);
    timeoutHandle = null;
  }
}

function startFrames(): void {
  const loop = () => {
    tick();
    rafHandle = requestAnimationFrame(loop);
  };
  rafHandle = requestAnimationFrame(loop);
}

/**
 * Re-aims at the next whole second after every tick rather than repeating a
 * fixed 1000 ms, so the display flips *on* the second and stays there however
 * much the timer is delayed.
 */
function startSeconds(): void {
  const step = () => {
    tick();
    timeoutHandle = setTimeout(step, 1000 - (Date.now() % 1000));
  };
  timeoutHandle = setTimeout(step, 1000 - (Date.now() % 1000));
}

function desiredMode(): typeof mode {
  if (listeners.size === 0) return 'none';
  if (typeof document !== 'undefined' && document.hidden) return 'none';
  // A reduced-motion viewer gets ticking second hands instead of sweeping
  // ones, which also means the page never needs a frame loop.
  return frameSubscribers > 0 && !reduceMotionQuery?.matches ? 'frame' : 'second';
}

function sync(): void {
  const next = desiredMode();
  if (next === mode) return;
  stop();
  mode = next;
  if (next === 'frame') startFrames();
  else if (next === 'second') startSeconds();
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    // Coming back from a background tab, the displayed time is stale by
    // however long we were away: catch up before rescheduling.
    if (!document.hidden) tick();
    sync();
  });
}
reduceMotionQuery?.addEventListener('change', sync);

function subscribe(listener: () => void, rate: TickRate): () => void {
  listeners.add(listener);
  if (rate === 'frame') frameSubscribers += 1;
  sync();
  return () => {
    listeners.delete(listener);
    if (rate === 'frame') frameSubscribers -= 1;
    sync();
  };
}

const snapshots: Record<TickRate, () => number> = {
  minute: () => Math.floor(nowMs / 60000) * 60000,
  second: () => Math.floor(nowMs / 1000) * 1000,
  frame: () => nowMs,
};

/**
 * The current instant, rounded down to `rate`.
 *
 * `frame` is for sweeping analog hands only. Prefer `second`, and `minute`
 * for faces that show no seconds -- it is the difference between 1 and 60
 * renders a minute per clock.
 */
export function useNow(rate: TickRate = 'second'): number {
  const getSnapshot = snapshots[rate];
  const subscribeAtRate = useCallback((listener: () => void) => subscribe(listener, rate), [rate]);
  return useSyncExternalStore(subscribeAtRate, getSnapshot, getSnapshot);
}
