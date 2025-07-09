import { particlesService } from '../services';
import { uiStore } from '../../stores/ui.store';
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
	 * @param {RouteConfig} config - Configuration de la page.
	 * @param {PageInstance} page - Instance de la page à afficher.
	 */
	public async renderPage(config: RouteConfig, page: PageInstance): Promise<void> {

		this.toggleParticles(config);
		const appDiv = getHTMLElementById(APP_ID);
		const navbarDiv = getHTMLElementById(HTML_COMPONENT_CONTAINERS.NAVBAR_ID);
		await this.pageTransitionOut(appDiv);
		if (uiStore.animateNavbarOut === true) {
			await this.navbarTransitionOut(navbarDiv);
			uiStore.animateNavbarOut = false;
		}
		await this.cleanup();
		this.currentPage = page;
		await this.pageTransitionIn(appDiv);
		await this.currentPage.render();
		if (uiStore.animateNavbarIn === true) {
			await this.navbarTransitionIn(navbarDiv);
			uiStore.animateNavbarIn = false;
		}
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
	 * Transition de la page vers l'entrée.
	 * 
	 * - Retire la classe 'scale-90' pour annuler le zoom-out.
	 * - Ajoute la classe 'scale-100' pour appliquer le zoom-in.
	 * - Retire la classe 'scale-100' après 300ms.
	 * 
	 * @param {HTMLElement} container - Élément HTML à transitionner.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque la transition est terminée.
	 */
	private async pageTransitionIn(container: HTMLElement): Promise<void> {
		container.classList.remove('scale-90');
		container.classList.add('scale-100');
		setTimeout(() => container.classList.remove('scale-100'), 300);
	}

	/**
	 * Transition de la page vers la sortie.
	 * 
	 * - Ajoute la classe 'scale-90' pour appliquer le zoom-out.
	 * - Retire la classe 'scale-90' après 300ms.
	 * - Attend 120ms pour que la transition soit terminée avant de continuer.
	 * 
	 * @param {HTMLElement} container - Élément HTML à transitionner.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque la transition est terminée.
	 */
	private async pageTransitionOut(container: HTMLElement): Promise<void> {
		container.classList.add('scale-90');
		setTimeout(() => container.classList.remove('scale-90'), 300);
		await new Promise(resolve => setTimeout(resolve, 120));
	}

	/**
	 * Transition de la navbar de la position cachée vers la position visible.
	 * 
	 * - Retire la classe '-translate-y-[--navbar-height]' pour annuler la translation vers le haut.
	 * - Ajoute la classe 'translate-y-0' pour appliquer la translation vers le bas.
	 * - Retire la classe 'translate-y-0' après 300ms.
	 * 
	 * @param {HTMLElement} container - Élément HTML de la navbar à transitionner.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque la transition est terminée.
	 */
	private async navbarTransitionIn(container: HTMLElement): Promise<void> {
		container.classList.remove('-translate-y-[--navbar-height]');
		container.classList.add('translate-y-0');
		setTimeout(() => container.classList.remove('translate-y-0'), 300);
	}
	
	/**
	 * Transition de la navbar de la position visible vers la position cachée.
	 *
	 * - Retire la classe 'translate-y-0' pour annuler la translation vers le bas.
	 * - Ajoute la classe '-translate-y-[--navbar-height]' pour appliquer la translation vers le haut.
	 * - Retire la classe '-translate-y-[--navbar-height]' après 300ms.
	 * - Attend 200ms pour que la transition soit terminée avant de continuer.
	 *
	 * @param {HTMLElement} container - Élément HTML de la navbar à transitionner.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque la transition est terminée.
	 */	
	private async navbarTransitionOut(container: HTMLElement): Promise<void> {
		container.classList.remove('translate-y-0');
		container.classList.add('-translate-y-[--navbar-height]');
		setTimeout(() => container.classList.remove('-translate-y-[--navbar-height]'), 300);
		await new Promise(resolve => setTimeout(resolve, 200));
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

