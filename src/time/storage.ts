/**
 * localStorage persistence for the whole dashboard.
 *
 * Everything read back is treated as untrusted: it may have been written by an
 * older build, hand-edited, or carry a time zone that tzdata has since
 * retired. `loadState` therefore validates field by field and repairs what it
 * can rather than throwing, so a bad entry costs one clock instead of the
 * dashboard.
 */
import { isClockStyleId } from '@/clocks/registry';

import { DEFAULT_PREFS, DEFAULT_STYLE, MAX_FEATURED, seedState } from './defaults';
import type {
  AccentId,
  ClockAppearance,
  ClockPrefs,
  ClockSize,
  DashboardState,
  SavedClock,
  ThemeId,
  UnitSystem,
} from './types';
import { guessUnits } from './weather';
import { isValidTimeZone } from './zones';

const KEY = 'multiclock.v1';

export const THEME_IDS: readonly ThemeId[] = ['classic-light', 'midnight', 'soft-neutral'];
export const ACCENT_IDS: readonly AccentId[] = ['mono', 'amber', 'indigo', 'emerald', 'rose'];
const UNIT_SYSTEMS: readonly UnitSystem[] = ['metric', 'imperial'];
const SIZES: readonly ClockSize[] = ['sm', 'md', 'lg', 'xl'];
const APPEARANCES: readonly ClockAppearance[] = ['auto', 'light', 'dark'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const str = (value: unknown, fallback: string): string =>
  typeof value === 'string' ? value : fallback;

const bool = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

const coord = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

/** A CSS colour the user picked. Only hex is ever written, so only hex is read. */
const hexColor = (value: unknown): string | null =>
  typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : null;

function parsePrefs(raw: unknown): ClockPrefs {
  if (!isRecord(raw)) return { ...DEFAULT_PREFS };
  return {
    size: oneOf(raw.size, SIZES, DEFAULT_PREFS.size),
    showSeconds: bool(raw.showSeconds, DEFAULT_PREFS.showSeconds),
    showDate: bool(raw.showDate, DEFAULT_PREFS.showDate),
    showOffset: bool(raw.showOffset, DEFAULT_PREFS.showOffset),
    hour12: typeof raw.hour12 === 'boolean' ? raw.hour12 : null,
    appearance: oneOf(raw.appearance, APPEARANCES, DEFAULT_PREFS.appearance),
    numerals: bool(raw.numerals, DEFAULT_PREFS.numerals),
    secondHand: bool(raw.secondHand, DEFAULT_PREFS.secondHand),
    minuteTicks: bool(raw.minuteTicks, DEFAULT_PREFS.minuteTicks),
    faceColor: hexColor(raw.faceColor),
    handColor: hexColor(raw.handColor),
  };
}

/** `null` when the entry has no usable zone -- there is no sane repair for that. */
function parseClock(raw: unknown, seenIds: Set<string>): SavedClock | null {
  if (!isRecord(raw)) return null;

  const timeZone = str(raw.timeZone, '');
  if (!isValidTimeZone(timeZone)) return null;

  const id = str(raw.id, '');
  if (!id || seenIds.has(id)) return null;
  seenIds.add(id);

  const cityName = str(raw.cityName, timeZone.split('/').pop()?.replace(/_/g, ' ') ?? timeZone);

  return {
    id,
    title: str(raw.title, cityName) || cityName,
    cityName,
    country: str(raw.country, ''),
    province: str(raw.province, ''),
    timeZone,
    lat: coord(raw.lat),
    lon: coord(raw.lon),
    // A style from an older build, or one that has since been renamed, falls
    // back rather than leaving the face unrenderable.
    style: isClockStyleId(raw.style) ? raw.style : DEFAULT_STYLE,
    prefs: parsePrefs(raw.prefs),
  };
}

/**
 * Trims the featured list to ids that still exist, drops duplicates, and
 * guarantees a hero: slot 0 is what the hero clock and city heading read, so
 * an empty list would leave the page with nothing to show.
 */
function parseFeatured(raw: unknown, clocks: SavedClock[]): string[] {
  const known = new Set(clocks.map((clock) => clock.id));
  const featured: string[] = [];
  if (Array.isArray(raw)) {
    for (const id of raw) {
      if (typeof id === 'string' && known.has(id) && !featured.includes(id)) featured.push(id);
      if (featured.length === MAX_FEATURED) break;
    }
  }
  if (featured.length === 0) {
    const first = clocks[0];
    if (first) featured.push(first.id);
  }
  return featured;
}

export function loadState(): DashboardState {
  let raw: unknown;
  try {
    const stored = localStorage.getItem(KEY);
    if (!stored) return seedState();
    raw = JSON.parse(stored);
  } catch {
    // Private-mode storage, a quota error, or malformed JSON: start fresh.
    return seedState();
  }

  if (!isRecord(raw)) return seedState();

  // A payload with no `clocks` array is not a dashboard we wrote, so it gets
  // seeded. An empty array, though, is a real state -- someone deleted their
  // last clock -- and must survive a refresh instead of silently refilling.
  if (!Array.isArray(raw.clocks)) return seedState();

  const seenIds = new Set<string>();
  const clocks = raw.clocks
    .map((clock) => parseClock(clock, seenIds))
    .filter((clock): clock is SavedClock => clock !== null);

  return {
    clocks,
    featured: parseFeatured(raw.featured, clocks),
    hour12: bool(raw.hour12, false),
    theme: oneOf<ThemeId>(raw.theme, THEME_IDS, 'classic-light'),
    accent: oneOf<AccentId>(raw.accent, ACCENT_IDS, 'mono'),
    weather: bool(raw.weather, true),
    units: oneOf<UnitSystem>(raw.units, UNIT_SYSTEMS, guessUnits()),
  };
}

export function saveState(state: DashboardState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage can be full or blocked. Persistence is a convenience here, so
    // the session carries on in memory rather than surfacing an error.
  }
}
