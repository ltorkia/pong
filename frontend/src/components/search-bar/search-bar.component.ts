// Pour hot reload Vite
import template from './search-bar.component.html?raw'

import { BaseComponent } from '../base/base.component';
import { RouteConfig } from '../../types/routes.types';
import { ComponentConfig } from '../../types/components.types';
import { getHTMLElementById } from '../../utils/dom.utils';

// ===========================================
// SEARCH BAR COMPONENT
// ===========================================

export class SearchBarComponent extends BaseComponent {
	private filtersToggle!: HTMLButtonElement;
	private filtersContainer!: HTMLDivElement;
	private filtersIcon!: SVGElement;
	private searchButton!: HTMLButtonElement;
	private searchInput!: HTMLInputElement;
	private statusFilter!: HTMLSelectElement;
	private levelFilter!: HTMLSelectElement;
	private regionFilter!: HTMLSelectElement;
	private friendsOnly!: HTMLInputElement;
	private verifiedOnly!: HTMLInputElement;
	private resetFilters!: HTMLButtonElement;

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
	 * Vérifie les préconditions avant le rendu du composant de ligne d'utilisateur.
	 *
	 * Cette méthode surcharge `preRenderCheck` de BaseComponent pour effectuer
	 * des vérifications spécifiques au composant de la barre de recherche.
	 * Elle charge le template en mode développement.
	 *
	 * @throws {Error} Lance une erreur si aucun utilisateur n'est fourni.
	 */
	protected preRenderCheck(): void {
		super.preRenderCheck();
		this.loadTemplateDev();
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
		// this.filtersIcon = getHTMLElementById('filters-icon', this.container) as unknown as SVGElement;
		this.filtersIcon = this.container.querySelector('.filters-icon') as SVGElement;

		// Gestion de la recherche et des filtres
		this.searchButton = getHTMLElementById('search-button', this.container) as HTMLButtonElement;
		this.searchInput = getHTMLElementById('search-input', this.container) as HTMLInputElement;
		this.statusFilter = getHTMLElementById('status-filter', this.container) as HTMLSelectElement;
		this.levelFilter = getHTMLElementById('level-filter', this.container) as HTMLSelectElement;
		this.regionFilter = getHTMLElementById('region-filter', this.container) as HTMLSelectElement;
		this.friendsOnly = getHTMLElementById('friends-only', this.container) as HTMLInputElement;
		this.verifiedOnly = getHTMLElementById('verified-only', this.container) as HTMLInputElement;
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
		[this.statusFilter, this.levelFilter, this.regionFilter].forEach(filter => {
			filter.addEventListener('change', this.performSearch);
		});
		[this.friendsOnly, this.verifiedOnly].forEach(checkbox => {
			checkbox.addEventListener('change', this.performSearch);
		});
		this.resetFilters.addEventListener('click', this.handleResetOnClick);
		this.searchButton.addEventListener('click', this.performSearch);
		this.searchInput.addEventListener('keypress', this.handleSearchInputKeypress);
	}

	/**
	 * Enlève les listeners.
	 */
	protected removeListeners(): void {
		this.filtersToggle.removeEventListener('click', this.handleFilterClick);
		[this.statusFilter, this.levelFilter, this.regionFilter].forEach(filter => {
			filter.removeEventListener('change', this.performSearch);
		});
		[this.friendsOnly, this.verifiedOnly].forEach(checkbox => {
			checkbox.removeEventListener('change', this.performSearch);	
		})
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
		this.loadTemplate(template);
	}

	// ===========================================
	// LISTENER HANDLERS
	// ===========================================

	private handleFilterClick = async (event: MouseEvent): Promise<void> => {
		event.preventDefault();
		const isHidden = this.filtersContainer.classList.contains('hidden');
		if (isHidden) {
			this.filtersContainer.classList.remove('hidden');
			this.filtersContainer.classList.add('show');
			this.filtersIcon.style.transform = 'rotate(180deg)';
		} else {
			this.filtersContainer.classList.add('hidden');
			this.filtersContainer.classList.remove('show');
			this.filtersIcon.style.transform = 'rotate(0deg)';
		}
	};

	private performSearch = async (event: Event): Promise<void> => {
		event.preventDefault();
		const searchTerm = this.searchInput.value;
		const status = this.statusFilter.value;
		const level = this.levelFilter.value;
		const region = this.regionFilter.value;
		const friendsChecked = this.friendsOnly.checked;
		const verifiedChecked = this.verifiedOnly.checked;

		console.log('Recherche avec les paramètres:', {
			searchTerm,
			status,
			level,
			region,
			friendsOnly: friendsChecked,
			verifiedOnly: verifiedChecked
		});
	}

	private handleSearchInputKeypress = async (event: KeyboardEvent): Promise<void> => {
		if (event.key === 'Enter') {
			this.performSearch(event);
		}
	}

	private handleResetOnClick = async (event: MouseEvent): Promise<void> => {
		event.preventDefault();
		this.searchInput.value = '';
		this.statusFilter.value = '';
		this.levelFilter.value = '';
		this.regionFilter.value = '';
		this.friendsOnly.checked = false;
		this.verifiedOnly.checked = false;
		this.performSearch(event);
	}
}