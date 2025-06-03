export const fonts = {
  arial: ['Arial', 'sans-serif'],
  cinzel: ['"Cinzel Decorative"', 'serif'],
  garamond: ['"Cormorant Garamond"', 'serif'],
} as const;

export const colorsTheme1 = {
  vdarkBlue: '#10131B',
  darkBlue: '#101626',
  darkForestGreen: '#0E191B',
  fadeForestGreen: '#1A2B2E',
  forestGreen: '#102D2C',
  lightForestGreen: '#275857',
  vlightForestGreen: '#3C5A5E',
  greyishGreen: '#728D8F',
  pureMint: '#97D0BE',
  mint: '#8AC8CD',
  vclearSky: '#87CEEB',
  deepSky: '#12C5C2',
  deepCyan: '#3762D5',
  deepPurple: '#4A2F6B',
  lilac: '#B38BFF',
  vlightLilac: '#C7B8E4',
  orangyYellow: '#F09400',
  fireflyYellow: '#FFD37C',
  grey: '#777381',
  vlightGrey: '#ABBBBD',
  white: '#FFFFFF',
  black: '#000000'
} as const;

export const particleColors = {
  forestGold: '#FFD700',
  forestLight: '#FFF8DC',
  forestLavender: '#E6E6FA',
  forestSky: '#87CEEB',
  forestGreen: '#98FB98',
  forestYellow: '#F0E68C',
  forestFirefly: '#FFFF00'
} as const;

export const images = {
  forestWallpaper: "url('/img/design/forest-bg.jpg')",
  avatarDefault: "url('/img/avatars/elisa.jpg')",
} as const;

/**
 * Types pour les clés des objets à utiliser dans le code pour typage TS et autocomplétion vscode
 */
// 'arial' | 'cinzel' | 'garamond'
export type FontName = keyof typeof fonts;

// 'vdarkBlue' | 'darkBlue' | ... | 'black'
export type ThemeColor = keyof typeof colorsTheme1;

// 'forestGold' | 'forestLight' | ...
export type ParticleColor = keyof typeof particleColors;

// 'forestWallpaper' | 'avatarDefault'
export type ImageName = keyof typeof images;

export default { fonts, colorsTheme1, particleColors, images };