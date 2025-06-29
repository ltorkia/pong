// CONFIGS
import { routesConfig } from '../config/routes.config';
import { componentsConfig } from '../config/components.config';

// TYPES
import { RouteConfig } from '../types/routes.types';
import { ComponentConfig } from '../types/components.types';

/**
 * Fonction utilitaire pour obtenir la liste des routes configurées
 * (retourne une copie pour éviter les modifications)
 */
export function getRoutesConfig(): RouteConfig[] {
	return [...routesConfig];
}

/**
 * Fonction utilitaire pour récupérer une configuration de route par l'une de ses propriétés (par défaut 'name').
 */
export function findRouteConfig(value: string, key: keyof RouteConfig = 'name'): RouteConfig | undefined {
	return routesConfig.find(route => route[key] === value);
}

/**
 * Fonction utilitaire pour récupérer une configuration de route par une propriété donnée
 * (par défaut 'name') et lever une erreur si aucune correspondance n'est trouvée.
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
 */
export function getComponentsConfig(): ComponentConfig[] {
	return [...componentsConfig];
}

/**
 * Fonction utilitaire pour récupérer une configuration de composant par l'une de ses propriétés (par défaut 'name').
 */
export const findComponentConfig = (value: string, key: keyof ComponentConfig = 'name'): ComponentConfig | undefined => {
	return componentsConfig.find(component => component[key] === value);
};

/**
 * Fonction utilitaire pour récupérer une configuration de composant par une propriété donnée
 * (par défaut 'name') et lever une erreur si aucune correspondance n'est trouvée.
 */
export function getComponentConfig(value: string, key: keyof ComponentConfig = 'name'): ComponentConfig {
	const config = findComponentConfig(value, key);
	if (!config) {
		throw new Error(`Composant avec ${key} = "${value}" introuvable dans componentsConfig`);
	}
	return config;
}