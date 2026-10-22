import { Plus } from 'lucide-react';

import { useClockReading } from '@/hooks/useClockReading';
import type { SavedClock } from '@/time/types';
import { describeOffsetDifference } from '@/time/zones';

import { Button } from './ui/controls';

export interface CityHeadingProps {
  clock: SavedClock;
  headingId: string;
  onAddCity: () => void;
}

/**
 * The §4 heading: the selected city set large, with a quiet line of context
 * and the add action opposite it.
 *
 * The tagline is computed rather than written, because "5 hours 30 minutes
 * ahead of you" is the thing a reader wants from a world clock -- and it
 * stays true when the selection or the season changes.
 */
export function CityHeading({ clock, headingId, onAddCity }: CityHeadingProps) {
  // A minute is plenty: this line only changes when an offset does.
  const reading = useClockReading(clock, 'minute');
  const relationship = describeOffsetDifference(
    reading.time.offsetMinutes,
    reading.reference.offsetMinutes,
  );

  return (
    <section className="flex flex-col gap-7 py-9 sm:py-12 md:flex-row md:items-end md:justify-between md:gap-12">
      <h2
        id={headingId}
        className="text-[clamp(1.9rem,6.4vw,3.5rem)] leading-[1.04] font-semibold tracking-[-0.035em] text-balance"
      >
        {clock.cityName}
        {clock.country ? (
          <>
            ,<br />
            <span className="text-muted">{clock.country}</span>
          </>
        ) : null}
      </h2>

      <div className="flex shrink-0 flex-col items-start gap-5 md:items-end">
        <div className="max-w-[32ch] space-y-0.5 md:text-right">
          <p className="text-[13px] font-medium text-ink">{reading.zone.name}</p>
          <p className="text-[13px] leading-relaxed text-muted">
            {reading.zone.abbreviation ? reading.zone.abbreviation + ' · ' : ''}
            <span className="tnum">{reading.zone.offset}</span>
            <span className="text-faint">{' · ' + relationship}</span>
          </p>
        </div>
        <Button variant="primary" onClick={onAddCity}>
          <Plus size={16} strokeWidth={2.2} aria-hidden="true" />
          Add Another City
        </Button>
      </div>
    </section>
  );
}
