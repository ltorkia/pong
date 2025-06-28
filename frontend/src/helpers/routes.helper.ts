// TYPES
import { RouteConfig } from '../types/routes.types';

// CONFIG
import { routesConfig } from '../config/routes.config';

/**
 * Fonction utilitaire pour vérifier si une route est publique
 */
export const isPublicRoute = (route: string | null): boolean => {
	if (!route || typeof route !== 'string') {
		return false;
	}

	// Recherche dans la configuration
	const routeConfig = routesConfig.find(config => config.path === route);
	return routeConfig?.isPublic ?? false;
};

/**
 * Fonction utilitaire pour vérifier si un template correspond à une page publique
 */
export const isPublicTemplate = (templatePath: string): boolean => {
	// Récupérer le nom du fichier sans extension pour reconstituer la route
	const fileName = templatePath.split('/').pop()?.replace('.html', '') ?? '';
	return isPublicRoute('/' + fileName);
};

/**
 * Fonction utilitaire pour récupérer une configuration de route par son path
 */
export const getRouteConfig = (path: string): RouteConfig | undefined => {
	return routesConfig.find(route => route.path === path);
};

/**
 * Fonction utilitaire pour obtenir la liste des routes configurées
 * (retourne une copie pour éviter les modifications)
 */
export function getRoutesConfig(): RouteConfig[] {
	return [...routesConfig];
}