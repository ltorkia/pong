import { RouteConfig } from '../types/routes.types';
import { ComponentConfig } from '../types/components.types';
import { User } from '../models/user.model';
import { UserController } from '../controllers/UserController';
import { loadTemplate, getHTMLElementById } from '../helpers/dom.helper';
import { LOADING_PAGE_ERR } from '../config/messages';

export abstract class BasePage {
	protected config: RouteConfig;								// Propriétés de la route liée à la page
	protected container: HTMLElement;							// Élément DOM dans lequel le contenu html sera injecté
	protected currentUser: User | null = null;					// Utilisateur actuellement connecté s'il existe
	
	protected templatePath: string;								// Chemin vers le template html à charger pour cette page
	protected components?: Record<string, ComponentConfig>;		// Les configs des composants associés à la page
	protected userController: UserController;					// Instance qui va gérer le parcourt d'authentification du current user

	// Le constructeur reçoit le container DOM et le chemin du template
	constructor(config: RouteConfig, container: HTMLElement, currentUser: User | null) {
		this.config = config;
		this.container = container;
		this.currentUser = currentUser;

		this.templatePath = this.config.templatePath;
		this.components = this.config.components;

		this.userController = new UserController();
	}

	/**
	 * Méthodes de surcharge (protected) optionnellement remplies par les sous-classes.
	 */	
	protected async beforeMount(): Promise<void> {}
	protected async loadSpecificComponents(): Promise<void> {}
	protected async mount(): Promise<void> {}
	protected attachListeners(): void {}

	/**
	 * Méthode principale de rendu.
	 */
	public async render(): Promise<void> {
		try {
			console.log(`[${this.constructor.name}] Début du rendu...`);

			// Sur une page privée (Login, Register),
			// on vérifie que l'utilisateur est bien connecté
			this.checkUserLogged();

			// Opérations logistiques avant de rendre la page
			await this.beforeMount();

			// Chargement asynchrone du template HTML via fetch ou cache
			// + injection HTML dans la div #app
			const html = await loadTemplate(this.templatePath);
			this.container.innerHTML = html;
			
			console.log(`[${this.constructor.name}] HTML injecté`);

			// Injection des composants communs à plusieurs pages (ex: navbar)
			await this.loadCommonComponents();

			// On genere les infos propres a chaque page
			await this.mount();
			console.log(`[${this.constructor.name}] Page montée, rendu terminé`);
			
			// On attache les listeners relatifs à la page (ex gestion de clic LOGIN pour gérer la logique de connexion)
			this.attachListeners();
			console.log(`[${this.constructor.name}] Listeners attachés`);

		} catch (error) {
			// En cas d'erreur (ex fetch qui échoue) afficher un message d'erreur dans le container
			console.error(`Erreur lors du rendu de ${this.constructor.name}: `, error);
			this.container.innerHTML = this.getErrorMessage();
		}
	}

	/**
	 * Vérifie qu'un utilisateur est bien authentifié si la page est privée (Login, Register...).
	 * Throw une erreur si l'utilisateur est introuvable.
	 */
	protected checkUserLogged(): void {
		if (!this.config.isPublic && !this.currentUser) {
			throw new Error(`La récupération du user a échoué`);
		}
	}

	/**
	 * Génère les composants communs à plusieurs pages (isCommon = true)
	 * NB: un composant avec la propriété isPublic à true ne s'affichera que sur les page publiques (Login, Register...)
	 * de même pour les composants privés affichés uniquement sur les pages privées (après authentification uniquement).
	 * ex: navbar qui s'affiche ou pas en fonction du statut log utilisateur
	 */
	protected async loadCommonComponents(): Promise<void> {
		if (!this.components) {
			return;
		}

		for (const componentConfig of Object.values(this.components)) {
			if (!this.isValidConfig(componentConfig)) {
				continue;
			}
			
			const componentContainer = getHTMLElementById(componentConfig.containerId);
			const component = new componentConfig.componentClass(this.config, componentConfig, componentContainer, null, this.currentUser, this.userController);
			await component.render();
			
			console.log(`[${this.constructor.name}] Composant '${componentConfig.name}' généré`);
		};
	}

	/**
	 * Vérifie si la configuration d'un composant est valide pour la page actuelle.
	 * -> invalide si le type attendu (isCommon) ne correspond pas à componentConfig.isCommon,
	 * ou si la visibilité (publique/privée) du composant ne correspond pas à celle de la page.
	 */
	protected isValidConfig(componentConfig: ComponentConfig, isCommon: boolean = true): boolean {
		const isVisibilityMismatch = !this.shouldRenderComponent(componentConfig);
		const isTypeMismatch = isCommon !== componentConfig.isCommon;

		if (isVisibilityMismatch || isTypeMismatch) {
			return false;
		}
		return true;
	}

	/**
	 * Détermine si un composant doit être rendu sur la page actuelle
	 * en fonction de la visibilité (publique/privée) de la page et du composant.
	 */
	protected shouldRenderComponent(componentConfig: ComponentConfig): boolean {
		return this.config.isPublic === componentConfig.isPublic;
	}

	/**
	 * Nettoyage de la page: vide le container #app et les composants.
	 * Appelée dans PageManager.ts avant de rendre une nouvelle page.
	 */
	public async cleanup(): Promise<void> {
		console.log(`[${this.constructor.name}] Nettoyage...`);
		this.cleanupComponents();
		this.container.innerHTML = '';
		console.log(`[${this.constructor.name}] Container principal #${this.container} nettoyé`);
		console.log(`[${this.constructor.name}] Nettoyage terminé`);
	}

	/**
	 * Nettoyage des composants de la page.
	 */
	protected cleanupComponents(): void {
		if (this.components) {
			Object.values(this.components).forEach(componentConfig => {
				const componentContainer = document.getElementById(componentConfig.containerId);
				if (componentContainer) {
					componentContainer.innerHTML = '';
					console.log(`[${this.constructor.name}] Container #${componentConfig.containerId} nettoyé`);
				}
			});
		}
	}

	// Error message à afficher dans le catch de la méthode render()
	protected getErrorMessage(): string {
		return `<div id="alert">${LOADING_PAGE_ERR}</div>`;
	}
}