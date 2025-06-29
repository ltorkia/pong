import { BasePage } from '../pages/BasePage';
import { User } from '../models/user.model';
import { ComponentConfig } from './components.types';

/**
 * Interface pour la configuration d'une route
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
 * Chaque page doit hériter de BasePage et avoir un constructeur avec ces paramètres :
 * - container: élément HTML dans lequel injecter le contenu
 * - templatePath: chemin vers le template HTML de la page
 * - routeConfig: configuration complète de la route (de type RouteConfig)
 * - param: paramètre optionnel associé à la route (ex: ID dans /user/:id)
 */
export type PageClass = new (
	routeConfig: RouteConfig,
	container: HTMLElement,
	currentUser: User | null,
	param?: number | RouteParams
) => BasePage;

/**
 * Type pour les handlers de route
 */
export type RouteHandler = (params?: RouteParams) => Promise<void>;

/**
 * Interface pour les paramètres de route dans handlers
 */
export interface RouteParams {
	[key: string]: string;
}