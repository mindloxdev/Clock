import clsx from 'clsx';
import { Check, Globe, Search } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { useClockReading } from '@/hooks/useClockReading';
import { useDashboard } from '@/hooks/useDashboard';
import { citiesIfLoaded, describeCity, loadCities, searchCities, type City } from '@/time/cities';
import { DEFAULT_STYLE, createClock } from '@/time/defaults';
import type { ClockStyleId } from '@/time/types';
import { formatTime } from '@/time/zones';

import { ClockStyleGallery } from './ClockStyleGallery';
import { Dialog } from './ui/Dialog';
import { Button, Field, inputClass } from './ui/controls';

/**
 * A stable stand-in so the preview hooks can run before a city is chosen.
 * Built once, because a new id on every render would churn the reading.
 */
const PLACEHOLDER = createClock({
  city: { name: 'UTC', country: '', province: '', timeZone: 'UTC', lat: null, lon: null },
});

export interface AddClockModalProps {
  open: boolean;
  onClose: () => void;
  /** Preselected when the nav search sent us here. */
  initialCity?: City | null;
}

/**
 * The Add City dialog (§8).
 *
 * The order of the fields is the order of the decisions: find the real place
 * first, confirm the zone it resolved to, and only then name it. The title is
 * the last field precisely because it changes nothing but the label.
 */
export function AddClockModal({ open, onClose, initialCity = null }: AddClockModalProps) {
  const { addClock } = useDashboard();
  const [cities, setCities] = useState<City[] | null>(citiesIfLoaded);
  const [query, setQuery] = useState('');
  const [chosen, setChosen] = useState<City | null>(initialCity);
  const [title, setTitle] = useState('');
  const [style, setStyle] = useState<ClockStyleId>(DEFAULT_STYLE);
  const searchId = useId();
  const titleId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Each opening starts clean, carrying in whatever the nav search picked.
  useEffect(() => {
    if (!open) return;
    setChosen(initialCity);
    setTitle('');
    setQuery('');
    setStyle(DEFAULT_STYLE);
    void loadCities().then(setCities);

    /*
      `showModal()` focuses the first tabbable thing it finds, which is the
      header's close button -- so opening "Add a city" and typing would go
      nowhere. Focus the field the dialog actually exists to fill instead,
      after a frame so it lands once the element is in the top layer.
    */
    const frame = requestAnimationFrame(() => {
      const target = initialCity ? titleRef.current : searchRef.current;
      target?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open, initialCity]);

  const results = useMemo(
    () => (cities && query.trim() ? searchCities(cities, query, { limit: 30 }) : []),
    [cities, query],
  );

  // A throwaway clock, so the preview and the gallery render the real thing.
  const draft = useMemo(
    () => (chosen ? createClock({ city: chosen, title, style }) : PLACEHOLDER),
    [chosen, title, style],
  );
  const reading = useClockReading(draft, 'second');
  const preview = formatTime(reading.time, reading.hour12, true);

  const submit = () => {
    if (!chosen) return;
    addClock({ city: chosen, title, style });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add a city"
      description="Pick the real place first. The display title you give it afterwards is only a label."
      size="lg"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!chosen} onClick={submit}>
            Add clock
          </Button>
        </>
      }
    >
      <div className="space-y-7">
        {chosen ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-line bg-sunken px-4 py-3.5">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                <Check size={15} strokeWidth={2.6} aria-hidden="true" />
                <span className="truncate">{chosen.name}</span>
              </p>
              <p className="mt-0.5 truncate text-[12px] text-muted">{describeCity(chosen)}</p>
              <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-faint">
                <Globe size={12} strokeWidth={2} aria-hidden="true" />
                <span className="truncate">{chosen.timeZone}</span>
                <span aria-hidden="true">·</span>
                <span className="tnum">{reading.offsetLabel}</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-right">
                <span className="tnum block text-[22px] leading-none font-semibold">
                  {preview.main}
                  {preview.meridiem ? (
                    <span className="ml-1 text-[12px] font-medium text-muted">
                      {preview.meridiem}
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block text-[11px] tracking-[0.1em] text-faint uppercase">
                  Live now
                </span>
              </p>
              <Button size="sm" onClick={() => setChosen(null)}>
                Change
              </Button>
            </div>
          </div>
        ) : (
          <Field
            label="Search for a city"
            htmlFor={searchId}
            hint={
              cities
                ? 'Over 2,400 places, each with its own IANA time zone.'
                : 'Loading the city list…'
            }
          >
            <div className="relative">
              <Search
                size={15}
                strokeWidth={2}
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-faint"
              />
              <input
                ref={searchRef}
                id={searchId}
                type="text"
                autoComplete="off"
                placeholder="Karachi, São Paulo, Auckland…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className={clsx(inputClass, 'pl-9.5')}
              />
            </div>
          </Field>
        )}

        {!chosen && results.length > 0 ? (
          <ul className="-mt-4 max-h-[17rem] overflow-y-auto rounded-card border border-line">
            {results.map(({ city, badge }) => (
              <li key={city.id} className="border-b border-line last:border-b-0">
                <button
                  type="button"
                  onClick={() => {
                    setChosen(city);
                    setQuery('');
                  }}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-sunken"
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
                      <span className="tnum rounded-full border border-line px-2 py-0.5 text-[10px] font-medium tracking-[0.06em] text-muted">
                        {badge}
                      </span>
                    ) : null}
                    <span className="text-[11px] text-faint">{city.timeZone}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {chosen ? (
          <>
            <Field
              label="Custom display title"
              htmlFor={titleId}
              hint={'A label only. The clock stays on ' + chosen.timeZone + ' whatever you call it.'}
            >
              <input
                ref={titleRef}
                id={titleId}
                type="text"
                maxLength={48}
                placeholder={chosen.name}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className={inputClass}
              />
            </Field>

            <div className="space-y-3">
              <p className="text-[12px] font-medium tracking-wide text-muted">Clock style</p>
              <ClockStyleGallery
                clock={draft}
                reading={reading}
                value={style}
                onChange={setStyle}
              />
            </div>
          </>
        ) : null}
      </div>
    </Dialog>
  );
}
