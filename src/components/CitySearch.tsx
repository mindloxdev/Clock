import clsx from 'clsx';
import { Search, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { useDashboard } from '@/hooks/useDashboard';
import { citiesIfLoaded, describeCity, loadCities, searchCities, type City } from '@/time/cities';
import type { SavedClock } from '@/time/types';

type Hit =
  | { kind: 'clock'; id: string; clock: SavedClock }
  | { kind: 'city'; id: string; city: City; badge: string | null };

export interface CitySearchProps {
  /** Called when a city is chosen, to open the add dialog prefilled. */
  onPickCity: (city: City) => void;
}

/**
 * The nav search: finds both the clocks already on the dashboard and any city
 * in the dataset.
 *
 * A real combobox, wired by hand because the native one cannot show two kinds
 * of result: `aria-activedescendant` moves a virtual cursor while focus stays
 * in the input, which is what lets typing and arrowing work at the same time.
 */
export function CitySearch({ onPickCity }: CitySearchProps) {
  const { state, selectHero } = useDashboard();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [cities, setCities] = useState<City[] | null>(citiesIfLoaded);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  // The 200 KB dataset is fetched the first time someone means to search.
  const ensureCities = () => {
    if (!cities) void loadCities().then(setCities);
  };

  const hits = useMemo<Hit[]>(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const folded = trimmed.toLowerCase();

    const clockHits: Hit[] = state.clocks
      .filter(
        (clock) =>
          clock.title.toLowerCase().includes(folded) ||
          clock.cityName.toLowerCase().includes(folded),
      )
      .slice(0, 4)
      .map((clock) => ({ kind: 'clock', id: 'clock:' + clock.id, clock }));

    const cityHits: Hit[] = (cities ? searchCities(cities, trimmed, { limit: 8 }) : []).map(
      ({ city, badge }) => ({ kind: 'city', id: 'city:' + city.id, city, badge }),
    );

    return [...clockHits, ...cityHits];
  }, [query, state.clocks, cities]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  // Any click outside dismisses the list, as a popup should.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    setCursor(0);
  };

  const commit = (hit: Hit | undefined) => {
    if (!hit) return;
    if (hit.kind === 'clock') selectHero(hit.clock.id);
    else onPickCity(hit.city);
    setQuery('');
    close();
    inputRef.current?.blur();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      if (query) setQuery('');
      close();
      return;
    }
    if (!hits.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setCursor((current) => (current + 1) % hits.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setCursor((current) => (current - 1 + hits.length) % hits.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      commit(hits[cursor]);
    } else if (event.key === 'Tab') {
      close();
    }
  };

  const expanded = open && hits.length > 0;
  const activeId = expanded ? listId + '-' + cursor : undefined;

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1 sm:max-w-[26rem]">
      <div className="relative">
        <Search
          size={15}
          strokeWidth={2}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-faint"
        />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          aria-label="Search cities and your clocks"
          placeholder="Search cities or clocks"
          value={query}
          onFocus={() => {
            ensureCities();
            setOpen(true);
          }}
          onChange={(event) => {
            ensureCities();
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className="h-10 w-full rounded-full border border-line bg-surface pr-9 pl-9.5 text-[13px] text-ink placeholder:text-faint transition-colors duration-150 hover:border-line-strong"
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-faint transition-colors duration-150 hover:bg-sunken hover:text-ink"
          >
            <X size={14} strokeWidth={2} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {expanded ? (
        <ul
          id={listId}
          role="listbox"
          aria-label="Search results"
          className="absolute top-[calc(100%+0.5rem)] right-0 left-0 z-50 max-h-[22rem] overflow-y-auto rounded-card border border-line bg-surface py-1.5 shadow-float"
        >
          {hits.map((hit, index) => (
            <li
              key={hit.id}
              id={listId + '-' + index}
              role="option"
              aria-selected={index === cursor}
              // Pointer down rather than click: the input's blur would
              // otherwise close the list before the click landed.
              onPointerDown={(event) => {
                event.preventDefault();
                commit(hit);
              }}
              onMouseEnter={() => setCursor(index)}
              className={clsx(
                'mx-1.5 flex cursor-pointer items-center justify-between gap-3 rounded-[10px] px-3 py-2.5',
                index === cursor ? 'bg-sunken' : '',
              )}
            >
              {hit.kind === 'clock' ? (
                <>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-ink">
                      {hit.clock.title}
                    </span>
                    <span className="block truncate text-[12px] text-muted">
                      {hit.clock.cityName}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] tracking-[0.1em] text-faint uppercase">
                    Your clock
                  </span>
                </>
              ) : (
                <>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-ink">
                      {hit.city.name}
                    </span>
                    <span className="block truncate text-[12px] text-muted">
                      {describeCity(hit.city)}
                    </span>
                  </span>
                  {/* The badge says why an abbreviation or offset search
                      matched a city whose name contains neither. */}
                  <span className="flex shrink-0 items-center gap-2">
                    {hit.badge ? (
                      <span className="tnum rounded-full border border-line px-2 py-0.5 text-[10px] font-medium tracking-[0.06em] text-muted">
                        {hit.badge}
                      </span>
                    ) : null}
                    <span className="text-[11px] text-faint">Add</span>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {open && query.trim() && !hits.length ? (
        <div className="absolute top-[calc(100%+0.5rem)] right-0 left-0 z-50 rounded-card border border-line bg-surface px-4 py-3 text-[13px] text-muted shadow-float">
          {cities ? 'No cities or clocks match that.' : 'Loading cities…'}
        </div>
      ) : null}
    </div>
  );
}
