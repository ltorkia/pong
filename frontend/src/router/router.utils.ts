import { RouteHandler } from '../types/navigation.types';

/**
 * Vérifie si une route contient des paramètres (ex: /user/:id)
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
 * Permet de rechercher une route enregistrée qui correspond au chemin donné.
 * Elle gère les routes dynamiques avec paramètres, par exemple "/users/:id".
 * 
 * - On boucle sur toutes les routes enregistrées dans routes.
 * - Pour chaque route, on la découpe en segments séparés par "/" ("/users/:id" -> ["", "users", ":id"]).
 * - On découpe aussi le chemin passé en paramètre de la même façon ("/users/42" -> ["", "users", "42"]).
 * - Si le nombre de segments diffère entre la route et le chemin, on passe à la route suivante (pas de correspondance possible).
 * - On initialise un objet params vide pour stocker les paramètres extraits ({ id: "42" }).
 * - On initialise une variable matched à true qui servira à valider si la route correspond.
 * - On parcourt chaque segment des deux tableaux simultanément :
 *    - Si le segment de la route commence par ":", c'est un paramètre dynamique.  
 *      On extrait le nom du paramètre (ex : ":id" -> "id") et on associe sa valeur depuis le chemin ("42").
 *    - Sinon, on compare directement les segments.  
 *      Si ils ne sont pas égaux, la route ne correspond pas, on met matched à false et on sort de la boucle.
 * - Après la boucle, si matched est toujours true, ca veut dire que la route correspond bien au chemin donné.
 *    On retourne un objet contenant la route correspondante et les paramètres extraits.
 * - Si aucune route ne correspond, on retourne null.
 * 
 *  Record<string, string> pour dire objet avec des clés string, valeurs string, qu'on ne connait pas a l'avance.
 * 
 * @param path Le chemin à tester, ex: "/users/42"
 * @param routes Map des routes enregistrées
 * @returns Un objet { route, params } si une route correspond, sinon null
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