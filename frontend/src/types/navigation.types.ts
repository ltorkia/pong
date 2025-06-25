/**
 * Interface pour la configuration d'une route
 */
export interface RouteConfig {
	path: string;				// Chemin de la route ('/', '/users', '/user/:id'...)
	component: any;				// Composant de la page à render (HomeView, GameView...)
	name: string;				// Nom de la route pour logs et debug
	isPublic: boolean;			// Si true, la route est accessible sans authentification (login, register)
	idUserRequired: boolean;	// Si true, l'id du user actuellement connecté est attendu en param de la view a instancier
	enableParticles: boolean;	// Si true, active les particules sur cette page
	getNavPath?: () => Promise<string | null> | string | null; // Fonction pour récupérer le lien actif dans la navbar
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