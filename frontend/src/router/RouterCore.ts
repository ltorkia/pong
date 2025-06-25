import { RouteGuard } from './RouteGuard';
import { NavigationHandler } from './NavigationHandler';
import { RouteHandler } from '../types/navigation.types';
import { normalizePath, matchRoute } from '../utils/router.utils';
import { defaultRoute } from '../config/navigation.config';

/**
 * Gère l'ensemble du système de routage pour:
 * - enregistrement et gestion des routes de l'app
 * - interception des événements de navigation (clics, popstate)
 * - coordination entre les différents composants (RouteGuard, NavigationHandler, utils)
 * - exécution des handlers de routes
 * - navigation et les redirections
 */
export class RouterCore {
	private routes: Map<string, RouteHandler> = new Map();
	private isNavigating = false;
	private routeGuard: RouteGuard;
	private navigationHandler: NavigationHandler;

	/**
	 * Constructeur: initialise les écouteurs d'événements importants
	 * 
	 * - Surveille les events popstate (boutons précédent/suivant du navigateur)
	 *   et déclenche handleLocation() pour render la page correspondante.
	 * 
	 * - Intercepte les clics sur les liens avec l'attribut data-link + enfants dans le html.
	 *   e.preventDefault() empêche le rechargement complet de la page
	 *   puis on appelle navigate(href) pour gérer la navigation en mode SPA
	 *   en ajoutant le nouveau lien dans l'historique du navigateur
	 *   et en redirigeant vers la bonne page.
	 */
	constructor() {
		this.routeGuard = new RouteGuard(this);
		this.navigationHandler = new NavigationHandler();
		
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
	public async handleLocationPublic(): Promise<void> {
		await this.handleLocation();
	}

	/**
	 * Méthode publique pour gérer les redirections forcées
	 * sans ajouter de nouvelle entrée dans l'historique navigateur
	 */
	public async redirectPublic(path: string): Promise<void> {
		await this.redirect(path);
	}

	/**
	 * Enregistre une nouvelle route dans la map déclarée plus haut.
	 * 
	 * Reçoit en paramètres un chemin (ex: /login) et une fonction handler
	 * qui sera exécutée pour render la page quand on ira vers cette route.
	 * 
	 * Elle normalise le chemin via normalizePath() pour s'assurer que
	 * toutes les routes n'ont pas de / à la fin.
	 * 
	 * Cette méthode est appelée pour chaque route dans RouteManager.ts
	 */
	public register(path: string, handler: RouteHandler) {
		const normalizedPath = normalizePath(path);
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
	 *   - Ajoute l'URL à l'historique avec history.pushState().
	 *   - Appelle handleLocation() pour exécuter le handler correspondant.
	 * - Sinon, redirige vers la page d'accueil '/' en actualisant l'historique avec replaceState(),
	 *   puis appelle `handleLocation()` pour afficher la page d'accueil.
	 * - Remet isNavigating à false pour autoriser d'autres navigations.
	 * 
	 * Peut être déclenchée par :
	 * - Un clic sur un lien intercepté.
	 * - Une redirection suite à une erreur.
	 */
	public async navigate(path: string) {
		if (this.isNavigating) return;

		const normalizedPath = normalizePath(path);
		if (window.location.pathname === normalizedPath) {
			return;
		}

		this.isNavigating = true;

		// Recherche d'une route qui correspond au chemin (supporte les routes dynamiques)
		const matchedRoute = matchRoute(normalizedPath, this.routes);
		if (matchedRoute) {
			// On pousse l'URL dans l'historique
			this.navigationHandler.pushState(normalizedPath);
			await this.handleLocation();
		} else {
			console.warn(`Route ${normalizedPath} n'existe pas, redirection vers /`);
			this.navigationHandler.pushState(defaultRoute);
			await this.handleLocation();
		}

		this.isNavigating = false;
	}

	/**
	 * Méthode privée qui gère la lecture de l'URL courante,
	 * recherche la route correspondante (dynamique ou statique),
	 * et exécute son handler avec les paramètres extraits.
	 * 
	 * - Récupère l'URL actuelle.
	 * - Normalise le path (enleve le potentiel \ de fin).
	 * - Si la normalisation modifie l'URL, met à jour la barre d'adresse avec replaceState().
	 * - Utilise matchRoute() pour trouver la route correspondante et ses params.
	 * - Si une route est trouvée, on verifie d'abord que l'utilisateur est authentifie pour la redirection.
	 * - Ensuite on exécute son handler en lui passant les params.
	 * - Sinon, remplace l'URL par '/' et rappelle handleLocation() pour afficher la page d'accueil.
	 * 
	 * Appelée lors :
	 * - D'un événement popstate (navigation navigateur).
	 * - Après un navigate().
	 * - Au démarrage de l'application.
	 */
	private async handleLocation() {
		let path = window.location.pathname;
		const normalizedPath = normalizePath(path);
		if (normalizedPath !== path) {
			this.navigationHandler.replaceState(normalizedPath);
			path = normalizedPath;
		}

		console.log(`Tentative de navigation vers: ${path}`);
		console.log('Routes disponibles:', Array.from(this.routes.keys()));

		// Recherche la route qui matche (statique ou dynamique)
		const matchedRoute = matchRoute(path, this.routes);

		if (matchedRoute) {
			const routeHandler = this.routes.get(matchedRoute.route);

			if (routeHandler) {
				const redirected = await this.routeGuard.checkAuthRedirect(matchedRoute);
				if (redirected) {
					return;
				}

				console.log(`Route trouvée pour ${path} (correspond à ${matchedRoute.route}), exécution...`);
				try {
					// Passe les params au handler s'il attend des arguments
					await routeHandler(matchedRoute.params);
					console.log(`Route ${path} exécutée`);
				} catch (error) {
					console.error(`Erreur lors de l'exécution de la route ${path}:`, error);

					if (path !== defaultRoute) {
						console.log('Redirection vers l\'accueil après erreur');
						await this.navigate(defaultRoute);
					}
				}
			} else {
				console.warn(`Handler introuvable pour la route ${matchedRoute.route}`);
			}
		} else {
			console.warn(`Aucune route trouvée pour: ${path}`);
			console.log('Redirection automatique vers l\'accueil');
			await this.redirect(defaultRoute);
		}
	}

	/**
	 * Redirige vers une route sans ajouter d'entrée dans l'historique du navigateur.
	 * 
	 * Utilisé notamment pour les redirections forcées (auth, erreurs, etc.),
	 * pour éviter les doublons lors du retour arrière (précédent / suivant).
	 */
	private async redirect(path: string): Promise<void> {
		this.navigationHandler.replaceState(path);
		await this.handleLocation();
	}

	/**
	 * Getter public pour récupérer la liste des routes enregistrées.
	 * Pour debug dans AppManager, méthode start().
	 */
	public getRoutes(): Map<string, RouteHandler> {
		return this.routes;
	}
}