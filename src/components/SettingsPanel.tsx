import clsx from 'clsx';
import { ArrowDown, ArrowUp, Copy, Pencil, Plus, Trash } from 'lucide-react';

import { useClockReading } from '@/hooks/useClockReading';
import { useWeather } from '@/hooks/useWeather';
import { useDashboard } from '@/hooks/useDashboard';
import type { AccentId, SavedClock, ThemeId, UnitSystem } from '@/time/types';

import { Dialog } from './ui/Dialog';
import { Button, IconButton, Segmented, Switch } from './ui/controls';

const THEMES: { id: ThemeId; name: string; description: string }[] = [
  { id: 'classic-light', name: 'Classic Light', description: 'Light grey ground, white cards, black type.' },
  { id: 'midnight', name: 'Midnight', description: 'Near-black ground with subtle borders.' },
  { id: 'soft-neutral', name: 'Soft Neutral', description: 'Warm off-white with charcoal type.' },
];

const ACCENTS: { id: AccentId; name: string }[] = [
  { id: 'mono', name: 'Monochrome' },
  { id: 'amber', name: 'Amber' },
  { id: 'indigo', name: 'Indigo' },
  { id: 'emerald', name: 'Emerald' },
  { id: 'rose', name: 'Rose' },
];

/**
 * One row of the manage list. It is its own component so each row can hold a
 * reading without the whole dialog re-rendering every second.
 */
function ClockRow({ clock, onEdit }: { clock: SavedClock; onEdit: () => void }) {
  const { state, moveClock, duplicateClock, removeClock } = useDashboard();
  const reading = useClockReading(clock, 'minute');
  const index = state.clocks.findIndex((entry) => entry.id === clock.id);

  return (
    <li className="flex items-center gap-2 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-ink">{clock.title}</p>
        <p className="truncate text-[12px] text-muted">
          {clock.cityName}
          <span className="text-faint">
            {' · '}
            <span className="tnum">{reading.offsetLabel}</span>
          </span>
        </p>
      </div>

      <IconButton
        label={'Move ' + clock.title + ' earlier'}
        disabled={index <= 0}
        onClick={() => moveClock(clock.id, -1)}
      >
        <ArrowUp size={15} strokeWidth={2} aria-hidden="true" />
      </IconButton>
      <IconButton
        label={'Move ' + clock.title + ' later'}
        disabled={index === -1 || index >= state.clocks.length - 1}
        onClick={() => moveClock(clock.id, 1)}
      >
        <ArrowDown size={15} strokeWidth={2} aria-hidden="true" />
      </IconButton>
      <IconButton label={'Duplicate ' + clock.title} onClick={() => duplicateClock(clock.id)}>
        <Copy size={15} strokeWidth={2} aria-hidden="true" />
      </IconButton>
      <IconButton label={'Settings for ' + clock.title} onClick={onEdit}>
        <Pencil size={15} strokeWidth={2} aria-hidden="true" />
      </IconButton>
      <IconButton label={'Delete ' + clock.title} onClick={() => removeClock(clock.id)}>
        <Trash size={15} strokeWidth={2} aria-hidden="true" />
      </IconButton>
    </li>
  );
}

export interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  onEditClock: (clock: SavedClock) => void;
  onAddCity: () => void;
}

/**
 * Dashboard settings: the three themes, the optional accent, the shared
 * defaults, and the list where clocks are reordered, renamed or removed.
 *
 * The theme and accent swatches carry `data-theme` / `data-accent`
 * themselves, so each preview is painted by the same custom properties the
 * real dashboard uses -- there is no second copy of the palette to keep in
 * step.
 */
export function SettingsPanel({ open, onClose, onEditClock, onAddCity }: SettingsPanelProps) {
  const { state, setTheme, setAccent, setHour12, setFeaturedCount, setWeather, setUnits } =
    useDashboard();
  const weather = useWeather();
  const maxFeatured = Math.min(3, Math.max(1, state.clocks.length));

  const updated =
    weather.lastUpdatedMs === null
      ? null
      : new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(
          weather.lastUpdatedMs,
        );

  return (
    <Dialog open={open} onClose={onClose} title="Settings" size="lg">
      <div className="space-y-8">
        <section className="space-y-3">
          <p className="text-[12px] font-medium tracking-wide text-muted">Theme</p>
          <fieldset className="grid gap-2.5 sm:grid-cols-3">
            <legend className="sr-only">Dashboard theme</legend>
            {THEMES.map((theme) => {
              const active = state.theme === theme.id;
              return (
                <label
                  key={theme.id}
                  className={clsx(
                    'flex cursor-pointer flex-col gap-2.5 rounded-card border p-3.5 transition-colors duration-150',
                    active ? 'border-ink bg-sunken' : 'border-line hover:border-line-strong',
                  )}
                >
                  <input
                    type="radio"
                    name="theme"
                    value={theme.id}
                    checked={active}
                    onChange={() => setTheme(theme.id)}
                    className="sr-only"
                  />
                  <span
                    data-theme={theme.id}
                    aria-hidden="true"
                    className="flex w-fit items-center gap-1 rounded-full border border-line bg-canvas px-1.5 py-1"
                  >
                    <span className="h-3.5 w-3.5 rounded-full border border-line bg-surface" />
                    <span className="h-3.5 w-3.5 rounded-full bg-ink" />
                    <span className="h-3.5 w-3.5 rounded-full bg-sunken" />
                  </span>
                  <span className="block text-[13px] font-medium text-ink">{theme.name}</span>
                  <span className="block text-[11px] leading-relaxed text-muted">
                    {theme.description}
                  </span>
                </label>
              );
            })}
          </fieldset>
        </section>

        <section className="space-y-3">
          <p className="text-[12px] font-medium tracking-wide text-muted">Accent</p>
          <p className="-mt-1 text-[12px] leading-relaxed text-muted">
            Applied only to focus rings, the sunrise and sunset marks, and the ring faces.
            Monochrome keeps the dashboard entirely black and white.
          </p>
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">Accent colour</legend>
            {ACCENTS.map((accent) => {
              const active = state.accent === accent.id;
              return (
                <label
                  key={accent.id}
                  className={clsx(
                    'flex cursor-pointer items-center gap-2 rounded-full border py-1.5 pr-3.5 pl-2 text-[12px] font-medium transition-colors duration-150',
                    active ? 'border-ink bg-sunken text-ink' : 'border-line text-muted hover:border-line-strong',
                  )}
                >
                  <input
                    type="radio"
                    name="accent"
                    value={accent.id}
                    checked={active}
                    onChange={() => setAccent(accent.id)}
                    className="sr-only"
                  />
                  <span
                    data-accent={accent.id}
                    aria-hidden="true"
                    className="h-4 w-4 rounded-full bg-accent"
                  />
                  {accent.name}
                </label>
              );
            })}
          </fieldset>
        </section>

        <section className="space-y-4">
          <p className="text-[12px] font-medium tracking-wide text-muted">Dashboard</p>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[13px] font-medium">Featured clocks</span>
            <Segmented
              size="sm"
              label="Number of featured clocks"
              value={String(Math.max(1, state.featured.length))}
              options={[
                { value: '1', label: 'One' },
                { value: '2', label: 'Two' },
                { value: '3', label: 'Three' },
              ].slice(0, maxFeatured)}
              onChange={(value) => setFeaturedCount(Number(value))}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[13px] font-medium">Default time format</span>
            <Segmented
              size="sm"
              label="Default time format"
              value={state.hour12 ? '12' : '24'}
              options={[
                { value: '12', label: '12h', srLabel: '12-hour' },
                { value: '24', label: '24h', srLabel: '24-hour' },
              ]}
              onChange={(value) => setHour12(value === '12')}
            />
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-[12px] font-medium tracking-wide text-muted">Weather</p>

          <div className="divide-y divide-line border-y border-line">
            <Switch
              label="Show current conditions"
              hint="The only feature that uses the network. Off means MultiClock makes no requests at all."
              checked={state.weather}
              onChange={setWeather}
            />
          </div>

          {state.weather ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-[13px] font-medium">Units</span>
                <Segmented
                  size="sm"
                  label="Units"
                  value={state.units}
                  options={[
                    { value: 'metric', label: '°C', srLabel: 'Celsius and kilometres per hour' },
                    { value: 'imperial', label: '°F', srLabel: 'Fahrenheit and miles per hour' },
                  ]}
                  onChange={(value: UnitSystem) => setUnits(value)}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[12px] leading-relaxed text-muted">
                  {weather.status === 'error'
                    ? 'Could not reach the weather service. Clocks are unaffected.'
                    : weather.status === 'loading'
                      ? 'Fetching conditions…'
                      : updated
                        ? 'Updated at ' + updated + ' · refreshes every 15 minutes'
                        : 'No readings yet.'}
                  <br />
                  <span className="text-faint">
                    Weather by Open-Meteo. Only city coordinates are sent — never your location.
                  </span>
                </p>
                <Button size="sm" onClick={weather.refresh}>
                  Refresh
                </Button>
              </div>
            </>
          ) : null}
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] font-medium tracking-wide text-muted">
              {'Your clocks (' + state.clocks.length + ')'}
            </p>
            <Button size="sm" onClick={onAddCity}>
              <Plus size={14} strokeWidth={2.2} aria-hidden="true" />
              Add city
            </Button>
          </div>

          {state.clocks.length === 0 ? (
            <p className="py-4 text-[13px] text-muted">No clocks saved yet.</p>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {state.clocks.map((clock) => (
                <ClockRow key={clock.id} clock={clock} onEdit={() => onEditClock(clock)} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </Dialog>
  );
}
