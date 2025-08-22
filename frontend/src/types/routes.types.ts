import { BasePage } from '../pages/base/base.page';
import { ComponentName, ComponentConfig } from './components.types';
import { PAGE_NAMES, ROUTE_PATHS, TEMPLATE_PATHS } from '../config/routes.config';
import { UserRowComponent } from '../components/user-row/user-row.component';
import { AppNotification } from '../shared/models/notification.model';
import { User } from '../shared/models/user.model';

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
 * 
 * La configuration d'une route comprend les éléments suivants:
 * path: chemin de la route ('/', '/users', '/user/:id'...)
 * name: nom de la route pour logs et debug
 * pageConstructor: constructeur de la page à instancier / render (HomePage, GamePage...)
 * templatePath: chemin du template HTML associé à la page
 * components: configuration des composants spécifiques à cette page
 * isPublic: si true, la route est accessible sans authentification uniquement (login, register)
 * enableParticles: si true, active les particules sur cette page
 */
export interface RouteConfig {
	path: RoutePath;
	name: PageName;
	pageConstructor: PageConstructor;
	templatePath: TemplatePath;
	components?: Partial<Record<ComponentName, ComponentConfig>>;
	isPublic: boolean;
	enableParticles: boolean;
}

/**
 * Type représentant une classe de page instanciable.
 *
 * Chaque page doit hériter de BasePage et avoir un constructeur avec ces paramètres:
 * - routeConfig: configuration complète de la route (de type RouteConfig)
 * - param: paramètre optionnel associé à la route (ex: ID dans /user/:id)
 */
export type PageConstructor = new (
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
 * - config: configuration de la route associée
 * - render: fonction de rendu HTML
 * - cleanup: fonction de nettoyage avant de changer de page
 * - getComponentInstance: fonction pour récupérer une instance de composant spécifique
 * - updateFriendButtons: fonction pour mettre à jour les boutons d'amitié
 * - changeOnlineStatus: fonction pour mettre à jour l'onlineStatus d'un utilisateur
 * - injectUser: fonction pour injecter un utilisateur dans la liste des utilisateurs
 * - removeUser: fonction pour supprimer un utilisateur de la liste des utilisateurs
 */
export interface PageInstance {
	config: RouteConfig;
	render: () => Promise<void>;
	cleanup?: () => Promise<void>;
	getComponentInstance?<T>(name: string): T | undefined;
	updateFriendButtons?: (friendId?: number, userRowInstance?: UserRowComponent) => Promise<void>;
	changeOnlineStatus?: (user: User) => Promise<void>;
	injectUser?: (user: User) => Promise<void>;
	removeUser?: (user: User) => Promise<void>;
}

/**
 * Type pour les chemins de routes.
 * 
 * `RoutePathsMap` représente le type des chemins de routes définis dans `ROUTE_PATHS`.
 * `RoutePath` représente une des valeurs possibles des chemins de routes.
 */
export type RoutePathsMap = typeof ROUTE_PATHS;

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
 * `PageNamesMap` représente le type des noms de pages définis dans `PAGE_NAMES`.
 * `PageName` représente une des valeurs possibles des noms de pages.
 */
export type PageNamesMap = typeof PAGE_NAMES;

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
 * `TemplatePathsMap` représente le type des chemins de templates définis dans `TEMPLATE_PATHS`.
 * `TemplatePath` représente une des valeurs possibles des chemins de templates.
 */
export type TemplatePathsMap = typeof TEMPLATE_PATHS;

/**
 * Type pour les chemins de templates HTML.
 * 
 * `TemplatePath` représente une des valeurs possibles des chemins de templates.
 * Par exemple, si `templatePaths` contient l'entrée `"home": "/templates/user/home.html"`,
 * alors `TemplatePath` peut valoir `"/templates/user/home.html"`.
 */
export type TemplatePath = TemplatePathsMap[keyof TemplatePathsMap];
