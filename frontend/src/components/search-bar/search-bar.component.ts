// Pour hot reload Vite
import template from './search-bar.component.html?raw'

import { BaseComponent } from '../base/base.component';
import { RouteConfig } from '../../types/routes.types';
import { ComponentConfig } from '../../types/components.types';
import { getHTMLElementById, getHTMLElementByTagName, toggleClass } from '../../utils/dom.utils';
import { SearchParams } from '../../shared/types/user.types';

// ===========================================
// SEARCH BAR COMPONENT
// ===========================================

export class SearchBarComponent extends BaseComponent {
	private filtersToggle!: HTMLButtonElement;
	private filtersContainer!: HTMLDivElement;
	private filtersIcon!: HTMLElement;
	private searchButton!: HTMLButtonElement;
	private searchInput!: HTMLInputElement;
	private statusFilter!: HTMLSelectElement;
	// private levelFilter!: HTMLSelectElement;
	private friendsOnly!: HTMLInputElement;
	private resetFilters!: HTMLButtonElement;
	private isResetSearch: boolean = false;

	/**
	 * Constructeur du composant de la barre de recherche.
	 *
	 * Stocke la configuration de la route actuelle, la configuration du composant,
	 * le container HTML et l'utilisateur à afficher dans le composant.
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
	 * Méthode de pré-rendering.
	 *
	 * Stocke les éléments HTML utiles pour le fonctionnement du composant
	 * dans les propriétés de l'objet.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les éléments HTML ont été stockés.
	 */
	protected async beforeMount(): Promise<void> {
		// Gestion de l'affichage des filtres
		this.filtersToggle = getHTMLElementById('filters-toggle', this.container) as HTMLButtonElement;
		this.filtersContainer = getHTMLElementById('filters-container', this.container) as HTMLDivElement;
		this.filtersIcon = getHTMLElementByTagName('i', this.filtersToggle) as HTMLElement;

		// Gestion de la recherche et des filtres
		this.searchButton = getHTMLElementById('search-button', this.container) as HTMLButtonElement;
		this.searchInput = getHTMLElementById('search-input', this.container) as HTMLInputElement;
		this.statusFilter = getHTMLElementById('status-filter', this.container) as HTMLSelectElement;
		// this.levelFilter = getHTMLElementById('level-filter', this.container) as HTMLSelectElement;
		this.friendsOnly = getHTMLElementById('friends-only', this.container) as HTMLInputElement;
		this.resetFilters = getHTMLElementById('reset-filters', this.container) as HTMLButtonElement;
	}

	protected async mount(): Promise<void> {

	}

	/**
	 * Attribue les listeners.
	 * 
	 * - Attribue un listener au bloc avatar/username pour rediriger vers le profil.
	 */
	protected attachListeners(): void {
		this.filtersToggle.addEventListener('click', this.handleFilterClick);
		[this.friendsOnly].forEach(checkbox => {
			checkbox.addEventListener('change', this.performSearch);
		});
		this.statusFilter.addEventListener('change', this.performSearch);
		this.resetFilters.addEventListener('click', this.handleResetOnClick);
		this.searchButton.addEventListener('click', this.performSearch);
		this.searchInput.addEventListener('keypress', this.handleSearchInputKeypress);
	}

	/**
	 * Enlève les listeners.
	 */
	protected removeListeners(): void {
		this.filtersToggle.removeEventListener('click', this.handleFilterClick);
		[this.friendsOnly].forEach(checkbox => {
			checkbox.removeEventListener('change', this.performSearch);	
		})
		this.statusFilter.removeEventListener('change', this.performSearch);
		this.resetFilters.removeEventListener('click', this.handleResetOnClick);
		this.searchButton.removeEventListener('click', this.performSearch);
		this.searchInput.removeEventListener('keypress', this.handleSearchInputKeypress);
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
		await this.loadTemplate(template);
	}

	// ===========================================
	// LISTENER HANDLERS
	// ===========================================

	private handleFilterClick = async (event: MouseEvent): Promise<void> => {
		event.preventDefault();
		toggleClass(this.filtersContainer, 'hidden', 'show');
		toggleClass(this.filtersIcon, 'fa-angle-down', 'fa-angle-up');
	};

	private performSearch = async (event: Event): Promise<void> => {
		event.preventDefault();

		const target = event.currentTarget as HTMLElement;
		this.isResetSearch = 
			target === this.statusFilter || 
			target === this.resetFilters || 
			target === this.searchInput ||
			target === this.searchButton ||
			target === this.friendsOnly;

		if (!this.isResetSearch && !this.searchInput.value 
			&& !this.statusFilter.value && !this.friendsOnly.checked)
			return;
		const params: SearchParams = {
			searchTerm: this.searchInput.value,
			status: this.statusFilter.value,
			friendsOnly: this.friendsOnly.checked
		};
		this.container.dispatchEvent(
			new CustomEvent('search', { detail: params })
		);
	}

	private handleSearchInputKeypress = async (event: KeyboardEvent): Promise<void> => {
		if (event.key === 'Enter') {
			this.performSearch(event);
		}
	}

	private handleResetOnClick = async (event: MouseEvent): Promise<void> => {
		event.preventDefault();
		if (!this.searchInput.value && !this.statusFilter.value && !this.friendsOnly.checked)
			return;
		this.searchInput.value = '';
		this.statusFilter.value = '';
		// this.levelFilter.value = '';
		this.friendsOnly.checked = false;
		this.performSearch(event);
	}
}