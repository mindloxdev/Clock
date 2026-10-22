/**
 * The vocabulary the clock catalogue is written in.
 *
 * Pure data: no React, no DOM. A preset describes *what* a face looks like;
 * the components under `components/clocks/families` decide how to draw it.
 * Keeping the two apart is what lets the catalogue hold 100+ designs without
 * 100+ components to maintain -- and it means every face inherits the same
 * verified dial geometry and the same time handling.
 */
import type { ClockKind } from '@/time/types';

export type FamilyId = 'analog' | 'digital' | 'ring' | 'panel' | 'flip' | 'type' | 'widget';

/**
 * The five colour roles a face needs.
 *
 * Values are raw CSS colours, so a preset can commit to a palette (the gold
 * dial is gold on every theme). A preset that should instead follow the
 * dashboard uses `var(--c-*)` tokens here -- same field, no special case.
 */
export interface FacePalette {
  /** Face or panel fill. `null` means transparent: it sits on the card. */
  bg: string | null;
  /** Hands, digits, markers. */
  ink: string;
  /**
   * Minute ticks and other decorative marks. Deliberately low contrast on the
   * screen palettes -- unlit LCD segments are *meant* to be faint -- so it is
   * never used for text.
   */
  dim: string;
  /** Secondary text. Always clears 4.5:1 on `bg`; see `palettes.ts`. */
  caption: string;
  /** Second hand, ring fill, glow. */
  accent: string;
  /** Rim or border. `null` means none. */
  line: string | null;
}

// ------------------------------------------------------------------ analog --

export type MarkerShape = 'bar' | 'dot' | 'wedge' | 'hairline' | 'square' | 'none';
export type NumeralSet = 'none' | 'arabic' | 'roman' | 'quarters' | 'twentyfour';
export type HandShape = 'baton' | 'needle' | 'leaf' | 'skeleton' | 'block' | 'arrow';
export type RimStyle = 'none' | 'hairline' | 'thick' | 'double' | 'inset';
export type FaceTexture = 'flat' | 'radial' | 'sunburst' | 'rings' | 'grid';

export interface AnalogSpec {
  family: 'analog';
  /**
   * A 24-hour dial turns its hour hand once a day, not twice, so the hand
   * maths genuinely differs rather than the numerals merely being relabelled.
   */
  hours?: 12 | 24;
  markers: MarkerShape;
  /** Preset default; the clock's own setting can still switch ticks off. */
  minuteTicks: boolean;
  numerals: NumeralSet;
  hands: HandShape;
  secondHand: 'thin' | 'thick' | 'counterweight' | 'railway';
  rim: RimStyle;
  pin: 'dot' | 'ring' | 'none';
  texture: FaceTexture;
  /** Gradient stops that paint markers and hands as metal rather than a flat fill. */
  metal?: readonly string[];
  numeralFont?: 'sans' | 'mono' | 'serif';
  /** A second, inner chapter ring. */
  innerRing?: boolean;
}

// ----------------------------------------------------------------- digital --

export interface DigitalSpec {
  family: 'digital';
  font: 'sans' | 'mono' | 'serif';
  weight: number;
  /** In em. Negative tightens. */
  tracking: number;
  layout: 'inline' | 'stacked';
  /** Colour of the glow, when the face has one. */
  glow?: string;
  /** Hollow digits with a stroked outline. */
  outline?: boolean;
  /** A hard offset shadow, as Neubrutalism uses. */
  hardShadow?: string;
  caption: 'date' | 'city' | 'offset' | 'none';
  captionTracking?: number;
  /** Separate the groups with a thin gap rather than a colon. */
  separator?: 'colon' | 'gap' | 'dot';
}

// -------------------------------------------------------------------- ring --

export interface RingSpec {
  family: 'ring';
  /**
   * `progress` sweeps once a day, `dual` draws hours and minutes as two arcs,
   * `segments` steps through 24 blocks, `outline` is a plain ruled circle.
   */
  mode: 'progress' | 'full' | 'dual' | 'segments' | 'outline';
  thickness: number;
  cap: 'round' | 'butt';
  track: boolean;
  gradient?: readonly string[];
  inner: 'time' | 'time+caption' | 'time+percent';
  dashed?: boolean;
}

// ------------------------------------------------------------------- panel --

export type PanelVariant =
  | 'glass'
  | 'neon'
  | 'lcd'
  | 'terminal'
  | 'card'
  | 'eink'
  | 'clay'
  | 'neumorph'
  | 'brutal'
  | 'hud'
  | 'pixel';

export interface PanelSpec {
  family: 'panel';
  variant: PanelVariant;
  radius: number;
  font: 'sans' | 'mono';
  weight?: number;
  glow?: string;
  scanlines?: boolean;
  /** Three stops for the wash a glass panel needs something to blur. */
  wash?: readonly [string, string, string];
  shadow?: string;
  /** Unlit segments ghosted behind the lit ones, as an LCD shows them. */
  ghost?: boolean;
  caption: 'date' | 'city' | 'offset' | 'none';
}

// -------------------------------------------------------------------- flip --

export interface FlipSpec {
  family: 'flip';
  tile: readonly [string, string];
  tileInk: string;
  border: string | null;
  radius: number;
  seam: boolean;
  separator: 'colon' | 'gap';
}

// -------------------------------------------------------------------- type --

export interface TypeSpec {
  family: 'type';
  font: 'sans' | 'mono' | 'serif';
  weight: number;
  tracking: number;
  layout: 'inline' | 'stacked' | 'ranged';
  caption: 'date' | 'city' | 'zone' | 'none';
  /** A hairline between the time and its caption. */
  rule: boolean;
  uppercase: boolean;
}

// ------------------------------------------------------------------ widget --

export interface WidgetSpec {
  family: 'widget';
  align: 'left' | 'center' | 'split';
  accentBar: 'left' | 'top' | 'none';
  density: 'tight' | 'roomy';
  showIcon: boolean;
  font: 'sans' | 'mono';
  weight: number;
}

export type FaceSpec =
  | AnalogSpec
  | DigitalSpec
  | RingSpec
  | PanelSpec
  | FlipSpec
  | TypeSpec
  | WidgetSpec;

export interface ClockPreset {
  id: string;
  name: string;
  family: FamilyId;
  kind: ClockKind;
  /** Free-text keywords, so the gallery search can find designs by mood. */
  tags: readonly string[];
  /**
   * What the face looks like when the clock follows the dashboard. A design
   * defined by its colour -- the gold dial, the terminal panel -- pins itself
   * here, and `appearance: auto` respects it.
   */
  naturalDark?: boolean;
  /** Draws its own title, so the featured wrapper leaves its header off. */
  selfLabelled?: boolean;
  palette: FacePalette;
  /** Used when the face resolves dark. Absent means the palette is fixed. */
  paletteDark?: FacePalette;
  spec: FaceSpec;
}

/** Follows the dashboard theme, on a card surface. */
export const THEMED: FacePalette = {
  bg: 'var(--c-surface)',
  ink: 'var(--c-ink)',
  dim: 'var(--c-line-strong)',
  caption: 'var(--c-muted)',
  accent: 'var(--c-accent)',
  line: 'var(--c-line-strong)',
};

/** Follows the theme with no fill of its own. */
export const THEMED_BARE: FacePalette = {
  bg: null,
  ink: 'var(--c-ink)',
  dim: 'var(--c-line-strong)',
  caption: 'var(--c-muted)',
  accent: 'var(--c-accent)',
  line: 'var(--c-line)',
};

export function palette(
  bg: string | null,
  ink: string,
  dim: string,
  accent: string,
  line: string | null,
  caption: string,
): FacePalette {
  return { bg, ink, dim, accent, line, caption };
}
