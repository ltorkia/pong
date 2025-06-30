import { BasePage } from '../pages/base/base.page';
import { ComponentConfig } from './components.types';

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
	path: string;									// Chemin de la route ('/', '/users', '/user/:id'...)
	name: string;									// Nom de la route pour logs et debug
	pageClass: PageClass;							// Classe de la page à instancier / render (HomePage, GamePage...)
	templatePath: string;							// Chemin du template HTML associé à la page
	components?: Record<string, ComponentConfig>;	// Config des composants spécifiques à cette page
	isPublic: boolean;								// Si true, la route est accessible sans authentification uniquement (login, register)
	enableParticles: boolean;						// Si true, active les particules sur cette page
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
