import { fonts, colorsTheme1, particleColors, images } from '../config/theme.config';

// ===========================================
// THEME TYPES
// ===========================================
/**
 * Ce fichier contient les types de données liés au thème de l'application.
 *
 * Les thèmes sont des ensembles de paramètres qui définissent l'apparence
 * de l'application. Les types définis dans ce fichier servent à définir
 * la structure des données qui configurent les thèmes.
 *
 * Les types exportés sont utilisés dans les parties de l'application qui
 * ont besoin de conna tre le thème actif.
 */

/**
 * Type représentant les noms de polices disponibles dans le thème.
 * @export
 */
export type FontName = keyof typeof fonts;

/**
 * Type représentant les noms de couleurs du thème.
 * @export
 */
export type ThemeColor = keyof typeof colorsTheme1;

/**
 * Type représentant les noms de couleurs des particules.
 * @export
 */
export type ParticleColor = keyof typeof particleColors;

/**
 * Type représentant les noms d'images disponibles dans le thème.
 * @export
 */
export type ImageName = keyof typeof images;
