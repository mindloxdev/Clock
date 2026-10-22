import clsx from 'clsx';
import { ArrowDown, ArrowUp, Copy, Trash } from 'lucide-react';
import { useEffect, useId, useState } from 'react';

import { useClockReading } from '@/hooks/useClockReading';
import { useDashboard } from '@/hooks/useDashboard';
import type { ClockAppearance, ClockSize, SavedClock } from '@/time/types';

import { ClockStyleGallery } from './ClockStyleGallery';
import { CLOCK_PRESETS, clockPreset } from '@/clocks/registry';
import { ClockFace } from './clocks/registry';
import { Dialog } from './ui/Dialog';
import { Button, Field, Segmented, Switch, Tabs, inputClass } from './ui/controls';

type SettingsTab = 'clock' | 'design';

/** Shown in the colour pickers before the viewer has chosen anything. */
const DEFAULT_FACE_HEX = '#ffffff';
const DEFAULT_HAND_HEX = '#111111';

function ClockSettingsBody({
  clock,
  onClose,
  tab,
  setTab,
}: {
  clock: SavedClock;
  onClose: () => void;
  tab: SettingsTab;
  setTab: (tab: SettingsTab) => void;
}) {
  const { state, updateClock, removeClock, duplicateClock, moveClock, toggleFeatured } =
    useDashboard();
  const reading = useClockReading(clock, 'second');
  const titleId = useId();
  const panelId = useId();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const meta = clockPreset(clock.style);
  const isAnalog = meta.kind === 'analog';
  const featured = state.featured.includes(clock.id);
  const index = state.clocks.findIndex((entry) => entry.id === clock.id);
  const prefs = clock.prefs;

  // A fresh dialog should never open mid-confirmation.
  useEffect(() => {
    setConfirmingDelete(false);
  }, [clock.id]);

  const setPrefs = (patch: Partial<SavedClock['prefs']>) =>
    updateClock(clock.id, { prefs: patch });

  /*
    Two panels rather than one long scroll.

    The design gallery holds 149 live previews; with it inline, every control
    under it -- size, format, delete -- sat a long way down the page. Giving it
    its own tab keeps the settings a single screen and gives the gallery room
    to be browsed.
  */
  const showingGallery = tab === 'design';

  return (
    <div className={clsx('space-y-6', showingGallery && 'flex h-full min-h-0 flex-col')}>
      <div className="flex shrink-0 justify-center">
        <Tabs
          label="Clock settings sections"
          panelId={panelId}
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'clock', label: 'Clock' },
            { value: 'design', label: 'Design', badge: String(CLOCK_PRESETS.length) },
          ]}
        />
      </div>

      <div
        id={panelId}
        role="tabpanel"
        className={clsx(showingGallery && 'flex min-h-0 flex-1 flex-col')}
      >
        {showingGallery ? (
          <ClockStyleGallery
            fill
            clock={clock}
            reading={reading}
            value={clock.style}
            onChange={(style) => updateClock(clock.id, { style })}
          />
        ) : (
          // A plain call, not <ClockPanel />: a component declared inside another
          // gets a new type on every render, which would remount this subtree
          // and drop focus out of the title field on each keystroke.
          clockPanel()
        )}
      </div>
    </div>
  );

  function clockPanel() {
    return (
    <div className="space-y-8">
      <Field
        label="Custom display title"
        htmlFor={titleId}
        hint={'A label only. This clock stays on ' + clock.timeZone + '.'}
      >
        <input
          id={titleId}
          type="text"
          maxLength={48}
          value={clock.title}
          placeholder={clock.cityName}
          onChange={(event) => updateClock(clock.id, { title: event.target.value })}
          className={inputClass}
        />
      </Field>

      {/* The current design, with a way through to the gallery -- so the
          other tab stays discoverable without being in the way. */}
      <section className="flex items-center justify-between gap-4 rounded-card border border-line bg-sunken px-4 py-3">
        <span className="flex min-w-0 items-center gap-3">
          {/* Drawn at full size and scaled down, so a wide digital face and a
              square dial both fit the same small box instead of one of them
              being cropped. */}
          <span
            aria-hidden="true"
            className="relative flex h-12 w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-[8px]"
          >
            <span className="origin-center scale-[0.5]">
              <ClockFace clock={clock} reading={reading} size={88} />
            </span>
          </span>
          <span className="min-w-0">
            <span className="block text-[12px] tracking-wide text-muted">Design</span>
            <span className="block truncate text-[13px] font-medium text-ink">{meta.name}</span>
          </span>
        </span>
        <Button size="sm" onClick={() => setTab('design')}>
          Change
        </Button>
      </section>

      <section className="space-y-4">
        <p className="text-[12px] font-medium tracking-wide text-muted">Size and format</p>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] font-medium">Clock size</span>
          <Segmented
            size="sm"
            label="Clock size"
            value={prefs.size}
            options={[
              { value: 'sm', label: 'S', srLabel: 'Small' },
              { value: 'md', label: 'M', srLabel: 'Medium' },
              { value: 'lg', label: 'L', srLabel: 'Large' },
              { value: 'xl', label: 'XL', srLabel: 'Extra large' },
            ]}
            onChange={(size: ClockSize) => setPrefs({ size })}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] font-medium">Time format</span>
          <Segmented
            size="sm"
            label="Time format for this clock"
            value={prefs.hour12 === null ? 'auto' : prefs.hour12 ? '12' : '24'}
            options={[
              { value: 'auto', label: 'Dashboard', srLabel: 'Follow the dashboard setting' },
              { value: '12', label: '12h', srLabel: '12-hour' },
              { value: '24', label: '24h', srLabel: '24-hour' },
            ]}
            onChange={(value) =>
              setPrefs({ hour12: value === 'auto' ? null : value === '12' })
            }
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] font-medium">Appearance</span>
          <Segmented
            size="sm"
            label="Clock appearance"
            value={prefs.appearance}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
            onChange={(appearance: ClockAppearance) => setPrefs({ appearance })}
          />
        </div>
      </section>

      <section className="divide-y divide-line border-y border-line">
        <Switch
          label="Show seconds"
          checked={prefs.showSeconds}
          onChange={(showSeconds) => setPrefs({ showSeconds })}
        />
        <Switch
          label="Show date"
          checked={prefs.showDate}
          onChange={(showDate) => setPrefs({ showDate })}
        />
        <Switch
          label="Show UTC offset"
          checked={prefs.showOffset}
          onChange={(showOffset) => setPrefs({ showOffset })}
        />
        <Switch
          label="Featured on the dashboard"
          hint={
            featured && state.featured.length === 1
              ? 'The last featured clock has to stay featured.'
              : 'Featured clocks appear in the large area at the top.'
          }
          checked={featured}
          onChange={() => toggleFeatured(clock.id)}
        />
      </section>

      {isAnalog ? (
        <section className="space-y-4">
          <p className="text-[12px] font-medium tracking-wide text-muted">Dial</p>
          <div className="divide-y divide-line border-y border-line">
            <Switch
              label="Numerals"
              checked={prefs.numerals}
              onChange={(numerals) => setPrefs({ numerals })}
            />
            <Switch
              label="Second hand"
              checked={prefs.secondHand}
              onChange={(secondHand) => setPrefs({ secondHand })}
            />
            <Switch
              label="Minute ticks"
              checked={prefs.minuteTicks}
              onChange={(minuteTicks) => setPrefs({ minuteTicks })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ColorChoice
              label="Face colour"
              value={prefs.faceColor}
              fallback={DEFAULT_FACE_HEX}
              onChange={(faceColor) => setPrefs({ faceColor })}
            />
            <ColorChoice
              label="Hand colour"
              value={prefs.handColor}
              fallback={DEFAULT_HAND_HEX}
              onChange={(handColor) => setPrefs({ handColor })}
            />
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <p className="text-[12px] font-medium tracking-wide text-muted">This clock</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => moveClock(clock.id, -1)}
            disabled={index <= 0}
            aria-label="Move earlier in the row"
          >
            <ArrowUp size={14} strokeWidth={2} aria-hidden="true" />
            Earlier
          </Button>
          <Button
            size="sm"
            onClick={() => moveClock(clock.id, 1)}
            disabled={index === -1 || index >= state.clocks.length - 1}
            aria-label="Move later in the row"
          >
            <ArrowDown size={14} strokeWidth={2} aria-hidden="true" />
            Later
          </Button>
          <Button size="sm" onClick={() => duplicateClock(clock.id)}>
            <Copy size={14} strokeWidth={2} aria-hidden="true" />
            Duplicate
          </Button>

          {confirmingDelete ? (
            <span className="flex items-center gap-2">
              <span className="text-[12px] text-muted">Delete this clock?</span>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  removeClock(clock.id);
                  onClose();
                }}
              >
                Yes, delete
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmingDelete(false)}>
                Keep
              </Button>
            </span>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setConfirmingDelete(true)}>
              <Trash size={14} strokeWidth={2} aria-hidden="true" />
              Delete
            </Button>
          )}
        </div>
      </section>
    </div>
    );
  }
}

function ColorChoice({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: string | null;
  fallback: string;
  onChange: (value: string | null) => void;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[12px] font-medium tracking-wide text-muted">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value ?? fallback}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-14 cursor-pointer rounded-control border border-line bg-surface p-1"
        />
        <span className={clsx('tnum text-[12px]', value ? 'text-ink' : 'text-faint')}>
          {value ?? 'Style default'}
        </span>
        {value ? (
          <Button size="sm" variant="ghost" onClick={() => onChange(null)} className="ml-auto">
            Reset
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export interface ClockSettingsProps {
  /** `null` keeps the dialog mounted but closed. */
  clock: SavedClock | null;
  onClose: () => void;
}

/**
 * Per-clock settings (§9).
 *
 * Every control lives behind this one dialog, so a card carries a single
 * settings button instead of a permanent row of them -- which is what the
 * spec asks for and what keeps the row calm.
 *
 * The dialog element stays mounted while closed so the browser runs its own
 * close path, including returning focus to the button that opened it.
 */
export function ClockSettings({ clock, onClose }: ClockSettingsProps) {
  const [tab, setTab] = useState<SettingsTab>('clock');

  // Each clock opens on its own settings, not on whichever tab the last one
  // was left showing.
  useEffect(() => {
    setTab('clock');
  }, [clock?.id]);

  return (
    <Dialog
      open={clock !== null}
      onClose={onClose}
      title="Clock settings"
      description={clock ? clock.title + ' · ' + clock.cityName + ' · ' + clock.timeZone : undefined}
      size="lg"
      // The gallery scrolls itself, so the dialog must not scroll as well.
      fillBody={tab === 'design'}
    >
      {clock ? (
        <ClockSettingsBody clock={clock} onClose={onClose} tab={tab} setTab={setTab} />
      ) : null}
    </Dialog>
  );
}
