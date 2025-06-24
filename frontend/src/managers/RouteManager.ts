// MANAGERS
import { PageManager } from './PageManager';
import { ParticlesManager } from './ParticlesManager';
import { userManager } from './UserManager';
import { RouterCore } from '../router/RouterCore';

// ROUTER / OUTILS
import { router } from '../router/router';
import { setActiveNavLink } from '../utils/navbar.utils';
import { hasParams } from '../utils/router.utils';

// CONFIG & TYPES
import { routesConfig, authFallbackRoute } from '../config/navigation.config';
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
	 * Initialise les routes à partir de la configuration externe.
	 */
	constructor(pageManager: PageManager, particlesManager: ParticlesManager) {
		this.pageManager = pageManager;
		this.particlesManager = particlesManager;
		this.setupRoutes();
	}
	
	/**
	 * Méthode publique pour démarrer la gestion des routes.
	 * 
	 * - Affiche dans la console la liste des routes enregistrées (utile pour debug)
	 * - Appelle router.handleLocationPublic() qui va lire l'URL courante
	 *   et déclencher le rendu de la page correspondante.
	 */
	public async start() {
		console.log('Routes enregistrées:', Array.from(router.getRoutes().keys()));
		await router.handleLocationPublic();
	}

	/**
	 * Enregistre toutes les routes à partir de la configuration externe.
	 */
	private setupRoutes(): void {routesConfig.forEach(config => {
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
	 * Gère les routes simples sans paramètres
	 */
	private async handleSimpleRoute(config: RouteConfig): Promise<void> {
		console.log(`Exec route: navigation vers ${config.name}`);
		
		const appDiv = this.getAppDiv();
		if (!appDiv) return;

		// Vérification d'authentification
		if (!config.isPublic && !(await this.checkAuthentication())) {
			return;
		}

		// Création de l'instance de page
		const pageInstance = await this.createPageInstance(config, appDiv);
		if (!pageInstance) return;

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
		if (!appDiv) return;

		// Vérification d'authentification
		if (!config.isPublic && !(await this.checkAuthentication())) {
			return;
		}

		// Création de l'instance avec paramètres
		const pageInstance = await this.createPageInstance(config, appDiv, params);
		if (!pageInstance) return;

		// Chargement et affichage de la page
		await this.loadPage(pageInstance, config.enableParticles);
		await this.updateNavigation(config);
		
		console.log(`${config.name} rendue`);
	}

	/**
	 * Vérifie l'authentification de l'utilisateur
	 */
	private async checkAuthentication(): Promise<boolean> {
		const currentUser = await userManager.loadOrRestoreUser();
		if (!currentUser) {
			console.log('Utilisateur non authentifié, redirection vers la page de connexion');
			await router.redirectPublic(authFallbackRoute);
			return false;
		}
		return true;
	}

	/**
	 * Crée une instance de page avec ou sans paramètres
	 */
	private async createPageInstance(config: RouteConfig, appDiv: HTMLElement, params?: RouteParams): Promise<any> {
		try {
			// Cas spécial pour HomePage qui nécessite l'ID utilisateur
			if (!config.isPublic && config.component.name === 'HomePage') {
				const currentUser = await userManager.loadOrRestoreUser();
				return new config.component(appDiv, currentUser?.id);
			}

			// Cas avec paramètres
			if (params) {
				return this.createParamPageInstance(config, appDiv, params);
			}

			// Cas simple
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
		// ProfilePage attend un number pour l'ID
		if (config.component.name === 'Profile' && params.id) {
			return new config.component(appDiv, Number(params.id));
		}
		if (config.component.name === 'ProfilePage' && params.id) {
			return new config.component(appDiv, Number(params.id));
		}
		
		// Cas général - extensible pour d'autres composants
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
	 * Ajoute dynamiquement une nouvelle route
	 */
	public addRoute(config: RouteConfig): void {
		try {
			if (hasParams(config.path)) {
				router.register(config.path, async (params?: RouteParams) => {
					await this.handleParamRoute(config, params);
				});
			} else {
				router.register(config.path, async () => {
					await this.handleSimpleRoute(config);
				});
			}
			console.log(`Route ${config.path} ajoutée dynamiquement`);
		} catch (error) {
			console.error(`Erreur lors de l'ajout de la route ${config.path}:`, error);
		}
	}

	/**
	 * Getter public pour récupérer le router
	 */
	public getRouter(): RouterCore {
		return router;
	}
}