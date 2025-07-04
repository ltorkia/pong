// ===========================================
// THEME CONFIG
// ===========================================
/**
 * Contient les configurations de base du thème de l'application.
 *
 * Ce fichier est importé par :
 * - tailwind.config.mjs: pour définir des class personnalisées
 * - particles.service.ts: pour les couleurs des particules
 *
 * Les configurations sont divisées en plusieurs constantes: les couleurs, les polices,
 * les images, etc.
 */

/**
 * Configuration des polices de caractères pour le thème.
 *
 * Définit les familles de polices utilisées dans l'application.
 * Chaque clé représente le nom de la police et sa valeur est un tableau
 * contenant la police principale suivie de polices de secours.
 */
export const fonts = {
    arial: ['Arial', 'Helvetica', 'sans-serif'],
    cinzel: ['"Cinzel Decorative"', 'Georgia', 'serif'],
    garamond: ['"Cormorant Garamond"', '"Garamond"', '"Times New Roman"', 'serif'],
} as const;

/**
 * Configuration des couleurs pour le thème 1.
 *
 * Contient des paires clé-valeur où chaque clé représente un nom de couleur
 * et chaque valeur est le code hexadécimal correspondant à cette couleur.
 */
export const colorsTheme1 = {
    darkBlue: '#10131B',
    pastelBlue: '#3b4e7f',
    white: '#FFFFFF',
    black: '#000000'
} as const;

/**
 * Configuration des couleurs pour les particules.
 *
 * Définit les couleurs utilisées pour les particules d'arrière-plan.
 * Chaque clé représente un nom descriptif de la couleur.
 */
export const particleColors = {
    forestGold: '#FFD700',
    forestLight: '#FFF8DC',
    forestLavender: '#E6E6FA',
    forestSky: '#87CEEB',
    forestGreen: '#98FB98',
    forestYellow: '#F0E68C',
    forestFirefly: '#FFFF00'
} as const;

/**
 * Configuration des chemins d'accès aux images utilisées dans le thème.
 *
 * Définit les URLs des ressources d'image utilisées pour le design du thème.
 * Chaque clé représente un nom symbolique de l'image.
 */
export const images = {
    forestWallpaper: "url('/img/design/forest-bg.jpg')"
} as const;