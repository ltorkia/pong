import { BasePage } from '../pages/base/base.page';
import { ComponentName, ComponentConfig } from './components.types';
import { pageNames, routePaths, templatePaths } from '../config/routes.config';

// ===========================================
// ROUTES TYPES
// ===========================================
/**
 * Ce fichier contient les types de données liés aux routes du projet.
 *
 * Les routes sont définies dans le fichier routes.config.ts et sont stockées
 * dans un tableau de type RouteConfig[]. Les types définis dans ce fichier
 * servent à définir la structure des données qui configurent les routes.
 *
 * Les types de routes sont exportés pour être utilisés dans les parties de
 * l'application qui en ont besoin.
 */

/**
 * Interface de configuration d'une route.
 *
 * Chaque route correspond à une URL, une classe de page et peut avoir
 * des composants spécifiques, des restrictions d'accès, ou des effets visuels.
 */
export interface RouteConfig {
	path: RoutePath;												// Chemin de la route ('/', '/users', '/user/:id'...)
	name: PageName;													// Nom de la route pour logs et debug
	pageClass: PageClass;											// Classe de la page à instancier / render (HomePage, GamePage...)
	templatePath: TemplatePath;										// Chemin du template HTML associé à la page
	components?: Partial<Record<ComponentName, ComponentConfig>>;	// Config des composants spécifiques à cette page
	isPublic: boolean;												// Si true, la route est accessible sans authentification uniquement (login, register)
	enableParticles: boolean;										// Si true, active les particules sur cette page
}

/**
 * Type représentant une classe de page instanciable.
 *
 * Chaque page doit hériter de BasePage et avoir un constructeur avec ces paramètres:
 * - routeConfig: configuration complète de la route (de type RouteConfig)
 * - container: élément HTML dans lequel injecter le contenu
 * - param: paramètre optionnel associé à la route (ex: ID dans /user/:id)
 */
export type PageClass = new (
	routeConfig: RouteConfig,
	param?: number | RouteParams
) => BasePage;

/**
 * Type représentant une fonction handler de route.
 *
 * C'est une fonction appelée lorsqu'une route est visitée.
 * Elle reçoit en option les paramètres extraits de l'URL (RouteParams).
 * ex: id pour profil utilisateur
 */
export type RouteHandler = (params?: RouteParams) => Promise<void>;

/**
 * Interface représentant les paramètres extraits dynamiquement d'une URL.
 * Ex: pour /user/42 = { id: '42' }
 */
export interface RouteParams {
	[key: string]: string;
}

/**
 * Interface représentant une page en cours d'affichage dans PageService.
 *
 * Regroupe les éléments nécessaires à l'affichage dynamique:
 * - render: fonction de rendu HTML
 * - cleanup: fonction de nettoyage avant de changer de page
 */
export interface PageInstance {
	render: () => Promise<void>;
	cleanup?: () => Promise<void>;
}

/**
 * Type pour les chemins de routes.
 * 
 * `RoutePathsMap` représente le type des chemins de routes définis dans `routePaths`.
 * `RoutePath` représente une des valeurs possibles des chemins de routes.
 */
export type RoutePathsMap = typeof routePaths;

/**
 * Type pour les chemins de routes.
 * 
 * `RoutePath` représente une des valeurs possibles des chemins de routes.
 * Par exemple, si `routePaths` contient l'entrée `"home": "/"`, alors `RoutePath` peut valoir `"/"`.
 */
export type RoutePath = RoutePathsMap[keyof RoutePathsMap];

/**
 * Types pour les noms de pages.
 * 
 * `PageNamesMap` représente le type des noms de pages définis dans `pageNames`.
 * `PageName` représente une des valeurs possibles des noms de pages.
 */
export type PageNamesMap = typeof pageNames;

/**
 * Type pour les noms de pages.
 * 
 * `PageName` représente une des valeurs possibles des noms de pages.
 * Par exemple, si `pageNames` contient l'entrée `"home": "home"`, alors `PageName` peut valoir `"home"`.
 */
export type PageName = PageNamesMap[keyof PageNamesMap];

/**
 * Type pour les chemins de templates HTML.
 * 
 * `TemplatePathsMap` représente le type des chemins de templates définis dans `templatePaths`.
 * `TemplatePath` représente une des valeurs possibles des chemins de templates.
 */
export type TemplatePathsMap = typeof templatePaths;

/**
 * Type pour les chemins de templates HTML.
 * 
 * `TemplatePath` représente une des valeurs possibles des chemins de templates.
 * Par exemple, si `templatePaths` contient l'entrée `"home": "/templates/user/home.html"`,
 * alors `TemplatePath` peut valoir `"/templates/user/home.html"`.
 */
export type TemplatePath = TemplatePathsMap[keyof TemplatePathsMap];
