/**
 * The clock catalogue.
 *
 * Pure data, so `src/time` can validate a saved style id and pick a tick rate
 * without importing anything that renders. The components that draw these
 * presets live in `components/clocks/families`.
 */
import { ANALOG_PRESETS } from './presets/analog';
import { DIGITAL_PRESETS } from './presets/digital';
import { FLIP_PRESETS, TYPE_PRESETS, WIDGET_PRESETS } from './presets/misc';
import { PANEL_PRESETS } from './presets/panel';
import { RING_PRESETS } from './presets/ring';
import type { ClockPreset, FamilyId } from './spec';
import type { ClockKind } from '@/time/types';

/**
 * Gallery order. Analog leads because it is what people picture when they
 * think "clock face", and the default digital preset sits at the top of its
 * own family rather than being promoted out of it.
 */
export const CLOCK_PRESETS: readonly ClockPreset[] = [
  ...DIGITAL_PRESETS,
  ...ANALOG_PRESETS,
  ...RING_PRESETS,
  ...PANEL_PRESETS,
  ...FLIP_PRESETS,
  ...TYPE_PRESETS,
  ...WIDGET_PRESETS,
];

export const DEFAULT_CLOCK_STYLE = 'digital-oversized';

const BY_ID = new Map(CLOCK_PRESETS.map((preset) => [preset.id, preset]));

/** The default preset. Present by construction; asserted once, here. */
const FALLBACK = BY_ID.get(DEFAULT_CLOCK_STYLE) ?? CLOCK_PRESETS[0]!;

export function clockPreset(id: string): ClockPreset {
  return BY_ID.get(id) ?? FALLBACK;
}

export function isClockStyleId(id: unknown): id is string {
  return typeof id === 'string' && BY_ID.has(id);
}

export function clockKind(id: string): ClockKind {
  return clockPreset(id).kind;
}

export const CLOCK_STYLE_IDS: readonly string[] = CLOCK_PRESETS.map((preset) => preset.id);

export interface FamilyMeta {
  id: FamilyId;
  name: string;
  /** How many presets the family holds, for the gallery's filter chips. */
  count: number;
}

const FAMILY_NAMES: Record<FamilyId, string> = {
  analog: 'Analog',
  digital: 'Digital',
  ring: 'Rings',
  panel: 'Panels',
  flip: 'Flip',
  type: 'Type',
  widget: 'Widgets',
};

export const CLOCK_FAMILIES: readonly FamilyMeta[] = (
  ['analog', 'digital', 'ring', 'panel', 'flip', 'type', 'widget'] as const
).map((id) => ({
  id,
  name: FAMILY_NAMES[id],
  count: CLOCK_PRESETS.filter((preset) => preset.family === id).length,
}));

/**
 * Filters the catalogue for the gallery.
 *
 * The query matches a preset's name, its family and its tags, so `gold`,
 * `terminal` and `analog` all find what you would expect -- and so does
 * `calm`, which is a mood rather than a mechanism.
 */
export function filterPresets(query: string, family: FamilyId | 'all'): readonly ClockPreset[] {
  const needle = query.trim().toLowerCase();
  return CLOCK_PRESETS.filter((preset) => {
    if (family !== 'all' && preset.family !== family) return false;
    if (!needle) return true;
    return (
      preset.name.toLowerCase().includes(needle) ||
      preset.family.includes(needle) ||
      preset.tags.some((tag) => tag.includes(needle))
    );
  });
}
