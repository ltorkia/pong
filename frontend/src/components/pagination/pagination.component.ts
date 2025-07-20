// Pour hot reload Vite
import template from './pagination.component.html?raw'

import { BaseComponent } from '../base/base.component';
import { RouteConfig } from '../../types/routes.types';
import { ComponentConfig } from '../../types/components.types';
import { User } from '../../models/user.model';
import { getHTMLElementById } from '../../utils/dom.utils';
import { PaginationInfos, PaginationParams } from '../../shared/types/user.types';

// ===========================================
// PAGINATION COMPONENT
// ===========================================


export class PaginationComponent extends BaseComponent {
	protected user?: User | null = null;
	private paginationParams!: PaginationParams;
	private paginationInfos!: PaginationInfos;
	private onPageChange!: (page: number) => void;

	private paginationInfoElement!: HTMLElement;
	private paginationButtonsContainer!: HTMLElement;

	/**
	 * Constructeur du composant de pagination.
	 *
	 * Stocke la configuration de la route actuelle, la configuration du composant,
	 * le container HTML et l'utilisateur à afficher dans le composant.
	 *
	 * @param {RouteConfig} routeConfig La configuration de la route actuelle.
	 * @param {ComponentConfig} componentConfig La configuration du composant.
	 * @param {HTMLElement} container L'élément HTML qui sera utilisé comme conteneur pour le composant.
	 * @param {User | null} user L'utilisateur à afficher dans le composant (facultatif).
	 * @param {PaginationInfos | null} paginationInfos Informations de pagination (facultatif).
	 */
	constructor(routeConfig: RouteConfig, componentConfig: ComponentConfig, container: HTMLElement, user?: User | null, paginationParams?: PaginationParams) {
		super(routeConfig, componentConfig, container);
		this.user = user;
		this.paginationParams = paginationParams;
		this.paginationInfos = this.paginationParams.infos;
		this.onPageChange = this.paginationParams.onPageChange;
	}

	// ===========================================
	// METHODES OVERRIDES DE BASECOMPONENT
	// ===========================================

	/**
	 * Vérifie les préconditions avant le rendu du composant de pagination.
	 *
	 * Cette méthode surcharge `preRenderCheck` de BaseComponent pour effectuer
	 * des vérifications spécifiques au composant de pagination.
	 * Elle charge le template en mode développement.
	 *
	 * @throws {Error} Lance une erreur si aucun utilisateur n'est fourni.
	 */
	protected preRenderCheck(): void {
		super.preRenderCheck();
		this.loadTemplateDev();
	}

	/**
	 * Méthode de pré-rendering du composant de pagination.
	 *
	 * Stocke les éléments HTML utiles pour le fonctionnement du composant
	 * dans les propriétés de l'objet.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les éléments HTML ont été stockés.
	 */
	protected async beforeMount(): Promise<void> {
		this.paginationInfoElement = getHTMLElementById('pagination-info');
		this.paginationButtonsContainer = getHTMLElementById('pagination-buttons-container');
	}

	/**
	 * Méthode de montage du composant de la pagination.
	 *
	 * Met à jour le contenu visuel de la pagination.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout lorsque le composant est monté.
	 */
	protected async mount(): Promise<void> {
		if (!this.paginationInfos || !this.paginationParams) return;

		const { totalPages, currentPage, totalUsers } = this.paginationInfos;
		this.paginationInfoElement.textContent = `Page ${currentPage} / ${totalPages} - ${totalUsers} résultats`;
		this.paginationButtonsContainer.innerHTML = '';

		for (let i = 1; i <= totalPages; i++) {
			const button = document.createElement('button');
			button.textContent = i.toString();
			button.className = 'px-3 py-1 mx-1 border rounded hover:bg-cyan-600 hover:text-white transition';
			if (i === currentPage) {
				button.classList.add('bg-cyan-700', 'text-white', 'cursor-default');
				button.disabled = true;
			}
			button.addEventListener('click', () => this.handlePageClick(i));
			this.paginationButtonsContainer.appendChild(button);
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

	// ===========================================
	// LISTENER HANDLERS
	// ===========================================

	private handlePageClick = async (page: number): Promise<void> => {
		if (this.onPageChange) {
			this.onPageChange(page);
		}
	};
}