import { attachHomePageListeners } from '../controllers/HomePageController';

export class HomePage {
	private container: HTMLElement;

	constructor(container: HTMLElement) {
		this.container = container;
	}

	public async render(): Promise<void> {
		try {
			const response = await fetch('/templates/home.html');
			if (!response.ok) {
				throw new Error(`Erreur lors du chargement du template: ${response.statusText}`);
			}
			const html = await response.text();
			this.container.innerHTML = html;
			attachHomePageListeners();
		} catch (error) {
			console.error('Erreur lors du rendu de la page:', error);
			this.container.innerHTML = '<p>Erreur de chargement de la page.</p>';
		}
	}
}
