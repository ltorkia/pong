type RouteHandler = () => Promise<void> | void;

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
	 * - Si une navigation est déjà en cours (isNavigating), ignore la demande.
	 * - Vérifie si on est déjà sur cette route, si oui, ne fait rien (return).
	 * - Normalise la route passée en paramètre (ex: /login/ -> /login).
	 * - Vérifie si la route existe dans la Map des routes enregistrées.
	 *   - Si oui, utilise history.pushState() pour ajouter l’URL à l'historique du navigateur
	 *     puis appelle handleLocation() qui exécute le handler correspondant dans la map des routes.
	 *   - Sinon, redirige vers la page d’accueil '/' en appelant aussi handleLocation().
	 * - Remet `isNavigating` à false pour autoriser d’autres navigations.
	 * 
	 * Cette méthode peut être déclenchée par:
	 * - Un clic sur un lien intercepté dans le constructeur
	 *   avec "document.addEventListener('click', (e) => {...});"
	 * - Une redirection vers l'accueil après une erreur dans handleLocation().
	 */
	public async navigate(path: string) {
		if (this.isNavigating) return;

		const normalizedPath = this.normalizePath(path);
		if (window.location.pathname === normalizedPath) {
			return;
		}

		this.isNavigating = true;
		
		if (this.routes.has(normalizedPath)) {
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
	 * Méthode privée qui gère la lecture de l’URL courante (window.location.pathname),
	 * cherche la route correspondante dans la map des routes et exécute son handler
	 * pour render la page.
	 * 
	 * - Récupère l’URL actuelle.
	 * - Normalise le path avec normalizePath().
	 * - Si la normalisation change l’URL, met à jour la barre d’adresse
	 *   via history.replaceState() (sans ajouter d’entrée dans l’historique).
	 * - Recherche dans la map si un handler existe pour cette route.
	 *   - Si oui, exécute la fonction asynchrone associée.
	 *     En cas d’erreur, exécute navigate('/') pour quand même pushState()
	 *     l'URL valide (= ajout historique) avant redirection vers accueil.
	 *   - Si aucune route n’est trouvée, met à jour la barre d’adresse avec history.replaceState()
	 *     (sans ajouter d’entrée dans l’historique), puis redirige vers la page d’accueil '/'
	 *     en rappelant récursivement handleLocation() pour gérer cette nouvelle route.
	 * 
	 * Cette méthode est appelée depuis:
	 * - Le constructeur sur l’événement popstate (navigation par boutons précédent/suivant du navigateur).
	 * - A la fin d'un navigate() réussi.
	 * - Au démarrage via handleLocationPublic().
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
		
		const routeHandler = this.routes.get(path);
		
		if (routeHandler) {
			console.log(`Route trouvée pour ${path}, exécution...`);
			try {
				await routeHandler();
				console.log(`Route ${path} exécutée`);
			} catch (error) {
				console.error(`Erreur lors de l'exécution de la route ${path}:`, error);

				if (path !== '/') {
					console.log('Redirection vers l\'accueil après erreur');
					await this.navigate('/');
				}
			}
		} else {
			console.warn(`Aucune route trouvée pour: ${path}`);
			console.log('Redirection automatique vers l\'accueil');

			window.history.replaceState({}, '', '/');
			await this.handleLocation();
		}
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