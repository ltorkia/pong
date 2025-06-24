/**
 * Interface pour la configuration d'une route
 */
export interface RouteConfig {
	path: string;				// Chemin de la route ('/', '/users', '/user/:id'...)
	component: any;				// Composant de la page à render (HomeView, GameView...)
	name: string;				// Nom de la route pour logs et debug
	isPublic?: boolean;			// Si true, la route est accessible sans authentification (login, register)
	enableParticles?: boolean;	// Si true, active les particules sur cette page (défaut: true)
	
	// Fonction pour récupérer le lien actif dans la navbar
	getNavPath?: () => Promise<string | null> | string | null;
	
	// Middlewares à exécuter avant le rendu de la page
	// middlewares?: RouteMiddleware[];
}

// /**
//  * Interface pour les middlewares de route
//  */
// export interface RouteMiddleware {
// 	name: string;
// 	execute: (params?: Record<string, string>) => Promise<boolean>;
// }

/**
 * Type pour les handlers de route
 */
export type RouteHandler = (params?: RouteParams) => Promise<void>;

/**
 * Interface pour les paramètres de route
 */
export interface RouteParams {
	[key: string]: string;
}

// /**
//  * Interface pour les options de navigation
//  */
// export interface NavigationOptions {
// 	replace?: boolean;
// 	state?: any;
// }