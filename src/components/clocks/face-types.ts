import type { ReactNode } from 'react';

import type { ClockPreset, FacePalette } from '@/clocks/spec';
import type { ClockReading } from '@/hooks/useClockReading';
import type { SavedClock } from '@/time/types';

/**
 * The contract every family renderer implements.
 *
 * Faces are pure: they receive an already-computed reading and an
 * already-resolved palette, and draw them. None of them owns a timer, reads
 * the dashboard state, or resolves a time zone -- which is what keeps the
 * time-zone logic out of the UI entirely.
 */
export interface ClockFaceProps {
  clock: SavedClock;
  reading: ClockReading;
  preset: ClockPreset;
  /** The preset's palette after light/dark resolution. */
  palette: FacePalette;
  /** Natural size in px: the diameter for analog, nominal height for digital. */
  size: number;
  /** True in the single-featured slot, where type scales with the viewport. */
  hero: boolean;
  /** False when the viewer asked for reduced motion; second hands then tick. */
  smoothSeconds: boolean;
}

export type ClockFaceComponent = (props: ClockFaceProps) => ReactNode;
