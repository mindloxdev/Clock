/** Circular faces built from arcs rather than hands. */
import {
  P_CHARCOAL,
  P_CRIMSON,
  P_EMERALD,
  P_FOREST,
  P_HUD,
  P_INK_BLUE,
  P_LAVENDER,
  P_MINT,
  P_NEON_BLUE,
  P_OLED,
  P_PAPER,
  P_SNOW,
  P_SYNTH,
  P_TERRACOTTA,
  P_VAPOR,
} from '../palettes';
import { THEMED, type ClockPreset, type FacePalette, type RingSpec } from '../spec';

type Shape = Omit<RingSpec, 'family'>;

function ring(
  id: string,
  name: string,
  tags: readonly string[],
  palette: FacePalette,
  shape: Shape,
  naturalDark?: boolean,
): ClockPreset {
  return {
    id,
    name,
    family: 'ring',
    kind: 'digital',
    tags,
    palette,
    ...(naturalDark === undefined ? {} : { naturalDark }),
    spec: { family: 'ring', ...shape },
  };
}

const PROGRESS: Shape = { mode: 'progress', thickness: 3, cap: 'round', track: true, inner: 'time+percent' };
const OUTLINE: Shape = { mode: 'outline', thickness: 1.5, cap: 'butt', track: false, inner: 'time+caption' };
const FULL: Shape = { mode: 'full', thickness: 8, cap: 'butt', track: false, inner: 'time+caption' };
const DUAL: Shape = { mode: 'dual', thickness: 5, cap: 'round', track: true, inner: 'time' };
const SEGMENTS: Shape = { mode: 'segments', thickness: 6, cap: 'butt', track: true, inner: 'time+caption' };

export const RING_PRESETS: readonly ClockPreset[] = [
  // The three original ids, preserved.
  ring('digital-circular', 'Circular digital', ['circle', 'clean', 'default'], THEMED, OUTLINE),
  ring('ring-progress', 'Progress ring', ['progress', 'day', 'arc'], THEMED, PROGRESS),
  ring('gradient-ring', 'Gradient ring', ['gradient', 'soft', 'arc'], THEMED, {
    ...FULL,
    gradient: ['var(--c-accent)', 'var(--c-accent)', 'var(--c-accent)'],
  }),

  ring('ring-dual', 'Dual arc', ['dual', 'hours', 'minutes'], THEMED, DUAL),
  ring('ring-segments', 'Day segments', ['segments', 'blocks', 'day'], THEMED, SEGMENTS),
  ring('ring-dashed', 'Dashed ring', ['dashed', 'technical', 'light'], THEMED, {
    ...PROGRESS,
    dashed: true,
    thickness: 4,
  }),
  ring('ring-thick', 'Heavy ring', ['bold', 'thick', 'graphic'], P_SNOW, {
    ...PROGRESS,
    thickness: 12,
    cap: 'butt',
  }, false),
  ring('ring-hairline', 'Hairline circle', ['minimal', 'quiet', 'thin'], P_PAPER, {
    ...OUTLINE,
    thickness: 1,
    inner: 'time',
  }, false),

  // Colour --------------------------------------------------------------------
  ring('ring-hud', 'HUD ring', ['hud', 'sci-fi', 'cyan'], P_HUD, {
    ...SEGMENTS,
    thickness: 4,
    gradient: ['#7fe7ff', '#38b6d9', '#1f4a5c'],
  }, true),
  ring('ring-neon', 'Neon ring', ['neon', 'glow', 'night'], P_NEON_BLUE, {
    ...PROGRESS,
    thickness: 5,
    gradient: ['#eaf4ff', '#7fc4ff', '#2a5f93'],
  }, true),
  ring('ring-vapor', 'Vapor ring', ['vaporwave', 'gradient', 'retro'], P_VAPOR, {
    ...FULL,
    gradient: ['#ff71ce', '#01cdfe', '#05ffa1'],
  }, true),
  ring('ring-synth', 'Sunset ring', ['synthwave', 'sunset', 'warm'], P_SYNTH, {
    ...FULL,
    gradient: ['#ffe6a7', '#ff006e', '#5d2a8f'],
  }, true),
  ring('ring-aurora', 'Aurora ring', ['aurora', 'gradient', 'cool'], P_INK_BLUE, {
    ...FULL,
    thickness: 10,
    gradient: ['#5aa9e6', '#7ad7c4', '#9d8df1'],
  }, true),
  ring('ring-forest', 'Forest ring', ['nature', 'green', 'calm'], P_FOREST, DUAL, true),
  ring('ring-emerald', 'Emerald ring', ['jewel', 'green', 'rich'], P_EMERALD, PROGRESS, true),
  ring('ring-crimson', 'Crimson ring', ['jewel', 'red', 'rich'], P_CRIMSON, SEGMENTS, true),
  ring('ring-charcoal', 'Charcoal ring', ['dark', 'quiet', 'matte'], P_CHARCOAL, OUTLINE, true),
  ring('ring-oled', 'Black ring', ['oled', 'dark', 'minimal'], P_OLED, PROGRESS, true),
  ring('ring-terracotta', 'Terracotta ring', ['earthy', 'warm', 'organic'], P_TERRACOTTA, FULL, false),
  ring('ring-lavender', 'Lavender ring', ['soft', 'violet', 'calm'], P_LAVENDER, DUAL, false),
  ring('ring-mint', 'Mint ring', ['fresh', 'light', 'green'], P_MINT, PROGRESS, false),
];
