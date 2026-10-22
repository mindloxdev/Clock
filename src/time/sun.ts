/**
 * Sunrise, sunset and day/night, from real solar geometry.
 *
 * The spec forbids inventing these values, so they come from SunCalc, which
 * implements Meeus' astronomical algorithms (rise/set accurate to ~15 s).
 * Anything that cannot be computed is returned as `null` for the UI to omit
 * rather than guess at.
 */
import * as SunCalc from 'suncalc';

import type { ZonedTime } from './zoned-time';

export interface SunInfo {
  /** Absolute instants, not wall-clock -- format them in the clock's zone. */
  sunriseMs: number | null;
  sunsetMs: number | null;
  /** Set when the sun does not cross the horizon on this local day. */
  polar: 'midnight-sun' | 'polar-night' | null;
}

/** One entry per location per local day; the cache turns over on its own. */
const cache = new Map<string, SunInfo>();
const CACHE_LIMIT = 400;

/**
 * Solar events for the clock's own calendar day.
 *
 * `utcOffset` is what makes that exact: given the zone's offset, SunCalc
 * returns the events of the local civil day containing the instant, so asking
 * at 23:00 in Auckland still gets Auckland's today rather than the solar day
 * straddling midnight.
 */
export function getSunInfo(t: ZonedTime, lat: number, lon: number): SunInfo {
  const key = lat.toFixed(3) + ',' + lon.toFixed(3) + ',' + t.year + '-' + t.month + '-' + t.day;
  const hit = cache.get(key);
  if (hit) return hit;

  const times = SunCalc.getTimes(new Date(t.epochMs), lat, lon, 0, t.offsetMinutes);

  const info: SunInfo = {
    sunriseMs: times.sunrise ? times.sunrise.getTime() : null,
    sunsetMs: times.sunset ? times.sunset.getTime() : null,
    // SunCalc reports the polar cases outright, so there is nothing to infer.
    polar: times.alwaysUp ? 'midnight-sun' : times.alwaysDown ? 'polar-night' : null,
  };

  if (cache.size >= CACHE_LIMIT) cache.clear();
  cache.set(key, info);
  return info;
}

/**
 * Whether it is daylight at a location right now.
 *
 * Decided from the day's own rise and set instants, which keeps the indicator
 * consistent with the two times printed beside it. Deliberately not from
 * `getPosition().altitude`: that is a refraction-corrected *apparent* angle,
 * which reads about -0.35 degrees at the moment SunCalc calls sunrise, so
 * comparing it against any round number would disagree with the displayed
 * times for a minute or so twice a day.
 *
 * Inside the polar circles a day can have a rise but no set, or neither; each
 * of those is handled rather than averaged away.
 */
export function isDaylight(nowMs: number, info: SunInfo): boolean {
  if (info.polar === 'midnight-sun') return true;
  if (info.polar === 'polar-night') return false;

  const { sunriseMs, sunsetMs } = info;
  if (sunriseMs !== null && sunsetMs !== null) {
    return sunriseMs <= sunsetMs
      ? nowMs >= sunriseMs && nowMs < sunsetMs
      : // Set before rise: dark in the middle of the day, light at its ends.
        nowMs < sunsetMs || nowMs >= sunriseMs;
  }
  // A transition day with only one event: the sun rose and stayed up, or
  // started up and set.
  if (sunriseMs !== null) return nowMs >= sunriseMs;
  if (sunsetMs !== null) return nowMs < sunsetMs;
  return false;
}

/**
 * Day/night without coordinates.
 *
 * Used only for zones the dataset has no position for. Local 06:00-18:00 is a
 * crude stand-in, which is exactly why the UI omits sunrise and sunset in
 * that case instead of printing a number it cannot stand behind.
 */
export function isDaylightByHour(t: ZonedTime): boolean {
  return t.hour >= 6 && t.hour < 18;
}
