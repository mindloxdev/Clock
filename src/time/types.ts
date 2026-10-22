/** Shared vocabulary for the dashboard. No UI concerns live in this folder. */

/**
 * A preset id from the clock catalogue.
 *
 * An open string rather than a union: the catalogue holds 149 presets and
 * grows by adding data, so membership is checked at runtime by
 * `isClockStyleId` -- which is also the only check that can protect against a
 * stale id in someone's saved dashboard.
 */
export type ClockStyleId = string;

export type ClockKind = 'digital' | 'analog';

export type ClockSize = 'sm' | 'md' | 'lg' | 'xl';

export type ThemeId = 'classic-light' | 'midnight' | 'soft-neutral';

/**
 * The optional accent from settings. `mono` is the default and resolves to the
 * theme's ink colour, which is what keeps the stock dashboard monochrome.
 */
export type AccentId = 'mono' | 'amber' | 'indigo' | 'emerald' | 'rose';

export type { UnitSystem } from './weather';
import type { UnitSystem } from './weather';

/**
 * A face can follow the dashboard theme or be pinned light/dark, so a dark
 * analog clock can sit on the light dashboard exactly as the spec asks.
 */
export type ClockAppearance = 'auto' | 'light' | 'dark';

export interface ClockPrefs {
  size: ClockSize;
  showSeconds: boolean;
  showDate: boolean;
  showOffset: boolean;
  /** `null` inherits the dashboard-wide 12h/24h choice. */
  hour12: boolean | null;
  appearance: ClockAppearance;
  /** Analog only. */
  numerals: boolean;
  secondHand: boolean;
  minuteTicks: boolean;
  /** Analog only; `null` keeps the face's designed colour. */
  faceColor: string | null;
  handColor: string | null;
}

/**
 * A saved clock embeds its resolved location rather than pointing into the
 * city dataset, so regenerating that dataset can never silently re-home
 * someone's clock. `title` is decoration only -- `timeZone` is the truth.
 */
export interface SavedClock {
  id: string;
  title: string;
  cityName: string;
  country: string;
  province: string;
  timeZone: string;
  lat: number | null;
  lon: number | null;
  style: ClockStyleId;
  prefs: ClockPrefs;
}

/**
 * `featured[0]` is the hero clock: the one the big display, the city heading
 * and the supporting detail row all read from. Slots 2 and 3 appear when the
 * layout selector asks for them, which keeps the spec's "selected clock" and
 * its "highlight up to three" from drifting into two competing ideas of
 * which clock is current.
 */
export interface DashboardState {
  clocks: SavedClock[];
  featured: string[];
  hour12: boolean;
  theme: ThemeId;
  accent: AccentId;
  /**
   * Whether to fetch current conditions. Off means the app makes no network
   * requests at all, which is how it behaves with everything else.
   */
  weather: boolean;
  /** Celsius and km/h, or Fahrenheit and mph. */
  units: UnitSystem;
}
