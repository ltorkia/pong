import { fonts, colorsTheme1, particleColors, images } from '../config/theme';

export type FontName = keyof typeof fonts;
export type ThemeColor = keyof typeof colorsTheme1;
export type ParticleColor = keyof typeof particleColors;
export type ImageName = keyof typeof images;
