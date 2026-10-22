/**
 * Time-zone abbreviations, so searching `EST`, `PST`, `CET` or `JST` finds
 * the cities on that zone.
 *
 * Two sources feed the index, because neither is enough alone:
 *
 *  1. `Intl` with `timeZoneName: 'short'`, which returns a true abbreviation
 *     (`EDT`, `PDT`, `AKST`) for North American zones and the useless
 *     `GMT+5:30` for most of the rest of the world. What it does give is the
 *     form that is correct *today*, daylight saving included.
 *  2. The curated table below, which covers everywhere `Intl` falls back to an
 *     offset, and pins both halves of each standard/daylight pair so `EST`
 *     still finds New York in July.
 *
 * Several abbreviations are genuinely ambiguous -- IST is India, Ireland and
 * Israel; CST is the US, China and Cuba. Those list every real candidate
 * rather than silently picking one, and the search ranks the results by
 * population as it does everywhere else.
 */

import { formatOffset } from './zones';

export interface ZoneAbbreviation {
  abbr: string;
  /** Spelt out, for the badge tooltip and the result row. */
  name: string;
  zones: readonly string[];
}

export const ZONE_ABBREVIATIONS: readonly ZoneAbbreviation[] = [
  // -------------------------------------------------------- North America --
  { abbr: 'EST', name: 'Eastern Standard Time', zones: ['America/New_York', 'America/Toronto', 'America/Detroit', 'America/Jamaica', 'America/Panama'] },
  { abbr: 'EDT', name: 'Eastern Daylight Time', zones: ['America/New_York', 'America/Toronto', 'America/Detroit'] },
  { abbr: 'ET', name: 'Eastern Time', zones: ['America/New_York', 'America/Toronto'] },
  { abbr: 'CST', name: 'Central Standard Time', zones: ['America/Chicago', 'America/Mexico_City', 'America/Winnipeg', 'Asia/Shanghai', 'Asia/Taipei', 'America/Havana'] },
  { abbr: 'CDT', name: 'Central Daylight Time', zones: ['America/Chicago', 'America/Winnipeg'] },
  { abbr: 'CT', name: 'Central Time', zones: ['America/Chicago', 'America/Mexico_City'] },
  { abbr: 'MST', name: 'Mountain Standard Time', zones: ['America/Denver', 'America/Phoenix', 'America/Edmonton'] },
  { abbr: 'MDT', name: 'Mountain Daylight Time', zones: ['America/Denver', 'America/Edmonton'] },
  { abbr: 'MT', name: 'Mountain Time', zones: ['America/Denver', 'America/Phoenix'] },
  { abbr: 'PST', name: 'Pacific Standard Time', zones: ['America/Los_Angeles', 'America/Vancouver', 'America/Tijuana'] },
  { abbr: 'PDT', name: 'Pacific Daylight Time', zones: ['America/Los_Angeles', 'America/Vancouver'] },
  { abbr: 'PT', name: 'Pacific Time', zones: ['America/Los_Angeles', 'America/Vancouver'] },
  { abbr: 'AKST', name: 'Alaska Standard Time', zones: ['America/Anchorage'] },
  { abbr: 'AKDT', name: 'Alaska Daylight Time', zones: ['America/Anchorage'] },
  { abbr: 'HST', name: 'Hawaii-Aleutian Standard Time', zones: ['Pacific/Honolulu'] },
  { abbr: 'AST', name: 'Atlantic / Arabia Standard Time', zones: ['America/Halifax', 'America/Puerto_Rico', 'Asia/Riyadh', 'Asia/Baghdad', 'Asia/Qatar'] },
  { abbr: 'ADT', name: 'Atlantic Daylight Time', zones: ['America/Halifax'] },
  { abbr: 'NST', name: 'Newfoundland Standard Time', zones: ['America/St_Johns'] },
  { abbr: 'NDT', name: 'Newfoundland Daylight Time', zones: ['America/St_Johns'] },

  // -------------------------------------------------------- South America --
  { abbr: 'BRT', name: 'Brasilia Time', zones: ['America/Sao_Paulo'] },
  { abbr: 'ART', name: 'Argentina Time', zones: ['America/Argentina/Buenos_Aires'] },
  { abbr: 'CLT', name: 'Chile Time', zones: ['America/Santiago'] },
  { abbr: 'COT', name: 'Colombia Time', zones: ['America/Bogota'] },
  { abbr: 'PET', name: 'Peru Time', zones: ['America/Lima'] },
  { abbr: 'VET', name: 'Venezuela Time', zones: ['America/Caracas'] },
  { abbr: 'UYT', name: 'Uruguay Time', zones: ['America/Montevideo'] },
  { abbr: 'BOT', name: 'Bolivia Time', zones: ['America/La_Paz'] },

  // --------------------------------------------------------------- Europe --
  { abbr: 'UTC', name: 'Coordinated Universal Time', zones: ['UTC'] },
  { abbr: 'GMT', name: 'Greenwich Mean Time', zones: ['Europe/London', 'Atlantic/Reykjavik', 'Africa/Abidjan', 'Africa/Accra'] },
  { abbr: 'BST', name: 'British Summer Time / Bangladesh Standard Time', zones: ['Europe/London', 'Asia/Dhaka'] },
  { abbr: 'WET', name: 'Western European Time', zones: ['Europe/Lisbon', 'Atlantic/Canary', 'Africa/Casablanca'] },
  { abbr: 'WEST', name: 'Western European Summer Time', zones: ['Europe/Lisbon', 'Atlantic/Canary'] },
  { abbr: 'CET', name: 'Central European Time', zones: ['Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome', 'Europe/Amsterdam', 'Europe/Brussels', 'Europe/Vienna', 'Europe/Warsaw', 'Europe/Prague', 'Europe/Budapest', 'Europe/Zurich', 'Europe/Stockholm', 'Europe/Oslo', 'Europe/Copenhagen'] },
  { abbr: 'CEST', name: 'Central European Summer Time', zones: ['Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome', 'Europe/Amsterdam', 'Europe/Warsaw', 'Europe/Zurich'] },
  { abbr: 'EET', name: 'Eastern European Time', zones: ['Europe/Athens', 'Europe/Helsinki', 'Europe/Bucharest', 'Europe/Kyiv', 'Europe/Riga', 'Europe/Vilnius', 'Europe/Sofia', 'Africa/Cairo'] },
  { abbr: 'EEST', name: 'Eastern European Summer Time', zones: ['Europe/Athens', 'Europe/Helsinki', 'Europe/Bucharest', 'Europe/Kyiv'] },
  { abbr: 'MSK', name: 'Moscow Standard Time', zones: ['Europe/Moscow'] },
  { abbr: 'TRT', name: 'Turkey Time', zones: ['Europe/Istanbul'] },

  // ------------------------------------------------------- Middle East, Africa --
  { abbr: 'GST', name: 'Gulf Standard Time', zones: ['Asia/Dubai', 'Asia/Muscat'] },
  { abbr: 'IRST', name: 'Iran Standard Time', zones: ['Asia/Tehran'] },
  { abbr: 'SAST', name: 'South Africa Standard Time', zones: ['Africa/Johannesburg'] },
  { abbr: 'WAT', name: 'West Africa Time', zones: ['Africa/Lagos', 'Africa/Algiers', 'Africa/Kinshasa'] },
  { abbr: 'CAT', name: 'Central Africa Time', zones: ['Africa/Harare', 'Africa/Maputo', 'Africa/Lusaka'] },
  { abbr: 'EAT', name: 'East Africa Time', zones: ['Africa/Nairobi', 'Africa/Addis_Ababa', 'Africa/Dar_es_Salaam', 'Africa/Kampala'] },

  // ----------------------------------------------------------------- Asia --
  { abbr: 'IST', name: 'India / Ireland / Israel Standard Time', zones: ['Asia/Kolkata', 'Europe/Dublin', 'Asia/Jerusalem'] },
  { abbr: 'PKT', name: 'Pakistan Standard Time', zones: ['Asia/Karachi'] },
  { abbr: 'NPT', name: 'Nepal Time', zones: ['Asia/Kathmandu'] },
  { abbr: 'AFT', name: 'Afghanistan Time', zones: ['Asia/Kabul'] },
  { abbr: 'UZT', name: 'Uzbekistan Time', zones: ['Asia/Tashkent'] },
  { abbr: 'ALMT', name: 'Alma-Ata Time', zones: ['Asia/Almaty'] },
  { abbr: 'ICT', name: 'Indochina Time', zones: ['Asia/Bangkok', 'Asia/Ho_Chi_Minh', 'Asia/Phnom_Penh', 'Asia/Vientiane'] },
  { abbr: 'WIB', name: 'Western Indonesian Time', zones: ['Asia/Jakarta'] },
  { abbr: 'WITA', name: 'Central Indonesian Time', zones: ['Asia/Makassar'] },
  { abbr: 'WIT', name: 'Eastern Indonesian Time', zones: ['Asia/Jayapura'] },
  { abbr: 'SGT', name: 'Singapore Time', zones: ['Asia/Singapore'] },
  { abbr: 'MYT', name: 'Malaysia Time', zones: ['Asia/Kuala_Lumpur'] },
  { abbr: 'HKT', name: 'Hong Kong Time', zones: ['Asia/Hong_Kong'] },
  { abbr: 'PHT', name: 'Philippine Time', zones: ['Asia/Manila'] },
  { abbr: 'JST', name: 'Japan Standard Time', zones: ['Asia/Tokyo'] },
  { abbr: 'KST', name: 'Korea Standard Time', zones: ['Asia/Seoul'] },
  { abbr: 'MMT', name: 'Myanmar Time', zones: ['Asia/Yangon'] },

  // ------------------------------------------------------ Oceania, Pacific --
  { abbr: 'AEST', name: 'Australian Eastern Standard Time', zones: ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane'] },
  { abbr: 'AEDT', name: 'Australian Eastern Daylight Time', zones: ['Australia/Sydney', 'Australia/Melbourne'] },
  { abbr: 'ACST', name: 'Australian Central Standard Time', zones: ['Australia/Adelaide', 'Australia/Darwin'] },
  { abbr: 'ACDT', name: 'Australian Central Daylight Time', zones: ['Australia/Adelaide'] },
  { abbr: 'AWST', name: 'Australian Western Standard Time', zones: ['Australia/Perth'] },
  { abbr: 'NZST', name: 'New Zealand Standard Time', zones: ['Pacific/Auckland'] },
  { abbr: 'NZDT', name: 'New Zealand Daylight Time', zones: ['Pacific/Auckland'] },
  { abbr: 'FJT', name: 'Fiji Time', zones: ['Pacific/Fiji'] },
  { abbr: 'CHST', name: 'Chamorro Standard Time', zones: ['Pacific/Guam'] },
  { abbr: 'SST', name: 'Samoa Standard Time', zones: ['Pacific/Pago_Pago'] },
  { abbr: 'PGT', name: 'Papua New Guinea Time', zones: ['Pacific/Port_Moresby'] },
];

/** Spelt-out name for an abbreviation, for the result row. */
const NAME_BY_ABBR = new Map(ZONE_ABBREVIATIONS.map((entry) => [entry.abbr, entry.name]));

export function abbreviationName(abbr: string): string | null {
  return NAME_BY_ABBR.get(abbr.toUpperCase()) ?? null;
}

export interface AbbreviationIndex {
  /** Uppercased abbreviation to the zones that answer to it. */
  byAbbr: Map<string, Set<string>>;
  /** A zone's abbreviation as it stands today, for the result badge. */
  currentByZone: Map<string, string>;
}

let cached: { index: AbbreviationIndex; hourBucket: number } | null = null;

/**
 * Builds (and caches) the abbreviation index for the zones supplied.
 *
 * The `Intl` half is only correct for the current date -- `America/New_York`
 * is EDT in July and EST in January -- so the cache turns over hourly, which
 * is far more often than any zone actually changes.
 */
export function abbreviationIndex(zones: Iterable<string>, nowMs: number): AbbreviationIndex {
  const hourBucket = Math.floor(nowMs / 3600000);
  if (cached && cached.hourBucket === hourBucket) return cached.index;

  const byAbbr = new Map<string, Set<string>>();
  const currentByZone = new Map<string, string>();

  const add = (abbr: string, zone: string) => {
    const key = abbr.toUpperCase();
    let set = byAbbr.get(key);
    if (!set) byAbbr.set(key, (set = new Set()));
    set.add(zone);
  };

  for (const entry of ZONE_ABBREVIATIONS) {
    for (const zone of entry.zones) add(entry.abbr, zone);
  }

  const date = new Date(nowMs);
  for (const zone of zones) {
    let short: string;
    try {
      short =
        new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'short' })
          .formatToParts(date)
          .find((part) => part.type === 'timeZoneName')?.value ?? '';
    } catch {
      continue;
    }
    // `GMT+5:30` is an offset, not an abbreviation; the curated table covers
    // those zones instead.
    if (!short || !/^[A-Z]{2,5}$/.test(short)) continue;
    currentByZone.set(zone, short);
    add(short, zone);
  }

  const index = { byAbbr, currentByZone };
  cached = { index, hourBucket };
  return index;
}

/** Matches `utc+5`, `gmt-3`, `+5:30`, `utc`. Returns minutes east of UTC. */
export function parseOffsetQuery(query: string): number | null {
  const match = /^(?:utc|gmt)?\s*([+−-])?\s*(\d{1,2})(?::?(\d{2}))?$/i.exec(query.trim());
  if (!match) {
    return /^(?:utc|gmt)$/i.test(query.trim()) ? 0 : null;
  }
  const [, sign, hours, minutes] = match;
  // A bare number is a year or a street number far more often than an offset.
  if (!sign) return null;
  const total = Number(hours) * 60 + Number(minutes ?? 0);
  if (total > 14 * 60) return null;
  return sign === '+' ? total : -total;
}


/**
 * Abbreviations that name the *summer* half of a zone's year.
 *
 * `BST` is in here because it is British Summer Time, but the same three
 * letters are Bangladesh Standard Time, which is not seasonal at all. The
 * lookup below resolves that by asking what the zone is doing right now
 * rather than by trusting the letters.
 */
const DAYLIGHT_ABBREVIATIONS = new Set([
  'EDT', 'CDT', 'MDT', 'PDT', 'AKDT', 'ADT', 'NDT',
  'WEST', 'CEST', 'EEST', 'BST', 'IDT',
  'AEDT', 'ACDT', 'NZDT', 'CLST',
]);

/** Zone to the abbreviations the curated table lists for it. */
let zoneToAbbreviations: Map<string, string[]> | null = null;

function abbreviationsForZone(timeZone: string): string[] {
  if (!zoneToAbbreviations) {
    zoneToAbbreviations = new Map();
    for (const entry of ZONE_ABBREVIATIONS) {
      for (const zone of entry.zones) {
        const list = zoneToAbbreviations.get(zone);
        if (list) list.push(entry.abbr);
        else zoneToAbbreviations.set(zone, [entry.abbr]);
      }
    }
  }
  return zoneToAbbreviations.get(timeZone) ?? [];
}

const namedFormatters = new Map<string, Intl.DateTimeFormat>();

function zoneNameFormatter(timeZone: string, width: 'long' | 'short'): Intl.DateTimeFormat {
  const key = timeZone + '|' + width;
  let fmt = namedFormatters.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: width });
    namedFormatters.set(key, fmt);
  }
  return fmt;
}

function zoneNamePart(timeZone: string, width: 'long' | 'short', date: Date): string {
  return (
    zoneNameFormatter(timeZone, width)
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')?.value ?? ''
  );
}

export interface ZoneLabel {
  /** `Pakistan Standard Time`, `Mountain Daylight Time`. Always present. */
  name: string;
  /** `PKT`, `EDT`. `null` for zones with no settled abbreviation. */
  abbreviation: string | null;
  /** `UTC+5`. */
  offset: string;
  /** The abbreviation when there is one, otherwise the offset. */
  short: string;
}

/** Keyed by zone and offset: the name only changes when the offset does. */
const labelCache = new Map<string, ZoneLabel>();

/**
 * What to call a zone right now.
 *
 * The full name comes from `Intl`, which has one for every zone and switches
 * between standard and summer forms on its own -- `Asia/Karachi` is "Pakistan
 * Standard Time" and `America/Denver` is "Mountain Daylight Time" in July.
 *
 * The abbreviation is harder: `Intl` only returns real letters for North
 * America and falls back to `GMT+5` everywhere else. So the curated table is
 * consulted, and where a zone has both a winter and a summer form the full
 * name decides which applies -- rather than deriving letters from the name,
 * which would turn Pakistan Standard Time into the Pacific's `PST`.
 */
export function zoneLabel(timeZone: string, epochMs: number, offsetMinutes: number): ZoneLabel {
  const key = timeZone + '|' + offsetMinutes;
  const hit = labelCache.get(key);
  if (hit) return hit;

  const date = new Date(epochMs);
  const offset = formatOffset(offsetMinutes);
  let name: string;
  let abbreviation: string | null = null;

  try {
    name = zoneNamePart(timeZone, 'long', date) || offset;
    const short = zoneNamePart(timeZone, 'short', date);
    if (/^[A-Z]{2,5}$/.test(short)) {
      abbreviation = short;
    } else {
      const candidates = abbreviationsForZone(timeZone);
      if (candidates.length > 0) {
        const summer = /summer|daylight/i.test(name);
        const matching = candidates.filter((abbr) =>
          summer ? DAYLIGHT_ABBREVIATIONS.has(abbr) : !DAYLIGHT_ABBREVIATIONS.has(abbr),
        );
        // A zone with only a seasonal-looking abbreviation keeps it: `BST`
        // is Bangladesh's year-round name even though it reads like summer.
        abbreviation = matching[0] ?? candidates[0] ?? null;
      }
    }
  } catch {
    name = offset;
  }

  const label: ZoneLabel = { name, abbreviation, offset, short: abbreviation ?? offset };
  if (labelCache.size > 600) labelCache.clear();
  labelCache.set(key, label);
  return label;
}
