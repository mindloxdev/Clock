import { useAutoClockReading } from '@/hooks/useClockReading';
import { useDashboard } from '@/hooks/useDashboard';
import type { SavedClock } from '@/time/types';
import { DATE_FULL, formatZonedDate, relativeDayLabel } from '@/time/zones';

import { DayNightIcon, SunTimes } from './DayNight';
import { WeatherLine } from './Weather';
import { ClockFace, SIZE_PX } from './clocks/registry';
import { Segmented } from './ui/controls';

/**
 * The §3 hero: the selected clock at page scale, with the small facts that
 * belong to it underneath.
 *
 * Everything here reads from `featured[0]`, so clicking a city card moves the
 * whole block -- time, date, sunrise, day/night -- to that clock at once.
 */
export function HeroClock({ clock }: { clock: SavedClock }) {
  const reading = useAutoClockReading(clock);
  const { state, setHour12, updateClock } = useDashboard();

  const date = formatZonedDate(reading.time, DATE_FULL);
  const relativeDay = relativeDayLabel(reading.time, reading.reference);

  // The digital faces size themselves from the viewport clamp; the dials and
  // the circular faces take a px basis, so the hero slot scales theirs up --
  // capped so a dial still fits a 375px screen's gutters.
  const heroSize = Math.min(Math.round(SIZE_PX[clock.prefs.size] * 1.3), 340);

  return (
    <section aria-label={'Selected clock: ' + clock.title} className="pt-8 pb-10 sm:pt-12 sm:pb-14">
      {/* The clamp keeps the widest string inside the gutters; the guard here
          is for the few faces that size themselves from a px basis. */}
      <div className="flex w-full justify-center overflow-hidden">
        <ClockFace clock={clock} reading={reading} hero size={heroSize} />
      </div>

      <div className="mt-8 flex flex-col items-center gap-4 sm:mt-11">
        <p className="flex items-center gap-2.5 text-[11px] font-medium tracking-[0.2em] text-faint uppercase">
          <span>Current</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5">
            <DayNightIcon isDay={reading.isDay} size={13} />
            {reading.isDay ? 'Day' : 'Night'}
          </span>
        </p>

        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-[15px] text-muted sm:text-[16px]">
          <span>{date}</span>
          {relativeDay ? (
            <span className="rounded-full border border-line px-2.5 py-0.5 text-[11px] font-medium tracking-[0.08em] text-faint uppercase">
              {relativeDay} for you
            </span>
          ) : null}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px]">
          <WeatherLine
            clock={clock}
            isDay={reading.isDay}
            variant="full"
            className="gap-2 text-muted"
          />
          <SunTimes clock={clock} reading={reading} />
        </div>

        <Segmented
          label="Time format"
          className="mt-1"
          value={reading.hour12 ? '12' : '24'}
          options={[
            { value: '12', label: '12h', srLabel: '12-hour' },
            { value: '24', label: '24h', srLabel: '24-hour' },
          ]}
          onChange={(value) => {
            const hour12 = value === '12';
            setHour12(hour12);
            // This clock may carry its own format override, in which case the
            // dashboard default alone would not move the display the toggle
            // sits under. Clearing it makes the control do what it says.
            if (clock.prefs.hour12 !== null && clock.prefs.hour12 !== hour12) {
              updateClock(clock.id, { prefs: { hour12: null } });
            }
          }}
        />
        {state.clocks.length > 1 ? (
          <p className="sr-only" aria-live="polite">
            {'Showing ' + clock.title + ', ' + clock.cityName}
          </p>
        ) : null}
      </div>
    </section>
  );
}
