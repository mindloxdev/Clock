/** Oversized digit faces: one typographic idea per preset. */
import {
  P_AMBER_CRT,
  P_BRUTAL,
  P_CHROME,
  P_CRIMSON,
  P_CYBER,
  P_INK_BLUE,
  P_MATRIX,
  P_MINT,
  P_NEON_BLUE,
  P_NEON_PINK,
  P_NEWSPRINT,
  P_NORD,
  P_OLED,
  P_PAPER,
  P_SAND,
  P_SYNTH,
  P_TERMINAL,
  P_VAPOR,
} from '../palettes';
import { THEMED_BARE, type ClockPreset, type DigitalSpec, type FacePalette } from '../spec';

type Shape = Omit<DigitalSpec, 'family'>;

function digital(
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
    family: 'digital',
    kind: 'digital',
    tags,
    palette,
    ...(naturalDark === undefined ? {} : { naturalDark }),
    spec: { family: 'digital', ...shape },
  };
}

const BOLD: Shape = { font: 'sans', weight: 600, tracking: -0.04, layout: 'inline', caption: 'none' };
const HEAVY: Shape = { font: 'sans', weight: 800, tracking: -0.05, layout: 'inline', caption: 'none' };
const LIGHT: Shape = { font: 'sans', weight: 200, tracking: 0.01, layout: 'inline', caption: 'date' };
const MONO: Shape = { font: 'mono', weight: 500, tracking: 0, layout: 'inline', caption: 'offset' };
const SERIF: Shape = { font: 'serif', weight: 400, tracking: -0.01, layout: 'inline', caption: 'date' };
const STACKED: Shape = { font: 'sans', weight: 700, tracking: -0.05, layout: 'stacked', caption: 'city' };

export const DIGITAL_PRESETS: readonly ClockPreset[] = [
  // The original id, preserved.
  digital('digital-oversized', 'Oversized digital', ['default', 'bold', 'clean'], THEMED_BARE, BOLD),

  digital('digital-heavy', 'Heavyweight', ['bold', 'poster', 'impact'], THEMED_BARE, HEAVY),
  digital('digital-light', 'Hairline digital', ['light', 'airy', 'quiet'], THEMED_BARE, LIGHT),
  digital('digital-mono', 'Monospace', ['mono', 'technical', 'even'], THEMED_BARE, MONO),
  digital('digital-serif', 'Serif digital', ['serif', 'editorial', 'warm'], THEMED_BARE, SERIF),
  digital('digital-stacked', 'Stacked digital', ['stacked', 'editorial', 'tall'], THEMED_BARE, STACKED),
  digital('digital-gap', 'Spaced digits', ['spaced', 'minimal', 'modern'], THEMED_BARE, {
    ...BOLD,
    tracking: 0.02,
    separator: 'gap',
    caption: 'date',
  }),
  digital('digital-dot', 'Dot separator', ['minimal', 'quiet', 'dot'], THEMED_BARE, {
    ...LIGHT,
    separator: 'dot',
  }),
  digital('digital-outline', 'Outline digits', ['outline', 'hollow', 'graphic'], THEMED_BARE, {
    ...HEAVY,
    outline: true,
    caption: 'city',
  }),

  // Screens -----------------------------------------------------------------
  digital('digital-terminal', 'Terminal digits', ['terminal', 'green', 'cli'], P_TERMINAL, {
    ...MONO,
    weight: 400,
    glow: '#33ff00',
    caption: 'city',
  }, true),
  digital('digital-amber', 'Amber CRT', ['crt', 'amber', 'retro'], P_AMBER_CRT, {
    ...MONO,
    weight: 400,
    glow: '#ffb000',
    caption: 'date',
  }, true),
  digital('digital-matrix', 'Matrix digits', ['matrix', 'green', 'code'], P_MATRIX, {
    ...MONO,
    glow: '#00e676',
    caption: 'offset',
  }, true),
  digital('digital-cyber', 'Cyberpunk', ['cyberpunk', 'neon', 'cyan'], P_CYBER, {
    ...MONO,
    weight: 700,
    glow: '#00f0ff',
    caption: 'city',
  }, true),
  digital('digital-neon-blue', 'Blue neon', ['neon', 'glow', 'cool'], P_NEON_BLUE, {
    ...BOLD,
    glow: '#7fc4ff',
    caption: 'date',
  }, true),
  digital('digital-neon-pink', 'Pink neon digits', ['neon', 'glow', 'warm'], P_NEON_PINK, {
    ...BOLD,
    glow: '#ff6ec7',
    caption: 'date',
  }, true),
  digital('digital-vapor', 'Vaporwave digits', ['vaporwave', 'retro', 'synth'], P_VAPOR, {
    ...HEAVY,
    glow: '#01cdfe',
    caption: 'city',
  }, true),
  digital('digital-synth', 'Synthwave', ['synthwave', '80s', 'sunset'], P_SYNTH, {
    ...HEAVY,
    glow: '#ff006e',
    caption: 'city',
  }, true),

  // Print and paper ---------------------------------------------------------
  digital('digital-paper', 'E-ink digital', ['paper', 'eink', 'calm'], P_PAPER, LIGHT, false),
  digital('digital-newsprint', 'Broadsheet', ['editorial', 'serif', 'print'], P_NEWSPRINT, {
    ...SERIF,
    weight: 600,
  }, false),
  digital('digital-brutal', 'Neubrutalist digits', ['brutalism', 'yellow', 'loud'], P_BRUTAL, {
    ...HEAVY,
    hardShadow: '#000000',
    caption: 'city',
  }, false),
  digital('digital-chrome', 'Chrome digits', ['y2k', 'chrome', 'glossy'], P_CHROME, {
    ...HEAVY,
    caption: 'date',
  }, false),

  // Quiet colour ------------------------------------------------------------
  digital('digital-oled', 'Pure black', ['oled', 'dark', 'minimal'], P_OLED, BOLD, true),
  digital('digital-nord', 'Nord digits', ['cool', 'muted', 'calm'], P_NORD, { ...LIGHT, weight: 300 }, true),
  digital('digital-ink-blue', 'Ink blue stack', ['navy', 'deep', 'quiet'], P_INK_BLUE, STACKED, true),
  digital('digital-mint', 'Mint digits', ['fresh', 'light', 'green'], P_MINT, LIGHT, false),
  digital('digital-sand', 'Sand', ['earthy', 'warm', 'muted'], P_SAND, { ...BOLD, caption: 'date' }, false),
  digital('digital-crimson', 'Crimson digits', ['jewel', 'red', 'rich'], P_CRIMSON, HEAVY, true),
];
