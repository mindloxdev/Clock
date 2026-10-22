import { useCallback, useSyncExternalStore } from 'react';

const query =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

/**
 * Whether the viewer has asked for less motion.
 *
 * CSS handles most of it, but the sweeping second hand is drawn from a
 * per-frame value rather than a transition, so that decision has to reach
 * JavaScript too.
 */
export function useReducedMotion(): boolean {
  const subscribe = useCallback((listener: () => void) => {
    query?.addEventListener('change', listener);
    return () => query?.removeEventListener('change', listener);
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => query?.matches ?? false,
    () => false,
  );
}
