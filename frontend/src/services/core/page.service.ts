import { particlesService } from '../index.service';
import { animationService } from '../index.service';
import { getHTMLElementById } from '../../utils/dom.utils';
import { APP_ID } from '../../config/routes.config';
import { RouteConfig, PageInstance } from '../../types/routes.types';
import { HTML_COMPONENT_CONTAINERS } from '../../config/components.config';

// ===========================================
// PAGE SERVICE
// ===========================================
/**
 * Service central chargé du rendu des pages.
 * 
 * - Gère le cycle de vie complet d'une page: nettoyage, transition, rendu.
 * - Applique les effets visuels (animations de page, transitions navbar).
 * - Active ou désactive dynamiquement les particules selon la configuration de la route.
 * - Garde une référence à la page actuellement affichée (currentPage).
 */
export class PageService {

	/**
	 * Référence à la page actuellement affichée.
	 * 
	 * - Stocke l'instance de la page visible pour permettre son nettoyage
	 *   et sa transition lorsque nécessaire.
	 * - Initialisée à null, elle est mise à jour lors du rendu d'une nouvelle page.
	 */
	private currentPage: PageInstance | null = null;

	/**
	 * Rendu d'une nouvelle page.
	 * 
	 * - Gère la transition de la page actuelle vers la nouvelle page.
	 * - Gère la transition de la navbar (disparait à la déconnexion
	 *   et apparait à la connexion après redirection).
	 * - Active ou désactive les particules de fond en fonction de la config de la page.
	 * - Nettoie l'ancienne page.
	 * - Stocke la nouvelle page en cours dans currentPage.
	 * - Appelle la méthode render() de la page pour l'affichage.
	 * 
	 * @param {PageInstance} page - Instance de la page à afficher.
	 */
	public async renderPage(page: PageInstance): Promise<void> {

		this.toggleParticles(page.config);
		const appDiv = getHTMLElementById(APP_ID);
		const navbarDiv = getHTMLElementById(HTML_COMPONENT_CONTAINERS.NAVBAR_ID);
		await animationService.pageTransitionOut(appDiv);
		await this.checkNavbarAnimationIn(navbarDiv);
		await this.cleanup();
		this.currentPage = page;
		await animationService.pageTransitionIn(appDiv);
		await this.currentPage.render();
		await this.checkNavbarAnimationOut(navbarDiv);
	}

	/**
	 * Active ou désactive les particules de fond en fonction de la config de la page.
	 * 
	 * Si le champ 'enableParticles' de la config est à true, active les particules,
	 * sinon les désactive.
	 * 
	 * @param {RouteConfig} config - Configuration de la page.
	 */
	private async toggleParticles(config: RouteConfig) {
		if (config.enableParticles) {
			await particlesService.enable();
		} else {
			await particlesService.disable();
		}
	}

	/**
	 * Vérifie si une animation de transition de la navbar vers la sortie est en cours.
	 * Si c'est le cas, attend que l'animation soit terminée, puis annule l'animation.
	 * 
	 * @param {HTMLElement} container - Élément HTML de la navbar.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque l'animation est terminée.
	 */
	private async checkNavbarAnimationIn(container: HTMLElement): Promise<void> {
		if (animationService.animateNavbarOut === true) {
			await animationService.navbarTransitionOut(container);
			animationService.animateNavbarOut = false;
		}
	}
	
	/**
	 * Transition de la navbar de la position visible vers la position cachée.
	 *
	 * Si animateNavbarIn est à true, on lance la transition de la navbar
	 * vers la position cachée.
	 * 
	 * @param {HTMLElement} container - Élément HTML de la navbar à transitionner.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque la transition est terminée.
	 */
	private async checkNavbarAnimationOut(container: HTMLElement): Promise<void> {
		if (animationService.animateNavbarIn === true) {
			await animationService.navbarTransitionIn(container);
			animationService.animateNavbarIn = false;
		}
	}

	/**
	 * Nettoie la page courante et ses composants avant de charger une nouvelle page.
	 * 
	 * - Si la page courante a une méthode cleanup() dans base.page.ts
	 *   on l'appelle pour libérer ressources, listeners etc
	 * - et vider le contenu du container DOM #app pour repartir à zéro.
	 * 
	 *  Méthode appelée par routing.service.ts avant le rendu de chaque page.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque la page est nettoyée.
	 */
	public async cleanup(): Promise<void> {
		if (this.currentPage && typeof this.currentPage.cleanup === 'function') {
			await this.currentPage.cleanup();
		}
		this.currentPage = null;
	}

	/**
	 * Retourne la page courante (instance de Page) ou null si pas de page courante.
	 *
	 * @returns {PageInstance | null} La page courante ou null.
	 */
	public getCurrentPage(): PageInstance | null {
		return this.currentPage;
	}
}

