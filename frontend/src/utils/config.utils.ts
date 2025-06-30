// CONFIGS
import { routesConfig } from '../config/routes.config';
import { componentsConfig } from '../config/components.config';

// TYPES
import { RouteConfig } from '../types/routes.types';
import { ComponentConfig } from '../types/components.types';

// ===========================================
// CONFIG UTILS
// ===========================================
/**
 * Ce fichier contient des fonctions utilitaires pour faciliter l'accès
 * et la manipulation des configurations de routes et de composants.
 * 
 * Les configurations sont stockées dans des fichiers de configuration
 * séparés (routes.config.ts et components.config.ts) et sont exportées
 * via des fonctions utilitaires dans ce fichier.
 */

/**
 * Fonction utilitaire pour obtenir la liste des routes configurées
 * (retourne une copie pour éviter les modifications).
 * 
 * @return {RouteConfig[]} La liste des routes configurées.
 */
export function getRoutesConfig(): RouteConfig[] {
	return [...routesConfig];
}

/**
 * Fonction utilitaire pour trouver une configuration de route par une propriété donnée (par défaut 'name').
 *
 * @param {string} value Valeur de la propriété à chercher
 * @param {keyof RouteConfig} [key='name'] Nom de la propriété à chercher
 * @return {(RouteConfig | undefined)} La configuration de route trouvée, ou undefined si pas trouvée
 */
export function findRouteConfig(value: string, key: keyof RouteConfig = 'name'): RouteConfig | undefined {
	return routesConfig.find(route => route[key] === value);
}

/**
 * Fonction utilitaire pour récupérer une configuration de route par une propriété donnée
 * (par défaut 'name') et lever une erreur si aucune correspondance n'est trouvée.
 * 
 * @param {string} value Valeur de la propriété à chercher
 * @param {keyof RouteConfig} [key='name'] Nom de la propriété à chercher
 * @return {RouteConfig} La configuration de route trouvée.
 * @throws {Error} Si aucune route correspondante n'est trouvée.
 */
export function getRouteConfig(value: string, key: keyof RouteConfig = 'name'): RouteConfig {
	const config = findRouteConfig(value, key);
	if (!config) {
		throw new Error(`Route avec ${key} = "${value}" introuvable dans routesConfig`);
	}
	return config;
}

/**
 * Fonction utilitaire pour obtenir la liste des components configurés
 * (retourne une copie pour éviter les modifications)
 *
 * @return {ComponentConfig[]}
 */
export function getComponentsConfig(): ComponentConfig[] {
	return [...componentsConfig];
}

/**
 * Fonction utilitaire pour trouver une configuration de composant par l'une de ses propriétés (par défaut 'name').
 *
 * @param {string} value Valeur de la propriété à chercher
 * @param {keyof ComponentConfig} [key='name'] Nom de la propriété à chercher
 * @return {(ComponentConfig | undefined)} La configuration de composant trouvée, ou undefined si pas trouvée
 */
export const findComponentConfig = (value: string, key: keyof ComponentConfig = 'name'): ComponentConfig | undefined => {
	return componentsConfig.find(component => component[key] === value);
};

/**
 * Fonction utilitaire pour récupérer une configuration de composant par une propriété donnée
 * (par défaut 'name') et lever une erreur si aucune correspondance n'est trouvée.
 *
 * @param {string} value Valeur de la propriété à chercher
 * @param {keyof ComponentConfig} [key='name'] Nom de la propriété à chercher
 * @return {ComponentConfig} La configuration de composant trouvée
 * @throws {Error} Si aucune configuration de composant n'est trouvée avec la propriété spécifiée
 */

export function getComponentConfig(value: string, key: keyof ComponentConfig = 'name'): ComponentConfig {
	const config = findComponentConfig(value, key);
	if (!config) {
		throw new Error(`Composant avec ${key} = "${value}" introuvable dans componentsConfig`);
	}
	return config;
}