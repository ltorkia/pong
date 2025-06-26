import { userStore } from '../stores/UserStore';
import { UserController } from '../controllers/UserController';
import { User } from '../models/User';
import { NavbarComponent } from '../components/common/navbar/NavbarComponent';
import { templateCache } from '../helpers/dom';

export abstract class BasePage {
	protected currentUser: User | null = null;
	protected container: HTMLElement;				// Élément DOM dans lequel le contenu html sera injecté
	protected templatePath: string;					// Chemin vers le template html à charger pour cette page
	protected userController: UserController;		// Instance qui va gérer le parcourt d'authentification du current user
	protected navbarComponent?: NavbarComponent;	// Navbar component

	// Le constructeur reçoit le container DOM et le chemin du template
	constructor(container: HTMLElement, templatePath: string) {
		this.container = container;
		this.templatePath = templatePath;
		this.userController = new UserController();
		this.currentUser = userStore.getCurrentUser();
	}

	/**
	 * Méthodes de surcharge (protected) optionnellement remplies par les sous-classes.
	 */	
	protected async beforeMount(): Promise<void> {}
	protected async mount(): Promise<void> {}
	protected attachListeners(): void {}

	/**
	 * Méthode principale de rendu.
	 */
	public async render(): Promise<void> {
		try {
			console.log(`${this.constructor.name}: Début du rendu...`);

			await this.beforeMount();

			// Chargement asynchrone du template html via fetch
			// + injection html dans la div #app
			const html = await this.loadTemplate();
			this.container.innerHTML = html;
			
			console.log(`${this.constructor.name}: HTML injecté`);

			// Génère les components relatifs à la page
			// (ici navbar selon le statut log du user)
			await this.loadComponents();

			// On genere les infos propres a chaque page
			await this.mount();
			console.log(`${this.constructor.name}: Page montée, rendu terminé`);
			
			// On attache les listeners relatifs à la page (ex gestion de clic LOGIN pour gérer la logique de connexion)
			this.attachListeners();
			console.log(`${this.constructor.name}: Listeners attachés`);

		} catch (error) {
			// En cas d'erreur (ex fetch qui échoue) afficher un message d'erreur dans le container
			console.error(`Erreur lors du rendu de ${this.constructor.name}:`, error);
			this.container.innerHTML = this.getErrorMessage();
		}
	}

	/**
	 * Génère les components relatifs à la page
	 */
	protected async loadComponents(): Promise<void> {
		await this.loadNavbar();
	}

	/**
	 * Nouvelle instance de NavbarComponent
	 * S'affiche en fonction du statut log utilisateur
	 */
	protected async loadNavbar(): Promise<void> {
		const navbarDiv = document.getElementById('navbar');
		if (navbarDiv) {
			this.navbarComponent = new NavbarComponent(navbarDiv, this.templatePath, this.userController, this.currentUser);
			await this.navbarComponent.render();
			console.log(`${this.constructor.name}: Navbar générée`);
		} else {
			console.warn('Container #navbar introuvable dans le DOM');
		}
	}

	/**
	 * Charge le template html via fetch ou cache.
	 * Si une erreur arrive on renvoie un message html sur la page.
	 */
	protected async loadTemplate(): Promise<string> {

		// On regarde d'abord si on n'a pas stocké le template en cache
		// pour éviter des requêtes réseau inutiles
		if (templateCache.has(this.templatePath)) {
			return templateCache.get(this.templatePath)!;
		}

		// Sinon on fetch le template
		try {
			const response = await fetch(this.templatePath);
			if (!response.ok) {
				throw new Error(`Erreur lors du chargement du template: ${response.statusText}`);
			}
			const html = await response.text();
			templateCache.set(this.templatePath, html);
			return html;

		} catch (error) {
			console.error(`Erreur lors du chargement de ${this.templatePath}:`, error);
			return this.getErrorMessage();
		}
	}

	/**
	 * Nettoyage de la page: vide le container #app.
	 * Appelée dans PageManager.ts avant de rendre une nouvelle page.
	 */
	public async cleanup(): Promise<void> {
		console.log(`${this.constructor.name}: Nettoyage...`);
		this.container.innerHTML = '';
		console.log(`${this.constructor.name}: Nettoyage terminé`);
	}

	// Error message à afficher dans le catch de la méthode render()
	protected getErrorMessage(): string {
		return '<div id="alert">Erreur de chargement de la page.</div>';
	}
}