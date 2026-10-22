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
 * The first-run dashboard: the spec's four example cards, with London as the
 * selected clock so the city heading opens on the "London, United Kingdom"
 * example. Coordinates are the dataset's own, so sunrise and sunset are live
 * from the very first paint without waiting on the city download.
 */
export function seedState(): DashboardState {
  const clocks = [
    createClock({
      title: 'My US Partner',
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
      title: 'Home Office',
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
      title: 'London Operations',
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
      title: 'European Team',
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
