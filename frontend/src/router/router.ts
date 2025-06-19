import { PUBLIC_ROUTES } from '../config/public.routes';
import { getUserLog } from '../api/users';

type RouteHandler = (params?: Record<string, string>) => Promise<void> | void;

export class Router {
	private routes: Map<string, RouteHandler> = new Map();
	private isNavigating = false;

	/**
	 * Constructeur: initialise les écouteurs d’événements importants
	 * 
	 * - Surveille les events popstate (boutons précédent/suivant du navigateur)
	 *   et déclenche handleLocation() pour render la page correspondante.
	 * 
	 * - Intercepte les clics sur les liens avec l’attribut data-link + enfants dans le html.
	 *   e.preventDefault() empêche le rechargement complet de la page
	 *   puis on appelle navigate(href) pour gérer la navigation en mode SPA
	 *   en ajoutant le nouveau lien dans l'historique du navigateur
	 *   et en redirigeant vers la bonne page.
	 */
	constructor() {
		window.addEventListener('popstate', () => this.handleLocation());
		document.addEventListener('click', (e) => {
			const target = e.target as HTMLElement;
			if (target.matches('[data-link], [data-link] *')) {
				e.preventDefault();
				const link = target.closest('[data-link]') as HTMLElement;
				const href = link.getAttribute('href');
				if (href) {
					this.navigate(href);
				}
			}
		});
	}

	/**
	 * Méthode publique pour gérer la route au démarrage de l'app.
	 * Utile si on recharge la page ou arrive directement sur une URL précise.
	 * Appelle la méthode privée handleLocation().
	 * Utilisée dans RouteManager (méthode start()), elle-même appelée
	 * par AppManager (méthode start()).
	 */
	public async handleLocationPublic() {
		await this.handleLocation();
	}

	/**
	 * Enregistre une nouvelle route dans la map déclarée plus haut.
	 * 
	 * Reçoit en paramètres un chemin (ex: /login) et une fonction handler
	 * qui sera exécutée pour render la page quand on ira vers cette route.
	 * 
	 * Elle normalise le chemin via normalizePath() pour s’assurer que
	 * toutes les routes n'ont pas de / à la fin.
	 * 
	 * Cette méthode est appelée pour chaque route dans RouteManager.ts
	 */
	public register(path: string, handler: RouteHandler) {
		const normalizedPath = this.normalizePath(path);
		this.routes.set(normalizedPath, handler);
	}

	/**
	 * Méthode principale pour demander une navigation vers une route donnée.
	 * 
	 * - Ignore la demande si une navigation est déjà en cours (isNavigating).
	 * - Normalise le chemin donné ("/login/" -> "/login").
	 * - Si on est déjà sur ce chemin, ne fait rien.
	 * - Utilise matchRoute() pour trouver une route enregistrée qui correspond
	 *   au chemin donné, y compris avec paramètres dynamiques ("/users/42" pour profil utilisateur).
	 * - Si une route correspond :
	 *   - Ajoute l’URL à l’historique avec history.pushState().
	 *   - Appelle handleLocation() pour exécuter le handler correspondant.
	 * - Sinon, redirige vers la page d’accueil '/' en actualisant l’historique avec replaceState(),
	 *   puis appelle `handleLocation()` pour afficher la page d’accueil.
	 * - Remet isNavigating à false pour autoriser d’autres navigations.
	 * 
	 * Peut être déclenchée par :
	 * - Un clic sur un lien intercepté.
	 * - Une redirection suite à une erreur.
	 */
	public async navigate(path: string) {
		if (this.isNavigating) return;

		const normalizedPath = this.normalizePath(path);
		if (window.location.pathname === normalizedPath) {
			return;
		}

		this.isNavigating = true;

		// Recherche d’une route qui correspond au chemin (supporte les routes dynamiques)
		const matchedRoute = this.matchRoute(normalizedPath);
		if (matchedRoute) {
			// On pousse l’URL dans l’historique
			window.history.pushState({}, '', normalizedPath);
			await this.handleLocation();
		} else {
			console.warn(`Route ${normalizedPath} n'existe pas, redirection vers /`);
			window.history.pushState({}, '', '/');
			await this.handleLocation();
		}

		this.isNavigating = false;
	}

	/**
	 * Méthode privée qui gère la lecture de l’URL courante,
	 * recherche la route correspondante (dynamique ou statique),
	 * et exécute son handler avec les paramètres extraits.
	 * 
	 * - Récupère l’URL actuelle.
	 * - Normalise le path (enleve le potentiel \ de fin).
	 * - Si la normalisation modifie l’URL, met à jour la barre d’adresse avec replaceState().
	 * - Utilise matchRoute() pour trouver la route correspondante et ses params.
	 * - Si une route est trouvée, on verifie d'abord que l'utilisateur est authentifie pour la redirection.
	 * - Ensuite on exécute son handler en lui passant les params.
	 * - Sinon, remplace l’URL par '/' et rappelle handleLocation() pour afficher la page d’accueil.
	 * 
	 * Appelée lors :
	 * - D’un événement popstate (navigation navigateur).
	 * - Après un navigate().
	 * - Au démarrage de l’application.
	 */
	private async handleLocation() {
		let path = window.location.pathname;
		const normalizedPath = this.normalizePath(path);
		if (normalizedPath !== path) {
			window.history.replaceState({}, '', normalizedPath);
			path = normalizedPath;
		}

		console.log(`Tentative de navigation vers: ${path}`);
		console.log('Routes disponibles:', Array.from(this.routes.keys()));

		// Recherche la route qui matche (statique ou dynamique)
		const matchedRoute = this.matchRoute(path);

		if (matchedRoute) {
			const routeHandler = this.routes.get(matchedRoute.route);

			if (routeHandler) {
				const redirected = await this.handleAuthRedirect(matchedRoute);
				if (redirected) {
					return;
				}

				console.log(`Route trouvée pour ${path} (correspond à ${matchedRoute.route}), exécution...`);
				try {
					// Passe les params au handler s’il attend des arguments
					await routeHandler(matchedRoute.params);
					console.log(`Route ${path} exécutée`);
				} catch (error) {
					console.error(`Erreur lors de l'exécution de la route ${path}:`, error);

					if (path !== '/') {
						console.log('Redirection vers l\'accueil après erreur');
						await this.navigate('/');
					}
				}
			} else {
				console.warn(`Handler introuvable pour la route ${matchedRoute.route}`);
			}
		} else {
			console.warn(`Aucune route trouvée pour: ${path}`);
			console.log('Redirection automatique vers l\'accueil');

			window.history.replaceState({}, '', '/');
			await this.handleLocation();
		}
	}

	/**
	 * Gestion des redirections d’authentification:
	 * Rediriger vers /login si l’utilisateur non authentifié tente d’accéder à une page privée.
	 * Rediriger vers / si un utilisateur déjà authentifié tente d’accéder à /login ou /register.
	 */
	private async handleAuthRedirect(matchedRoute: { route: string }): Promise<boolean> {
		const publicRoutes = PUBLIC_ROUTES.map(route => `${route}`);
		const userLogStatus = await getUserLog();

		if (!publicRoutes.includes(matchedRoute.route)) {
			// Route privée
			try {
				if (!userLogStatus) {
					console.log('Redirection vers /login (non authentifié)');
					await this.navigate('/login');
					return true;
				}
			} catch {
				console.log('Redirection vers /login (erreur auth)');
				await this.navigate('/login');
				return true;
			}
		} else {
			// Route publique
			try {
				if (userLogStatus) {
					console.log('Redirection vers / (authentifié)');
					await this.navigate('/');
					return true;
				}
			} catch {
				console.log('Redirection vers /login (erreur auth)');
				await this.navigate('/login');
				return true;
			}
		}
		return false;
	}

	/**
	 * Permet de rechercher une route enregistrée qui correspond au chemin donné.
	 * Elle gère les routes dynamiques avec paramètres, par exemple "/users/:id".
	 * 
	 * - On boucle sur toutes les routes enregistrées dans this.routes.
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
	 * @returns Un objet { route, params } si une route correspond, sinon null
	*/
	private matchRoute(path: string): { route: string; params: Record<string, string> } | null {
		for (const [route, _] of this.routes) {
			const routeParts = route.split('/');
			const pathParts = path.split('/');

			if (routeParts.length !== pathParts.length) continue;

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

			if (matched) return { route, params };
		}
		return null;
	}
	
	/**
	 * Méthode utilitaire privée pour normaliser les paths.
	 * 
	 * - Convertit '' ou '/index.html' en '/'
	 * - Supprime le slash final sauf pour la racine (ex: '/login/' -> '/login').
	 * 
	 * Permet d’éviter les doublons dans la map des routes et facilite la gestion des chemins.
	 */
	private normalizePath(path: string): string {
		if (!path || path === '' || path === '/index.html') {
			return '/';
		}
		if (path.length > 1 && path.endsWith('/')) {
			return path.slice(0, -1);
		}
		return path;
	}

	/**
	 * Getter public pour récupérer la liste des routes enregistrées.
	 * Pour debug dans AppManager, méthode start().
	 */
	public getRoutes() {
		return this.routes;
	}
}

export const router = new Router();