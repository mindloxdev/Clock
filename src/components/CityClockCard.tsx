import clsx from 'clsx';
import { Ellipsis } from 'lucide-react';

import { useClockReading } from '@/hooks/useClockReading';
import { citySubtitle } from '@/time/defaults';
import type { SavedClock } from '@/time/types';
import { DATE_SHORT, formatTime, formatZonedDate, relativeDayLabel } from '@/time/zones';

import { DayNightIcon } from './DayNight';
import { WeatherLine } from './Weather';

export interface CityClockCardProps {
  clock: SavedClock;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
}

/**
 * A compact city card (§5).
 *
 * The card always shows the same anatomy -- title, city, time, offset,
 * day/night -- whatever face style the clock itself is set to, so the row
 * stays scannable even when the featured clocks are analog.
 *
 * The whole card is one hit target *and* it carries its own settings button,
 * which a `<button>` wrapping a `<button>` cannot express. So the select
 * action is a full-bleed button underneath, the content above it is
 * pointer-transparent, and the settings button sits above both.
 */
export function CityClockCard({ clock, selected, onSelect, onEdit }: CityClockCardProps) {
  const reading = useClockReading(clock, clock.prefs.showSeconds ? 'second' : 'minute');
  const { main, meridiem } = formatTime(reading.time, reading.hour12, reading.showSeconds);
  const relativeDay = relativeDayLabel(reading.time, reading.reference);
  const date = clock.prefs.showDate ? formatZonedDate(reading.time, DATE_SHORT) : null;

  const secondary = selected ? 'text-muted-invert' : 'text-muted';
  const tertiary = selected ? 'text-muted-invert' : 'text-faint';

  return (
    <div
      className={clsx(
        'relative rounded-card border transition-colors duration-200',
        selected
          ? 'border-invert bg-invert text-on-invert'
          : 'border-line bg-surface text-ink hover:border-line-strong',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="absolute inset-0 z-10 cursor-pointer rounded-card"
      >
        <span className="sr-only">
          {'Show ' + clock.title + ' (' + clock.cityName + ') as the main clock'}
        </span>
      </button>

      <div className="pointer-events-none relative z-20 flex flex-col gap-3 p-4 sm:p-5">
        <div className="min-w-0 pr-8">
          <p className="truncate text-[13px] font-semibold tracking-[-0.005em]">{clock.title}</p>
          {citySubtitle(clock) ? (
            <p className={clsx('truncate text-[12px]', secondary)}>{citySubtitle(clock)}</p>
          ) : null}
        </div>

        <p className="tnum flex items-baseline text-[clamp(1.6rem,6vw,2rem)] leading-none font-semibold tracking-[-0.035em]">
          {main}
          {meridiem ? (
            <span className={clsx('ml-1.5 text-[0.45em] font-medium', secondary)}>{meridiem}</span>
          ) : null}
        </p>

        <div className={clsx('flex items-center justify-between gap-2 text-[11px]', tertiary)}>
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <DayNightIcon isDay={reading.isDay} size={13} labelled />
            <span className="truncate">{relativeDay ?? date ?? clock.cityName}</span>
          </span>
          {clock.prefs.showOffset ? <span className="tnum shrink-0">{reading.zone.short}</span> : null}
        </div>

        {/* Renders nothing when there is no reading to show. */}
        <WeatherLine clock={clock} isDay={reading.isDay} className={clsx('text-[11px]', tertiary)} />
      </div>

      <button
        type="button"
        onClick={onEdit}
        aria-label={'Settings for ' + clock.title}
        title={'Settings for ' + clock.title}
        className={clsx(
          'absolute top-2.5 right-2.5 z-30 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors duration-150',
          selected
            ? 'text-muted-invert hover:bg-white/15 hover:text-on-invert'
            : 'text-faint hover:bg-sunken hover:text-ink',
        )}
      >
        <Ellipsis size={16} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}
