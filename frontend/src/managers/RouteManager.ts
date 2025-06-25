// MANAGERS
import { PageManager } from './PageManager';
import { ParticlesManager } from './ParticlesManager';
import { userManager } from './UserManager';
import { RouterCore } from '../router/RouterCore';

// ROUTER / OUTILS
import { router } from '../router/router';
import { setActiveNavLink } from '../utils/navbar.utils';
import { hasParams } from '../utils/router.utils';

// CONFIG / TYPES
import { routesConfig } from '../config/navigation.config';
import { RouteConfig, RouteParams } from '../types/navigation.types';

export class RouteManager {
	private pageManager: PageManager;
	private particlesManager: ParticlesManager;

	/**
	 * Constructeur de RouteManager.
	 * 
	 * Prend en paramètres:
	 * - pageManager pour gérer le rendu et le nettoyage des pages,
	 * - particlesManager pour gérer les effets visuels de particules.
	 * 
	 * - Initialise les routes en appelant setupRoutes() qui enregistre
	 * les différentes routes dans le router global (la map dans Router.ts).
	 */
	constructor(pageManager: PageManager, particlesManager: ParticlesManager) {
		this.pageManager = pageManager;
		this.particlesManager = particlesManager;
		this.setupRoutes();
	}
	
	/**
	 * Méthode publique pour démarrer la gestion des routes.
	 * 
	 * - Affiche dans la console la liste des routes enregistrées pour debug
	 * - Appelle handleLocationPublic() du router qui va lire l'URL courante
	 *   et déclencher le rendu de la page associée.
	 * 
	 * Cette méthode est appelée par AppManager lors du démarrage de l’application.
	 */
	public async start() {
		console.log('Routes enregistrées:', Array.from(router.getRoutes().keys()));
		await router.handleLocationPublic();
	}

	/**
	 * Enregistre les routes dans la map de RouterCore
	 * en se basant sur routesConfig du fichier navigation.config.
	 * 
	 * Dans la map, on set un chemin (ex: /login) et une fonction handler
	 * qui sera exécutée pour render cette page.
	 * Le handler peut prendre un parametre (ex: id).
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
	 * Exemple lineaire pour la route login (c'etait avant refactorisation
	 * quand toutes les routes etaient declarees en dur) :
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
	private async handleSimpleRoute(config: RouteConfig): Promise<void> {
		console.log(`Exec route: navigation vers ${config.name}`);
		
		const appDiv = this.getAppDiv();
		if (!appDiv) {
			return;
		}

		// Création de l'instance de page
		const pageInstance = await this.createPageInstance(config, appDiv);
		if (!pageInstance) {
			return
		};

		// Chargement et affichage de la page
		await this.loadPage(pageInstance, config.enableParticles);
		await this.updateNavigation(config);
		
		console.log(`${config.name} rendue`);
	}

	/**
	 * Gère les routes avec paramètres
	 */
	private async handleParamRoute(config: RouteConfig, params?: RouteParams): Promise<void> {
		if (!params || Object.keys(params).length === 0) {
			console.error(`Paramètres manquants pour la route ${config.path}`);
			return;
		}

		console.log(`Exec route: navigation vers ${config.name} avec params:`, params);
		
		const appDiv = this.getAppDiv();
		if (!appDiv) {
			return;
		}

		// Création de l'instance avec paramètres
		const pageInstance = await this.createPageInstance(config, appDiv, params);
		if (!pageInstance) {
			return;
		}

		// Chargement et affichage de la page
		await this.loadPage(pageInstance, config.enableParticles);
		await this.updateNavigation(config);
		
		console.log(`${config.name} rendue`);
	}

	/**
	 * Crée une instance de page avec ou sans paramètres
	 */
	private async createPageInstance(config: RouteConfig, appDiv: HTMLElement, params?: RouteParams): Promise<any> {
		try {
			// Cas spéciaux qui attendent l'id user en paramètre (comme HomeView)
			if (!config.isPublic && config.idUserRequired) {
				const currentUser = await userManager.loadOrRestoreUser();
				return new config.component(appDiv, currentUser?.id);	// = ex: return new HomeView(id)
			}

			// Cas avec paramètres dans le handler qu'il faut transmettre a la page
			if (params) {
				return this.createParamPageInstance(config, appDiv, params);
			}

			// Cas classique
			return new config.component(appDiv);
		} catch (error) {
			console.error(`Erreur lors de la création de l'instance de page pour ${config.name}:`, error);
			return null;
		}
	}

	/**
	 * Crée une instance de page avec des paramètres spécifiques
	 */
	private createParamPageInstance(config: RouteConfig, appDiv: HTMLElement, params: RouteParams): any {
		// Cas qui attendent un id user en parametre qui est deja en param du handler (comme pour ProfileView)
		if (config.idUserRequired && params.id) {
			return new config.component(appDiv, Number(params.id));
		}
		
		// Cas général avec params, a creuser pour d'autres composants ?
		return new config.component(appDiv, params);
	}

	/**
	 * Met à jour la navigation et le lien actif dans la navbar
	 */
	private async updateNavigation(config: RouteConfig): Promise<void> {
		try {
			if (config.getNavPath) {
				const navPath = await config.getNavPath();
				if (navPath) {
					setActiveNavLink(navPath);
				} else {
					console.warn(`Impossible de déterminer le chemin de navigation pour ${config.name}`);
				}
			} else {
				setActiveNavLink(config.path);
			}
		} catch (error) {
			console.error(`Erreur lors de la mise à jour de la navigation pour ${config.name}:`, error);
		}
	}

	/**
	 * Charge et affiche une page avec gestion des particules
	 */
	private async loadPage(pageInstance: any, enableParticles: boolean = true): Promise<void> {
		try {
			// Gestion des particules
			if (enableParticles) {
				await this.particlesManager.enable();
			} else {
				await this.particlesManager.disable();
			}

			// Rendu de la page
			await this.pageManager.renderPage(pageInstance);
		} catch (error) {
			console.error('Erreur lors du chargement de la page:', error);
		}
	}

	/**
	 * Récupère l'élément DOM principal de l'application
	 */
	private getAppDiv(): HTMLElement | null {
		const appDiv = document.getElementById('app') as HTMLElement | null;
		if (!appDiv) {
			console.error("Élément #app introuvable dans le DOM");
		}
		return appDiv;
	}

	/**
	 * Getter public router
	 */
	public getRouter(): RouterCore {
		return router;
	}
}