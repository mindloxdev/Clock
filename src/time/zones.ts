/**
 * Time-zone arithmetic, built on `Intl.DateTimeFormat` and IANA identifiers.
 *
 * Nothing here hand-rolls a UTC offset table: the platform already ships
 * tzdata, including every daylight-saving rule, so every value below is
 * derived from a formatter rather than assumed.
 */
import type { ZonedTime } from './zoned-time';

export type { ZonedTime } from './zoned-time';

/**
 * `en-US` with `h23` is a parsing locale, not a display one -- it guarantees
 * ASCII digits and a 0-23 hour whatever locale the viewer is in. Formatters
 * are expensive to construct and cheap to reuse, and a clock would otherwise
 * build one on every tick, so they are cached for the life of the page.
 */
const numericFormatters = new Map<string, Intl.DateTimeFormat>();

function numericFormatter(timeZone: string): Intl.DateTimeFormat {
  let fmt = numericFormatters.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    numericFormatters.set(timeZone, fmt);
  }
  return fmt;
}

export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** The viewer's own zone, falling back to UTC on engines that hide it. */
export function localTimeZone(): string {
  const resolved = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  return resolved && isValidTimeZone(resolved) ? resolved : 'UTC';
}

let viewerZone: string | null = null;

/**
 * The viewer's zone, resolved once. It is the reference for "Tomorrow" and
 * "Yesterday" badges, so it has to be the same value everywhere on the page.
 */
export function viewerTimeZone(): string {
  viewerZone ??= localTimeZone();
  return viewerZone;
}

/**
 * Breaks an instant into the wall-clock fields of `timeZone`.
 *
 * `asIfUtcMs` carries those same fields re-pinned to UTC. Display formatters
 * then run against it with `timeZone: 'UTC'`, which is what lets a single
 * formatter render any zone's date without being dragged back to the viewer's
 * offset -- and it yields the weekday for free via `getUTCDay`.
 */
export function zonedTime(epochMs: number, timeZone: string): ZonedTime {
  const parts = numericFormatter(timeZone).formatToParts(new Date(epochMs));

  let year = 1970;
  let month = 1;
  let day = 1;
  let hour = 0;
  let minute = 0;
  let second = 0;

  for (const part of parts) {
    switch (part.type) {
      case 'year':
        year = Number(part.value);
        break;
      case 'month':
        month = Number(part.value);
        break;
      case 'day':
        day = Number(part.value);
        break;
      case 'hour':
        hour = Number(part.value);
        break;
      case 'minute':
        minute = Number(part.value);
        break;
      case 'second':
        second = Number(part.value);
        break;
      default:
        break;
    }
  }

  // Some engines still report midnight as hour 24 under an h23 request.
  if (hour === 24) hour = 0;

  const asIfUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);

  // Comparing the zone's wall clock against the same instant truncated to a
  // whole second gives the offset the zone is actually on right now, DST
  // included, with no table of our own to keep up to date.
  const offsetMinutes = Math.round((asIfUtcMs - Math.floor(epochMs / 1000) * 1000) / 60000);

  return {
    timeZone,
    epochMs,
    asIfUtcMs,
    year,
    month,
    day,
    hour,
    minute,
    second,
    millisecond: ((epochMs % 1000) + 1000) % 1000,
    weekdayIndex: new Date(asIfUtcMs).getUTCDay(),
    offsetMinutes,
  };
}

/** Current offset of a zone, in minutes east of UTC. */
export function offsetMinutesOf(timeZone: string, epochMs: number): number {
  return zonedTime(epochMs, timeZone).offsetMinutes;
}

/** `UTC+5:30`, `UTC-3` with a real minus sign, or plain `UTC` at zero. */
export function formatOffset(offsetMinutes: number): string {
  if (offsetMinutes === 0) return 'UTC';
  const sign = offsetMinutes > 0 ? '+' : '−';
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  return minutes === 0
    ? 'UTC' + sign + hours
    : 'UTC' + sign + hours + ':' + String(minutes).padStart(2, '0');
}

export interface TimeParts {
  /** Zero-padded, two digits, in both formats. */
  hh: string;
  mm: string;
  ss: string;
  /** `AM`/`PM` in 12-hour mode, otherwise `null`. */
  meridiem: string | null;
}

/**
 * The time as separate fields, for faces that lay the digits out themselves --
 * the flip tiles, the stacked typographic face.
 *
 * Hours are zero-padded in 12-hour mode too. An oversized hero clock that
 * drops a glyph at 9:59 -> 10:00 visibly jumps even with tabular numerals,
 * and the spec is explicit that the time must never shift the layout.
 */
export function timeParts(t: ZonedTime, hour12: boolean): TimeParts {
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    hh: pad(hour12 ? t.hour % 12 || 12 : t.hour),
    mm: pad(t.minute),
    ss: pad(t.second),
    meridiem: hour12 ? (t.hour < 12 ? 'AM' : 'PM') : null,
  };
}

export interface TimeText {
  /** `08:15:40`, assembled from `timeParts`. */
  main: string;
  meridiem: string | null;
}

/** The joined form: one source of truth for padding, shared with `timeParts`. */
export function formatTime(t: ZonedTime, hour12: boolean, showSeconds: boolean): TimeText {
  const { hh, mm, ss, meridiem } = timeParts(t, hour12);
  return { main: showSeconds ? hh + ':' + mm + ':' + ss : hh + ':' + mm, meridiem };
}

const dateFormatters = new Map<string, Intl.DateTimeFormat>();

/**
 * Formats a zone's own calendar date in the viewer's locale.
 *
 * The instant handed to the formatter is `asIfUtcMs`, so `timeZone: 'UTC'`
 * here is not a shortcut -- it is what pins the output to the clock's zone
 * instead of the viewer's.
 */
export function formatZonedDate(t: ZonedTime, options: Intl.DateTimeFormatOptions): string {
  const key = JSON.stringify(options);
  let fmt = dateFormatters.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(undefined, { ...options, timeZone: 'UTC' });
    dateFormatters.set(key, fmt);
  }
  return fmt.format(new Date(t.asIfUtcMs));
}

export const DATE_FULL: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
};

export const DATE_MEDIUM: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
};

export const DATE_SHORT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
};

/** Whole days between two zones' current calendar dates. */
export function dayDifference(a: ZonedTime, b: ZonedTime): number {
  const dayMs = 86400000;
  return Math.floor(a.asIfUtcMs / dayMs) - Math.floor(b.asIfUtcMs / dayMs);
}

/** `Yesterday` / `Tomorrow` relative to a reference zone; `null` on the same day. */
export function relativeDayLabel(clock: ZonedTime, reference: ZonedTime): string | null {
  switch (dayDifference(clock, reference)) {
    case -1:
      return 'Yesterday';
    case 1:
      return 'Tomorrow';
    default:
      return null;
  }
}

/**
 * How far a clock's zone sits from the viewer's, in words.
 *
 * Phrased as a relationship rather than a raw offset, since "5 hours ahead of
 * you" is the thing a reader actually wanted to know. Half- and quarter-hour
 * zones are covered, so Kolkata reads "5 hours 30 minutes ahead of you".
 */
export function describeOffsetDifference(clockOffset: number, viewerOffset: number): string {
  const delta = clockOffset - viewerOffset;
  if (delta === 0) return 'Same time as you';

  const abs = Math.abs(delta);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  const parts: string[] = [];
  if (hours) parts.push(hours + (hours === 1 ? ' hour' : ' hours'));
  if (minutes) parts.push(minutes + (minutes === 1 ? ' minute' : ' minutes'));

  return parts.join(' ') + (delta > 0 ? ' ahead of you' : ' behind you');
}

export interface HandAngles {
  hour: number;
  minute: number;
  second: number;
}

/**
 * Degrees clockwise from twelve for each hand. The hour and minute hands
 * always creep continuously -- a real clock's hour hand sits between numerals
 * at half past. Only the second hand chooses between a sweep and a tick,
 * because that is the one a reduced-motion viewer reads as animation.
 *
 * `dialHours` of 24 is a real 24-hour dial: the hour hand makes one turn a
 * day at 15 degrees an hour, with midnight at the top.
 */
export function handAngles(
  t: ZonedTime,
  smoothSeconds: boolean,
  dialHours: 12 | 24 = 12,
): HandAngles {
  const seconds = t.second + (smoothSeconds ? t.millisecond / 1000 : 0);
  const minutes = t.minute + seconds / 60;
  const hour =
    dialHours === 24
      ? (t.hour + minutes / 60) * 15
      : ((t.hour % 12) + minutes / 60) * 30;
  return { hour, minute: minutes * 6, second: seconds * 6 };
}

/** Fraction of the local day elapsed, for progress-ring faces. */
export function dayProgress(t: ZonedTime): number {
  return (t.hour * 3600 + t.minute * 60 + t.second + t.millisecond / 1000) / 86400;
}
