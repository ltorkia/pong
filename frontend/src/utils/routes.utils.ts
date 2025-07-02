// CONFIG
import { routesConfig } from '../config/routes.config';
import { RouteConfig } from '../types/routes.types';

// ===========================================
// ROUTES UTILS
// ===========================================
/**
 * Ce fichier contient des fonctions utilitaires pour manipuler les routes.
 * 
 * Les fonctions sont conçues pour être utilisées de manière générale et
 * ne sont pas liées  un contexte spécifique.
 */

/**
 * Vérifie si une route est publique (accessible sans authentification).
 * 
 * @param {string | null} route Chemin de la route  v rifier
 * @returns {boolean} true si la route est publique, false sinon
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
 * Vérifie si un modèle donné correspond à une page publique.
 *
 * Cette fonction extrait la route du chemin de modèle fourni
 * et détermine si elle est une route publique.
 *
 * @param {string} templatePath - Le chemin du fichier de modèle.
 * @return {boolean} true si le modèle correspond à une page publique, false sinon.
 */
export const isPublicTemplate = (templatePath: string): boolean => {
	// Récupérer le nom du fichier sans extension pour reconstituer la route
	const fileName = getRouteFromTemplatePath(templatePath);
	return isPublicRoute(fileName);
};

/**
 * Retourne le nom de la page (chemin de la route) associé à un chemin de fichier de
 * mod le (template).
 *
 * Exemple: si le chemin de fichier est "src/templates/page.html", la fonction
 * retourne "/page".
 *
 * @param {string} path - Le chemin du fichier de mod le.
 * @return {string} - Le nom de la page (chemin de la route) associ .
 */
export const getRouteFromTemplatePath = (path: string): string => {
	// Récupérer le nom de la page sans extension pour reconstituer la route
	const pageName = path.split('/').pop()?.replace('.html', '') ?? '';
	return '/' + pageName;
};

/**
 * Récupère la configuration de la route correspondant à la page actuelle.
 * Gère aussi les routes dynamiques comme /user/:id.
 *
 * @returns {RouteConfig | undefined} La configuration de la route courante.
 */
export const getCurrentRouteConfig = (): RouteConfig | undefined => {
	const currentPath = window.location.pathname;

	// 1. Recherche exacte
	const exactMatch = routesConfig.find(config => config.path === currentPath);
	if (exactMatch) return exactMatch;

	// 2. Cas des routes dynamiques (ex: /user/:id)
	if (currentPath.startsWith('/user/')) {
		return routesConfig.find(config => config.path.startsWith('/user/:'));
	}

	// Ajoute ici d'autres cas dynamiques si nécessaire

	return undefined;
};
