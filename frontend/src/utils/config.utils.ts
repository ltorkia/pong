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
 * Ce fichier regroupe des fonctions utilitaires destinées à faciliter
 * l'accès, la recherche, la copie et la manipulation des configurations
 * des routes et des composants de l’application.
 * 
 * Les configurations elles-mêmes sont définies dans des fichiers dédiés
 * (routes.config.ts et components.config.ts).
 */

/**
 * Fonction utilitaire permettant d’obtenir la copie d'une route configurée.
 * 
 * Retourne une copie de la configuration d’origine afin d’éviter toute
 * modification involontaire de la source initiale.
 *
 * @returns {ComponentConfig[]} Une nouvelle copie indépendante de la configuration de la route.
 */
export function cloneRouteConfig(config: RouteConfig): RouteConfig {
	return { ...config };
}

/**
 * Fonction utilitaire pour trouver une configuration de route par une
 * propriété donnée (par défaut 'name').
 *
 * @param {string} value Valeur de la propriété à chercher
 * @param {keyof RouteConfig} [key='name'] Nom de la propriété à chercher
 * @returns {(RouteConfig | undefined)} La configuration de route trouvée, ou undefined si pas trouvée
 */
export function findRouteConfig(value: string, key: keyof RouteConfig = 'name'): RouteConfig | undefined {
	return routesConfig.find(route => route[key] === value);
}

/**
 * Fonction utilitaire pour récupérer une configuration de route par
 * une propriété donnée (par défaut 'name') et lever une erreur si aucune correspondance n'est trouvée.
 * 
 * @param {string} value Valeur de la propriété à chercher
 * @param {keyof RouteConfig} [key='name'] Nom de la propriété à chercher
 * @returns {RouteConfig} La configuration de route trouvée.
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
 * Fonction utilitaire permettant d’obtenir la copie d'un composant configuré.
 * 
 * Retourne une copie de la configuration d’origine afin d’éviter toute
 * modification involontaire de la source initiale.
 *
 * @returns {ComponentConfig[]} Une nouvelle copie indépendante de la configuration du composant.
 */
export function cloneComponentConfig(config: ComponentConfig): ComponentConfig {
	return { ...config };
}

/**
 * Fonction utilitaire pour trouver une configuration de composant par l'une de ses
 * propriétés (par défaut 'name').
 *
 * @param {string} value Valeur de la propriété à chercher
 * @param {keyof ComponentConfig} [key='name'] Nom de la propriété à chercher
 * @returns {(ComponentConfig | undefined)} La configuration de composant trouvée, ou undefined si pas trouvée
 */
export const findComponentConfig = (value: string, key: keyof ComponentConfig = 'name'): ComponentConfig | undefined => {
	return componentsConfig.find(component => component[key] === value);
};

/**
 * Fonction utilitaire pour récupérer une configuration de composant par
 * une propriété donnée (par défaut 'name') et lever une erreur si aucune correspondance n'est trouvée.
 *
 * @param {string} value Valeur de la propriété à chercher
 * @param {keyof ComponentConfig} [key='name'] Nom de la propriété à chercher
 * @returns {ComponentConfig} La configuration de composant trouvée
 * @throws {Error} Si aucune configuration de composant n'est trouvée avec la propriété spécifiée
 */

export function getComponentConfig(value: string, key: keyof ComponentConfig = 'name'): ComponentConfig {
	const config = findComponentConfig(value, key);
	if (!config) {
		throw new Error(`Composant avec ${key} = "${value}" introuvable dans componentsConfig`);
	}
	return config;
}