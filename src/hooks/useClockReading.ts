import { clockKind } from '@/clocks/registry';
import { zoneLabel, type ZoneLabel } from '@/time/abbreviations';
import { getSunInfo, isDaylight, isDaylightByHour, type SunInfo } from '@/time/sun';
import type { SavedClock } from '@/time/types';
import { formatOffset, viewerTimeZone, zonedTime, type ZonedTime } from '@/time/zones';

import { useNow, type TickRate } from './useNow';
import { useReducedMotion } from './useReducedMotion';
import { useDashboard } from './useDashboard';

export interface ClockReading {
  time: ZonedTime;
  /** The viewer's own current time, for "Tomorrow"/"Yesterday" badges. */
  reference: ZonedTime;
  /** `null` when the location has no coordinates to compute from. */
  sun: SunInfo | null;
  isDay: boolean;
  offsetLabel: string;
  /** What to call this zone right now: `Pakistan Standard Time`, `PKT`. */
  zone: ZoneLabel;
  /** The clock's own override, or the dashboard default. */
  hour12: boolean;
  showSeconds: boolean;
}

/**
 * How often a face needs to redraw.
 *
 * Only a sweeping second hand justifies a frame loop. Everything else is a
 * second, and a face with no seconds at all drops to a minute -- which is 60
 * renders a minute saved per clock on a dashboard full of them.
 */
export function tickRateFor(clock: SavedClock, reducedMotion: boolean): TickRate {
  if (clockKind(clock.style) === 'analog') {
    if (!clock.prefs.secondHand) return 'minute';
    return reducedMotion ? 'second' : 'frame';
  }
  return clock.prefs.showSeconds ? 'second' : 'minute';
}

/**
 * Everything a face needs to draw itself, recomputed at the clock's own rate.
 *
 * The `rate` is a parameter rather than derived here so a caller can pin it:
 * the compact city cards tick once a second whatever face style the clock is
 * configured with, because the card never draws hands.
 */
export function useClockReading(clock: SavedClock, rate: TickRate): ClockReading {
  const { state } = useDashboard();
  const nowMs = useNow(rate);

  const time = zonedTime(nowMs, clock.timeZone);
  const reference = zonedTime(nowMs, viewerTimeZone());

  const hasCoordinates = clock.lat !== null && clock.lon !== null;
  const sun = hasCoordinates ? getSunInfo(time, clock.lat as number, clock.lon as number) : null;
  const isDay = sun ? isDaylight(nowMs, sun) : isDaylightByHour(time);

  return {
    time,
    reference,
    sun,
    isDay,
    offsetLabel: formatOffset(time.offsetMinutes),
    zone: zoneLabel(clock.timeZone, nowMs, time.offsetMinutes),
    hour12: clock.prefs.hour12 ?? state.hour12,
    showSeconds: clock.prefs.showSeconds,
  };
}

/** `useClockReading` with the rate chosen from the clock's own style. */
export function useAutoClockReading(clock: SavedClock): ClockReading {
  const reducedMotion = useReducedMotion();
  return useClockReading(clock, tickRateFor(clock, reducedMotion));
}
