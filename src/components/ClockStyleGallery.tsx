import clsx from 'clsx';
import { Check, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';

import { CLOCK_FAMILIES, clockPreset, filterPresets } from '@/clocks/registry';
import type { ClockPreset, FamilyId } from '@/clocks/spec';
import type { ClockReading } from '@/hooks/useClockReading';
import type { ClockStyleId, SavedClock } from '@/time/types';

import { ClockFace } from './clocks/registry';
import { inputClass } from './ui/controls';

/** Previews are drawn small; the dial geometry holds at any size. */
const PREVIEW_SIZE = 84;
const TILE_HEIGHT = 96;

/*
  One observer for the whole gallery rather than one per tile.

  With 149 live clocks a gallery that rendered them all would redraw every
  face every second, most of them scrolled out of sight. Tiles mount their
  preview only once they are near the viewport, which keeps the working set to
  the dozen or so actually on screen.
*/
const callbacks = new WeakMap<Element, (visible: boolean) => void>();
let observer: IntersectionObserver | null = null;

function sharedObserver(): IntersectionObserver {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) callbacks.get(entry.target)?.(entry.isIntersecting);
    },
    { rootMargin: '240px' },
  );
  return observer;
}

function useInView(ref: RefObject<HTMLElement | null>): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    // No IntersectionObserver (old engine, test runner): show everything.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = sharedObserver();
    callbacks.set(element, setInView);
    io.observe(element);
    return () => {
      io.unobserve(element);
      callbacks.delete(element);
    };
  }, [ref]);
  return inView;
}

function StyleTile({
  preset,
  clock,
  reading,
  selected,
  onChange,
}: {
  preset: ClockPreset;
  clock: SavedClock;
  reading: ClockReading;
  selected: boolean;
  onChange: () => void;
}) {
  const ref = useRef<HTMLLabelElement>(null);
  const visible = useInView(ref);

  return (
    <label
      ref={ref}
      title={preset.tags.join(', ')}
      className={clsx(
        'relative flex cursor-pointer flex-col gap-2 rounded-card border p-3 transition-colors duration-150',
        selected ? 'border-ink bg-sunken' : 'border-line bg-surface hover:border-line-strong',
      )}
    >
      <input
        type="radio"
        name="clock-style"
        value={preset.id}
        checked={selected}
        onChange={onChange}
        className="sr-only"
      />

      {selected ? (
        <span className="absolute top-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-invert text-on-invert">
          <Check size={12} strokeWidth={3} aria-hidden="true" />
        </span>
      ) : null}

      <div
        aria-hidden="true"
        className="flex items-center justify-center overflow-hidden rounded-[10px]"
        style={{ height: TILE_HEIGHT }}
      >
        {visible ? (
          <ClockFace
            clock={clock}
            reading={reading}
            size={PREVIEW_SIZE}
            previewPreset={preset}
          />
        ) : null}
      </div>

      <div className="min-w-0">
        <p className="truncate text-[12px] font-medium text-ink">{preset.name}</p>
        <p className="truncate text-[11px] tracking-[0.06em] text-faint uppercase">
          {preset.family}
        </p>
      </div>
    </label>
  );
}

export interface ClockStyleGalleryProps {
  /** Supplies the zone and settings the previews are drawn with. */
  clock: SavedClock;
  reading: ClockReading;
  value: ClockStyleId;
  onChange: (style: ClockStyleId) => void;
  /**
   * Stretch to the height of the container and scroll the grid inside it,
   * rather than capping the grid and letting the page scroll too. Used where
   * the gallery is the whole panel; off where it is one section among others.
   */
  fill?: boolean;
}

/**
 * The style gallery: every preset in the catalogue, each a live clock rather
 * than a picture of one, so what you pick is literally what you saw.
 *
 * Real radio inputs, so arrow keys walk the grid and the selection is
 * announced as one choice out of however many the filter is showing.
 */
export function ClockStyleGallery({
  clock,
  reading,
  value,
  onChange,
  fill = false,
}: ClockStyleGalleryProps) {
  const [query, setQuery] = useState('');
  const [family, setFamily] = useState<FamilyId | 'all'>('all');

  const results = useMemo(() => filterPresets(query, family), [query, family]);
  const selected = clockPreset(value);

  return (
    <div className={clsx('space-y-3', fill && 'flex min-h-0 flex-1 flex-col')}>
      <div className="relative">
        <Search
          size={15}
          strokeWidth={2}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-faint"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search designs — gold, terminal, paper, neon…"
          aria-label="Search clock designs"
          className={clsx(inputClass, 'pl-9.5')}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <FamilyChip
          label="All"
          count={CLOCK_FAMILIES.reduce((sum, entry) => sum + entry.count, 0)}
          active={family === 'all'}
          onClick={() => setFamily('all')}
        />
        {CLOCK_FAMILIES.map((entry) => (
          <FamilyChip
            key={entry.id}
            label={entry.name}
            count={entry.count}
            active={family === entry.id}
            onClick={() => setFamily(entry.id)}
          />
        ))}
      </div>

      <p className="text-[12px] text-muted" aria-live="polite">
        {results.length === 0
          ? 'No designs match that.'
          : results.length + ' design' + (results.length === 1 ? '' : 's') + ' · currently ' + selected.name}
      </p>

      {/*
        The scroll container is a plain div wrapping the fieldset, not the
        fieldset itself: a `<fieldset>` renders through an anonymous box that
        never becomes a scroll container in Chrome or WebKit, so `overflow`
        on it silently clips instead of scrolling -- which would leave most of
        the catalogue unreachable. The grouping semantics stay on the
        fieldset; only the scrolling moves out.
      */}
      <div
        className={clsx('overflow-y-auto', fill ? 'min-h-0 flex-1' : 'max-h-[52vh]')}
      >
        <fieldset>
          <legend className="sr-only">Clock style</legend>
          <div className="grid grid-cols-2 gap-2.5 pb-1 sm:grid-cols-3">
            {results.map((preset) => (
              <StyleTile
                key={preset.id}
                preset={preset}
                clock={clock}
                reading={reading}
                selected={preset.id === value}
                onChange={() => onChange(preset.id)}
              />
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  );
}

function FamilyChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        'cursor-pointer rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors duration-150',
        active
          ? 'border-ink bg-invert text-on-invert'
          : 'border-line text-muted hover:border-line-strong hover:text-ink',
      )}
    >
      {label}
      <span className={clsx('ml-1.5 tnum', active ? 'opacity-70' : 'text-faint')}>{count}</span>
    </button>
  );
}
