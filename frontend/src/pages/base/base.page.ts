import { RouteConfig } from '../../types/routes.types';
import { User } from '../../models/user.model';
import { userCurrentService, userDataService } from '../../services/index.service';
import { checkUserLogged } from '../../utils/app.utils'; 
import { BaseComponent } from '../../components/base/base.component';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { ComponentName, ComponentConfig } from '../../types/components.types';
import { loadTemplate, getContainerApp, getHTMLElementById } from '../../utils/dom.utils';
import { APP_ID } from '../../config/routes.config';
import { COMPONENT_NAMES } from '../../config/components.config';
import { LOADING_PAGE_ERR } from '../../config/messages.config';

// ===========================================
// BASE PAGE
// ===========================================
/**
 * La classe de base des pages.
 * Contient les propriétés et les méthodes communes à toutes les pages de l'application.
 */
export abstract class BasePage {
	protected config: RouteConfig;
	protected container: HTMLElement;
	protected currentUser: User | null = null;
	protected currentUserAvatarURL: string | null = null;
	protected templatePath: string;
	protected components?: Partial<Record<ComponentName, ComponentConfig>>;
	protected componentInstances: Record<ComponentName | string, BaseComponent> = {};

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
		this.container = getContainerApp();
		this.currentUser = userCurrentService.getCurrentUser();
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

	// ===========================================
	// RENDER -> MODELE SUIVI PAR LES SOUS-CLASSES
	// ===========================================

	/**
	 * Méthode principale de rendu de la page.
	 * 
	 * - Vérifie les conditions de pré-rendering avant le montage de la page.
	 * - Charge le template HTML et l'injecte dans le conteneur.
	 * - Exécute les étapes de pré-rendering avec `beforeMount()`.
	 * - Charge et rend les composants persistants - comme la navbar - si besoin.
	 * - Charge et rend les composants spécifiques à la page.
	 * - Exécute les opérations de montage spécifiques à la page (injection dynamique d'infos).
	 * - Attache les écouteurs d'événements nécessaires.
	 * - En cas d'erreur, affiche un message d'erreur dans le conteneur.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque le rendu est terminé.
	 */
	public async render(): Promise<void> {
		try {
			console.log(`[${this.constructor.name}] Début du rendu...`);

			await this.preRenderCheck();
			await this.loadTemplate();
			await this.beforeMount();
			await this.loadPersistentComponents();
			await this.loadSpecificComponents();
			await this.mount();
			this.attachListeners();

			console.log(`[${this.constructor.name}] Page montée, rendu terminé`);

		} catch (error) {
			console.error(`Erreur lors du rendu de ${this.constructor.name}: `, error);
			this.container.innerHTML = this.getErrorMessage();
		}
	}

	/**
	 * Procède aux vérifications nécessaires avant le montage de la page.
	 * 
	 * Vérifie que l'utilisateur est bien authentifié si la page est privée.
	 * Si oui, on récupère l'URL de son avatar.
	 * Si l'utilisateur n'est pas trouvé, une erreur est levée.
	 * Les sous-classes peuvent réutiliser cette méthode et ajouter leurs propres checks.
	 * Pour garder aussi celui-ci, ajouter super.preRenderCheck();
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les checks sont terminées.
	 */
	protected async preRenderCheck(): Promise<void> {
		checkUserLogged(this.config.isPublic);
		if (this.currentUser) {
			this.currentUserAvatarURL = await userDataService.getUserAvatarURL(this.currentUser);
		}
	}

	/**
	 * Charge le template HTML correspondant au chemin de template stocké
	 * dans la propriété templatePath de la page.
	 * 
	 * Si le template est déjà en cache, le récupère directement.
	 * Sinon, fetch le template et le stocke en cache.
	 * Injecte le contenu HTML dans le conteneur de la page.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque le template
	 * est chargé et injecté dans le conteneur.
	 */
	protected async loadTemplate(): Promise<void> {
		const html = await loadTemplate(this.templatePath);
		this.container.innerHTML = html;
		console.log(`[${this.constructor.name}] HTML injecté`);
	}

	/**
	 * Charge les composants persistants sur plusieurs pages (isPersistent = true)
	 * en bouclant sur la propriété components de la page.
	 * 
	 * Si un composant est déjà instancié dans la propriété instance
	 * de la configuration, met à jour la navigation en appelant la méthode
	 * setActiveLink() s'il s'agit de la navbar, puis le composant est simplement
	 * ajouté à la liste des composants de la page sans être recréé.
	 * 
	 * Sinon, fait appel à initPersistentComponent() pour créer
	 * l'instance du composant persistant et le charger et le rendre.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque
	 * tous les composants persistants sont chargés et rendus.
	 */
	protected async loadPersistentComponents(): Promise<void> {
		if (!this.components) {
			return;
		}
		for (const componentConfig of Object.values(this.components)) {
			if (!componentConfig || !this.isValidConfig(componentConfig)) {
				continue;
			}
			if (componentConfig.instance) {
				this.updateNavigation(componentConfig);
				this.addToComponentInstances(componentConfig.name, componentConfig.instance);
				console.log(`[${this.constructor.name}] Composant '${componentConfig.name}' maintenu sur la page`);
				continue;
			}
			await this.initPersistentComponent(componentConfig);
		};
	}
	
	/**
	 * Instancie et charge un composant persistant sur plusieurs pages.
	 * 
	 * Pour un composant persistant, crée une instance de la classe du composant
	 * avec la configuration de la page, la configuration du composant
	 * et le conteneur HTML correspondant,
	 * Appelle la méthode render() du composant.
	 * Stocke l'instance du composant dans la propriété componentInstances
	 * de la page avec le nom du composant comme clé.
	 * 
	 * @param {ComponentConfig} componentConfig La configuration du composant à charger.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque le composant est chargé et rendu.
	 */
	protected async initPersistentComponent(componentConfig: ComponentConfig): Promise<void> {
		const componentContainer = getHTMLElementById(componentConfig.containerId);
		const componentInstance = new componentConfig.componentConstructor(this.config, componentConfig, componentContainer);
		componentConfig.instance = componentInstance;
		this.addToComponentInstances(componentConfig.name, componentInstance);
		await componentInstance.render();
		
		console.log(`[${this.constructor.name}] Composant '${componentConfig.name}' généré`);
	}

	/**
	 * Vérifie si la configuration d'un composant est valide pour la page actuelle.
	 *
	 * La configuration est considérée comme valide si le type (persistant ou non) et
	 * la visibilité (publique ou privée) du composant correspondent aux attentes
	 * pour la page actuelle.
	 *
	 * @param {ComponentConfig} componentConfig La configuration du composant à vérifier.
	 * @param {boolean} [isPersistent=true] Indique si le composant est persistant sur plusieurs pages.
	 * @returns {boolean} Retourne true si la configuration du composant est valide, false sinon.
	 */
	protected isValidConfig(componentConfig: ComponentConfig, isPersistent: boolean = true): boolean {
		const isVisibilityMismatch = !this.shouldRenderComponent(componentConfig);
		const isTypeMismatch = isPersistent !== componentConfig.isPersistent;

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
	 * Retourne l'instance d'un composant par son nom.
	 *
	 * Cherche l'instance du composant enregistrée dans
	 * la propriété componentInstances de la page en utilisant le nom
	 * du composant comme clé.
	 * Si l'instance est trouvée, la retourne, sinon retourne undefined.
	 *
	 * @template T Le type de l'instance du composant attendue.
	 * @param {string} name Le nom du composant à retrouver.
	 * @returns {T | undefined} L'instance du composant trouvée, ou undefined si pas trouvée.
	 */
	protected getComponentInstance<T>(name: string): T | undefined {
		return this.componentInstances[name] as T;
	}

	/**
	 * Met à jour la navigation active sur la navbar.
	 *
	 * Appelée par loadPersistentComponents() pour mettre à jour la navigation
	 * active sur la navbar si elle est présente sur la page actuelle.
	 * La méthode setActiveLink() est appelée sur l'instance de la navbar
	 * en passant le pathname de la route actuelle en paramètre.
	 *
	 * @param {ComponentConfig} componentConfig La configuration du composant navbar.
	 */
	private updateNavigation(componentConfig: ComponentConfig): void {
		if (componentConfig.name === COMPONENT_NAMES.NAVBAR && componentConfig.instance instanceof NavbarComponent) {
			componentConfig.instance.setActiveLink(this.config.path);
		}
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
		console.log(`[${this.constructor.name}] Container principal #${APP_ID} nettoyé`);
		console.log(`[${this.constructor.name}] Nettoyage terminé`);
	}

	/**
	 * Nettoyage des composants de la page.
	 *
	 * Appel la méthode cleanup() de chaque instance de composant stockée dans
	 * componentInstances pour nettoyer les composants de la page, sauf si le
	 * composant est persistant et que la propriété destroy est à false.
	 * Les composants persistants sont alors maintenus sur la page.
	 */
	protected cleanupComponents(): void {
		if (this.components) {
			for (const instance of Object.values(this.componentInstances)) {
				if (instance.componentConfig.isPersistent
					&& instance.componentConfig.destroy === false) {
					continue;
				}
				instance.cleanup();
			}
		}
	}

	/**
	 * Retourne le message d'erreur à afficher si la page ne peut pas être rendue.
	 *
	 * @returns {string} Le message d'erreur sous forme de code HTML.
	 */
	protected getErrorMessage(): string {
		return `<div id="alert" class="alert-error">${LOADING_PAGE_ERR}</div>`;
	}
}