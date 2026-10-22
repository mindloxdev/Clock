import clsx from 'clsx';
import { Plus, Search, TriangleAlert, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { useDashboard } from '@/hooks/useDashboard';
import { zoneLabel } from '@/time/abbreviations';
import { citiesIfLoaded, describeCity, loadCities, searchCities, type City } from '@/time/cities';
import { citySubtitle, createClock } from '@/time/defaults';
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
import { Button, Field, IconButton, inputClass } from './ui/controls';

const DAY_MS = 86400000;

function ResultRow({
  clock,
  instantMs,
  sourceZone,
  isSource,
  hour12,
  onRemove,
  onKeep,
}: {
  clock: SavedClock;
  instantMs: number;
  /** The zone the reading was entered in, for the day and offset deltas. */
  sourceZone: string;
  isSource: boolean;
  hour12: boolean;
  /** Set for a city added just for this comparison. */
  onRemove?: () => void;
  onKeep?: () => void;
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
          {onRemove ? (
            <span className="shrink-0 rounded-full border border-dashed border-line-strong px-2 py-0.5 text-[10px] font-medium tracking-[0.08em] text-faint uppercase">
              Just this once
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

      {onRemove ? (
        <span className="order-last flex shrink-0 items-center gap-0.5">
          <IconButton label={'Keep ' + clock.cityName + ' on the dashboard'} onClick={onKeep}>
            <Plus size={15} strokeWidth={2} aria-hidden="true" />
          </IconButton>
          <IconButton label={'Remove ' + clock.cityName + ' from the comparison'} onClick={onRemove}>
            <X size={15} strokeWidth={2} aria-hidden="true" />
          </IconButton>
        </span>
      ) : null}

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
  const { state, hero, addClock } = useDashboard();
  // A minute is enough: this only drives the "Now" default and the live clock.
  const nowMs = useNow('minute');

  const [sourceId, setSourceId] = useState<string>('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [occurrence, setOccurrence] = useState<'first' | 'second'>('first');

  /*
    Cities pulled in just to answer one question. They are real clocks for
    rendering purposes but are never saved: comparing against a city should
    not mean committing it to the dashboard. They outlive a close so the
    comparison is still there when the dialog is reopened.
  */
  const [extras, setExtras] = useState<SavedClock[]>([]);
  const [cityQuery, setCityQuery] = useState('');
  const [cities, setCities] = useState<City[] | null>(citiesIfLoaded);

  const sourceSelectId = useId();
  const citySearchId = useId();
  const dateId = useId();
  const timeId = useId();

  /** Saved clocks first, then anything added for this comparison. */
  const allClocks = useMemo(() => [...state.clocks, ...extras], [state.clocks, extras]);

  const source = allClocks.find((clock) => clock.id === sourceId) ?? hero ?? allClocks[0] ?? null;

  const cityResults = useMemo(
    () => (cities && cityQuery.trim() ? searchCities(cities, cityQuery, { limit: 8 }) : []),
    [cities, cityQuery],
  );

  const addExtra = (city: City) => {
    // Already on the dashboard, or already added: nothing to do.
    const already = allClocks.some(
      (clock) => clock.cityName === city.name && clock.timeZone === city.timeZone,
    );
    setCityQuery('');
    if (already) return;
    setExtras((current) => [...current, createClock({ city })]);
  };

  const keepExtra = (clock: SavedClock) => {
    addClock({
      city: {
        name: clock.cityName,
        country: clock.country,
        province: clock.province,
        timeZone: clock.timeZone,
        lat: clock.lat,
        lon: clock.lon,
      },
    });
    setExtras((current) => current.filter((entry) => entry.id !== clock.id));
  };

  const removeExtra = (id: string) =>
    setExtras((current) => current.filter((entry) => entry.id !== id));

  const initialised = useRef(false);

  /*
    Opening the dialog starts from the selected clock, right now -- and then
    leaves the fields alone. Re-running whenever the dashboard changed meant
    that keeping a compared city wiped the date and time just typed, since
    adding a clock moves the hero.
  */
  useEffect(() => {
    if (!open) {
      initialised.current = false;
      return;
    }
    if (initialised.current) return;
    const start = hero ?? state.clocks[0] ?? null;
    if (!start) return;
    initialised.current = true;
    const fields = wallTimeInputs(Date.now(), start.timeZone);
    setSourceId(start.id);
    setDate(fields.date);
    setTime(fields.time);
    setOccurrence('first');
    void loadCities().then(setCities);
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

  /*
    Any city, not only the saved ones. Comparing against somewhere is a
    question, not a commitment -- the row carries a `+` for the times the
    answer is worth keeping.
  */
  const citySearch = (
    <div className="space-y-2">
      <Field
        label="Compare another city"
        htmlFor={citySearchId}
        hint="Added for this comparison only, unless you keep it."
      >
        <div className="relative">
          <Search
            size={15}
            strokeWidth={2}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-faint"
          />
          <input
            id={citySearchId}
            type="search"
            autoComplete="off"
            placeholder={cities ? 'Lahore, Tokyo, São Paulo…' : 'Loading cities…'}
            value={cityQuery}
            onChange={(event) => setCityQuery(event.target.value)}
            onFocus={() => {
              if (!cities) void loadCities().then(setCities);
            }}
            className={clsx(inputClass, 'pl-9.5')}
          />
        </div>
      </Field>

      {cityResults.length > 0 ? (
        <ul className="max-h-[13rem] overflow-y-auto rounded-card border border-line">
          {cityResults.map(({ city, badge }) => (
            <li key={city.id} className="border-b border-line last:border-b-0">
              <button
                type="button"
                onClick={() => addExtra(city)}
                className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-sunken"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-ink">
                    {city.name}
                  </span>
                  <span className="block truncate text-[12px] text-muted">
                    {describeCity(city)}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {badge ? (
                    <span className="tnum rounded-full border border-line px-2 py-0.5 text-[10px] font-medium text-muted">
                      {badge}
                    </span>
                  ) : null}
                  <Plus size={15} strokeWidth={2} aria-hidden="true" className="text-faint" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Compare times"
      description="Pick a moment in one city and see it in all of them."
      size="lg"
      footer={<Button onClick={onClose}>Done</Button>}
    >
      {!source ? (
        <div className="space-y-4">
          <p className="text-[13px] text-muted">
            Search for a city to compare. Nothing is added to your dashboard.
          </p>
          {citySearch}
        </div>
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
                {allClocks.map((clock) => {
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

          {citySearch}

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
                {allClocks.map((clock) => {
                  const temporary = extras.some((entry) => entry.id === clock.id);
                  return (
                    <ResultRow
                      key={clock.id}
                      clock={clock}
                      instantMs={instantMs}
                      sourceZone={source.timeZone}
                      isSource={clock.id === source.id}
                      hour12={state.hour12}
                      {...(temporary
                        ? { onRemove: () => removeExtra(clock.id), onKeep: () => keepExtra(clock) }
                        : null)}
                    />
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </Dialog>
  );
}
