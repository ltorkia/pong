import { userManager } from '../managers/UserManager';
import { User } from '../types/store.types';

export abstract class BaseComponent {
	protected currentUser: User | null = null;
	protected container: HTMLElement;
	protected componentPath: string;

	constructor(container: HTMLElement, componentPath: string) {
		this.container = container;
		this.componentPath = componentPath;
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
		this.beforeMount;

		// Charge et injecte le HTML, mount et attache les listeners.
		let html = await this.loadComponent();
		this.container.innerHTML = html;
		await this.mount();
		this.attachListeners();
	}

	/**
	 * Charge le html via fetch.
	 * Si une erreur arrive on renvoie un message d'erreur html.
	 */
	protected async loadComponent(): Promise<string> {
		try {
			const response = await fetch(this.componentPath);
			if (!response.ok) {
				throw new Error(`Erreur lors du chargement du component: ${response.statusText}`);
			}
			return await response.text();
		} catch (error) {
			console.error(`Erreur lors du chargement de ${this.componentPath}:`, error);
			return this.getErrorMessage();
		}
	}

	/**
	 * Charge le current user
	 */
	 // TODO: changer la logique pour injecter le user ??
	protected async loadUserData(): Promise<void> {
		try {
			this.currentUser = await userManager.loadOrRestoreUser();
			if (!this.currentUser || !this.currentUser.id) {
				return;
			}
		} catch (error) {
			console.error('Error loading user data:', error);
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