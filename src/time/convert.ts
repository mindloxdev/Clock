/**
 * The other direction: from a wall-clock reading in some zone back to an
 * instant.
 *
 * Everything else in this app goes instant -> wall clock, which is always
 * well defined. This direction is not. Twice a year a zone skips an hour, so
 * a time like 02:30 simply does not happen; and twice a year it repeats one,
 * so 01:30 happens twice. A converter that quietly picked one and said
 * nothing would be wrong in exactly the cases people most need it to be
 * right -- so both are detected and reported.
 */
import { offsetMinutesOf, zonedTime } from './zones';

export interface WallTime {
  year: number;
  /** 1-12. */
  month: number;
  day: number;
  /** 0-23. */
  hour: number;
  minute: number;
}

export type InstantKind =
  /** One instant, no ambiguity. */
  | 'exact'
  /** The clocks jumped over this reading; it never occurs. */
  | 'skipped'
  /** The clocks repeated this reading; it occurs twice. */
  | 'ambiguous';

export interface ResolvedInstant {
  /** Always usable: for `skipped`, where the clocks actually landed. */
  epochMs: number;
  kind: InstantKind;
  /** For `skipped`: what the clocks read at `epochMs` instead. */
  landedOn?: WallTime;
  /** For `ambiguous`: both instants, earliest first. */
  earlierMs?: number;
  laterMs?: number;
}

const DAY_MS = 86400000;

function wallOf(epochMs: number, timeZone: string): WallTime {
  const t = zonedTime(epochMs, timeZone);
  return { year: t.year, month: t.month, day: t.day, hour: t.hour, minute: t.minute };
}

function sameWall(a: WallTime, b: WallTime): boolean {
  return (
    a.year === b.year &&
    a.month === b.month &&
    a.day === b.day &&
    a.hour === b.hour &&
    a.minute === b.minute
  );
}

/**
 * Finds the instant at which `timeZone` reads `wall`.
 *
 * The zone's offset is sampled a day either side of the target, which
 * brackets any transition; each offset gives a candidate instant, and a
 * candidate only counts if converting it back actually produces the time that
 * was asked for. Two survivors means the reading happens twice; none means it
 * never happens at all.
 */
export function instantFromWallTime(wall: WallTime, timeZone: string): ResolvedInstant {
  const asIfUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute);

  const offsetBefore = offsetMinutesOf(timeZone, asIfUtc - DAY_MS);
  const offsetAfter = offsetMinutesOf(timeZone, asIfUtc + DAY_MS);

  const candidates = [...new Set([asIfUtc - offsetBefore * 60000, asIfUtc - offsetAfter * 60000])];
  const valid = candidates.filter((ms) => sameWall(wallOf(ms, timeZone), wall)).sort((a, b) => a - b);

  if (valid.length === 0) {
    // A gap. The later candidate is the one on the far side of it, which is
    // where a clock showing this reading would actually have ended up.
    const landedMs = Math.max(...candidates);
    return { epochMs: landedMs, kind: 'skipped', landedOn: wallOf(landedMs, timeZone) };
  }

  const earliest = valid[0] as number;
  if (valid.length > 1) {
    const latest = valid[valid.length - 1] as number;
    return { epochMs: earliest, kind: 'ambiguous', earlierMs: earliest, laterMs: latest };
  }

  return { epochMs: earliest, kind: 'exact' };
}

/** Parses the `YYYY-MM-DD` and `HH:MM` an `<input>` gives us. */
export function parseWallTime(date: string, time: string): WallTime | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})/.exec(time);
  if (!dateMatch || !timeMatch) return null;

  const wall: WallTime = {
    year: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
  };

  // Reject 31 February rather than letting Date.UTC roll it into March.
  if (wall.month < 1 || wall.month > 12 || wall.day < 1 || wall.day > 31) return null;
  if (wall.hour > 23 || wall.minute > 59) return null;
  const probe = new Date(Date.UTC(wall.year, wall.month - 1, wall.day));
  if (probe.getUTCMonth() !== wall.month - 1 || probe.getUTCDate() !== wall.day) return null;

  return wall;
}

/** The `YYYY-MM-DD` and `HH:MM` strings for an instant, as a zone reads it. */
export function wallTimeInputs(epochMs: number, timeZone: string): { date: string; time: string } {
  const t = zonedTime(epochMs, timeZone);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: t.year + '-' + pad(t.month) + '-' + pad(t.day),
    time: pad(t.hour) + ':' + pad(t.minute),
  };
}

/**
 * How far one zone sits from another at a given moment, as a short chip:
 * `+5h 30m`, `−4h`, `same time`.
 */
export function formatOffsetDelta(minutes: number): string {
  if (minutes === 0) return 'same time';
  const sign = minutes > 0 ? '+' : '−';
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const rest = abs % 60;
  if (hours === 0) return sign + rest + 'm';
  return sign + hours + 'h' + (rest ? ' ' + rest + 'm' : '');
}
