import { pageNames, componentNames, HTMLContainers } from '../config/constants.config';

// ===========================================
// CONSTANTS TYPES
// ===========================================
/**
 * Ce fichier contient les types de données liés aux constantes du projet.
 *
 * Les constantes sont des valeurs qui ne changent pas au cours de l'exécution du programme.
 * Elles sont utilisées pour définir des noms de pages, des noms de composants, des noms de conteneurs HTML, etc.
 *
 * Les types définis dans ce fichier servent à définir la structure des données
 * qui configurent les constantes.
 */

/**
 * Types pour les noms de pages.
 * 
 * `PageNamesMap` représente le type des noms de pages définis dans `pageNames`.
 * `PageName` représente une des valeurs possibles des noms de pages.
 * @export
 */
export type PageNamesMap = typeof pageNames;

/**
 * Type pour les noms de pages.
 * 
 * `PageName` représente une des valeurs possibles des noms de pages.
 * Par exemple, si `pageNames` contient l'entrée `"home": "home"`, alors `PageName` peut valoir `"home"`.
 * @export
 */
export type PageName = PageNamesMap[keyof PageNamesMap];

/**
 * Types pour les noms de composants.
 * 
 * `ComponentNamesMap` représente le type des noms de composants définis dans `componentNames`.
 * `ComponentName` représente une des valeurs possibles des noms de composants.
 * @export
 */
export type ComponentNamesMap = typeof componentNames;


/**
 * Type pour les noms de composants.
 * 
 * `ComponentName` représente une des valeurs possibles des noms de composants.
 * Par exemple, si `componentNames` contient l'entrée `"navbar": "navbar"`, alors `ComponentName` peut valoir `"navbar"`.
 * @export
 */
export type ComponentName = ComponentNamesMap[keyof ComponentNamesMap];

/**
 * Types pour les conteneurs HTML.
 * 
 * `HTMLContainersMap` représente le type des identifiants de conteneurs HTML définis dans `HTMLContainers`.
 * `HTMLContainer` représente une des valeurs possibles des identifiants de conteneurs HTML.
 * @export
 */
export type HTMLContainersMap = typeof HTMLContainers;

/**
 * Type pour les identifiants de conteneurs HTML.
 * 
 * `HTMLContainer` représente une des valeurs possibles des identifiants de conteneurs HTML.
 * Par exemple, si `HTMLContainers` contient l'entrée `"root": "#root"`, alors `HTMLContainer` peut valoir `"#root"`.
 * @export
 */
export type HTMLContainer = HTMLContainersMap[keyof HTMLContainersMap];

