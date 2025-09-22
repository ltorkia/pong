// Pour hot reload Vite
import template from './translater.component.html?raw';

import { BaseComponent } from '../base/base.component';
import { RouteConfig } from '../../types/routes.types';
import { ComponentConfig } from '../../types/components.types';
import { getHTMLElementById } from '../../utils/dom.utils';
import { Locale, translateService } from '../../services/core/core.service';

// ===========================================
// TRANSLATER COMPONENT
// ===========================================
/**
 * Composant de traduction.
 *
 * Ce composant permet de traduire le contenu de l'application
 * en fonction de la langue sélectionnée.
 */
export class TranslaterComponent extends BaseComponent {
	public langSwitcher!: HTMLSelectElement;

	/**
	 * Constructeur du composant.
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
		const isPreRenderChecked = await super.preRenderCheck();
		if (!isPreRenderChecked)
			return false;
		await this.loadTemplateDev();
		return true;
	}

	/**
	 * Méthode de pré-rendering du composant.
	 * 
	 * Stocke les éléments HTML utiles pour le fonctionnement du composant
	 * dans les propriétés de l'objet.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les éléments HTML ont été stockés.
	 */
	protected async beforeMount(): Promise<void> {
		this.langSwitcher = this.container as HTMLSelectElement;
	}

	protected async mount(): Promise<void> {
		this.langSwitcher.value = translateService.getLocale();
	}

	/**
	 * Attribue les listeners.
	 */
	protected attachListeners(): void {
		this.langSwitcher.addEventListener('change', this.toggleLangMenu);
	}

	/**
	 * Enlève les listeners.
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

	// ===========================================
	// LISTENER HANDLERS
	// ===========================================

	/**
	 * Bascule la langue de l'application.
	 * 
	 * @param {Event} event L'événement de changement de langue.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque la langue est basculée.
	 */
	private toggleLangMenu = async (event: Event): Promise<void> => {
		const selectedLang = (event.target as HTMLSelectElement).value as Locale;
		console.log('Langue sélectionnée :', selectedLang);
		translateService.updateLanguage(selectedLang);
	}
}