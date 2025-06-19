export class PageManager {
	private currentPage: { render: () => Promise<void>; cleanup?: () => Promise<void> } | null = null;

	/**
	 * Méthode principale pour afficher une nouvelle page.
	 * 
	 * - On ajoute une petite animation zoom-out / zoom-in au changement de page
	 * - On stocke la nouvelle page en cours dans currentPage.
	 * - On appelle la méthode render() qui doit être async - pour ne pas bloquer le fil 
	 *   principal du navigateur et faire tout le rendu HTML + logique).
	 * 
	 *  Méthode appelée par RouteManager.ts dans router.register(path) de chaque route.
	 */
	public async renderPage(page: { render: () => Promise<void>; cleanup?: () => Promise<void> }) {

		const app = document.getElementById('app');
		if (app) {
			app.classList.add('transition-transform', 'duration-200');
			app.classList.add('scale-90'); // dezoom léger
			await new Promise(resolve => setTimeout(resolve, 120));
		}

		await this.cleanup();

		if (app) {
			app.classList.remove('scale-90');
			app.classList.add('scale-100'); // zoom-in léger
			setTimeout(() => app.classList.remove('scale-100'), 200);
		}

		this.currentPage = page;
		await page.render();
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

	public hasCurrentPage(): boolean {
		return this.currentPage !== null;
	}
}