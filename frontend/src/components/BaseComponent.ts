import { userStore } from '../stores/UserStore';
import { UserModel } from '../types/user.types';
import { templateCache } from '../helpers/dom';

export abstract class BaseComponent {
	protected currentUser: UserModel | null = null;
	protected container: HTMLElement;
	protected componentPath: string;
	protected shouldRender: boolean = true;

	constructor(container: HTMLElement, componentPath: string) {
		this.container = container;
		this.componentPath = componentPath;
		this.currentUser = userStore.getCurrentUser();
	}

	/**
	 * Méthodes abstraites (abstract) qui doivent obligatoirement être définies chez les sous-classes
	 * ou méthodes de surcharge (protected) optionnellement remplies par les sous-classes.
	 */	
	protected async beforeMount(): Promise<void> {}
	protected abstract mount(): Promise<void>;
	protected attachListeners(): void {}

	/**
	 * Méthode principale de rendu.
	 */
	public async render(): Promise<void> {
		// Etapes avant de render
		// ex pour navbar: vérifier si on est sur une page publique ou privée...
		await this.beforeMount();

		// Flag qui indique si, après vérification spéciale, le component
		// doit se loader (ex: navbar sur page publique)
		if (!this.shouldRender) {
			await this.cleanup();
			return;
		}

		// Charge et injecte le HTML.
		if (import.meta.env.VITE_IS_DEV === 'false') {
			// code exécuté uniquement en prod pour fetch les components
			// (hot reload Vite inactif)
			// En dev on importe directement le template dans le fichier
			// (voir NavbarComponent pour ex)
			let html = await this.loadComponent();
			this.container.innerHTML = html;
			// console.log(this.componentPath, this.container.innerHTML);
			console.log('[UserRowComponent] Hot-reload inactif');
		}

		// On genere les infos propres à chaque component
		// et on attach les event listeners
		await this.mount();
		this.attachListeners();
	}

	/**
	 * Charge le html via fetch ou cache.
	 * Si une erreur arrive on renvoie un message html sur la page.
	 */
	protected async loadComponent(): Promise<string> {

		// On regarde d'abord si on n'a pas stocké le template en cache
		// pour éviter des requêtes réseau inutiles
		if (templateCache.has(this.componentPath)) {
			return templateCache.get(this.componentPath)!;
		}

		// Sinon on fetch le template
		try {
			const response = await fetch(this.componentPath);
			if (!response.ok) {
				throw new Error(`Erreur lors du chargement du component: ${response.statusText}`);
			}
			const html = await response.text();
			templateCache.set(this.componentPath, html);
			return html;

		} catch (error) {
			console.error(`Erreur lors du chargement de ${this.componentPath}:`, error);
			return this.getErrorMessage();
		}
	}

	/**
	 * Nettoyage de la page: vide le container.
	 */
	protected async cleanup(): Promise<void> {
		if (this.container) {
			this.container.innerHTML = '';
		}
	}

	// Error message à afficher dans le catch de la méthode render()
	protected getErrorMessage(): string {
		return '<div id="alert">Erreur de chargement du component.</div>';
	}
}