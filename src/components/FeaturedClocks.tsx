import clsx from 'clsx';
import { Star } from 'lucide-react';
import { useId } from 'react';

import { useAutoClockReading } from '@/hooks/useClockReading';
import { useDashboard } from '@/hooks/useDashboard';
import { DATE_MEDIUM, formatZonedDate } from '@/time/zones';
import type { SavedClock } from '@/time/types';

import { DayNightIcon } from './DayNight';
import { WeatherLine } from './Weather';
import { HeroClock } from './HeroClock';
import { clockPreset } from '@/clocks/registry';
import { citySubtitle } from '@/time/defaults';

import { ClockFace, SIZE_PX } from './clocks/registry';
import { Segmented } from './ui/controls';

/**
 * Per-slot ceiling on a face's drawn size.
 *
 * A clock set to `xl` would otherwise overflow its column once three of them
 * share a row, and the viewer's size choice is about the clock, not about
 * which layout it happens to be sitting in today.
 */
const SIZE_CAP: Record<number, number> = { 1: 360, 2: 296, 3: 232 };

function FeaturedSlot({
  clock,
  index,
  count,
  onEdit,
}: {
  clock: SavedClock;
  index: number;
  count: number;
  onEdit: () => void;
}) {
  const { state, setFeaturedSlot, selectHero } = useDashboard();
  const reading = useAutoClockReading(clock);
  const meta = clockPreset(clock.style);
  const selectId = useId();

  const isPrimary = index === 0;
  const cap = SIZE_CAP[count] ?? 232;
  const size = Math.min(SIZE_PX[clock.prefs.size], cap);
  const date = clock.prefs.showDate ? formatZonedDate(reading.time, DATE_MEDIUM) : null;

  return (
    <li
      className={clsx(
        'flex flex-col gap-4 rounded-card border bg-surface p-5 sm:p-6',
        isPrimary ? 'border-line-strong' : 'border-line',
      )}
    >
      {/* Two of the fifteen faces print their own title; the rest get one. */}
      {meta.selfLabelled ? null : (
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[13px] font-semibold tracking-[-0.005em]">
              <span className="truncate">{clock.title}</span>
              {isPrimary ? (
                <Star size={12} strokeWidth={2.4} aria-label="Main clock" className="shrink-0 text-faint" />
              ) : null}
            </p>
            {citySubtitle(clock) ? (
              <p className="truncate text-[12px] text-muted">{citySubtitle(clock)}</p>
            ) : null}
          </div>
          <span className="flex shrink-0 items-center gap-2.5 text-[11px] text-faint">
            <WeatherLine clock={clock} isDay={reading.isDay} />
            <DayNightIcon isDay={reading.isDay} size={13} labelled />
            {clock.prefs.showOffset ? <span className="tnum">{reading.offsetLabel}</span> : null}
          </span>
        </header>
      )}

      <div className="flex min-h-0 flex-1 items-center justify-center py-1">
        <ClockFace clock={clock} reading={reading} size={size} />
      </div>

      <footer className="space-y-2.5 border-t border-line pt-4">
        <div className="flex items-center justify-between gap-3 text-[12px] text-muted">
          <span className="min-w-0 truncate">{date ?? clock.cityName}</span>
          {isPrimary ? null : (
            <button
              type="button"
              onClick={() => selectHero(clock.id)}
              className="-my-1 shrink-0 cursor-pointer rounded-full px-2.5 py-1.5 font-medium transition-colors duration-150 hover:bg-sunken hover:text-ink"
            >
              Make main
            </button>
          )}
        </div>

        {/* The slot picker gets its own row: three controls on one line left
            the date truncated to "Wed, Oct...". */}
        <div className="flex items-center gap-2">
          <label htmlFor={selectId} className="sr-only">
            {'Clock in position ' + (index + 1)}
          </label>
          <select
            id={selectId}
            value={clock.id}
            onChange={(event) => setFeaturedSlot(index, event.target.value)}
            className="select-arrow min-w-0 flex-1 cursor-pointer appearance-none rounded-full border border-line bg-surface py-1.5 pr-8 pl-3 text-[12px] text-muted transition-colors duration-150 hover:border-line-strong hover:text-ink"
          >
            {state.clocks.map((option) => (
              <option key={option.id} value={option.id}>
                {option.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onEdit}
            className="shrink-0 cursor-pointer rounded-full border border-line px-3 py-1.5 text-[12px] font-medium text-muted transition-colors duration-150 hover:border-line-strong hover:bg-sunken hover:text-ink"
          >
            Edit
          </button>
        </div>
      </footer>
    </li>
  );
}

export interface FeaturedClocksProps {
  onEditClock: (clock: SavedClock) => void;
}

/**
 * The featured area (§6), and the selector that sizes it.
 *
 * One featured clock renders the full-page hero of §3. Two or three render
 * balanced widgets instead, each able to use a different face while the frame
 * around them stays identical -- which is what keeps three different styles
 * from reading as three different designs.
 */
export function FeaturedClocks({ onEditClock }: FeaturedClocksProps) {
  const { state, featured, hero, setFeaturedCount } = useDashboard();

  if (!hero) return null;

  const count = featured.length;
  const maxSelectable = Math.min(3, Math.max(1, state.clocks.length));

  return (
    <>
      <div className="flex items-center justify-end pt-5">
        <Segmented
          size="sm"
          label="Number of featured clocks"
          value={String(count)}
          options={[
            { value: '1', label: '1', srLabel: 'One featured clock' },
            { value: '2', label: '2', srLabel: 'Two featured clocks' },
            { value: '3', label: '3', srLabel: 'Three featured clocks' },
          ].slice(0, maxSelectable)}
          onChange={(value) => setFeaturedCount(Number(value))}
        />
      </div>

      {count <= 1 ? (
        <HeroClock clock={hero} />
      ) : (
        <ul
          className={clsx(
            'grid gap-4 pt-6 pb-10 sm:gap-5 sm:pt-8 sm:pb-14',
            count === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3',
          )}
        >
          {featured.map((clock, index) => (
            <FeaturedSlot
              key={clock.id}
              clock={clock}
              index={index}
              count={count}
              onEdit={() => onEditClock(clock)}
            />
          ))}
        </ul>
      )}
    </>
  );
}
