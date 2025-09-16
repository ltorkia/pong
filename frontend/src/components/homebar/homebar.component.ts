// Pour hot reload Vite
import template from './homebar.component.html?raw';

import { currentService, animationService } from '../../services/index.service';
import { BaseComponent } from '../base/base.component';
import { RouteConfig } from '../../types/routes.types';
import { ComponentConfig } from '../../types/components.types';

// ===========================================
// HOMEBAR COMPONENT
// ===========================================
/**
 * Composant de la barre de navigation en mode non connecté.
 */
export class HomebarComponent extends BaseComponent {
	public langSwitcher!: HTMLSelectElement;

	/**
	 * Constructeur du composant de la navbar.
	 *
	 * Stocke la configuration de la route actuelle, la configuration du composant,
	 * et le container HTML.
	 *
	 * @param {RouteConfig} routeConfig La configuration de la route actuelle.
	 * @param {ComponentConfig} componentConfig La configuration du composant.
	 * @param {HTMLElement} container L'élément HTML qui sera utilisé comme conteneur pour le composant.
	 */
	constructor(routeConfig: RouteConfig, componentConfig: ComponentConfig, container: HTMLElement) {
		super(routeConfig, componentConfig, container);
	}

	// ===========================================
	// METHODES OVERRIDES DE BASECOMPONENT
	// ===========================================

	/**
	 * Procède aux vérifications nécessaires avant le montage du composant.
	 *
	 * Exécute les vérifications de base de la classe parente (`BaseComponent`).
	 * Charge le template HTML du composant en mode développement via `loadTemplateDev()`.
	 *
	 * @returns {Promise<boolean>} Une promesse qui se résout lorsque les vérifications sont terminées.
	 */
	protected async preRenderCheck(): Promise<boolean> {
		if (!super.preRenderCheck())
			return false;
		await this.loadTemplateDev();
		return true;
	}

	// ===========================================
	// METHODES PUBLIC
	// ===========================================

	/**
	 * Animate la barre de navigation hors de l'écran.
	 * 
	 * - Définit la propriété "destroy" de la configuration du composant à true.
	 * - Définit la propriété "animateHomebarOut" du service d'animation à true.
	 * - Définit la propriété "animateNavbarIn" du service d'animation à true.
	 */
	public destroy(): void {
		if (currentService.getCurrentUser()) {
			this.componentConfig.destroy = true;
			animationService.animateHomebarOut = true;
			animationService.animateNavbarIn = true;
		}
	}

	// ===========================================
	// METHODES PRIVATES
	// ===========================================

	/**
	 * Charge le template HTML du composant en mode développement
	 * (hot-reload Vite).
	 *
	 * Si le hot-reload est actif (en mode développement), charge le
	 * template HTML du composant en remplaçant le contenu du conteneur
	 * par le template. Sinon, ne fait rien.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout lorsque le
	 * template est chargé et injecté dans le conteneur.
	 */
	private async loadTemplateDev(): Promise<void> {
		this.loadTemplate(template);
	}
}