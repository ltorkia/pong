// TYPES
import { RouteConfig } from '../types/navigation.types';

// CONFIG
import { routesConfig } from '../config/navigation.config';

/**
 * Fonction utilitaire pour vérifier si une route est publique
 */
export const isPublicRoute = (routeOrPath: { route: string } | string | null): boolean => {
	if (!routeOrPath) {
		return false;
	}

	// Extraction du chemin
	const path = typeof routeOrPath === 'object' && 'route' in routeOrPath 
		? routeOrPath.route 
		: routeOrPath;

	if (typeof path !== 'string') {
		return false;

	}

	// Recherche dans la configuration
	const routeConfig = routesConfig.find(config => config.path === path);
	return routeConfig?.isPublic ?? false;
};

/**
 * Fonction utilitaire pour vérifier si une route est protégée
 */
export const isProtectedRoute = (routeOrPath: { route: string } | string | null): boolean => {
	return !isPublicRoute(routeOrPath);
};

/**
 * Fonction utilitaire pour vérifier si un template correspond à une page publique
 */
export const isPublicTemplate = (templatePath: string): boolean => {
	// Extraction du chemin depuis le template path (ex: /templates/login.html -> /login)
	const routePath = templatePath
		.replace('/templates', '')
		.replace('.html', '');
	
	return isPublicRoute(routePath);
};

/**
 * Fonction utilitaire pour récupérer une configuration de route par son path
 */
export const getRouteConfig = (path: string): RouteConfig | undefined => {
	return routesConfig.find(route => route.path === path);
};