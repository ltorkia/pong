import { RouteConfig } from '../types/routes.types';
import { ComponentName, ComponentConfig } from '../types/components.types';
import { User } from '../models/user.model';
import { userStore } from '../stores/user.store';
import { BaseComponent } from 'src/components/base/base.component';
import { loadTemplate, getHTMLElementById } from '../utils/dom.utils';
import { appId } from '../config/routes.config';
import { LOADING_PAGE_ERR } from '../config/messages.config';

// ===========================================
// BASE PAGE
// ===========================================
/**
 * La classe de base des pages.
 * Contient les propriétés et les méthodes communes à toutes les pages de l'application.
 */
export abstract class BasePage {
	protected config: RouteConfig;																	// Propriétés de la route liée à la page
	protected container: HTMLElement;																// Élément DOM dans lequel le contenu html sera injecté
	protected currentUser: User | null = null;														// Utilisateur actuellement connecté s'il existe
	protected templatePath: string;																	// Chemin vers le template html à charger pour cette page
	protected components?: Partial<Record<ComponentName, ComponentConfig>>;							// Les configs des composants associés à la page
	protected componentInstances: Partial<Record<ComponentName | string, BaseComponent>> = {};		// Les composants chargés et injectés dans le template

	/**
	 * Constructeur de la classe de base des pages.
	 *
	 * Initialise les propriétés de la classe avec la configuration de la route,
	 * l'utilisateur actuellement connecté, et prépare le conteneur DOM pour
	 * l'injection de contenu HTML.
	 *
	 * @param {RouteConfig} config La configuration de la route actuelle, 
	 * contenant des informations telles que le chemin du template et les
	 * composants associés à la page.
	 */
	constructor(config: RouteConfig) {
		this.config = config;
		this.container = this.getContainerApp();
		this.currentUser = userStore.getCurrentUser();
		this.templatePath = this.config.templatePath;
		this.components = this.config.components;
		this.componentInstances = {};
	}

	/**
	 * Méthodes de surcharge (protected) optionnellement remplies par les sous-classes.
	 */	
	protected async beforeMount(): Promise<void> {}
	protected async loadSpecificComponents(): Promise<void> {}
	protected async mount(): Promise<void> {}
	protected attachListeners(): void {}
	protected removeListeners(): void {}

	/**
	 * Méthode principale de rendu de la page.
	 * 
	 * - Vérifie que l'utilisateur est connecté si la page est privée.
	 * - Exécute les étapes de pré-rendering (beforeMount).
	 * - Charge le HTML du template via fetch ou cache et l'injecte dans
	 *   le conteneur DOM.
	 * - Injecte les composants communs à plusieurs pages.
	 * - Exécute les opérations de rendu propres à la page (mount).
	 * - Attache les écouteurs d'événements relatifs à la page.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque le rendu est terminé.
	 */
	public async render(): Promise<void> {
		try {
			console.log(`[${this.constructor.name}] Début du rendu...`);
			this.checkUserLogged();
			await this.beforeMount();
			const html = await loadTemplate(this.templatePath);
			this.container.innerHTML = html;
			console.log(`[${this.constructor.name}] HTML injecté`);
			await this.loadCommonComponents();
			await this.mount();
			console.log(`[${this.constructor.name}] Page montée, rendu terminé`);
			this.attachListeners();
			console.log(`[${this.constructor.name}] Listeners attachés`);

		} catch (error) {
			console.error(`Erreur lors du rendu de ${this.constructor.name}: `, error);
			this.container.innerHTML = this.getErrorMessage();
		}
	}

	/**
	 * Charge les composants communs à plusieurs pages (isCommon = true)
	 * en bouclant sur la propriété components de la page.
	 * Pour chaque composant, instancie la classe du composant avec
	 * la configuration de la page et le conteneur HTML correspondant,
	 * et appelle la méthode render() du composant.
	 * Stocke les instances des composants rendus dans la propriété
	 * componentInstances avec le nom du composant comme clé.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque
	 * tous les composants communs sont chargés et rendus.
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
			const component = new componentConfig.componentConstructor(this.config, componentConfig, componentContainer);
			await component.render();
			this.addToComponentInstances(componentConfig.name, component);
			
			console.log(`[${this.constructor.name}] Composant '${componentConfig.name}' généré`);
		};
	}

	/**
	 * Vérifie si la configuration d'un composant est valide pour la page actuelle.
	 *
	 * La configuration est considérée comme valide si le type (commun ou non) et
	 * la visibilité (publique ou privée) du composant correspondent aux attentes
	 * pour la page actuelle.
	 *
	 * @param {ComponentConfig} componentConfig La configuration du composant à vérifier.
	 * @param {boolean} [isCommon=true] Indique si le composant est commun à plusieurs pages.
	 * @returns {boolean} Retourne true si la configuration du composant est valide, false sinon.
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
	 * Détermine si un composant doit être rendu sur la page actuelle en fonction
	 * de la visibilité (publique/privée) de la page et du composant.
	 *
	 * Si la page est publique, seuls les composants publics sont rendus.
	 * Si la page est privée, seuls les composants privés sont rendus.
	 *
	 * @param {ComponentConfig} componentConfig La configuration du composant à vérifier.
	 * @returns {boolean} Retourne true si le composant doit être rendu, false sinon.
	 */
	protected shouldRenderComponent(componentConfig: ComponentConfig): boolean {
		return this.config.isPublic === componentConfig.isPublic;
	}

	/**
	 * Ajoute une instance de composant au tableau des instances de composants.
	 *
	 * Cette méthode stocke l'instance de composant donnée dans le tableau
	 * componentInstances en utilisant le nom du composant fourni comme clé.
	 * Cela permet de retrouver et de gérer facilement les instances de composants
	 * associées à la page.
	 *
	 * @param {ComponentName} componentName - Le nom du composant.
	 * @param {BaseComponent} componentInstance - L'instance du composant à stocker.
	 */
	protected addToComponentInstances(componentName: ComponentName | string, componentInstance: BaseComponent): void {
		this.componentInstances[componentName] = componentInstance;
	}

	/**
	 * Vérifie qu'un utilisateur est bien authentifié si la page est privée.
	 *
	 * Si la page est privée, cette méthode vérifie que l'utilisateur est
	 * bien authentifié en vérifiant l'existence de l'utilisateur courant.
	 * Si l'utilisateur n'est pas trouvé, une erreur est levée.
	 */
	protected checkUserLogged(): void {
		if (!this.config.isPublic && !this.currentUser) {
			throw new Error(`La récupération du user a échoué`);
		}
	}

	/**
	 * Retourne l'élément HTML du conteneur principal de l'application.
	 *
	 * @returns {HTMLElement} L'élément HTML correspondant à l'ID spécifié.
	 * @throws {Error} Si l'élément n'est pas trouvé dans le DOM.
	 */
	protected getContainerApp(): HTMLElement {
		return getHTMLElementById(appId);
	}

	/**
	 * Nettoyage de la page: vide le container #app et les composants.
	 *
	 * Appelée dans page.service.ts avant de rendre une nouvelle page.
	 * - Nettoie les composants de la page
	 * - Supprime les listeners
	 * - Vide le container principal #app
	 *
	 * @returns {Promise<void>} Une promesse qui se résout lorsque le nettoyage est terminé.
	 */
	public async cleanup(): Promise<void> {
		console.log(`[${this.constructor.name}] Nettoyage...`);
		this.cleanupComponents();
		this.removeListeners();
		this.container.replaceChildren();
		console.log(`[${this.constructor.name}] Container principal #${appId} nettoyé`);
		console.log(`[${this.constructor.name}] Nettoyage terminé`);
	}

	/**
	 * Nettoyage des composants de la page.
	 *
	 * Appel la méthode cleanup() de chaque instance de composant stockée dans
	 * componentInstances pour nettoyer les composants de la page.
	 */
	protected cleanupComponents(): void {
		if (this.components) {
			Object.values(this.componentInstances).forEach(componentInstance => {
				if (!componentInstance) {
					return;
				}
				componentInstance.cleanup();
			});
		}
	}

	/**
	 * Retourne le message d'erreur à afficher si la page ne peut pas être rendue.
	 *
	 * @returns {string} Le message d'erreur sous forme de code HTML.
	 */
	protected getErrorMessage(): string {
		return `<div id="alert">${LOADING_PAGE_ERR}</div>`;
	}
}