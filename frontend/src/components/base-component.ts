import { loadTemplate } from '../helpers/dom.helper';
import { User } from '../models/user.model';
import { UserController } from '../controllers/UserController';
import { RouteConfig } from '../types/routes.types';
import { ComponentConfig } from '../types/components.types';

export abstract class BaseComponent {
	protected routeConfig: RouteConfig;
	protected componentConfig: ComponentConfig;
	protected container: HTMLElement;
	protected user: User | null = null;
	protected currentUser: User | null = null;
	protected userController: UserController;
	protected templatePath: string;

	constructor(routeConfig: RouteConfig, componentConfig: ComponentConfig, container: HTMLElement, user: User | null, currentUser: User | null, userController: UserController) {
		this.routeConfig = routeConfig;
		this.componentConfig = componentConfig;
		this.container = container;
		this.user = user;
		this.currentUser = currentUser;
		this.userController = userController;
		this.templatePath = this.componentConfig.templatePath;
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

		// Charge et injecte le HTML.
		if (import.meta.env.PROD === true) {
			console.log(this.templatePath);
			// code exécuté uniquement en prod pour fetch les components
			// (hot reload Vite inactif)
			// En dev on importe directement le template dans le fichier
			// (voir NavbarComponent pour ex)
			let html = await loadTemplate(this.templatePath);
			this.container.innerHTML = html;
			// console.log(this.templatePath, this.container.innerHTML);
			console.log(`[${this.constructor.name}] Hot-reload inactif`);
		}

		// On genere les infos propres à chaque component
		// et on attach les event listeners
		await this.mount();
		this.attachListeners();
	}

	/**
	 * Nettoyage de la page: vide le container.
	 */
	protected async cleanup(): Promise<void> {
		if (this.container) {
			this.container.innerHTML = '';
		}
	}
}