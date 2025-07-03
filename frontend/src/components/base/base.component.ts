import { User } from '../../models/user.model';
import { userStore } from '../../stores/user.store';
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
	protected container: HTMLElement;
	protected templatePath: string;
	protected currentUser: User | null = null;

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
		this.currentUser = userStore.getCurrentUser();
	}

	/**
	 * Méthodes abstraites (abstract) qui doivent obligatoirement être définies chez les sous-classes
	 * ou méthodes de surcharge (protected) optionnellement remplies par les sous-classes.
	 */	

	protected async beforeMount(): Promise<void> {}
	protected abstract mount(): Promise<void>;
	protected attachListeners(): void {}
	protected removeListeners(): void {}

	/**
	 * Méthode principale de rendu d'un composant.
	 *
	 * Exécute les étapes suivantes:
	 * 1. Appelle la méthode `beforeMount()` pour effectuer les étapes de pré-rendering.
	 * 2. Charge le HTML du composant via `loadTemplate()` si le hot-reload est inactif (en production).
	 *    Si le template est en cache, on ne le fetch pas.
	 * 3. Injecte le HTML dans le conteneur du composant.
	 * 4. Appelle la méthode `mount()` pour effectuer les opérations de rendu propres au composant.
	 * 5. Appelle la méthode `attachListeners()` pour attacher les event listeners.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout lorsque le composant est entièrement rendu.
	 */
	public async render(): Promise<void> {
		await this.beforeMount();
		if (import.meta.env.PROD === true) {
			console.log(this.templatePath);
			let html = await loadTemplate(this.templatePath);
			this.container.innerHTML = html;
			console.log(`[${this.constructor.name}] Hot-reload inactif`);
		}
		await this.mount();
		this.attachListeners();
	}

	/**
	 * Vérifie qu'un utilisateur est bien authentifié si la page est privée.
	 *
	 * Si la page est privée, cette méthode vérifie que l'utilisateur est
	 * bien authentifié en vérifiant l'existence de l'utilisateur courant.
	 * Si l'utilisateur n'est pas trouvé, une erreur est levée.
	 */
	protected checkUserLogged(): void {
		if (!this.routeConfig.isPublic && !this.currentUser) {
			throw new Error(`La récupération du user a échoué`);
		}
	}

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
			this.removeListeners();
			this.container.replaceChildren();
			console.log(`[${this.constructor.name}] Container #${this.componentConfig.containerId} nettoyé`);
		}
	}
}