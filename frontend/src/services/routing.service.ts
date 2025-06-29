// PAGE UI
import { pageService } from './page.service';

// ROUTER
import { routesConfig } from '../config/routes.config';
import { router, Router } from '../router/router';
import { RouteConfig, RouteParams } from '../types/routes.types';
import { hasParams } from '../router/router.helper';

// ===========================================
// ROUTING SERVICE
// ===========================================
/**
 * Service central pour la gestion des routes.
 *
 * Ce service est responsable de:
 * - l'enregistrement des routes dans le router global
 * - la gestion de la navigation (changements d'URL, popstate, etc.)
 * - l'exécution des handlers de routes
 * - la coordination avec les autres composants (RouteGuard, Router etc.)
 */
export class RoutingService {

	/**
	 * Constructeur:
	 * - Initialise les routes en les enregistrant dans le router global
	 * (la map dans router.ts).
	 * 
	 * @memberof RoutingService
	 */
	constructor() {
		this.setupRoutes();
	}
	
	/**
	 * Démarre la gestion des routes.
	 * 
	 * - Affiche la liste des routes enregistrées dans la console pour debug
	 * - Appelle handleLocationPublic() du router qui va lire l'URL courante
	 *   et déclencher le rendu de la page associée.
	 */
	public async start() {
		console.log(`[${this.constructor.name}] Routes enregistrées:`, Array.from(router.getRoutes().keys()));
		await router.handleLocationPublic();
	}

	/**
	 * Enregistre les routes dans la map de Router
	 * en se basant sur routesConfig du fichier navigation.config.
	 * 
	 * Dans la map, on set un chemin (ex: /login) et une fonction handler
	 * qui sera exécutée pour render cette page au moment de la navigation.
	 * Le handler peut prendre un parametre (ex: id).
	 * 
	 * @memberof RoutingService
	 */

	
	/**
	 * Enregistre les routes dans la map de Router
	 * en se basant sur routesConfig du fichier navigation.config.
	 *
	 * Pour chaque route, on vérifie si elle contient des paramètres
	 * (ex: /users/:id) en utilisant hasParams() du router.helper.
	 *
	 * Si oui, on enregistre la route avec un handler qui prend un paramètre
	 * (RouteParams) qui sera passé à handleParamRoute().
	 *
	 * Sinon, on enregistre la route avec un handler qui n'a pas de paramètre
	 * et qui appellera handleSimpleRoute().
	 * 
	 * @memberof RoutingService
	 */
	private setupRoutes(): void {
		routesConfig.forEach(config => {
			if (hasParams(config.path)) {
				router.register(config.path, async (params?: RouteParams) => {
					await this.handleParamRoute(config, params);
				});
			} else {
				router.register(config.path, async () => {
					await this.handleSimpleRoute(config);
				});
			}
		});
	}

	/**
	 * ! Exemple lineaire pour la route login (c'etait avant refactorisation
	 * ! quand toutes les routes etaient declarees en dur) :
	 */
	// router.register('/login', async () => {
	// 	console.log('Exec route: navigation vers Login');
	// 	const appDiv = document.getElementById('app') as HTMLElement | null;
	// 	if (!appDiv) {
	// 		console.error("div #app introuvable");
	// 		return;
	// 	}
	// 	console.log('div #app trouvée, création LoginPage');
	// 	const loginPage = new LoginPage(appDiv) as LoginPage;
	// 	await this.loadPage(loginPage);
	// 	setActiveNavLink('/login');
	// 	console.log('LoginPage rendue');
	// });

	/**
	 * Gère les routes simples sans paramètres
	 */
	
	/**
	 * Gère les routes sans paramètres.
	 * 
	 * - Crée l'instance de page associée à la route en appelant createPageInstance()
	 *   en passant la config de la route.
	 * - Si l'instance est null, on stoppe là.
	 * - Appel la méthode loadPage() pour charger et afficher la page.
	 * - En cas d'erreur, on logue l'erreur.
	 * 
	 * @param {RouteConfig} config Configuration de la route.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque la page est rendue.
	 * @memberof RoutingService
	 */
	private async handleSimpleRoute(config: RouteConfig): Promise<void> {
		console.log(`[${this.constructor.name}] Exec route -> navigation vers ${config.name}`);

		// Création de l'instance de page
		const pageInstance = await this.createPageInstance(config);
		if (!pageInstance) {
			return
		};

		// Chargement et affichage de la page
		await this.loadPage(config, pageInstance);
		console.log(`[${this.constructor.name}] ${config.name} rendue`);
	}

	/**
	 * Gère les routes avec paramètres.
	 * 
	 * - Vérifie que les paramètres sont bien présents.
	 * - Crée l'instance de page en appelant createPageInstance() en passant la config de la route et les paramètres.
	 * - Si l'instance est null, on stoppe là.
	 * - Appel la méthode loadPage() pour charger et afficher la page.
	 * - En cas d'erreur, on logue l'erreur.
	 * 
	 * @param {RouteConfig} config Configuration de la route.
	 * @param {RouteParams} [params] Paramètres de la route.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque la page est rendue.
	 * @memberof RoutingService
	 */
	private async handleParamRoute(config: RouteConfig, params?: RouteParams): Promise<void> {
		if (!params || Object.keys(params).length === 0) {
			console.error(`[${this.constructor.name}] Paramètres manquants pour la route ${config.path}`);
			return;
		}

		console.log(`[${this.constructor.name}] Exec route -> navigation vers ${config.name} avec params:`, params);

		// Création de l'instance avec paramètres
		const pageInstance = await this.createPageInstance(config, params);
		if (!pageInstance) {
			return;
		}

		// Chargement et affichage de la page
		await this.loadPage(config, pageInstance);
		// await this.updateNavigation(config);
		
		console.log(`[${this.constructor.name}] ${config.name} rendue`);
	}

	/**
	 * Crée une instance de page avec ou sans paramètres.
	 * 
	 * - Si des paramètres sont passés, on appelle createParamPageInstance()
	 *   pour transmettre ces paramètres à la page.
	 * - Sinon, on crée une instance de page classique.
	 * 
	 * @param {RouteConfig} config Configuration de la route.
	 * @param {RouteParams} [params] Paramètres de la route.
	 * @returns {Promise<any>} Une promesse qui se résout avec l'instance de page crée.
	 * @memberof RoutingService
	 */
	private async createPageInstance(config: RouteConfig, params?: RouteParams): Promise<any> {
		try {
			// Cas avec paramètres dans le handler qu'il faut transmettre a la page
			if (params) {
				return this.createParamPageInstance(config, params);
			}

			// Cas classique
			console.log(config.path);
			return new config.pageClass(config);
		} catch (error) {
			console.error(`[${this.constructor.name}] Erreur lors de la création de l'instance de page pour ${config.name}:`, error);
			return null;
		}
	}

	/**
	 * Crée une instance de page avec des paramètres spécifiques.
	 * 
	 * - Si le paramètre est un id user, on l'injecte directement dans le constructeur de la page.
	 * - Sinon, on l'injecte sous forme de Record<string, any> pour une éventuelle utilisation par la page.
	 * 
	 * @param {RouteConfig} config Configuration de la route.
	 * @param {RouteParams} params Paramètres de la route.
	 * @returns {any} Une instance de la page crée.
	 * @memberof RoutingService
	 */
	private createParamPageInstance(config: RouteConfig, params: RouteParams): any {
		// Cas qui attendent un id user en parametre deja en param du handler (comme pour ProfilePage)
		if (params.id) {
			return new config.pageClass(config, Number(params.id));
		}
		
		// Cas général avec params, utile pour de futures pages ?
		return new config.pageClass(config, params);
	}

	/**
	 * Charge et affiche une page en appelant la méthode renderPage() de PageService.
	 * 
	 * - Gère les erreurs de chargement de la page en les loguant.
	 * 
	 * @param {RouteConfig} config Configuration de la route.
	 * @param {any} pageInstance Instance de la page créée.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque la page est rendue.
	 * @memberof RoutingService
	 */
	private async loadPage(config: RouteConfig, pageInstance: any): Promise<void> {
		try {
			await pageService.renderPage(config, pageInstance);
		} catch (error) {
			console.error('Erreur lors du chargement de la page:', error);
		}
	}

	/**
	 * Getter public pour accéder au router.
	 * 
	 * @returns {Router} L'instance du router.
	 * @memberof RoutingService
	 */
	public getRouter(): Router {
		return router;
	}
}

/**
 * Service de routage global pour l'application.
 * 
 * Cette instance unique de RoutingService gère 
 * l'enregistrement et la gestion des routes.
 */
export const routingService = new RoutingService();
