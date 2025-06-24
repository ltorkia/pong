/**
 * Interface pour la configuration d'une route
 */
export interface RouteConfig {
	path: string;				// Chemin de la route (ex: '/', '/users', '/user/:id')
	component: any;				// Composant de la page à rendre
	name: string;				// Nom de la route pour les logs et le debug
	isPublic?: boolean;			// Si true, la route est accessible sans authentification
	enableParticles?: boolean;	// Si true, active les particules sur cette page (défaut: true)
	
	// Fonction pour récupérer le chemin de navigation actif dans la navbar
	getNavPath?: () => Promise<string | null> | string | null;
	
	// Middlewares à exécuter avant le rendu de la page
	middlewares?: RouteMiddleware[];
}

/**
 * Interface pour les middlewares de route
 */
export interface RouteMiddleware {
	name: string;
	execute: (params?: Record<string, string>) => Promise<boolean>;
}

/**
 * Interface pour les paramètres de route
 */
export interface RouteParams {
	[key: string]: string;
}

/**
 * Type pour les handlers de route
 */
export type RouteHandler = (params?: RouteParams) => Promise<void>;

/**
 * Interface pour les options de navigation
 */
export interface NavigationOptions {
	replace?: boolean;
	state?: any;
}