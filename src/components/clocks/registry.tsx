import { clockPreset } from '@/clocks/registry';
import type { ClockPreset, FacePalette, FamilyId } from '@/clocks/spec';
import type { ClockReading } from '@/hooks/useClockReading';
import { useDashboard } from '@/hooks/useDashboard';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { ClockSize, SavedClock } from '@/time/types';

import type { ClockFaceComponent } from './face-types';
import {
  AnalogFace,
  DigitalFace,
  FlipFace,
  PanelFace,
  RingFace,
  TypeFace,
  WidgetFace,
} from './families';

const FAMILY_RENDERERS: Record<FamilyId, ClockFaceComponent> = {
  analog: AnalogFace,
  digital: DigitalFace,
  ring: RingFace,
  panel: PanelFace,
  flip: FlipFace,
  type: TypeFace,
  widget: WidgetFace,
};

/** Rendered size per setting: the dial diameter, or a digital face's basis. */
export const SIZE_PX: Record<ClockSize, number> = { sm: 148, md: 200, lg: 264, xl: 332 };

/**
 * Picks the palette a preset should draw with.
 *
 * `appearance` on the clock wins when it is set to light or dark. On `auto` a
 * preset that declares `naturalDark` keeps its own identity -- a face called
 * "Dark analog" that turned white on the light theme would stop being that
 * design -- and everything else follows the dashboard.
 */
export function resolvePalette(
  preset: ClockPreset,
  appearance: SavedClock['prefs']['appearance'],
  themeIsDark: boolean,
): { palette: FacePalette; dark: boolean } {
  const dark =
    appearance === 'dark'
      ? true
      : appearance === 'light'
        ? false
        : (preset.naturalDark ?? themeIsDark);

  return { palette: dark && preset.paletteDark ? preset.paletteDark : preset.palette, dark };
}

export interface ClockFaceSlotProps {
  clock: SavedClock;
  reading: ClockReading;
  /** The single-featured slot, where type scales with the viewport. */
  hero?: boolean;
  /** Overrides the clock's configured size, for gallery previews. */
  size?: number;
  /** Renders a different preset than the clock's own, for gallery previews. */
  previewPreset?: ClockPreset;
}

/**
 * Renders whichever face a clock is set to, resolving the preset, its palette
 * and the motion preference once so no family renderer has to know about the
 * dashboard.
 */
export function ClockFace({
  clock,
  reading,
  hero = false,
  size,
  previewPreset,
}: ClockFaceSlotProps) {
  const { state } = useDashboard();
  const reducedMotion = useReducedMotion();

  const preset = previewPreset ?? clockPreset(clock.style);
  const { palette } = resolvePalette(preset, clock.prefs.appearance, state.theme === 'midnight');
  const Face = FAMILY_RENDERERS[preset.family];

  return (
    <Face
      clock={clock}
      reading={reading}
      preset={preset}
      palette={palette}
      size={size ?? SIZE_PX[clock.prefs.size]}
      hero={hero}
      smoothSeconds={!reducedMotion}
    />
  );
}
