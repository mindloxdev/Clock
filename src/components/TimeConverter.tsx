import clsx from 'clsx';
import { TriangleAlert } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';

import { useDashboard } from '@/hooks/useDashboard';
import { zoneLabel } from '@/time/abbreviations';
import { citySubtitle } from '@/time/defaults';
import { useNow } from '@/hooks/useNow';
import {
  formatOffsetDelta,
  instantFromWallTime,
  parseWallTime,
  wallTimeInputs,
} from '@/time/convert';
import { getSunInfo, isDaylight, isDaylightByHour } from '@/time/sun';
import type { SavedClock } from '@/time/types';
import {
  DATE_MEDIUM,
  dayDifference,
  formatTime,
  formatZonedDate,
  zonedTime,
} from '@/time/zones';

import { DayNightIcon } from './DayNight';
import { Dialog } from './ui/Dialog';
import { Button, Field, inputClass } from './ui/controls';

const DAY_MS = 86400000;

function ResultRow({
  clock,
  instantMs,
  sourceZone,
  isSource,
  hour12,
}: {
  clock: SavedClock;
  instantMs: number;
  /** The zone the reading was entered in, for the day and offset deltas. */
  sourceZone: string;
  isSource: boolean;
  hour12: boolean;
}) {
  const time = zonedTime(instantMs, clock.timeZone);
  const sourceTime = zonedTime(instantMs, sourceZone);
  const shown = formatTime(time, hour12, false);

  // Both read the same instant, so any difference in date is the whole point:
  // 5pm Tuesday in New York is 2am *Wednesday* in Karachi.
  const dayDelta = dayDifference(time, sourceTime);
  const offsetDelta = time.offsetMinutes - sourceTime.offsetMinutes;
  const city = citySubtitle(clock);
  const zone = zoneLabel(clock.timeZone, instantMs, time.offsetMinutes);

  return (
    <li
      className={clsx(
        'flex items-center justify-between gap-4 rounded-card border px-4 py-3',
        isSource ? 'border-ink bg-sunken' : 'border-line bg-surface',
      )}
    >
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <span className="truncate">{clock.title}</span>
          {isSource ? (
            <span className="shrink-0 rounded-full border border-line-strong px-2 py-0.5 text-[10px] font-medium tracking-[0.08em] text-muted uppercase">
              From
            </span>
          ) : null}
        </p>
        <p className="truncate text-[12px] text-muted">
          {city ? city + ' · ' : ''}
          {/* The zone as it will be named at that moment, not as it is now:
              5pm in November is EST even when today is EDT. */}
          <span title={zone.name}>{zone.short}</span>
          <span className="text-faint">
            {isSource ? null : ' · ' + formatOffsetDelta(offsetDelta)}
          </span>
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="tnum flex items-baseline justify-end gap-1.5 text-[22px] leading-none font-semibold text-ink">
          {shown.main}
          {shown.meridiem ? (
            <span className="text-[12px] font-medium text-muted">{shown.meridiem}</span>
          ) : null}
          {dayDelta !== 0 ? (
            <span className="rounded-full border border-line-strong px-2 py-0.5 text-[10px] font-medium tracking-[0.06em] text-muted">
              {dayDelta > 0 ? '+' : '−'}
              {Math.abs(dayDelta)}d
            </span>
          ) : null}
        </p>
        <p className="mt-1.5 flex items-center justify-end gap-1.5 text-[11px] text-muted">
          <DayNightIcon isDay={dayNightAt(clock, instantMs)} size={12} labelled />
          {formatZonedDate(time, DATE_MEDIUM)}
        </p>
      </div>
    </li>
  );
}

/** Day or night at a *future* moment, from the same solar maths as the cards. */
function dayNightAt(clock: SavedClock, instantMs: number): boolean {
  const time = zonedTime(instantMs, clock.timeZone);
  if (clock.lat === null || clock.lon === null) return isDaylightByHour(time);
  return isDaylight(instantMs, getSunInfo(time, clock.lat, clock.lon));
}

export interface TimeConverterProps {
  open: boolean;
  onClose: () => void;
}

/**
 * "What time will it be there?"
 *
 * Pick a clock, a date and a time, and every other clock shows what it will
 * read at that same instant. The conversion goes through
 * `instantFromWallTime`, so the two days a year when a reading is skipped or
 * repeated are called out rather than silently resolved.
 */
export function TimeConverter({ open, onClose }: TimeConverterProps) {
  const { state, hero } = useDashboard();
  // A minute is enough: this only drives the "Now" default and the live clock.
  const nowMs = useNow('minute');

  const [sourceId, setSourceId] = useState<string>('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [occurrence, setOccurrence] = useState<'first' | 'second'>('first');

  const sourceSelectId = useId();
  const dateId = useId();
  const timeId = useId();

  const source =
    state.clocks.find((clock) => clock.id === sourceId) ?? hero ?? state.clocks[0] ?? null;

  // Opening the dialog starts from the selected clock, right now.
  useEffect(() => {
    if (!open) return;
    const start = hero ?? state.clocks[0] ?? null;
    if (!start) return;
    const fields = wallTimeInputs(Date.now(), start.timeZone);
    setSourceId(start.id);
    setDate(fields.date);
    setTime(fields.time);
    setOccurrence('first');
  }, [open, hero, state.clocks]);

  const wall = useMemo(() => parseWallTime(date, time), [date, time]);
  const resolved = useMemo(
    () => (wall && source ? instantFromWallTime(wall, source.timeZone) : null),
    [wall, source],
  );

  const instantMs =
    resolved === null
      ? null
      : resolved.kind === 'ambiguous' && occurrence === 'second'
        ? (resolved.laterMs ?? resolved.epochMs)
        : resolved.epochMs;

  /** Shifts the date field by whole days, staying in the source zone. */
  const nudgeDays = (days: number) => {
    if (!source || instantMs === null) return;
    const fields = wallTimeInputs(instantMs + days * DAY_MS, source.timeZone);
    setDate(fields.date);
    setTime(fields.time);
    setOccurrence('first');
  };

  const resetToNow = () => {
    if (!source) return;
    const fields = wallTimeInputs(Date.now(), source.timeZone);
    setDate(fields.date);
    setTime(fields.time);
    setOccurrence('first');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Compare times"
      description="Pick a moment in one city and see it in all of them."
      size="lg"
      footer={<Button onClick={onClose}>Done</Button>}
    >
      {state.clocks.length === 0 || !source ? (
        <p className="py-6 text-center text-[13px] text-muted">
          Add a city first and its time will show up here.
        </p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_0.8fr]">
            <Field label="When it is" htmlFor={sourceSelectId}>
              <select
                id={sourceSelectId}
                value={source.id}
                onChange={(event) => setSourceId(event.target.value)}
                className={clsx(inputClass, 'select-arrow cursor-pointer appearance-none pr-10')}
              >
                {state.clocks.map((clock) => {
                  const city = citySubtitle(clock);
                  return (
                    <option key={clock.id} value={clock.id}>
                      {city ? clock.title + ' — ' + city : clock.title}
                    </option>
                  );
                })}
              </select>
            </Field>

            <Field label="On" htmlFor={dateId}>
              <input
                id={dateId}
                type="date"
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setOccurrence('first');
                }}
                className={clsx(inputClass, 'cursor-pointer')}
              />
            </Field>

            <Field label="At" htmlFor={timeId}>
              <input
                id={timeId}
                type="time"
                value={time}
                onChange={(event) => {
                  setTime(event.target.value);
                  setOccurrence('first');
                }}
                className={clsx(inputClass, 'cursor-pointer')}
              />
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={resetToNow}>
              Now
            </Button>
            <Button size="sm" onClick={() => nudgeDays(-1)}>
              −1 day
            </Button>
            <Button size="sm" onClick={() => nudgeDays(1)}>
              +1 day
            </Button>
          </div>

          {/* The two days a year the question has no single answer. */}
          {resolved?.kind === 'skipped' && resolved.landedOn ? (
            <p className="flex items-start gap-2.5 rounded-card border border-line-strong bg-sunken px-4 py-3 text-[12px] leading-relaxed text-ink">
              <TriangleAlert size={15} strokeWidth={2} aria-hidden="true" className="mt-0.5 shrink-0" />
              <span>
                That time does not exist in {source.cityName} — the clocks jump forward that day.
                Showing{' '}
                <strong className="font-semibold">
                  {String(resolved.landedOn.hour).padStart(2, '0')}:
                  {String(resolved.landedOn.minute).padStart(2, '0')}
                </strong>{' '}
                instead, where they land.
              </span>
            </p>
          ) : null}

          {resolved?.kind === 'ambiguous' ? (
            <div className="flex flex-wrap items-center gap-3 rounded-card border border-line-strong bg-sunken px-4 py-3 text-[12px] leading-relaxed text-ink">
              <TriangleAlert size={15} strokeWidth={2} aria-hidden="true" className="shrink-0" />
              <span className="min-w-0 flex-1">
                That time happens twice in {source.cityName} — the clocks go back that day.
              </span>
              <span className="flex shrink-0 gap-1.5">
                <Button
                  size="sm"
                  variant={occurrence === 'first' ? 'primary' : 'secondary'}
                  onClick={() => setOccurrence('first')}
                >
                  First
                </Button>
                <Button
                  size="sm"
                  variant={occurrence === 'second' ? 'primary' : 'secondary'}
                  onClick={() => setOccurrence('second')}
                >
                  Second
                </Button>
              </span>
            </div>
          ) : null}

          {instantMs === null ? (
            <p className="py-4 text-center text-[13px] text-muted">
              Choose a date and a time to compare.
            </p>
          ) : (
            <>
              <p className="text-[12px] text-muted" aria-live="polite">
                {instantMs < nowMs - 60000
                  ? 'In the past'
                  : instantMs > nowMs + 60000
                    ? 'In the future'
                    : 'Right about now'}
                {' · '}
                {formatZonedDate(zonedTime(instantMs, source.timeZone), DATE_MEDIUM)}
              </p>

              <ul className="space-y-2">
                {state.clocks.map((clock) => (
                  <ResultRow
                    key={clock.id}
                    clock={clock}
                    instantMs={instantMs}
                    sourceZone={source.timeZone}
                    isSource={clock.id === source.id}
                    hour12={state.hour12}
                  />
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </Dialog>
  );
}
