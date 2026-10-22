/**
 * The analog catalogue.
 *
 * A preset is a *shape* (which markers, which hands, which rim) crossed with a
 * palette. The shapes are declared once below and reused, so a Bauhaus dial
 * and a terminal dial differ in exactly the ways they should and share the
 * geometry that has to be right.
 */
import {
  COPPER_METAL,
  GOLD_METAL,
  P_BAUHAUS,
  P_BLUEPRINT,
  P_CHARCOAL,
  P_CHROME,
  P_CLAY,
  P_CLAY_WARM,
  P_CRIMSON,
  P_EMERALD,
  P_FOG,
  P_FOREST,
  P_GOLD,
  P_GOLD_CREAM,
  P_INK_BLUE,
  P_LAVENDER,
  P_MAHOGANY,
  P_MATRIX,
  P_MINT,
  P_MONO_INVERT,
  P_NEUMORPH,
  P_NEWSPRINT,
  P_NORD,
  P_OLED,
  P_OLIVE,
  P_PAPER,
  P_PARCHMENT,
  P_PEACH,
  P_ROSE_GOLD,
  P_SAND,
  P_SNOW,
  P_STEEL,
  P_SWISS_RED,
  P_TERMINAL,
  P_TERRACOTTA,
  P_VINTAGE,
  P_WHITE,
  ROSE_METAL,
  SILVER_METAL,
} from '../palettes';
import { THEMED, type AnalogSpec, type ClockPreset, type FacePalette } from '../spec';

type Shape = Omit<AnalogSpec, 'family'>;

/** Bar markers, a full minute track, a railway second hand. */
const SWISS: Shape = {
  markers: 'bar',
  minuteTicks: true,
  numerals: 'none',
  hands: 'baton',
  secondHand: 'railway',
  rim: 'hairline',
  pin: 'dot',
  texture: 'flat',
};

const MINIMAL: Shape = {
  markers: 'dot',
  minuteTicks: false,
  numerals: 'none',
  hands: 'needle',
  secondHand: 'thin',
  rim: 'none',
  pin: 'dot',
  texture: 'flat',
};

const BAUHAUS: Shape = {
  markers: 'wedge',
  minuteTicks: false,
  numerals: 'quarters',
  hands: 'block',
  secondHand: 'thick',
  rim: 'thick',
  pin: 'ring',
  texture: 'flat',
};

const ROMAN: Shape = {
  markers: 'hairline',
  minuteTicks: true,
  numerals: 'roman',
  hands: 'leaf',
  secondHand: 'thin',
  rim: 'double',
  pin: 'ring',
  texture: 'radial',
  numeralFont: 'serif',
  innerRing: true,
};

const NUMERALS: Shape = {
  markers: 'none',
  minuteTicks: true,
  numerals: 'arabic',
  hands: 'baton',
  secondHand: 'counterweight',
  rim: 'hairline',
  pin: 'dot',
  texture: 'flat',
};

const RAILWAY: Shape = {
  markers: 'bar',
  minuteTicks: true,
  numerals: 'none',
  hands: 'block',
  secondHand: 'railway',
  rim: 'thick',
  pin: 'dot',
  texture: 'flat',
};

const SKELETON: Shape = {
  markers: 'hairline',
  minuteTicks: true,
  numerals: 'none',
  hands: 'skeleton',
  secondHand: 'thin',
  rim: 'inset',
  pin: 'ring',
  texture: 'rings',
  innerRing: true,
};

const CHRONO: Shape = {
  markers: 'bar',
  minuteTicks: true,
  numerals: 'quarters',
  hands: 'arrow',
  secondHand: 'counterweight',
  rim: 'double',
  pin: 'ring',
  texture: 'radial',
  innerRing: true,
};

const TICKS_ONLY: Shape = {
  markers: 'none',
  minuteTicks: true,
  numerals: 'none',
  hands: 'needle',
  secondHand: 'thin',
  rim: 'none',
  pin: 'none',
  texture: 'flat',
};

const TWENTY_FOUR: Shape = {
  hours: 24,
  markers: 'hairline',
  minuteTicks: false,
  numerals: 'twentyfour',
  hands: 'needle',
  secondHand: 'thin',
  rim: 'hairline',
  pin: 'dot',
  texture: 'flat',
  numeralFont: 'mono',
};

const SQUARED: Shape = {
  markers: 'square',
  minuteTicks: false,
  numerals: 'none',
  hands: 'block',
  secondHand: 'thick',
  rim: 'none',
  pin: 'dot',
  texture: 'grid',
};

const SUNBURST: Shape = {
  markers: 'bar',
  minuteTicks: true,
  numerals: 'none',
  hands: 'leaf',
  secondHand: 'counterweight',
  rim: 'double',
  pin: 'ring',
  texture: 'sunburst',
  innerRing: true,
};

function analog(
  id: string,
  name: string,
  tags: readonly string[],
  palette: FacePalette,
  shape: Shape,
  options: { naturalDark?: boolean; metal?: readonly string[]; paletteDark?: FacePalette } = {},
): ClockPreset {
  const { naturalDark, metal, paletteDark } = options;
  return {
    id,
    name,
    family: 'analog',
    kind: 'analog',
    tags,
    palette,
    ...(naturalDark === undefined ? {} : { naturalDark }),
    ...(paletteDark ? { paletteDark } : {}),
    spec: { family: 'analog', ...shape, ...(metal ? { metal } : {}) },
  };
}

export const ANALOG_PRESETS: readonly ClockPreset[] = [
  // The four original ids, preserved so saved clocks keep their face.
  analog('analog-classic', 'Classic analog', ['swiss', 'clean', 'default'], THEMED, SWISS),
  analog('analog-minimal', 'Minimal analog', ['minimal', 'white', 'quiet'], P_WHITE, MINIMAL, {
    naturalDark: false,
    paletteDark: P_CHARCOAL,
  }),
  analog('analog-dark', 'Dark analog', ['dark', 'matte', 'night'], P_CHARCOAL, SWISS, {
    naturalDark: true,
    paletteDark: P_CHARCOAL,
  }),
  analog('analog-luxury', 'Black and gold', ['luxury', 'gold', 'formal'], P_GOLD, SUNBURST, {
    naturalDark: true,
    metal: GOLD_METAL,
    paletteDark: P_GOLD,
  }),

  // Swiss and railway -------------------------------------------------------
  analog('analog-swiss-red', 'Swiss railway', ['swiss', 'railway', 'red'], P_SWISS_RED, RAILWAY),
  analog('analog-station', 'Station clock', ['railway', 'bold', 'public'], P_SNOW, RAILWAY),
  analog('analog-helvetica', 'Helvetica dial', ['swiss', 'numerals', 'grid'], P_WHITE, NUMERALS),
  analog('analog-grid', 'Grid dial', ['swiss', 'geometric', 'square'], P_FOG, SQUARED),

  // Bauhaus and graphic -----------------------------------------------------
  analog('analog-bauhaus', 'Bauhaus', ['bauhaus', 'primary', 'geometric'], P_BAUHAUS, BAUHAUS),
  analog('analog-blueprint', 'Blueprint', ['blueprint', 'technical', 'blue'], P_BLUEPRINT, TWENTY_FOUR, {
    naturalDark: true,
  }),
  analog('analog-invert', 'Inverted mono', ['mono', 'black', 'stark'], P_MONO_INVERT, MINIMAL, {
    naturalDark: true,
  }),
  analog('analog-newsprint', 'Newsprint dial', ['editorial', 'paper', 'serif'], P_NEWSPRINT, ROMAN),

  // Paper, calm -------------------------------------------------------------
  analog('analog-eink', 'E-ink dial', ['paper', 'eink', 'calm'], P_PAPER, TICKS_ONLY, {
    naturalDark: false,
  }),
  analog('analog-parchment', 'Parchment', ['vintage', 'warm', 'roman'], P_PARCHMENT, ROMAN, {
    naturalDark: false,
  }),
  analog('analog-vintage', 'Vintage film', ['vintage', 'sepia', 'retro'], P_VINTAGE, NUMERALS, {
    naturalDark: false,
  }),
  analog('analog-academia', 'Library', ['academia', 'mahogany', 'brass'], P_MAHOGANY, ROMAN, {
    naturalDark: true,
    metal: GOLD_METAL,
  }),

  // Metal -------------------------------------------------------------------
  analog('analog-steel', 'Brushed steel', ['metal', 'steel', 'tool'], P_STEEL, CHRONO, {
    naturalDark: true,
    metal: SILVER_METAL,
  }),
  analog('analog-chrome', 'Chrome dial', ['metal', 'chrome', 'y2k'], P_CHROME, SUNBURST, {
    naturalDark: false,
    metal: SILVER_METAL,
  }),
  analog('analog-rose-gold', 'Rose gold', ['luxury', 'rose', 'warm'], P_ROSE_GOLD, SUNBURST, {
    naturalDark: true,
    metal: ROSE_METAL,
  }),
  analog('analog-copper', 'Copper', ['metal', 'copper', 'warm'], P_CLAY_WARM, SUNBURST, {
    naturalDark: true,
    metal: COPPER_METAL,
  }),
  analog('analog-gold-cream', 'Cream and gold', ['luxury', 'light', 'formal'], P_GOLD_CREAM, ROMAN, {
    naturalDark: false,
    metal: GOLD_METAL,
  }),

  // Mechanical --------------------------------------------------------------
  analog('analog-skeleton', 'Skeleton', ['mechanical', 'open', 'technical'], P_CHARCOAL, SKELETON, {
    naturalDark: true,
  }),
  analog('analog-chrono', 'Chronograph', ['chronograph', 'sport', 'technical'], P_OLED, CHRONO, {
    naturalDark: true,
  }),
  analog('analog-nord', 'Nord dial', ['cool', 'muted', 'calm'], P_NORD, SWISS, { naturalDark: true }),
  analog('analog-ink-blue', 'Ink blue dial', ['navy', 'quiet', 'classic'], P_INK_BLUE, NUMERALS, {
    naturalDark: true,
  }),

  // Screens -----------------------------------------------------------------
  analog('analog-terminal', 'Terminal dial', ['terminal', 'green', 'hacker'], P_TERMINAL, TWENTY_FOUR, {
    naturalDark: true,
  }),
  analog('analog-matrix', 'Matrix dial', ['matrix', 'green', 'code'], P_MATRIX, TICKS_ONLY, {
    naturalDark: true,
  }),

  // Soft, warm --------------------------------------------------------------
  analog('analog-neumorph', 'Soft UI dial', ['neumorphism', 'soft', 'tactile'], P_NEUMORPH, MINIMAL, {
    naturalDark: false,
  }),
  analog('analog-clay', 'Clay dial', ['claymorphism', 'playful', 'lilac'], P_CLAY, BAUHAUS, {
    naturalDark: false,
  }),
  analog('analog-terracotta', 'Terracotta', ['earthy', 'warm', 'organic'], P_TERRACOTTA, MINIMAL, {
    naturalDark: false,
  }),
  analog('analog-sand', 'Desert sand', ['earthy', 'sand', 'muted'], P_SAND, NUMERALS, {
    naturalDark: false,
  }),
  analog('analog-olive', 'Olive', ['nature', 'green', 'calm'], P_OLIVE, SWISS, { naturalDark: false }),
  analog('analog-peach', 'Peach', ['warm', 'soft', 'friendly'], P_PEACH, MINIMAL, {
    naturalDark: false,
  }),
  analog('analog-lavender', 'Lavender', ['soft', 'violet', 'calm'], P_LAVENDER, ROMAN, {
    naturalDark: false,
  }),
  analog('analog-mint', 'Mint dial', ['fresh', 'green', 'light'], P_MINT, MINIMAL, { naturalDark: false }),

  // Deep ---------------------------------------------------------------------
  analog('analog-forest', 'Forest', ['nature', 'deep', 'green'], P_FOREST, SKELETON, {
    naturalDark: true,
  }),
  analog('analog-emerald', 'Emerald', ['jewel', 'green', 'rich'], P_EMERALD, SUNBURST, {
    naturalDark: true,
  }),
  analog('analog-crimson', 'Crimson dial', ['jewel', 'red', 'rich'], P_CRIMSON, CHRONO, {
    naturalDark: true,
  }),
];
