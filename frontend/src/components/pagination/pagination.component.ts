// Pour hot reload Vite
import template from './pagination.component.html?raw'

import { BaseComponent } from '../base/base.component';
import { RouteConfig } from '../../types/routes.types';
import { ComponentConfig, PaginationParams } from '../../types/components.types';
import { User } from '../../shared/models/user.model';
import { getHTMLElementById } from '../../utils/dom.utils';
import { PaginationInfos } from '../../shared/types/user.types';

// ===========================================
// PAGINATION COMPONENT
// ===========================================


export class PaginationComponent extends BaseComponent {
	protected user?: User | null = null;
	private paginationParams?: PaginationParams;
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
		if (this.paginationParams) {
			this.paginationInfos = this.paginationParams.infos;
			this.onPageChange = this.paginationParams.onPageChange;
		}
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

		if (totalPages <= 1) return;

		this.renderPaginationButtons();
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

	/**
	 * Génère et affiche tous les boutons de pagination avec une logique avancée.
	 */
	private renderPaginationButtons(): void {
		const { totalPages, currentPage, hasPreviousPage, hasNextPage } = this.paginationInfos;

		// Bouton Précédent
		if (hasPreviousPage) {
			this.createPaginationButton('‹ Previous', currentPage - 1, 'prev-btn');
		}

		// Logique d'affichage des pages
		const pages = this.calculateVisiblePages(currentPage, totalPages);
		
		pages.forEach((page, index) => {
			if (page === '...') {
				this.createEllipsis();
			} else {
				this.createPaginationButton(
					page.toString(), 
					page as number, 
					page === currentPage ? 'current-page' : 'page-btn'
				);
			}
		});

		// Bouton Suivant
		if (hasNextPage) {
			this.createPaginationButton('Next ›', currentPage + 1, 'next-btn');
		}
	}

	/**
	 * Calcule les pages à afficher selon une logique intelligente.
	 * 
	 * @param {number} currentPage La page courante
	 * @param {number} totalPages Le nombre total de pages
	 * @returns {Array<number | string>} Un tableau contenant les numéros de pages et les ellipses
	 */
	private calculateVisiblePages(currentPage: number, totalPages: number): Array<number | string> {
		const pages: Array<number | string> = [];
		const maxVisiblePages = 5; // Nombre maximum de boutons de page visibles

		if (totalPages <= maxVisiblePages) {
			// Si peu de pages, afficher toutes les pages
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			// Toujours afficher la première page
			pages.push(1);

			if (currentPage <= 3) {
				// Début : 1, 2, 3, 4, ..., dernière
				for (let i = 2; i <= 4; i++) {
					pages.push(i);
				}
				if (totalPages > 4) {
					pages.push('...');
					pages.push(totalPages);
				}
			} else if (currentPage >= totalPages - 2) {
				// Fin : 1, ..., avant-avant-dernière, avant-dernière, dernière
				pages.push('...');
				for (let i = totalPages - 3; i <= totalPages; i++) {
					if (i > 1) {
						pages.push(i);
					}
				}
			} else {
				// Milieu : 1, ..., précédente, courante, suivante, ..., dernière
				pages.push('...');
				for (let i = currentPage - 1; i <= currentPage + 1; i++) {
					pages.push(i);
				}
				pages.push('...');
				pages.push(totalPages);
			}
		}

		return pages;
	}

	/**
	 * Crée un bouton de pagination.
	 * 
	 * @param {string} text Le texte à afficher sur le bouton
	 * @param {number} page Le numéro de page associé au bouton
	 * @param {string} type Le type de bouton pour le styling
	 */
	private createPaginationButton(text: string, page: number, type: string): void {
		const button = document.createElement('button');
		button.textContent = text;
		button.className = this.getButtonClasses(type);
		
		if (type === 'current-page') {
			button.disabled = true;
		}
		
		button.addEventListener('click', () => this.handlePageClick(page));
		this.paginationButtonsContainer.appendChild(button);
	}

	/**
	 * Crée un élément ellipsis (...) non cliquable.
	 */
	private createEllipsis(): void {
		const ellipsis = document.createElement('span');
		ellipsis.textContent = '...';
		ellipsis.className = 'px-3 py-1 mx-1 text-gray-500 cursor-default';
		this.paginationButtonsContainer.appendChild(ellipsis);
	}

	/**
	 * Retourne les classes CSS appropriées selon le type de bouton.
	 * 
	 * @param {string} type Le type de bouton
	 * @returns {string} Les classes CSS à appliquer
	 */
	private getButtonClasses(type: string): string {
		const baseClasses = 'px-3 py-1 mx-1 border rounded transition duration-200';
		
		switch (type) {
			case 'current-page':
				return `${baseClasses} bg-cyan-700 text-white cursor-default border-cyan-700`;
			case 'prev-btn':
			case 'next-btn':
				return `${baseClasses} bg-gray-100 hover:bg-cyan-600 hover:text-white hover:border-cyan-600 border-gray-300`;
			case 'page-btn':
			default:
				return `${baseClasses} bg-white hover:bg-cyan-600 hover:text-white hover:border-cyan-600 border-gray-300`;
		}
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