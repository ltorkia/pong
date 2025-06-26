export const fonts = {
	arial: ['Arial', 'sans-serif'],
	cinzel: ['"Cinzel Decorative"', 'serif'],
	garamond: ['"Cormorant Garamond"', 'serif'],
} as const;

export const colorsTheme1 = {
	darkBlue: '#10131B',
	pastelBlue: '#3b4e7f',
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
	forestWallpaper: "url('/img/design/forest-bg.jpg')"
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