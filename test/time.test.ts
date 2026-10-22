import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ZONE_ABBREVIATIONS, parseOffsetQuery } from '@/time/abbreviations';
import {
  formatOffsetDelta,
  instantFromWallTime,
  parseWallTime,
  wallTimeInputs,
} from '@/time/convert';
import {
  describeWeather,
  fetchWeather,
  formatTemperature,
  formatWind,
  pointKey,
} from '@/time/weather';
import { loadCities, searchCities } from '@/time/cities';
import { CLOCK_FAMILIES, CLOCK_PRESETS, clockKind, isClockStyleId } from '@/clocks/registry';
import { createClock, seedState } from '@/time/defaults';
import { getSunInfo, isDaylight } from '@/time/sun';
import { loadState, saveState } from '@/time/storage';
import type { DashboardState } from '@/time/types';
import {
  DATE_FULL,
  dayDifference,
  formatOffset,
  formatTime,
  formatZonedDate,
  handAngles,
  isValidTimeZone,
  relativeDayLabel,
  zonedTime,
} from '@/time/zones';

/** 2026-07-04T12:00:00Z and 2026-01-15T12:00:00Z: one in DST, one out. */
const SUMMER = Date.parse('2026-07-04T12:00:00Z');
const WINTER = Date.parse('2026-01-15T12:00:00Z');

describe('zonedTime', () => {
  it('reads the wall clock of whole-hour zones', () => {
    const london = zonedTime(SUMMER, 'Europe/London');
    expect([london.hour, london.minute]).toEqual([13, 0]);
    expect([london.year, london.month, london.day]).toEqual([2026, 7, 4]);
  });

  it('handles half- and quarter-hour offsets', () => {
    const kolkata = zonedTime(SUMMER, 'Asia/Kolkata');
    expect([kolkata.hour, kolkata.minute]).toEqual([17, 30]);
    expect(kolkata.offsetMinutes).toBe(330);

    // Australia/Eucla is UTC+8:45 -- a 45-minute offset, all year.
    const eucla = zonedTime(SUMMER, 'Australia/Eucla');
    expect([eucla.hour, eucla.minute]).toEqual([20, 45]);
    expect(eucla.offsetMinutes).toBe(525);

    // Pacific/Marquesas is UTC-9:30: a negative non-whole-hour offset.
    const marquesas = zonedTime(SUMMER, 'Pacific/Marquesas');
    expect([marquesas.hour, marquesas.minute]).toEqual([2, 30]);
    expect(marquesas.offsetMinutes).toBe(-570);
  });

  it('follows daylight saving without a table of its own', () => {
    expect(zonedTime(SUMMER, 'America/New_York').offsetMinutes).toBe(-240);
    expect(zonedTime(WINTER, 'America/New_York').offsetMinutes).toBe(-300);
    expect(zonedTime(SUMMER, 'America/New_York').hour).toBe(8);
    expect(zonedTime(WINTER, 'America/New_York').hour).toBe(7);

    // The southern hemisphere runs the other way round.
    expect(zonedTime(SUMMER, 'Pacific/Auckland').offsetMinutes).toBe(720);
    expect(zonedTime(WINTER, 'Pacific/Auckland').offsetMinutes).toBe(780);
  });

  it('resolves a calendar date that differs from the viewer’s', () => {
    const auckland = zonedTime(SUMMER, 'Pacific/Auckland');
    const utc = zonedTime(SUMMER, 'UTC');
    expect([auckland.year, auckland.month, auckland.day]).toEqual([2026, 7, 5]);
    expect(dayDifference(auckland, utc)).toBe(1);
    expect(relativeDayLabel(auckland, utc)).toBe('Tomorrow');
    expect(relativeDayLabel(utc, auckland)).toBe('Yesterday');
    expect(relativeDayLabel(utc, utc)).toBeNull();
  });

  it('reports the weekday of the clock’s own zone', () => {
    // 4 July 2026 is a Saturday; Auckland is already on Sunday the 5th.
    expect(zonedTime(SUMMER, 'UTC').weekdayIndex).toBe(6);
    expect(zonedTime(SUMMER, 'Pacific/Auckland').weekdayIndex).toBe(0);
  });

  it('formats a zone’s date rather than the viewer’s', () => {
    const auckland = zonedTime(SUMMER, 'Pacific/Auckland');
    expect(formatZonedDate(auckland, DATE_FULL)).toContain('5');
    expect(formatZonedDate(auckland, DATE_FULL)).toContain('2026');
  });

  it('rejects identifiers that are not real zones', () => {
    expect(isValidTimeZone('Europe/London')).toBe(true);
    expect(isValidTimeZone('Mars/Olympus_Mons')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
  });
});

describe('formatOffset', () => {
  it('writes whole, fractional and zero offsets', () => {
    expect(formatOffset(0)).toBe('UTC');
    expect(formatOffset(60)).toBe('UTC+1');
    expect(formatOffset(330)).toBe('UTC+5:30');
    expect(formatOffset(525)).toBe('UTC+8:45');
    // A typographic minus, not a hyphen.
    expect(formatOffset(-300)).toBe('UTC−5');
    expect(formatOffset(-570)).toBe('UTC−9:30');
  });
});

describe('formatTime', () => {
  const at = (hour: number, minute = 15, second = 40) =>
    zonedTime(Date.UTC(2026, 6, 4, hour, minute, second), 'UTC');

  it('pads the hour in both formats so the width never changes', () => {
    expect(formatTime(at(8), false, true).main).toBe('08:15:40');
    expect(formatTime(at(8), true, true).main).toBe('08:15:40');
    expect(formatTime(at(20), false, true).main).toBe('20:15:40');
    expect(formatTime(at(20), true, true).main).toBe('08:15:40');
    expect(formatTime(at(8), false, false).main).toBe('08:15');
  });

  it('turns midnight and noon into 12 with the right meridiem', () => {
    expect(formatTime(at(0), true, false)).toEqual({ main: '12:15', meridiem: 'AM' });
    expect(formatTime(at(12), true, false)).toEqual({ main: '12:15', meridiem: 'PM' });
    expect(formatTime(at(11), true, false).meridiem).toBe('AM');
    expect(formatTime(at(23), true, false)).toEqual({ main: '11:15', meridiem: 'PM' });
    expect(formatTime(at(23), false, false).meridiem).toBeNull();
  });
});

describe('handAngles', () => {
  const at = (hour: number, minute: number, second = 0) =>
    zonedTime(Date.UTC(2026, 6, 4, hour, minute, second), 'UTC');

  it('places the hands where a real clock would', () => {
    expect(handAngles(at(3, 0), false)).toEqual({ hour: 90, minute: 0, second: 0 });
    expect(handAngles(at(9, 0), false)).toEqual({ hour: 270, minute: 0, second: 0 });
    expect(handAngles(at(0, 0), false)).toEqual({ hour: 0, minute: 0, second: 0 });
    // Noon and midnight sit at the same place on a twelve-hour dial.
    expect(handAngles(at(12, 0), false).hour).toBe(0);
  });

  it('creeps the hour hand between the numerals', () => {
    // Half past six: the hour hand is halfway from 6 to 7.
    expect(handAngles(at(6, 30), false).hour).toBe(195);
    expect(handAngles(at(6, 30), false).minute).toBe(180);
  });

  it('only sweeps the second hand when asked', () => {
    const t = zonedTime(Date.UTC(2026, 6, 4, 10, 0, 30) + 500, 'UTC');
    expect(handAngles(t, false).second).toBe(180);
    expect(handAngles(t, true).second).toBe(183);
  });
});

describe('sun', () => {
  const LONDON = { lat: 51.5, lon: -0.1167 };
  const SVALBARD = { lat: 78.2232, lon: 15.6469 };

  it('computes sunrise and sunset for the clock’s own civil day', () => {
    const t = zonedTime(Date.parse('2026-06-21T12:00:00Z'), 'Europe/London');
    const info = getSunInfo(t, LONDON.lat, LONDON.lon);
    // Midsummer in London: 04:43 BST sunrise, 21:21 BST sunset.
    expect(info.sunriseMs).not.toBeNull();
    expect(zonedTime(info.sunriseMs as number, 'Europe/London').hour).toBe(4);
    expect(zonedTime(info.sunsetMs as number, 'Europe/London').hour).toBe(21);
    expect(info.polar).toBeNull();
  });

  it('asks the zone, not the viewer, which day it is', () => {
    // 23:00 local in Auckland: the events must be that day's, not the next.
    const t = zonedTime(Date.parse('2026-03-10T10:00:00Z'), 'Pacific/Auckland');
    expect(t.day).toBe(10);
    const info = getSunInfo(t, -36.85, 174.765);
    expect(zonedTime(info.sunriseMs as number, 'Pacific/Auckland').day).toBe(10);
    expect(zonedTime(info.sunsetMs as number, 'Pacific/Auckland').day).toBe(10);
  });

  it('reports the polar cases instead of inventing a time', () => {
    const december = zonedTime(Date.parse('2026-12-21T12:00:00Z'), 'Arctic/Longyearbyen');
    const polarNight = getSunInfo(december, SVALBARD.lat, SVALBARD.lon);
    expect(polarNight.sunriseMs).toBeNull();
    expect(polarNight.sunsetMs).toBeNull();
    expect(polarNight.polar).toBe('polar-night');
    expect(isDaylight(december.epochMs, polarNight)).toBe(false);

    const june = zonedTime(Date.parse('2026-06-21T12:00:00Z'), 'Arctic/Longyearbyen');
    const midnightSun = getSunInfo(june, SVALBARD.lat, SVALBARD.lon);
    expect(midnightSun.polar).toBe('midnight-sun');
    expect(isDaylight(june.epochMs, midnightSun)).toBe(true);
  });

  it('switches day and night at the computed instants', () => {
    const t = zonedTime(Date.parse('2026-06-21T12:00:00Z'), 'Europe/London');
    const info = getSunInfo(t, LONDON.lat, LONDON.lon);
    const sunrise = info.sunriseMs as number;
    const sunset = info.sunsetMs as number;
    expect(isDaylight(sunrise - 1000, info)).toBe(false);
    expect(isDaylight(sunrise + 1000, info)).toBe(true);
    expect(isDaylight(sunset - 1000, info)).toBe(true);
    expect(isDaylight(sunset + 1000, info)).toBe(false);
  });
});

describe('city dataset', () => {
  it('ranks the obvious match first', async () => {
    const all = await loadCities();
    expect(searchCities(all, 'new york')[0]?.city.name).toBe('New York');
    expect(searchCities(all, 'new')[0]?.city.name).toBe('New York');
    expect(searchCities(all, 'lond')[0]?.city.name).toBe('London');
    expect(searchCities(all, 'karachi')[0]?.city.timeZone).toBe('Asia/Karachi');
    // A plain name match needs no explanation, so it carries no badge.
    expect(searchCities(all, 'new york')[0]?.badge).toBeNull();
  });

  it('matches without diacritics and by zone', () => {
    const all = searchCities([
      {
        id: 'zurich',
        name: 'Zürich',
        country: 'Switzerland',
        province: 'Zurich',
        timeZone: 'Europe/Zurich',
        lat: 47.38,
        lon: 8.53,
        population: 400000,
        zoneOnly: false,
      },
    ], 'zurich');
    expect(all).toHaveLength(1);
  });

  it('finds cities by time-zone abbreviation', async () => {
    const all = await loadCities();
    const top = (q: string, nowMs: number) => searchCities(all, q, { nowMs })[0];

    expect(top('EST', WINTER)?.city.timeZone).toBe('America/New_York');
    expect(top('EST', WINTER)?.badge).toBe('EST');
    expect(top('PST', WINTER)?.city.timeZone).toBe('America/Los_Angeles');
    expect(top('JST', SUMMER)?.city.timeZone).toBe('Asia/Tokyo');
    expect(top('PKT', SUMMER)?.city.timeZone).toBe('Asia/Karachi');
    expect(top('AEST', SUMMER)?.city.timeZone).toBe('Australia/Sydney');

    // Lower case is how people actually type it.
    expect(top('pst', WINTER)?.city.timeZone).toBe('America/Los_Angeles');
  });

  it('matches an abbreviation in both halves of the year', async () => {
    const all = await loadCities();
    const zonesFor = (q: string, nowMs: number) =>
      searchCities(all, q, { nowMs, limit: 40 }).map((hit) => hit.city.timeZone);

    // `Intl` reports EDT in July and EST in January; both forms must find
    // New York either way round.
    for (const nowMs of [SUMMER, WINTER]) {
      expect(zonesFor('EST', nowMs)).toContain('America/New_York');
      expect(zonesFor('EDT', nowMs)).toContain('America/New_York');
    }
  });

  it('offers every candidate for an ambiguous abbreviation', async () => {
    const all = await loadCities();
    const zones = new Set(
      searchCities(all, 'IST', { nowMs: SUMMER, limit: 60 }).map((hit) => hit.city.timeZone),
    );
    // IST is India, Ireland and Israel; picking one silently would be wrong.
    expect(zones.has('Asia/Kolkata')).toBe(true);
    expect(zones.has('Europe/Dublin')).toBe(true);
    expect(zones.has('Asia/Jerusalem')).toBe(true);
  });

  it('does not let a short word hijack the city search', async () => {
    const all = await loadCities();
    // `cet` is an abbreviation, but a real city name still outranks it.
    expect(searchCities(all, 'paris', { nowMs: SUMMER })[0]?.city.name).toBe('Paris');
    // Two letters that are not an abbreviation fall through to names.
    expect(searchCities(all, 'os', { nowMs: SUMMER })[0]?.badge).toBeNull();
  });

  it('finds cities by UTC offset', async () => {
    const all = await loadCities();
    const hit = searchCities(all, 'UTC+5:30', { nowMs: SUMMER })[0];
    expect(hit?.city.timeZone).toBe('Asia/Kolkata');
    expect(hit?.badge).toBe('UTC+5:30');

    expect(searchCities(all, 'gmt+9', { nowMs: SUMMER })[0]?.city.timeZone).toBe('Asia/Tokyo');
    // New York is on UTC-4 in July and UTC-5 in January.
    expect(searchCities(all, '-4', { nowMs: SUMMER })[0]?.city.timeZone).toBe('America/New_York');
    expect(searchCities(all, '-5', { nowMs: WINTER })[0]?.city.timeZone).toBe('America/New_York');
  });

  it('carries a valid IANA zone on every abbreviation', () => {
    for (const entry of ZONE_ABBREVIATIONS) {
      expect(entry.zones.length).toBeGreaterThan(0);
      for (const zone of entry.zones) {
        expect(isValidTimeZone(zone), entry.abbr + ' -> ' + zone).toBe(true);
      }
    }
    // No duplicate abbreviations, or one would shadow the other.
    const seen = ZONE_ABBREVIATIONS.map((entry) => entry.abbr);
    expect(new Set(seen).size).toBe(seen.length);
  });

  it('carries a valid IANA zone on every entry', async () => {
    const all = await loadCities();
    expect(all.length).toBeGreaterThan(2000);
    const invalid = all.filter((city) => !isValidTimeZone(city.timeZone));
    expect(invalid).toHaveLength(0);
  });

  it('keeps homonyms apart', async () => {
    const all = await loadCities();
    const londons = all.filter((city) => city.name === 'London');
    expect(londons.length).toBeGreaterThan(1);
    expect(new Set(londons.map((city) => city.id)).size).toBe(londons.length);
    expect(londons.some((city) => city.timeZone === 'Europe/London')).toBe(true);
    expect(londons.some((city) => city.timeZone === 'America/Toronto')).toBe(true);
  });
});

describe('parseOffsetQuery', () => {
  it('reads the forms people type', () => {
    expect(parseOffsetQuery('UTC+5')).toBe(300);
    expect(parseOffsetQuery('gmt-3')).toBe(-180);
    expect(parseOffsetQuery('+5:30')).toBe(330);
    expect(parseOffsetQuery('+0545')).toBe(345);
    expect(parseOffsetQuery('UTC')).toBe(0);
  });

  it('refuses things that only look like offsets', () => {
    // A bare number is a postcode or a year far more often than an offset.
    expect(parseOffsetQuery('5')).toBeNull();
    expect(parseOffsetQuery('2026')).toBeNull();
    expect(parseOffsetQuery('+25')).toBeNull();
    expect(parseOffsetQuery('london')).toBeNull();
  });
});

describe('instantFromWallTime', () => {
  const at = (date: string, time: string, zone: string) => {
    const wall = parseWallTime(date, time);
    expect(wall, date + ' ' + time).not.toBeNull();
    return instantFromWallTime(wall as NonNullable<typeof wall>, zone);
  };

  it('answers the question the feature exists for', () => {
    // "Tomorrow 5pm in New York -- what time is that in Pakistan?"
    const resolved = at('2026-10-23', '17:00', 'America/New_York');
    expect(resolved.kind).toBe('exact');

    const karachi = zonedTime(resolved.epochMs, 'Asia/Karachi');
    expect([karachi.hour, karachi.minute]).toEqual([2, 0]);
    // New York is still on EDT in October, so it lands on the next day there.
    expect([karachi.year, karachi.month, karachi.day]).toEqual([2026, 10, 24]);

    // And the source zone still reads what was asked for.
    const newYork = zonedTime(resolved.epochMs, 'America/New_York');
    expect([newYork.day, newYork.hour]).toEqual([23, 17]);
  });

  it('handles half-hour zones in this direction too', () => {
    const resolved = at('2026-06-01', '09:00', 'Asia/Kolkata');
    expect(zonedTime(resolved.epochMs, 'UTC').hour).toBe(3);
    expect(zonedTime(resolved.epochMs, 'UTC').minute).toBe(30);
  });

  it('reports a reading the clocks skipped', () => {
    // US clocks go 02:00 -> 03:00 on 8 March 2026, so 02:30 never happens.
    const resolved = at('2026-03-08', '02:30', 'America/New_York');
    expect(resolved.kind).toBe('skipped');
    expect(resolved.landedOn?.hour).toBe(3);
    expect(resolved.landedOn?.minute).toBe(30);
    // The instant it hands back is still usable.
    expect(zonedTime(resolved.epochMs, 'America/New_York').hour).toBe(3);
  });

  it('reports a reading that happens twice', () => {
    // US clocks repeat 01:00-02:00 on 1 November 2026.
    const resolved = at('2026-11-01', '01:30', 'America/New_York');
    expect(resolved.kind).toBe('ambiguous');
    expect(resolved.earlierMs).toBe(Date.parse('2026-11-01T05:30:00Z'));
    expect(resolved.laterMs).toBe(Date.parse('2026-11-01T06:30:00Z'));
    // It defaults to the first occurrence.
    expect(resolved.epochMs).toBe(resolved.earlierMs);
  });

  it('handles the southern hemisphere, where the transitions run the other way', () => {
    const skipped = at('2026-10-04', '02:30', 'Australia/Sydney');
    expect(skipped.kind).toBe('skipped');
    const repeated = at('2026-04-05', '02:30', 'Australia/Sydney');
    expect(repeated.kind).toBe('ambiguous');
  });

  it('is exact either side of a transition', () => {
    expect(at('2026-03-08', '01:30', 'America/New_York').kind).toBe('exact');
    expect(at('2026-03-08', '03:30', 'America/New_York').kind).toBe('exact');
    expect(at('2026-11-01', '00:30', 'America/New_York').kind).toBe('exact');
    expect(at('2026-11-01', '03:30', 'America/New_York').kind).toBe('exact');
  });

  it('round-trips an instant through the input fields', () => {
    const original = Date.parse('2026-07-04T12:34:00Z');
    for (const zone of ['Europe/London', 'Asia/Kolkata', 'Australia/Eucla', 'Pacific/Marquesas']) {
      const { date, time } = wallTimeInputs(original, zone);
      const wall = parseWallTime(date, time);
      const resolved = instantFromWallTime(wall as NonNullable<typeof wall>, zone);
      expect(resolved.kind, zone).toBe('exact');
      expect(resolved.epochMs, zone).toBe(original);
    }
  });
});

describe('parseWallTime', () => {
  it('reads what the date and time inputs produce', () => {
    expect(parseWallTime('2026-10-23', '17:00')).toEqual({
      year: 2026, month: 10, day: 23, hour: 17, minute: 0,
    });
    // Some browsers include seconds in a time input.
    expect(parseWallTime('2026-01-01', '00:00:00')?.hour).toBe(0);
  });

  it('refuses dates that do not exist instead of rolling them over', () => {
    // Date.UTC would silently turn this into 3 March.
    expect(parseWallTime('2026-02-31', '12:00')).toBeNull();
    expect(parseWallTime('2026-13-01', '12:00')).toBeNull();
    expect(parseWallTime('2026-10-23', '25:00')).toBeNull();
    expect(parseWallTime('', '12:00')).toBeNull();
    expect(parseWallTime('2026-10-23', '')).toBeNull();
    // A leap day that does exist is kept.
    expect(parseWallTime('2028-02-29', '12:00')?.day).toBe(29);
  });
});

describe('formatOffsetDelta', () => {
  it('writes the gap between two zones', () => {
    expect(formatOffsetDelta(0)).toBe('same time');
    expect(formatOffsetDelta(540)).toBe('+9h');
    expect(formatOffsetDelta(330)).toBe('+5h 30m');
    expect(formatOffsetDelta(-240)).toBe('−4h');
    expect(formatOffsetDelta(-30)).toBe('−30m');
    expect(formatOffsetDelta(45)).toBe('+45m');
  });
});

describe('weather', () => {
  it('names the WMO codes it knows', () => {
    expect(describeWeather(0)).toEqual({ label: 'Clear', icon: 'clear' });
    expect(describeWeather(3)?.icon).toBe('cloudy');
    expect(describeWeather(45)?.icon).toBe('fog');
    expect(describeWeather(65)?.label).toBe('Heavy rain');
    expect(describeWeather(95)?.icon).toBe('thunder');
    // 56/57 are freezing drizzle sitting inside the drizzle block; a range
    // check would mislabel them as ordinary drizzle.
    expect(describeWeather(55)?.icon).toBe('drizzle');
    expect(describeWeather(56)?.icon).toBe('freezing');
    expect(describeWeather(57)?.icon).toBe('freezing');
    expect(describeWeather(61)?.icon).toBe('rain');
  });

  it('returns nothing for a code it does not know', () => {
    // Better unlabelled than mislabelled.
    expect(describeWeather(4)).toBeNull();
    expect(describeWeather(999)).toBeNull();
    expect(describeWeather(-1)).toBeNull();
  });

  it('converts units at the point of display', () => {
    expect(formatTemperature(0, 'metric')).toBe('0°');
    expect(formatTemperature(0, 'imperial')).toBe('32°');
    expect(formatTemperature(21.5, 'metric')).toBe('22°');
    expect(formatTemperature(100, 'imperial')).toBe('212°');
    expect(formatTemperature(-12.4, 'metric')).toBe('-12°');
    expect(formatWind(10, 'metric')).toBe('10 km/h');
    expect(formatWind(100, 'imperial')).toBe('62 mph');
  });

  it('treats near-identical coordinates as one place', () => {
    expect(pointKey(51.5074, -0.1278)).toBe(pointKey(51.5071, -0.1279));
    expect(pointKey(51.5074, -0.1278)).not.toBe(pointKey(40.75, -73.98));
  });

  describe('fetchWeather', () => {
    const originalFetch = globalThis.fetch;
    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    const stub = (payload: unknown, ok = true) => {
      const calls: string[] = [];
      globalThis.fetch = (async (url: string) => {
        calls.push(String(url));
        return { ok, status: ok ? 200 : 503, json: async () => payload } as Response;
      }) as typeof fetch;
      return calls;
    };

    it('reads a multi-location response in order', async () => {
      stub([
        { current: { temperature_2m: 10.4, weather_code: 0, is_day: 0, relative_humidity_2m: 60, wind_speed_10m: 19.4, apparent_temperature: 5.9 } },
        { current: { temperature_2m: 17.5, weather_code: 2, is_day: 1 } },
      ]);
      const result = await fetchWeather([
        { lat: 51.5, lon: -0.1167 },
        { lat: 40.75, lon: -73.98 },
      ]);
      expect(result.get(pointKey(51.5, -0.1167))?.temperatureC).toBe(10.4);
      expect(result.get(pointKey(51.5, -0.1167))?.isDay).toBe(false);
      expect(result.get(pointKey(40.75, -73.98))?.code).toBe(2);
      // Missing optional fields fall back rather than becoming NaN.
      expect(result.get(pointKey(40.75, -73.98))?.apparentC).toBe(17.5);
    });

    it('reads the single-location shape, which is an object not an array', async () => {
      stub({ current: { temperature_2m: 27.2, weather_code: 0, is_day: 0 } });
      const result = await fetchWeather([{ lat: 24.87, lon: 66.99 }]);
      expect(result.get(pointKey(24.87, 66.99))?.temperatureC).toBe(27.2);
    });

    it('omits a location rather than inventing a reading', async () => {
      stub([
        { current: { weather_code: 0 } },
        { current: { temperature_2m: 5 } },
        {},
      ]);
      const result = await fetchWeather([
        { lat: 1, lon: 1 },
        { lat: 2, lon: 2 },
        { lat: 3, lon: 3 },
      ]);
      // No temperature, or no condition, means nothing worth showing.
      expect(result.size).toBe(0);
    });

    it('batches so one URL never carries a hundred locations', async () => {
      const calls = stub([]);
      const points = Array.from({ length: 60 }, (_, i) => ({ lat: i, lon: i }));
      await fetchWeather(points);
      expect(calls).toHaveLength(3);
      expect(calls[0]?.split('latitude=')[1]?.split('&')[0]?.split(',')).toHaveLength(25);
    });

    it('joins a request already on the wire instead of firing a second', async () => {
      let resolveBody: (value: unknown) => void = () => {};
      const calls: string[] = [];
      globalThis.fetch = (async (url: string) => {
        calls.push(String(url));
        const body = await new Promise((resolve) => {
          resolveBody = resolve;
        });
        return { ok: true, status: 200, json: async () => body } as Response;
      }) as typeof fetch;

      const points = [{ lat: 51.5, lon: -0.1167 }];
      // Two callers, same batch, overlapping in time: one request.
      const first = fetchWeather(points);
      const second = fetchWeather(points);
      await Promise.resolve();
      expect(calls).toHaveLength(1);

      resolveBody([{ current: { temperature_2m: 9, weather_code: 3 } }]);
      const [a, b] = await Promise.all([first, second]);
      expect(a.get(pointKey(51.5, -0.1167))?.temperatureC).toBe(9);
      expect(b.get(pointKey(51.5, -0.1167))?.temperatureC).toBe(9);

      // Once settled, the next call goes to the network again.
      stub([{ current: { temperature_2m: 11, weather_code: 0 } }]);
      await fetchWeather(points);
    });

    it('throws on a failed request so the caller can keep the old reading', async () => {
      stub({}, false);
      await expect(fetchWeather([{ lat: 1, lon: 1 }])).rejects.toThrow('503');
    });

    it('asks for nothing when there is nothing to ask about', async () => {
      const calls = stub([]);
      expect((await fetchWeather([])).size).toBe(0);
      expect(calls).toHaveLength(0);
    });
  });
});

describe('clock catalogue', () => {
  it('ships well over a hundred distinct designs', () => {
    expect(CLOCK_PRESETS.length).toBeGreaterThanOrEqual(100);
    const ids = CLOCK_PRESETS.map((preset) => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
    // Two presets with the same name would be indistinguishable in the gallery.
    const names = CLOCK_PRESETS.map((preset) => preset.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('fills every family', () => {
    for (const family of CLOCK_FAMILIES) {
      expect(family.count, family.id).toBeGreaterThan(0);
    }
    expect(CLOCK_FAMILIES.reduce((sum, f) => sum + f.count, 0)).toBe(CLOCK_PRESETS.length);
  });

  it('keeps every preset well formed', () => {
    for (const preset of CLOCK_PRESETS) {
      expect(preset.spec.family, preset.id).toBe(preset.family);
      expect(preset.kind === 'analog' ? preset.family === 'analog' : true).toBe(true);
      expect(preset.tags.length, preset.id).toBeGreaterThan(0);
      expect(clockKind(preset.id)).toBe(preset.kind);
      // Every colour a face paints with has to be a real CSS value.
      for (const value of [preset.palette.ink, preset.palette.caption, preset.palette.accent]) {
        expect(value, preset.id).toMatch(/^(#[0-9a-f]{6}|var\(--[a-z-]+\))$/);
      }
    }
  });

  it('still answers to the original fifteen style ids', () => {
    // A dashboard saved before the catalogue existed must keep its faces.
    const original = [
      'digital-oversized', 'analog-classic', 'analog-minimal', 'analog-dark',
      'analog-luxury', 'digital-circular', 'ring-progress', 'glass', 'neon',
      'flip', 'lcd', 'gradient-ring', 'widget-compact', 'split-wide', 'type-minimal',
    ];
    for (const id of original) expect(isClockStyleId(id), id).toBe(true);
  });

  it('rejects an id that is not in the catalogue', () => {
    expect(isClockStyleId('not-a-style')).toBe(false);
    expect(isClockStyleId(42)).toBe(false);
  });
});

describe('storage', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => void store.set(key, value),
        removeItem: (key: string) => void store.delete(key),
        clear: () => store.clear(),
      },
    });
  });

  it('seeds a first-run dashboard with a hero', () => {
    const state = loadState();
    expect(state.clocks).toHaveLength(4);
    expect(state.featured).toHaveLength(1);
    expect(state.clocks.some((clock) => clock.id === state.featured[0])).toBe(true);
    expect(state.theme).toBe('classic-light');
    expect(state.accent).toBe('mono');
  });

  it('round-trips a saved dashboard', () => {
    const original = seedState();
    original.hour12 = true;
    original.theme = 'midnight';
    saveState(original);
    const restored = loadState();
    expect(restored.hour12).toBe(true);
    expect(restored.theme).toBe('midnight');
    expect(restored.clocks.map((clock) => clock.title)).toEqual(
      original.clocks.map((clock) => clock.title),
    );
    expect(restored.featured).toEqual(original.featured);
  });

  it('drops clocks whose zone is no longer real, and keeps the rest', () => {
    const good = createClock({
      title: 'Keep me',
      city: { name: 'Oslo', country: 'Norway', province: '', timeZone: 'Europe/Oslo', lat: 59.9, lon: 10.7 },
    });
    saveState({
      clocks: [good, { ...good, id: 'broken', timeZone: 'Nowhere/Fake' }],
      featured: ['broken', good.id],
      hour12: false,
      theme: 'classic-light',
      accent: 'mono',
      weather: true,
      units: 'metric',
    });
    const restored = loadState();
    expect(restored.clocks.map((clock) => clock.id)).toEqual([good.id]);
    // The hero pointed at the dropped clock, so it falls back to a real one.
    expect(restored.featured).toEqual([good.id]);
  });

  it('repairs out-of-range and unknown values instead of failing', () => {
    localStorage.setItem(
      'multiclock.v1',
      JSON.stringify({
        clocks: [
          {
            id: 'a',
            title: 'Odd',
            cityName: 'Tokyo',
            timeZone: 'Asia/Tokyo',
            style: 'not-a-style',
            prefs: { size: 'enormous', showSeconds: 'yes', faceColor: 'red', hour12: 'maybe' },
          },
        ],
        featured: ['a', 'a', 'ghost'],
        theme: 'neon-dreams',
        accent: 'chartreuse',
      }),
    );
    const state = loadState();
    const clock = state.clocks[0];
    expect(clock?.style).toBe('digital-oversized');
    expect(clock?.prefs.size).toBe('md');
    expect(clock?.prefs.showSeconds).toBe(true);
    // An unparseable colour becomes "use the face default", not a broken value.
    expect(clock?.prefs.faceColor).toBeNull();
    expect(clock?.prefs.hour12).toBeNull();
    expect(state.featured).toEqual(['a']);
    expect(state.theme).toBe('classic-light');
    expect(state.accent).toBe('mono');
  });

  it('honours a dashboard someone emptied', () => {
    const emptied: DashboardState = {
      clocks: [],
      featured: [],
      hour12: false,
      theme: 'soft-neutral',
      accent: 'mono',
      weather: true,
      units: 'metric',
    };
    saveState(emptied);
    const restored = loadState();
    expect(restored.clocks).toHaveLength(0);
    expect(restored.theme).toBe('soft-neutral');
  });

  it('survives storage being unavailable', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: () => {
          throw new Error('denied');
        },
        setItem: () => {
          throw new Error('denied');
        },
      },
    });
    expect(() => saveState(seedState())).not.toThrow();
    expect(loadState().clocks).toHaveLength(4);
  });
});
