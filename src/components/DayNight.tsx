import clsx from 'clsx';
import { Moon, Sun, Sunrise, Sunset } from 'lucide-react';

import type { ClockReading } from '@/hooks/useClockReading';
import type { SavedClock } from '@/time/types';
import { formatTime, zonedTime } from '@/time/zones';

export interface DayNightIconProps {
  isDay: boolean;
  size?: number;
  className?: string;
  /** Adds a spoken "Daytime"/"Night-time"; leave off when text says it already. */
  labelled?: boolean;
}

/**
 * The sun/moon indicator. Decorative by default -- the surrounding text
 * usually names the state, and a second announcement would be noise.
 */
export function DayNightIcon({ isDay, size = 14, className, labelled }: DayNightIconProps) {
  const Icon = isDay ? Sun : Moon;
  return (
    <>
      <Icon
        size={size}
        strokeWidth={1.75}
        aria-hidden="true"
        className={clsx('shrink-0', className)}
      />
      {labelled ? <span className="sr-only">{isDay ? 'Daytime' : 'Night-time'}</span> : null}
    </>
  );
}

export interface SunTimesProps {
  clock: SavedClock;
  reading: ClockReading;
}

/**
 * Sunrise and sunset in the clock's own zone.
 *
 * Renders nothing at all when the location has no coordinates, and says so
 * plainly inside the polar circles -- the one thing it will not do is print a
 * time that was not computed.
 */
export function SunTimes({ clock, reading }: SunTimesProps) {
  const { sun } = reading;
  if (!sun) return null;

  if (sun.polar) {
    return (
      <span className="inline-flex items-center gap-1.5 text-muted">
        <Sun size={14} strokeWidth={1.75} aria-hidden="true" />
        {sun.polar === 'midnight-sun' ? 'Midnight sun' : 'Polar night'}
      </span>
    );
  }

  const label = (instant: number) =>
    formatTime(zonedTime(instant, clock.timeZone), reading.hour12, false);

  const sunrise = sun.sunriseMs === null ? null : label(sun.sunriseMs);
  const sunset = sun.sunsetMs === null ? null : label(sun.sunsetMs);
  if (!sunrise && !sunset) return null;

  return (
    <>
      {sunrise ? (
        <span className="inline-flex items-center gap-1.5 text-muted">
          <Sunrise size={14} strokeWidth={1.75} aria-hidden="true" className="text-accent" />
          <span className="sr-only">Sunrise </span>
          <span className="tnum">
            {sunrise.main}
            {sunrise.meridiem ? ' ' + sunrise.meridiem : ''}
          </span>
        </span>
      ) : null}
      {sunset ? (
        <span className="inline-flex items-center gap-1.5 text-muted">
          <Sunset size={14} strokeWidth={1.75} aria-hidden="true" className="text-accent" />
          <span className="sr-only">Sunset </span>
          <span className="tnum">
            {sunset.main}
            {sunset.meridiem ? ' ' + sunset.meridiem : ''}
          </span>
        </span>
      ) : null}
    </>
  );
}
