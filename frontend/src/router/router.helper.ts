import { RouteHandler } from '../types/routes.types';

// ===========================================
// ROUTER HELPER
// ===========================================
/**
 * Ce fichier contient des fonctions utilitaires pour faciliter la gestion des routes.
 * 
 * Les fonctions exportées sont utilisées par le routeur et dans les parties de
 * l'application qui ont besoin de gérer les routes.
 */

/**
 * Vérifie si une route contient des param tres (ex: /user/:id)
 * 
 * @export
 * @param {string} path - Le chemin de la route  v rifier
 * @returns {boolean} true si le chemin contient des param tres, false sinon
 */
export function hasParams(path: string): boolean {
	return path.includes(':');
}

/**
 * Méthode utilitaire pour normaliser les paths.
 * 
 * - Convertit '' ou '/index.html' en '/'
 * - Supprime le slash final sauf pour la racine (ex: '/login/' -> '/login').
 * 
 * Permet d'éviter les doublons dans la map des routes et facilite la gestion des chemins.
 * 
 * @example
 * normalizePath('') => '/'
 * normalizePath('/index.html') => '/'
 * normalizePath('/login/') => '/login'
 * normalizePath('/login') => '/login'
 * 
 * @export
 * @param {string} path - Le chemin  normaliser
 * @returns {string} Le chemin normalisé
 */
export function normalizePath(path: string): string {
	if (!path || path === '' || path === '/index.html') {
		return '/';
	}
	if (path.length > 1 && path.endsWith('/')) {
		return path.slice(0, -1);
	}
	return path;
}

/**
 * Cherche une route enregistrée qui correspond au chemin donné.
 * Gère les routes statiques et dynamiques (avec des paramètres), par exemple "/users/:id".
 * 
 * - Boucle à travers toutes les routes enregistrées dans la map.
 * - Découpe chaque route et le chemin en segments séparés par "/".
 * - Si le nombre de segments diffère, passe à la route suivante.
 * - Initialise un objet vide params pour stocker les paramètres extraits.
 * - Parcourt chaque segment des deux tableaux simultanément :
 *   - Si le segment de la route commence par ":", c'est un paramètre dynamique.
 *     Extrait le nom du paramètre et associe sa valeur depuis le chemin.
 *   - Sinon, compare directement les segments. Si différents, la route ne correspond pas.
 * - Si tous les segments correspondent, retourne un objet contenant la route et les paramètres extraits.
 * - Retourne null si aucune route ne correspond.
 * 
 * @export
 * @param {string} path - Chemin  tester, ex: "/users/42"
 * @param {Map<string, RouteHandler>} routes - Map des routes enregistrées
 * @returns {{ route: string; params: Record<string, string> } | null} - Objet { route, params } si une route correspond, sinon null
 */
export function matchRoute(path: string, routes: Map<string, RouteHandler>): { route: string; params: Record<string, string> } | null {
	for (const [route, _] of routes) {
		const routeParts = route.split('/');
		const pathParts = path.split('/');

		if (routeParts.length !== pathParts.length) {
			continue;
		}

		let params: Record<string, string> = {};
		let matched = true;

		for (let i = 0; i < routeParts.length; i++) {
			if (routeParts[i].startsWith(':')) {
				const paramName = routeParts[i].substring(1);
				params[paramName] = pathParts[i];
			} else if (routeParts[i] !== pathParts[i]) {
				matched = false;
				break;
			}
		}

		if (matched) {
			return { route, params };
		}
	}
	return null;
}