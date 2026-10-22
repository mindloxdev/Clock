import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type { SavedClock } from '@/time/types';
import {
  WEATHER_TTL_MS,
  fetchWeather,
  pointKey,
  type WeatherPoint,
  type WeatherReading,
} from '@/time/weather';

import { useDashboard } from './useDashboard';

export type WeatherStatus = 'off' | 'idle' | 'loading' | 'ready' | 'error';

export interface WeatherApi {
  status: WeatherStatus;
  /** `null` whenever there is nothing we can honestly show. */
  forClock: (clock: SavedClock) => WeatherReading | null;
  lastUpdatedMs: number | null;
  refresh: () => void;
}

const WeatherContext = createContext<WeatherApi | null>(null);

const CACHE_KEY = 'multiclock.weather.v1';

/**
 * Readings survive a reload, so the dashboard opens with conditions already
 * on screen instead of blank boxes that fill in a second later. Anything
 * older than the TTL is discarded on read rather than shown as current.
 */
function loadCache(): Map<string, WeatherReading> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return new Map();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return new Map();
    const now = Date.now();
    const entries = Object.entries(parsed as Record<string, WeatherReading>).filter(
      ([, value]) =>
        value &&
        typeof value.temperatureC === 'number' &&
        typeof value.fetchedMs === 'number' &&
        now - value.fetchedMs < WEATHER_TTL_MS,
    );
    return new Map(entries);
  } catch {
    return new Map();
  }
}

function saveCache(cache: Map<string, WeatherReading>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(cache)));
  } catch {
    // Storage full or blocked; the in-memory cache still works for this session.
  }
}

export function WeatherProvider({ children }: { children: ReactNode }) {
  const { state } = useDashboard();
  const [cache, setCache] = useState<Map<string, WeatherReading>>(() =>
    typeof localStorage === 'undefined' ? new Map() : loadCache(),
  );
  const [status, setStatus] = useState<WeatherStatus>('idle');

  // The effect reads the cache without depending on it, which would loop.
  const cacheRef = useRef(cache);
  cacheRef.current = cache;

  /** One entry per distinct place: two clocks in a city cost one lookup. */
  const points = useMemo<WeatherPoint[]>(() => {
    if (!state.weather) return [];
    const unique = new Map<string, WeatherPoint>();
    for (const clock of state.clocks) {
      if (clock.lat === null || clock.lon === null) continue;
      const key = pointKey(clock.lat, clock.lon);
      if (!unique.has(key)) unique.set(key, { lat: clock.lat, lon: clock.lon });
    }
    return [...unique.values()];
  }, [state.clocks, state.weather]);

  // A stable string, so adding a clock in a city we already track changes
  // nothing and the effect does not re-run on array identity alone.
  const signature = useMemo(
    () =>
      points
        .map((point) => pointKey(point.lat, point.lon))
        .sort()
        .join('|'),
    [points],
  );

  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!state.weather) {
      setStatus('off');
      return;
    }
    if (points.length === 0) {
      setStatus('idle');
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const run = async () => {
      const now = Date.now();
      const stale = points.filter((point) => {
        const hit = cacheRef.current.get(pointKey(point.lat, point.lon));
        return !hit || now - hit.fetchedMs >= WEATHER_TTL_MS;
      });

      if (stale.length > 0) {
        setStatus('loading');
        try {
          const fresh = await fetchWeather(stale);
          if (cancelled) return;
          setCache((previous) => {
            const next = new Map(previous);
            for (const [key, reading] of fresh) next.set(key, reading);
            saveCache(next);
            return next;
          });
          // An empty response is not an error, but it is not data either.
          setStatus(fresh.size > 0 ? 'ready' : 'error');
        } catch {
          if (cancelled) return;
          // A failed lookup leaves whatever was cached on screen and tries
          // again at the next interval. It never fabricates a reading.
          setStatus('error');
        }
      } else {
        setStatus('ready');
      }

      if (!cancelled) timer = setTimeout(run, WEATHER_TTL_MS);
    };

    void run();

    // Coming back to a tab that sat idle for an hour should not show an hour
    // of stale weather while it waits for the next timer.
    const onVisible = () => {
      if (document.visibilityState === 'visible') void run();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      // A request already on the wire is left to finish and be ignored; it is
      // shared, so aborting it here could cut off another listener.
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [signature, state.weather, points, nonce]);

  const api = useMemo<WeatherApi>(() => {
    let lastUpdatedMs: number | null = null;
    for (const reading of cache.values()) {
      if (lastUpdatedMs === null || reading.fetchedMs > lastUpdatedMs) {
        lastUpdatedMs = reading.fetchedMs;
      }
    }

    return {
      status,
      lastUpdatedMs,
      refresh: () => setNonce((value) => value + 1),
      forClock: (clock) => {
        if (!state.weather || clock.lat === null || clock.lon === null) return null;
        const reading = cache.get(pointKey(clock.lat, clock.lon));
        if (!reading) return null;
        // Stale beyond a full cycle is treated as nothing to show.
        return Date.now() - reading.fetchedMs < WEATHER_TTL_MS * 4 ? reading : null;
      },
    };
  }, [cache, status, state.weather]);

  return <WeatherContext.Provider value={api}>{children}</WeatherContext.Provider>;
}

export function useWeather(): WeatherApi {
  const api = useContext(WeatherContext);
  if (!api) throw new Error('useWeather must be used inside a WeatherProvider');
  return api;
}

/** The reading for one clock, or `null` when there is nothing to show. */
export function useClockWeather(clock: SavedClock): WeatherReading | null {
  return useWeather().forClock(clock);
}
