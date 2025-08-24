import { User } from '../../shared/models/user.model';
import { router } from '../../router/router';
import { DEFAULT_ROUTE } from '../../config/routes.config';
import { currentService } from '../../services/index.service';
import { checkUserLogged } from '../../utils/app.utils'; 
import { RouteConfig } from '../../types/routes.types';
import { ComponentConfig } from '../../types/components.types';
import { loadTemplate } from '../../utils/dom.utils';

// ===========================================
// BASE COMPONENT
// ===========================================
/**
 * Classe de base pour les composants.
 *
 * Les composants sont des éléments de l'interface utilisateur qui peuvent être
 * injectés dans des éléments HTML pour ajouter des fonctionnalités ou des
 * contenus dynamiques.
 *
 * La classe BaseComponent fournit un ensemble de méthodes et de propriétés
 * communes à tous les composants. Les composants doivent hériter de cette
 * classe pour bénéficier de ces fonctionnalités.
 */
export abstract class BaseComponent {
	protected routeConfig: RouteConfig;
	public componentConfig: ComponentConfig;
	public container: HTMLElement;
	protected templatePath: string;
	protected currentUser: User | null = null;
	protected removeListenersFlag: boolean = true;

	/**
	 * Constructeur de la classe BaseComponent.
	 *
	 * @param {ComponentConfig} componentConfig Les informations de configuration du composant.
	 * @param {HTMLElement} container L'élément HTML qui sera utilisé comme conteneur pour le composant.
	 *
	 * Au moment de la construction, le composant va charger le template HTML depuis
	 * le chemin indiqué dans la configuration du composant et le stocker dans la propriété
	 * `templatePath`.
	 */
	constructor(routeConfig: RouteConfig, componentConfig: ComponentConfig, container: HTMLElement) {
		this.componentConfig = componentConfig;
		this.container = container;
		this.templatePath = this.componentConfig.templatePath;
		this.routeConfig = routeConfig;
		this.currentUser = currentService.getCurrentUser();
	}

	/**
	 * Méthodes abstraites (abstract) qui doivent obligatoirement être définies chez les sous-classes
	 * ou méthodes de surcharge (protected) optionnellement remplies par les sous-classes.
	 */	

	protected async beforeMount(): Promise<void> {}
	protected async mount(): Promise<void> {}
	protected attachListeners(): void {}
	protected removeListeners(): void {}

	// ===========================================
	// RENDER -> MODELE SUIVI PAR LES SOUS-CLASSES
	// ===========================================

	/**
	 * Méthode principale de rendu d'un composant.
	 *
	 * Exécute les étapes suivantes:
	 * 1. Vérifie les conditions de pré-rendering avant le montage du composant.
	 * 2. Charge le HTML du composant via `loadTemplate()`.
	 * 3. Appelle `beforeMount()` pour effectuer les étapes de pré-rendering.
	 * 4. Injecte le HTML dans le conteneur du composant.
	 * 5. Appelle `mount()` pour effectuer les opérations de rendu propres au composant (injection dynamique d'infos).
	 * 6. Attache les écouteurs d'événements nécessaires.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout lorsque le composant est entièrement rendu.
	 */
	public async render(): Promise<void> {
		if (!await this.preRenderCheck()) {
			this.removeListenersFlag = false;
			await router.redirect(DEFAULT_ROUTE);
			return;
		};
		await this.loadTemplate();
		await this.beforeMount();
		await this.mount();
		this.attachListeners();
	}

	// ===========================================
	// METHODES PROTECTED
	// ===========================================

	/**
	 * Procède aux vérifications nécessaires avant le montage du composant.
	 * 
	 * Vérifie que l'utilisateur est bien authentifié si la page est privée.
	 * Si l'utilisateur n'est pas trouvé, une erreur est levée.
	 * Les sous-classes peuvent réutiliser cette méthode et ajouter leurs propres checks.
	 * Pour garder aussi celui-ci, ajouter super.preRenderCheck();
	 * 
	 * @returns {Promise<boolean>} Une promesse qui se résout lorsque les checks sont terminées et validés.
	 */
	protected async preRenderCheck(): Promise<boolean> {
		if (!checkUserLogged(this.componentConfig.isPublic))
			return false;
		return true;
	}

	/**
	 * Charge le template HTML du composant.
	 *
	 * Si le hot-reload est inactif (en production), fetch le template HTML
	 * depuis le chemin de template stocké dans la propriété `templatePath`
	 * ou récupère le template HTML en cache.
	 * Sinon, injecte le template HTML?raw fourni en paramètre dans le conteneur
	 * pour permettre le hot-reload avec Vite.
	 *
	 * @param {string} [template=''] Le template HTML à injecter.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque le template est injecté.
	 */
	protected async loadTemplate(template: string = ''): Promise<void> {
		if (import.meta.env.PROD === true && template === '') {
			let html = await loadTemplate(this.templatePath);
			this.container.innerHTML = html;
			console.log(`[${this.constructor.name}] Hot-reload inactif`);
		}
		if (import.meta.env.DEV === true && template !== '') {
			this.container.innerHTML = template;
			console.log(`[${this.constructor.name}] Hot-reload actif`);
		}
	}

	// ===========================================
	// METHODES PUBLICS
	// ===========================================

	/**
	 * Nettoyage du composant:
	 * - Réinitialise la configuration du composant s'il est persistant.
	 * - Désactive les écouteurs d'événements (removeListeners).
	 * - Vide le container.
	 *
	 * Utilisé par la méthode `cleanup()` de la classe `BasePage`
	 * pour nettoyer les composants de la page avant de la quitter.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque le nettoyage est terminé.
	 */
	public async cleanup(): Promise<void> {
		if (this.container) {
			if (this.componentConfig.isPersistent) {
				this.componentConfig.destroy = false;
				this.componentConfig.instance = undefined;
			}
			if (this.removeListenersFlag)
				this.removeListeners();
			this.container.replaceChildren();
			console.log(`[${this.constructor.name}] Container #${this.componentConfig.containerId} nettoyé`);
		}
	}
}