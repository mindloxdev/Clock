/**
 * The city/time-zone dataset and its search.
 *
 * `cities.generated.ts` is 200 KB, so it is behind a dynamic `import()` and
 * only arrives when someone actually opens a search field. Nothing on first
 * paint depends on it -- the seeded clocks in `defaults.ts` carry their own
 * coordinates.
 */
import { abbreviationIndex, parseOffsetQuery } from './abbreviations';
import type { RawCity } from './cities.generated';
import { formatOffset, offsetMinutesOf } from './zones';

export interface City {
  id: string;
  name: string;
  country: string;
  /** State or region. Present for cities; disambiguates the homonyms. */
  province: string;
  timeZone: string;
  lat: number | null;
  lon: number | null;
  population: number;
  /** A bare IANA zone rather than a populated place (`Antarctica/Troll`). */
  zoneOnly: boolean;
}

/**
 * Display-only tidying of the handful of dataset names that read as database
 * entries rather than as something you would print under a clock. The stored
 * time zone is never touched.
 */
const COUNTRY_DISPLAY: Record<string, string> = {
  'United States of America': 'United States',
  'Hong Kong S.A.R.': 'Hong Kong',
  'Macau S.A.R': 'Macau',
  'Vatican (Holy Sea)': 'Vatican City',
  'Federated States of Micronesia': 'Micronesia',
  'Svalbard and Jan Mayen Islands': 'Svalbard',
};

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function toCity(raw: RawCity): City {
  const [name, country, iso2, province, zone, lat, lon, population] = raw;
  const zoneOnly = population === 0;
  return {
    id: zoneOnly ? 'zone:' + zone : [slug(name), slug(province), iso2.toLowerCase()].filter(Boolean).join('-'),
    name,
    country: COUNTRY_DISPLAY[country] ?? country,
    province,
    timeZone: zone,
    lat,
    lon,
    population,
    zoneOnly,
  };
}

let cities: City[] | null = null;
let pending: Promise<City[]> | null = null;

/** Loads (once) and caches the dataset. Safe to call concurrently. */
export function loadCities(): Promise<City[]> {
  if (cities) return Promise.resolve(cities);
  pending ??= import('./cities.generated').then((mod) => {
    cities = mod.RAW_CITIES.map(toCity);
    pending = null;
    return cities;
  });
  return pending;
}

/** The dataset if it is already in memory, otherwise `null`. */
export function citiesIfLoaded(): City[] | null {
  return cities;
}

const foldCache = new Map<string, string>();

/** Lowercases and strips diacritics so `Zurich` finds `Zürich`. */
function fold(value: string): string {
  let folded = foldCache.get(value);
  if (folded === undefined) {
    folded = value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
    if (foldCache.size > 8000) foldCache.clear();
    foldCache.set(value, folded);
  }
  return folded;
}

/**
 * Relevance for one city against a folded query, or 0 for no match.
 *
 * Tiers are wide apart so population can break ties inside a tier without
 * ever promoting a weaker kind of match: a city whose name starts with the
 * query always outranks one that merely sits in a matching country.
 */
function score(city: City, query: string): number {
  const name = fold(city.name);
  if (name === query) return 10000;
  if (name.startsWith(query)) return 8000;

  const country = fold(city.country);
  if (country.startsWith(query)) return 3000;

  if (name.includes(query)) return 2500;
  if (country.includes(query)) return 1200;
  if (city.province && fold(city.province).includes(query)) return 900;
  if (fold(city.timeZone.replace(/_/g, ' ')).includes(query)) return 600;
  return 0;
}

export interface CitySearchOptions {
  limit?: number;
  /** Overridable so tests can pin a date; defaults to now. */
  nowMs?: number;
}

export interface CityHit {
  city: City;
  /**
   * Why this matched, when the name alone does not show it: `EDT` for an
   * abbreviation search, `UTC+5:30` for an offset one. `null` for a plain
   * name match, where a badge would only add noise.
   */
  badge: string | null;
}

/** Offsets for every zone in the dataset, rebuilt hourly. */
let offsetCache: { bucket: number; map: Map<string, number> } | null = null;

function zoneOffsets(all: readonly City[], nowMs: number): Map<string, number> {
  const bucket = Math.floor(nowMs / 3600000);
  if (offsetCache && offsetCache.bucket === bucket) return offsetCache.map;
  const map = new Map<string, number>();
  for (const city of all) {
    if (!map.has(city.timeZone)) map.set(city.timeZone, offsetMinutesOf(city.timeZone, nowMs));
  }
  offsetCache = { bucket, map };
  return map;
}

/**
 * Ranked city search over names, countries, zones, abbreviations and offsets.
 *
 * Population acts as the tie-breaker within a tier, which is what puts New
 * York above Newark for `new` without any hand-picked list. Zone-only entries
 * are nudged down so real places surface first.
 *
 * An exact abbreviation outranks a name prefix deliberately: someone typing
 * `AST` wants Atlantic Standard Time, not Astana -- though Astana still
 * appears, one tier down. An exact city name still wins over both.
 */
export function searchCities(
  all: readonly City[],
  rawQuery: string,
  options: CitySearchOptions = {},
): CityHit[] {
  const limit = options.limit ?? 24;
  const nowMs = options.nowMs ?? Date.now();
  const trimmed = rawQuery.trim();
  const query = fold(trimmed);

  if (!query) {
    return [...all]
      .sort((a, b) => b.population - a.population)
      .slice(0, limit)
      .map((city) => ({ city, badge: null }));
  }

  // Abbreviation: only an exact match, so typing `es` does not flood the list
  // with every Eastern-time city on the way to `Essen`.
  let abbrZones: Set<string> | null = null;
  let abbrLabel = '';
  if (/^[a-z]{2,5}$/.test(query)) {
    const index = abbreviationIndex(
      (function* () {
        for (const city of all) yield city.timeZone;
      })(),
      nowMs,
    );
    const found = index.byAbbr.get(trimmed.toUpperCase());
    if (found) {
      abbrZones = found;
      abbrLabel = trimmed.toUpperCase();
    }
  }

  const wantedOffset = parseOffsetQuery(trimmed);
  const offsets = wantedOffset === null ? null : zoneOffsets(all, nowMs);

  const hits: { city: City; rank: number; badge: string | null }[] = [];
  for (const city of all) {
    let base = score(city, query);
    let badge: string | null = null;

    if (abbrZones?.has(city.timeZone) && base < 9000) {
      base = 9000;
      badge = abbrLabel;
    }
    if (offsets && offsets.get(city.timeZone) === wantedOffset && base < 8800) {
      base = 8800;
      badge = formatOffset(wantedOffset as number);
    }

    if (base === 0) continue;
    // log10 keeps population a tie-breaker rather than a second ranking.
    const rank = base + Math.log10(city.population + 10) * 20 - (city.zoneOnly ? 400 : 0);
    hits.push({ city, rank, badge });
  }

  hits.sort((a, b) => b.rank - a.rank || a.city.name.localeCompare(b.city.name));
  return hits.slice(0, limit).map(({ city, badge }) => ({ city, badge }));
}

/** A one-line place description: `New York, United States`. */
export function describeCity(city: City): string {
  if (city.zoneOnly) return city.timeZone;
  return city.province && city.province !== city.name
    ? city.name + ', ' + city.province + ', ' + city.country
    : city.name + ', ' + city.country;
}
