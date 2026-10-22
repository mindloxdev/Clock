/**
 * The palettes the catalogue draws from.
 *
 * Colours are taken from the design-system style reference (Bauhaus, E-Ink,
 * Terminal CLI, Cyberpunk, Vaporwave, Academia, Nature Distilled, Y2K,
 * Neubrutalism, Neumorphism, Claymorphism and the rest), so a preset named
 * after a style actually looks like that style rather than like a tint of it.
 *
 * Every pair here was checked for legibility: a face's `ink` on its `bg`
 * clears 4.5:1, and `dim` clears 3:1 since it only ever carries ticks and
 * secondary captions.
 */
import { palette, type FacePalette } from './spec';

// --------------------------------------------------------------- neutrals --

export const P_WHITE = palette('#ffffff', '#0d0d0d', '#9d9d98', '#0d0d0d', '#d8d8d2', '#4c4c4c');
export const P_SNOW = palette('#fbfbf9', '#141414', '#8e8e88', '#141414', '#e3e3dd', '#505050');
export const P_CHARCOAL = palette('#131316', '#f2f2f4', '#6e6e78', '#f2f2f4', '#2b2b33', '#b8b8ba');
export const P_OLED = palette('#000000', '#fafafa', '#6a6a72', '#fafafa', '#1e1e22', '#b9b9b9');
export const P_SLATE = palette('#1e2430', '#e8eef7', '#73808f', '#8fb6e8', '#2f3845', '#b3b9c3');
export const P_FOG = palette('#e9ebee', '#1d2127', '#7c838d', '#1d2127', '#ccd1d8', '#52565b');

// ------------------------------------------------------------ e-ink, paper --

export const P_PAPER = palette('#fdfbf7', '#1a1a1a', '#8c8779', '#1a1a1a', '#ddd7cb', '#555553');
export const P_NEWSPRINT = palette('#f2efe6', '#15130f', '#857f70', '#15130f', '#d5cfc0', '#4e4c47');

// ----------------------------------------------------------- warm, organic --

export const P_TERRACOTTA = palette('#f5f0e1', '#5a3a28', '#9c8b7a', '#b5651d', '#ddd0b8', '#7f6654');
export const P_SAND = palette('#d4c4a8', '#3b3226', '#7a6e59', '#8b4513', '#b9a784', '#5a4f40');
export const P_OLIVE = palette('#eceee2', '#2f3524', '#77805f', '#6b7b3c', '#ccd2bb', '#606555');
export const P_CLAY_WARM = palette('#2a211c', '#f2e4d6', '#9a8574', '#c67b5c', '#44352c', '#beb1a6');

// ---------------------------------------------------------------- academia --

export const P_MAHOGANY = palette('#1c1714', '#e8dfd4', '#8a7c6a', '#c9a962', '#3d332b', '#b3aba2');
export const P_PARCHMENT = palette('#e8dfd4', '#2b231c', '#7d7161', '#8b2635', '#cdc0ad', '#5c544c');

// ---------------------------------------------------------- metal, luxury --

export const P_GOLD = palette('#0b0b0d', '#e8d79a', '#6d5620', '#d4af37', '#8d6f28', '#afa275');
export const P_GOLD_CREAM = palette('#fbf8ef', '#6f5518', '#b09a62', '#9a7b2e', '#c9a84c', '#856f3a');
export const P_ROSE_GOLD = palette('#17120f', '#f0cbb6', '#7d5c4c', '#d98f6d', '#7a5443', '#b89b8b');
export const P_STEEL = palette('#20232a', '#dfe4ec', '#79808d', '#b9c3d4', '#39404c', '#adb2ba');
export const P_CHROME = palette('#dfe3ea', '#1b1f27', '#78808c', '#5b6673', '#b4bcc8', '#4e525a');

export const GOLD_METAL = ['#f7e9bd', '#d9b65a', '#a8812a'] as const;
export const SILVER_METAL = ['#f4f6fa', '#c3ccd8', '#8d97a5'] as const;
export const ROSE_METAL = ['#fadbcb', '#e0a384', '#a9705a'] as const;
export const COPPER_METAL = ['#f3cfae', '#c6814c', '#8a5428'] as const;

// -------------------------------------------------------- screens, terminals --

export const P_TERMINAL = palette('#050505', '#33ff00', '#1a3d1a', '#ffb000', '#1d4a1d', '#27be01');
export const P_AMBER_CRT = palette('#0a0702', '#ffb000', '#4a3200', '#ffd37a', '#3d2a00', '#bf8401');
export const P_CYBER = palette('#0d0d12', '#00f0ff', '#1b5f66', '#ff2bd1', '#15424a', '#03b5c1');
export const P_HUD = palette('#05080c', '#7fe7ff', '#1f4a5c', '#ff4d4d', '#17384a', '#5fadc0');
export const P_MATRIX = palette('#010a03', '#00e676', '#0d3b1c', '#9dffbf', '#0f4723', '#00ad58');

// ------------------------------------------------------------------- LCD --

export const P_LCD = palette('#c5d1bc', '#1e2a1a', '#6c7a63', '#1e2a1a', '#a9b89f', '#495544');
export const P_LCD_BLUE = palette('#9fc3d6', '#102230', '#4e6f82', '#102230', '#7ea6bd', '#354c5b');
export const P_LCD_DARK = palette('#2b3327', '#d7e4cd', '#6d7d64', '#d7e4cd', '#3c4637', '#aab6a2');

// ------------------------------------------------------------- neon, retro --

export const P_NEON_BLUE = palette('#080a10', '#eaf4ff', '#5d7596', '#7fc4ff', '#1d2a3d', '#afb7c1');
export const P_NEON_PINK = palette('#120616', '#ffd9f3', '#8a5c7d', '#ff6ec7', '#33173a', '#c1a2ba');
export const P_VAPOR = palette('#1b0b36', '#ffc2f0', '#7b5ba6', '#01cdfe', '#3a1f63', '#c492c0');
export const P_SYNTH = palette('#1a0b2e', '#ffe6a7', '#8a6ea8', '#ff006e', '#38215c', '#c3ad88');
export const P_Y2K = palette('#d8dde6', '#2a2140', '#6f6a85', '#9400d3', '#aab2c0', '#57526b');
export const P_VINTAGE = palette('#f5e6c8', '#3c2f20', '#9a8468', '#4a7b7c', '#dcc8a3', '#6c5f4c');
export const P_SEPIA = palette('#2a2118', '#f0dcb8', '#8d7a5e', '#d4a574', '#463827', '#bdab8e');

// ----------------------------------------------------------------- playful --

export const P_BRUTAL = palette('#ffeb3b', '#000000', '#5c5526', '#e03c3c', '#000000', '#423d0f');
export const P_BRUTAL_BLUE = palette('#1565c0', '#ffffff', '#9fc4ea', '#ffeb3b', '#000000', '#dae6f5');
export const P_MEMPHIS = palette('#fdf4e3', '#2c2740', '#6a7bb4', '#d1479f', '#86ccca', '#625c6a');
export const P_CLAY = palette('#f0e9ff', '#3a2f55', '#8a7fb0', '#8f67d6', '#ddd2f5', '#695f81');
export const P_MINT = palette('#e4f5ee', '#14342a', '#5e8a7a', '#0f8f6c', '#c2e3d6', '#4a665d');
export const P_CANDY = palette('#ffeef5', '#4a1130', '#a9708c', '#e23c82', '#ffd0e2', '#794a63');

// ------------------------------------------------------------- neumorphism --

export const P_NEUMORPH = palette('#e8e8ec', '#30343d', '#8f949e', '#5b6472', '#d2d4da', '#60636b');
export const P_NEUMORPH_BLUE = palette('#c8e0f4', '#1d3348', '#5f7e99', '#2b4f72', '#aecbe4', '#496075');

// ------------------------------------------------------------------ nature --

export const P_FOREST = palette('#0f1c14', '#d8ead9', '#5f7d68', '#4caf7d', '#20382a', '#a4b4a6');
export const P_SKY = palette('#eaf4fb', '#12303f', '#5b7f93', '#1d7ea8', '#c7dfed', '#4a6370');
export const P_OCEAN = palette('#07202e', '#cfe9f5', '#527689', '#38b6d9', '#123a4d', '#9bb5c1');

// ------------------------------------------------------- graphic, editorial --

export const P_BAUHAUS = palette('#f7f5f0', '#121212', '#b5b0a6', '#d62828', '#121212', '#4e4d4c');
export const P_SWISS_RED = palette('#ffffff', '#101010', '#c9c9c4', '#e01b24', '#d8d8d2', '#4e4e4e');
export const P_BLUEPRINT = palette('#0d3b66', '#e8f1ff', '#3f6ea3', '#7fd1ff', '#1c558c', '#afc2d7');
export const P_MONO_INVERT = palette('#0d0d0d', '#ffffff', '#4a4a4a', '#ffffff', '#2a2a2a', '#c0c0c0');

// ------------------------------------------------------------- cool, quiet --

export const P_NORD = palette('#2e3440', '#eceff4', '#4c566a', '#88c0d0', '#3b4252', '#bbbec5');
export const P_INK_BLUE = palette('#0f1b2d', '#dce7f5', '#38506e', '#5aa9e6', '#1d2f49', '#a7b2c1');
export const P_LAVENDER = palette('#f3f0fb', '#2f2744', '#a9a0c4', '#6d4fc4', '#ddd6ef', '#625b74');
export const P_PEACH = palette('#fff1e6', '#4a2c1a', '#c3a893', '#c75c3c', '#f0d9c7', '#795f4f');
export const P_CRIMSON = palette('#1a0a0e', '#f7dde3', '#6b3a46', '#e23e57', '#3a1620', '#bea6ac');
export const P_EMERALD = palette('#06231a', '#d4f3e5', '#3f7360', '#2fbf8f', '#0d3b2c', '#9ebdb0');

/** Every palette, for the contrast check in the test suite. */
export const ALL_PALETTES: Readonly<Record<string, FacePalette>> = {
  P_WHITE,
  P_SNOW,
  P_CHARCOAL,
  P_OLED,
  P_SLATE,
  P_FOG,
  P_PAPER,
  P_NEWSPRINT,
  P_TERRACOTTA,
  P_SAND,
  P_OLIVE,
  P_CLAY_WARM,
  P_MAHOGANY,
  P_PARCHMENT,
  P_GOLD,
  P_GOLD_CREAM,
  P_ROSE_GOLD,
  P_STEEL,
  P_CHROME,
  P_TERMINAL,
  P_AMBER_CRT,
  P_CYBER,
  P_HUD,
  P_MATRIX,
  P_LCD,
  P_LCD_BLUE,
  P_LCD_DARK,
  P_NEON_BLUE,
  P_NEON_PINK,
  P_VAPOR,
  P_SYNTH,
  P_Y2K,
  P_VINTAGE,
  P_SEPIA,
  P_BRUTAL,
  P_BRUTAL_BLUE,
  P_MEMPHIS,
  P_CLAY,
  P_MINT,
  P_CANDY,
  P_NEUMORPH,
  P_NEUMORPH_BLUE,
  P_FOREST,
  P_SKY,
  P_OCEAN,
  P_BAUHAUS,
  P_SWISS_RED,
  P_BLUEPRINT,
  P_MONO_INVERT,
  P_NORD,
  P_INK_BLUE,
  P_LAVENDER,
  P_PEACH,
  P_CRIMSON,
  P_EMERALD,
};
