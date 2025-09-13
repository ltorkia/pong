// Pour hot reload Vite
import template from './homebar.component.html?raw';

import { BaseComponent } from '../base/base.component';
import { RouteConfig } from '../../types/routes.types';
import { ComponentConfig } from '../../types/components.types';
import { getHTMLElementById } from '../../utils/dom.utils';

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

	/**
	 * Méthode de pré-rendering du composant de la navbar.
	 * 
	 * Stocke les éléments HTML utiles pour le fonctionnement du composant
	 * dans les propriétés de l'objet.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les éléments HTML ont été stockés.
	 */
	protected async beforeMount(): Promise<void> {
		this.langSwitcher = getHTMLElementById('languages', this.container) as HTMLSelectElement;
	}

	protected async mount(): Promise<void> {
		// this.langSwitcher.value = translateService.getLocale();
		this.addTranslaterComponent();
	}

	/**
	 * Attribue les listeners aux éléments de la navbar.
	 * 
	 * - Attribue un listener au lien de logo de la navbar.
	 * - Attribue un listener au bouton burger pour le menu mobile.
	 * - Attribue un listener aux liens de navigation.
	 * - Attribue un listener au bouton de déconnexion.
	 */
	protected attachListeners(): void {
		this.langSwitcher.addEventListener('change', this.toggleLangMenu);
	}

	/**
	 * Enlève les listeners attribués aux éléments de la navbar.
	 *
	 * - Enlève le listener au lien de logo de la navbar.
	 * - Enlève le listener du bouton burger pour le menu mobile.
	 * - Enlève le listener aux liens de navigation.
	 * - Enlève le listener du bouton de déconnexion.
	 */
	protected removeListeners(): void {
		this.langSwitcher.removeEventListener('change', this.toggleLangMenu);
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

	private addTranslaterComponent(): void {
		// const translaterContainer = getHTMLElementById('translater-container', this.container);
		// const translaterComponentConfig: ComponentConfig = {
		// 	name: 'translater',
		// 	destroy: false,
		// 	animateIn: false,
		// 	animateOut: false,
		// };
		// const translaterComponent = new (require('../translater/translater.component').TranslaterComponent)(
		// 	this.routeConfig,
		// 	translaterComponentConfig,
		// 	translaterContainer
		// );
	}
}