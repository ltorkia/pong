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
	const fileName = getRouteFromPath(templatePath);
	return isPublicRoute(fileName);
};

/**
 * Fonction utilitaire pour vérifier si un template correspond à une page publique
 */
export const getRouteFromPath = (path: string): string => {
	// Récupérer le nom de la page sans extension pour reconstituer la route
	const pageName = path.split('/').pop()?.replace('.html', '') ?? '';
	return '/' + pageName;
};