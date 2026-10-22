/**
 * Current conditions, from Open-Meteo.
 *
 * Weather is the one thing on this dashboard that cannot be computed. Sunrise
 * comes from orbital mechanics; the fact that it is raining in Karachi has to
 * be observed by somebody. So it is fetched -- and when the fetch fails, or a
 * location has no coordinates, the UI shows nothing at all rather than a
 * plausible-looking number. The same rule the spec sets for sunrise.
 *
 * Open-Meteo needs no key, allows cross-origin requests, and takes many
 * locations in a single call, so a dashboard of twenty clocks costs one
 * request. Temperatures are always fetched in Celsius and converted here, so
 * switching to Fahrenheit never triggers a refetch.
 */

export type WeatherIcon =
  | 'clear'
  | 'partly'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'freezing'
  | 'snow'
  | 'showers'
  | 'thunder'
  | 'hail';

export interface WeatherCondition {
  label: string;
  icon: WeatherIcon;
}

/**
 * WMO 4677 present-weather codes, which is what Open-Meteo reports.
 *
 * Listed in full rather than bucketed by range: the ranges are not contiguous
 * (56/57 are freezing drizzle in the middle of the drizzle block) and a wrong
 * bucket would mislabel the weather rather than fail loudly.
 */
const WMO: Record<number, WeatherCondition> = {
  0: { label: 'Clear', icon: 'clear' },
  1: { label: 'Mainly clear', icon: 'partly' },
  2: { label: 'Partly cloudy', icon: 'partly' },
  3: { label: 'Overcast', icon: 'cloudy' },
  45: { label: 'Fog', icon: 'fog' },
  48: { label: 'Freezing fog', icon: 'fog' },
  51: { label: 'Light drizzle', icon: 'drizzle' },
  53: { label: 'Drizzle', icon: 'drizzle' },
  55: { label: 'Heavy drizzle', icon: 'drizzle' },
  56: { label: 'Freezing drizzle', icon: 'freezing' },
  57: { label: 'Freezing drizzle', icon: 'freezing' },
  61: { label: 'Light rain', icon: 'rain' },
  63: { label: 'Rain', icon: 'rain' },
  65: { label: 'Heavy rain', icon: 'rain' },
  66: { label: 'Freezing rain', icon: 'freezing' },
  67: { label: 'Freezing rain', icon: 'freezing' },
  71: { label: 'Light snow', icon: 'snow' },
  73: { label: 'Snow', icon: 'snow' },
  75: { label: 'Heavy snow', icon: 'snow' },
  77: { label: 'Snow grains', icon: 'snow' },
  80: { label: 'Light showers', icon: 'showers' },
  81: { label: 'Showers', icon: 'showers' },
  82: { label: 'Violent showers', icon: 'showers' },
  85: { label: 'Snow showers', icon: 'snow' },
  86: { label: 'Heavy snow showers', icon: 'snow' },
  95: { label: 'Thunderstorm', icon: 'thunder' },
  96: { label: 'Thunderstorm, hail', icon: 'hail' },
  99: { label: 'Thunderstorm, hail', icon: 'hail' },
};

/** `null` for a code we do not recognise -- better unlabelled than mislabelled. */
export function describeWeather(code: number): WeatherCondition | null {
  return WMO[code] ?? null;
}

export type UnitSystem = 'metric' | 'imperial';

export interface WeatherReading {
  /** Always Celsius; convert at the point of display. */
  temperatureC: number;
  apparentC: number;
  /** Percent. */
  humidity: number;
  /** Always km/h. */
  windKph: number;
  code: number;
  /** The provider's own day/night flag, kept for reference. */
  isDay: boolean;
  /** When this reading was retrieved. */
  fetchedMs: number;
}

export function formatTemperature(celsius: number, units: UnitSystem): string {
  const value = units === 'imperial' ? celsius * 1.8 + 32 : celsius;
  // A clock face is not a laboratory: whole degrees.
  return Math.round(value) + '°';
}

export function formatWind(kph: number, units: UnitSystem): string {
  return units === 'imperial'
    ? Math.round(kph * 0.621371) + ' mph'
    : Math.round(kph) + ' km/h';
}

/**
 * The zones where Fahrenheit is the everyday unit: the United States, Liberia
 * and Myanmar.
 *
 * Listing zones rather than reading the browser language on purpose. Plenty
 * of people run an `en-US` browser from Karachi or Berlin, and what decides
 * whether 51 or 10 is the useful number is where the reader *is*, not which
 * English their menus are in. The language region is only consulted when the
 * zone is one we do not recognise.
 */
const IMPERIAL_ZONES = new Set([
  'America/New_York', 'America/Detroit', 'America/Kentucky/Louisville',
  'America/Kentucky/Monticello', 'America/Indiana/Indianapolis', 'America/Indianapolis',
  'America/Indiana/Vincennes', 'America/Indiana/Winamac', 'America/Indiana/Marengo',
  'America/Indiana/Petersburg', 'America/Indiana/Vevay', 'America/Indiana/Tell_City',
  'America/Indiana/Knox', 'America/Chicago', 'America/Menominee',
  'America/North_Dakota/Center', 'America/North_Dakota/New_Salem',
  'America/North_Dakota/Beulah', 'America/Denver', 'America/Boise', 'America/Phoenix',
  'America/Los_Angeles', 'America/Anchorage', 'America/Juneau', 'America/Sitka',
  'America/Metlakatla', 'America/Yakutat', 'America/Nome', 'America/Adak',
  'Pacific/Honolulu', 'Africa/Monrovia', 'Asia/Yangon', 'Asia/Rangoon',
]);

export function guessUnits(): UnitSystem {
  try {
    const zone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (zone) return IMPERIAL_ZONES.has(zone) ? 'imperial' : 'metric';
  } catch {
    // Fall through to the language check.
  }
  try {
    const region = new Intl.Locale(navigator.language).maximize().region ?? '';
    return ['US', 'LR', 'MM'].includes(region) ? 'imperial' : 'metric';
  } catch {
    return 'metric';
  }
}

export interface WeatherPoint {
  lat: number;
  lon: number;
}

/** Two clocks in the same city should not cost two lookups. */
export function pointKey(lat: number, lon: number): string {
  return lat.toFixed(2) + ',' + lon.toFixed(2);
}

/**
 * Open-Meteo refreshes on a 15-minute cadence (it reports `interval: 900`),
 * so asking more often than that returns the same numbers.
 */
export const WEATHER_TTL_MS = 15 * 60 * 1000;

/** Keeps any one URL a sane length when a dashboard has many clocks. */
const BATCH_SIZE = 25;

const ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

interface OpenMeteoCurrent {
  temperature_2m?: unknown;
  apparent_temperature?: unknown;
  relative_humidity_2m?: unknown;
  wind_speed_10m?: unknown;
  weather_code?: unknown;
  is_day?: unknown;
}

const num = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

function parseCurrent(current: OpenMeteoCurrent | undefined, fetchedMs: number): WeatherReading | null {
  if (!current) return null;
  const temperatureC = num(current.temperature_2m);
  const code = num(current.weather_code);
  // Without a temperature and a condition there is nothing worth showing.
  if (temperatureC === null || code === null) return null;
  return {
    temperatureC,
    apparentC: num(current.apparent_temperature) ?? temperatureC,
    humidity: num(current.relative_humidity_2m) ?? 0,
    windKph: num(current.wind_speed_10m) ?? 0,
    code,
    isDay: num(current.is_day) === 1,
    fetchedMs,
  };
}

/**
 * Requests already on the wire, keyed by URL.
 *
 * Two things ask for the same batch at the same moment more often than you
 * would think: React's development double-invoke, a tab regaining focus while
 * a fetch is pending, an impatient second press of Refresh. Joining the
 * request in flight is both faster and politer to a free service than firing
 * a second identical one.
 */
const inFlight = new Map<string, Promise<unknown>>();

function requestBatch(url: string): Promise<unknown> {
  const existing = inFlight.get(url);
  if (existing) return existing;

  const pending = fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error('Weather request failed: ' + response.status);
      return response.json() as Promise<unknown>;
    })
    .finally(() => {
      inFlight.delete(url);
    });

  inFlight.set(url, pending);
  return pending;
}

/**
 * Fetches current conditions for a list of points, in one request per batch.
 *
 * Resolves to a map keyed by `pointKey`. Points the provider could not answer
 * for are simply absent -- callers must treat a missing entry as "no weather
 * to show", never as zero.
 *
 * Deliberately not cancellable. A caller that has gone away ignores the
 * result instead, which lets concurrent callers share one request; cancelling
 * would mean the first to leave kills the fetch the others are waiting on.
 */
export async function fetchWeather(
  points: readonly WeatherPoint[],
): Promise<Map<string, WeatherReading>> {
  const results = new Map<string, WeatherReading>();
  if (points.length === 0) return results;

  for (let start = 0; start < points.length; start += BATCH_SIZE) {
    const batch = points.slice(start, start + BATCH_SIZE);
    const url =
      ENDPOINT +
      '?latitude=' +
      batch.map((p) => p.lat.toFixed(4)).join(',') +
      '&longitude=' +
      batch.map((p) => p.lon.toFixed(4)).join(',') +
      '&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,is_day,weather_code';

    const body = await requestBatch(url);

    // One location returns an object; several return an array, in order.
    const entries = Array.isArray(body) ? body : [body];
    const fetchedMs = Date.now();

    entries.forEach((entry, index) => {
      const point = batch[index];
      if (!point || typeof entry !== 'object' || entry === null) return;
      const reading = parseCurrent((entry as { current?: OpenMeteoCurrent }).current, fetchedMs);
      if (reading) results.set(pointKey(point.lat, point.lon), reading);
    });
  }

  return results;
}
