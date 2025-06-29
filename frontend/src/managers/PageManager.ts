import { getHTMLElementById } from '../helpers/dom.helper';
import { uiStore } from '../stores/ui-store';
import { HTMLContainers } from '../config/constants';

export class PageManager {
	private currentPage: { render: () => Promise<void>; cleanup?: () => Promise<void> } | null = null;

	/**
	 * Méthode principale pour afficher une nouvelle page.
	 * 
	 * - On ajoute une petite animation zoom-out / zoom-in au changement de page
	 *  + transition navbar (slide-up / slide-down) à la connexion / déconnexion.
	 * - On stocke la nouvelle page en cours dans currentPage.
	 * - On appelle la méthode render() qui doit être async - pour ne pas bloquer le fil 
	 *   principal du navigateur et faire tout le rendu HTML + logique).
	 * 
	 *  Méthode appelée par RouteManager.ts dans router.register(path) de chaque route.
	 */
	public async renderPage(page: { render: () => Promise<void>; cleanup?: () => Promise<void> }) {

		const appDiv = getHTMLElementById(HTMLContainers.appId);
		await this.pageTransitionOut(appDiv);

		const navbarDiv = getHTMLElementById(HTMLContainers.navbarId);
		if (uiStore.animateNavbar === true) {
			await this.navbarTransitionOut(navbarDiv);
		}

		await this.cleanup();
		this.currentPage = page;

		await this.pageTransitionIn(appDiv);
		await this.currentPage.render();

		if (uiStore.animateNavbar === true) {
			await this.navbarTransitionIn(navbarDiv);
		}
	}

	/**
	 * Transitions page au changement de page:
	 * - entrée -> zoom-in léger
	 * - sortie -> zoom-out léger
	 */
	private async pageTransitionIn(container: HTMLElement): Promise<void> {
		container.classList.remove('scale-90');
		container.classList.add('scale-100');
		setTimeout(() => container.classList.remove('scale-100'), 300);
	}
	private async pageTransitionOut(container: HTMLElement): Promise<void> {
		container.classList.add('scale-90');
		setTimeout(() => container.classList.remove('scale-90'), 300);
		await new Promise(resolve => setTimeout(resolve, 120));
	}

	/**
	 * Transitions navbar au changement de page:
	 * - entrée -> slide-down
	 * - sortie -> slide-up
	 */
	private async navbarTransitionIn(container: HTMLElement): Promise<void> {
		// Entrée navbar (slide down)
		container.classList.remove('-translate-y-[--navbar-height]');
		container.classList.add('translate-y-0');
		setTimeout(() => container.classList.remove('translate-y-0'), 300);
		uiStore.animateNavbar = false;
	}
	private async navbarTransitionOut(container: HTMLElement): Promise<void> {
		container.classList.remove('translate-y-0');
		container.classList.add('-translate-y-[--navbar-height]');
		setTimeout(() => container.classList.remove('-translate-y-[--navbar-height]'), 300);
		await new Promise(resolve => setTimeout(resolve, 200));
	}

	/**
	 * Nettoie la page courante avant de charger une nouvelle page.
	 * 
	 * - Si la page courante a une méthode cleanup() dans BasePage.ts
	 *   on l'appelle pour libérer ressources, listeners etc
	 * - et vider le contenu du container DOM #app pour repartir à zéro.
	 * 
	 *  Méthode appelée par RouteManager.ts avant le rendu de chaque page.
	 */
	public async cleanup() {
		if (this.currentPage && typeof this.currentPage.cleanup === 'function') {
			await this.currentPage.cleanup();
		}
		this.currentPage = null;
	}
	
	public getCurrentPage() {
		return this.currentPage;
	}
}