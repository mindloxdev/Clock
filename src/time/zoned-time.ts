/**
 * The shape `zonedTime` produces. Split into its own module so consumers can
 * import the type without pulling in the formatter caches.
 */
export interface ZonedTime {
  timeZone: string;
  /** The instant this was computed from. */
  epochMs: number;
  /** The same wall-clock fields re-pinned to UTC; see `zonedTime`. */
  asIfUtcMs: number;
  year: number;
  /** 1-12. */
  month: number;
  day: number;
  /** 0-23. */
  hour: number;
  minute: number;
  second: number;
  /** Fraction within the current second, for sweeping hands. */
  millisecond: number;
  /** 0 = Sunday. */
  weekdayIndex: number;
  /** Minutes east of UTC, as the zone stands at `epochMs`. */
  offsetMinutes: number;
}
