# MultiClock

**Live: https://mindloxdev.github.io/Clock/**

A premium, minimalist world-clock dashboard. One oversized hero clock, a row of
city cards, **149 working clock designs**, and live time zones that handle
daylight saving, half-hour offsets, real sunrise/sunset and current weather.
Search by city, by time-zone abbreviation (`EST`, `PST`, `CET`, `JST`) or by
UTC offset. Compare a past or future moment across every city at once — *what
is tomorrow 5pm in New York, in Karachi?*

No backend and no account: everything is computed in the browser and saved to
`localStorage`. The single exception is weather, which has to be observed
rather than calculated — it is one request to Open-Meteo, and switching it off
in settings leaves the app making no network requests at all.

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm test
npm run build
```

## How it is put together

```
src/
  clocks/        The clock catalogue. Pure data, no React.
    spec.ts         Family specs: what an analog/ring/panel face can vary
    palettes.ts     55 palettes, every one contrast-checked
    presets/        149 presets across seven families
    registry.ts     Lookup, validation, family counts, gallery filtering
  time/          Pure logic. No React, no DOM.
    zones.ts        Intl-based zone arithmetic: wall clock, offsets, hand angles
    abbreviations.ts  EST/PST/CET/JST and friends, plus offset-query parsing
    weather.ts      WMO code table, unit conversion, batched fetching
    convert.ts      Wall clock -> instant, including the two awkward days
    sun.ts          Sunrise/sunset and day/night, via SunCalc
    cities.ts       City dataset loading, folding and ranked search
    cities.generated.ts   2,446 places — generated, do not hand-edit
    storage.ts      Versioned, validating localStorage persistence
    defaults.ts     Style ids, default prefs, the first-run dashboard
  hooks/         React plumbing
    useNow.ts       One shared ticker for the whole page
    useDashboard.tsx  Reducer + context + persistence
    useClockReading.ts  Everything a face needs, at the right tick rate
    useWeather.tsx  One batched lookup for every clock, cached for 15 minutes
  components/
    clocks/
      AnalogDial.tsx  One dial that draws every analog preset
      families.tsx    One renderer per family
      registry.tsx    Resolves preset + palette, then renders
    ui/            Dialog, segmented control, switch, buttons
```

The rule the structure enforces: **time-zone logic never touches the UI.** A
face component receives an already-computed reading and draws it. It owns no
timer, resolves no zone, and reads no global state.

## Decisions worth knowing

**149 designs, 7 renderers.** A preset is data: a palette plus a shape (which
markers, which hands, which rim; which weight, which glow, which separator).
Seven family renderers consume those specs, so every analog design inherits
the same verified hand geometry and every face inherits the same time
handling. Adding a design means adding a row, not a component — and the
catalogue cannot drift away from the code that draws it. The style ids from
the original fifteen faces are all still present, so a dashboard saved before
the catalogue existed keeps its faces.

**Palettes are checked, not eyeballed.** Each of the 55 palettes carries five
roles. `ink` and `caption` clear 4.5:1 on their own background and `accent`
clears 3:1 — verified for every palette. `dim` is deliberately exempt: it
paints minute ticks and unlit LCD segments, which are *meant* to be faint, so
it is never used for text. The caption colours were solved for, not picked.

**Search knows what EST means.** `Intl` only returns real abbreviations for
North America (`EDT`, `PDT`, `AKST`); everywhere else it falls back to
`GMT+5:30`. So the index combines what the platform reports today with a
curated table covering the rest of the world, pinning both halves of each
standard/daylight pair — `EST` finds New York in July too. Ambiguous
abbreviations (IST is India, Ireland *and* Israel; CST is the US, China and
Cuba) list every real candidate rather than silently choosing. Offsets work as
queries as well: `UTC+5:30`, `gmt-3`, `+0545`.

**Converting *to* an instant is the hard direction.** Everything else goes
instant → wall clock, which is always well defined. Going back is not: twice a
year a zone skips an hour, so `02:30` never happens, and twice a year it
repeats one, so `01:30` happens twice. `instantFromWallTime` samples the
zone's offset a day either side of the target, which brackets any transition,
and keeps only the candidates that convert *back* to the reading that was
asked for. No survivors means the clocks jumped over it; two means it happens
twice. The converter says which, rather than silently picking one — those two
days a year are exactly when people most need it to be right.

**Weather is observed, so it is fetched — and never invented.** Sunrise comes
from orbital mechanics; whether it is raining in Karachi does not. Conditions
come from Open-Meteo (no key, CORS, free), and when the lookup fails or a
location has no coordinates the UI shows *nothing* rather than a
plausible-looking number — the same rule the spec sets for sunrise. Every
clock on the dashboard costs one request, not one each: points are deduped by
rounded coordinate, batched 25 to a URL, and identical requests already on the
wire are joined rather than repeated. Readings are cached for 15 minutes (the
provider's own cadence) and survive a reload. Temperatures are always fetched
in Celsius and converted at the point of display, so switching to Fahrenheit
costs nothing. Only city coordinates leave the browser — never the viewer's
location, and no geolocation prompt.

**Units follow where you are, not what language your browser is in.** Plenty
of people run an `en-US` browser from Karachi. The default is taken from the
viewer's IANA time zone, falling back to the language region only when the
zone is unfamiliar.

**Time comes from the platform, not from a table.** Every offset is derived by
asking `Intl.DateTimeFormat` for a zone's wall clock and comparing it to the
instant — so daylight saving, half-hour zones (`Asia/Kolkata`), quarter-hour
zones (`Australia/Eucla`) and negative fractional zones
(`Pacific/Marquesas`) are all simply correct, and stay correct as tzdata
updates ship with the browser.

**One ticker, three rates.** A dashboard of faces each running `setInterval`
would drift apart. There is a single loop; components subscribe at `minute`,
`second` or `frame`, and `useSyncExternalStore` bails out of renders that
would not change anything. Only a sweeping second hand justifies a frame loop,
and a reduced-motion viewer never gets one. The loop re-aims at the next whole
second after each tick rather than repeating a fixed 1000 ms, so the display
flips *on* the second; it stops entirely while the tab is hidden and catches up
on return.

**Sunrise and sunset are computed, never invented.** SunCalc (Meeus'
algorithms, rise/set accurate to ~15 s) is given the zone's UTC offset so it
returns events for the clock's own *calendar* day — asking at 23:00 in Auckland
otherwise lands on the neighbouring day. Day/night is decided from those two
instants rather than from solar altitude, so the indicator can never disagree
with the times printed beside it. Polar day and night are reported by SunCalc
outright and shown as "Midnight sun" / "Polar night". A location with no
coordinates shows no sunrise at all rather than a guess.

**The title is only a title.** A clock stores its resolved location — city,
country, IANA zone, coordinates — rather than a pointer into the dataset, so
regenerating the dataset can never re-home someone's clock, and a clock called
"Design Partner (Tokyo!)" still keeps Kolkata time.

**`featured[0]` is the hero.** The spec's "selected clock" and its "highlight
up to three" are one idea, not two: slot 0 is what the big clock, the city
heading and the detail row all read from. Clicking a card promotes that clock
into slot 0 without changing how many are featured.

**Monochrome by default.** `--c-accent` resolves to the ink colour until an
accent is chosen in settings, and even then it reaches only focus rings, the
sunrise/sunset marks and the ring faces. Every text/background pair in all
three themes was checked to clear 4.5:1.

**Restored before first paint.** A small inline script in `index.html` applies
the saved theme before React mounts, so a Midnight user never sees a frame of
Classic Light.

## The city dataset

`src/time/cities.generated.ts` is built from the `city-timezones` package:

```bash
npm run build:cities
```

2,446 entries over 444 IANA zones — every city above 150k, the largest city of
every zone in the dataset (so small-island zones stay reachable), and every
remaining zone `Intl` knows about as a zone-only entry. Entries with no
coordinates simply omit sunrise and sunset. The file is behind a dynamic
`import()`, so its 193 kB only loads when a search field is opened.

## Accessibility

- The segmented controls and the style gallery are real `<input type="radio">`
  groups, so arrow-key movement and "2 of 3" announcements come from the
  platform rather than from re-implemented ARIA.
- Modals are the native `<dialog>` element: focus trap, Escape, background
  inertness and top-layer stacking are the browser's job.
- Analog faces expose a spoken time (`9:41 AM in London`), not a pile of digits.
- The gallery mounts a preview only when it scrolls near the viewport, so 149
  live clocks never redraw at once.
- Controls are 44 px; one `outline` focus style is defined globally and never
  removed. Nothing depends on hover alone.
- `prefers-reduced-motion` ticks second hands instead of sweeping them, and
  suppresses the flip animation.

## Verified

61 tests cover the zone arithmetic (DST in both hemispheres, 45-minute and
negative half-hour offsets, date rollover), sunrise/sunset including the polar
cases at Longyearbyen, time formatting, hand angles, abbreviation and offset
search, dataset integrity, catalogue integrity (no duplicate ids or names,
every preset well formed, the original fifteen ids still valid), the wall-clock
converter (the user's own New York → Karachi case, skipped and repeated
readings in both hemispheres, and a round trip through the input fields),
weather
(the WMO table including the freezing codes buried mid-range, unit
conversion, both response shapes, request batching, in-flight deduplication,
and that a partial response yields no reading at all), and storage
round-tripping and repair. The layout was measured at 320–1600 px with zero
horizontal overflow at every width.

## Deploying

Pushing to `main` runs `.github/workflows/deploy.yml`, which type-checks, runs
the tests, and only then builds and force-pushes `dist/` to the `gh-pages`
branch that Pages serves. A red test does not ship.

It publishes to a branch rather than using the Actions-based Pages deployment
because changing a repository's Pages source needs admin rights that the
workflow token does not have; pushing a branch needs only `contents: write`.

The production build sets `base: '/Clock/'` because the site is served from a
repository subpath; the dev server stays at the root, where a prefix would
only get in the way.

## Weather

Open-Meteo, chosen because it needs no API key, allows cross-origin requests
from the browser, and answers for many locations in one call — which is what
lets a no-backend app offer weather at all. It is free for non-commercial use
and asks for attribution, which the settings panel carries.

Turn it off in Settings → Weather and the app goes back to making no requests.

## Not built

Authentication. The spec asks for a Log In control *only if* authentication is
implemented, so there is none — and no marketing pages either. The dashboard is
the product.
