/** Default preferences, the first-run dashboard, and clock construction. */
import { DEFAULT_CLOCK_STYLE } from '@/clocks/registry';

import { guessUnits } from './weather';

import type { City } from './cities';
import type { ClockPrefs, ClockStyleId, DashboardState, SavedClock } from './types';

export const DEFAULT_STYLE: ClockStyleId = DEFAULT_CLOCK_STYLE;

/** At most three clocks can be featured at once. */
export const MAX_FEATURED = 3;

export const DEFAULT_PREFS: ClockPrefs = {
  size: 'md',
  showSeconds: true,
  showDate: true,
  showOffset: true,
  hour12: null,
  appearance: 'auto',
  numerals: false,
  secondHand: true,
  minuteTicks: true,
  faceColor: null,
  handColor: null,
};

/**
 * The city line to show beneath a clock's title, or `null` when the title is
 * already the city name.
 *
 * A clock added without a custom title gets the city as its title, so showing
 * both reads "London - London". One helper rather than the same conditional
 * copied into every surface that lists a clock.
 */
export function citySubtitle(clock: Pick<SavedClock, 'title' | 'cityName'>): string | null {
  return clock.cityName === clock.title ? null : clock.cityName;
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export interface CreateClockInput {
  city: Pick<City, 'name' | 'country' | 'province' | 'timeZone' | 'lat' | 'lon'>;
  /** Blank falls back to the city's own name. */
  title?: string;
  style?: ClockStyleId;
  prefs?: Partial<ClockPrefs>;
}

export function createClock({ city, title, style, prefs }: CreateClockInput): SavedClock {
  return {
    id: newId(),
    title: title?.trim() || city.name,
    cityName: city.name,
    country: city.country,
    province: city.province,
    timeZone: city.timeZone,
    lat: city.lat,
    lon: city.lon,
    style: style ?? DEFAULT_STYLE,
    prefs: { ...DEFAULT_PREFS, ...prefs },
  };
}

/**
 * Titles the first-run dashboard used to ship with.
 *
 * They were invented job labels, which is a guess about who is using this and
 * reads as someone else's dashboard. Kept only so `migrateSeedTitles` can
 * recognise and clear them; nothing creates them any more.
 */
export const RETIRED_SEED_TITLES: readonly { title: string; cityName: string; timeZone: string }[] =
  [
    { title: 'My US Partner', cityName: 'New York', timeZone: 'America/New_York' },
    { title: 'Home Office', cityName: 'Karachi', timeZone: 'Asia/Karachi' },
    { title: 'London Operations', cityName: 'London', timeZone: 'Europe/London' },
    { title: 'European Team', cityName: 'Paris', timeZone: 'Europe/Paris' },
  ];

/**
 * Replaces a retired seed title with the city's own name.
 *
 * Deliberately narrow: the title, the city *and* the zone all have to match a
 * clock nobody has touched. A clock the viewer genuinely named "Home Office"
 * for somewhere other than Karachi keeps its name.
 */
export function migrateSeedTitles(clocks: SavedClock[]): SavedClock[] {
  return clocks.map((clock) =>
    RETIRED_SEED_TITLES.some(
      (retired) =>
        retired.title === clock.title &&
        retired.cityName === clock.cityName &&
        retired.timeZone === clock.timeZone,
    )
      ? { ...clock, title: clock.cityName }
      : clock,
  );
}

/**
 * The first-run dashboard: four cities under their own names.
 *
 * No invented titles -- a clock is called London until someone decides it
 * should be called something else. Coordinates are the dataset's own, so
 * sunrise, sunset and weather are live from the first paint without waiting
 * on the city download.
 */
export function seedState(): DashboardState {
  const clocks = [
    createClock({
      city: {
        name: 'New York',
        country: 'United States',
        province: 'New York',
        timeZone: 'America/New_York',
        lat: 40.75,
        lon: -73.98,
      },
    }),
    createClock({
      city: {
        name: 'Karachi',
        country: 'Pakistan',
        province: 'Sind',
        timeZone: 'Asia/Karachi',
        lat: 24.87,
        lon: 66.99,
      },
    }),
    createClock({
      city: {
        name: 'London',
        country: 'United Kingdom',
        province: 'Westminster',
        timeZone: 'Europe/London',
        lat: 51.5,
        lon: -0.1167,
      },
    }),
    createClock({
      city: {
        name: 'Paris',
        country: 'France',
        province: 'Île-de-France',
        timeZone: 'Europe/Paris',
        lat: 48.8667,
        lon: 2.3333,
      },
    }),
  ];

  const london = clocks[2];
  return {
    clocks,
    featured: london ? [london.id] : [],
    hour12: false,
    theme: 'classic-light',
    accent: 'mono',
    weather: true,
    // Guessed from the viewer's locale once, then stored like any other choice.
    units: guessUnits(),
  };
}
