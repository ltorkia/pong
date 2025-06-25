import { UserController } from '../controllers/UserController';
import { NavbarComponent } from '../components/common/NavbarComponent';

export abstract class BaseView {
	protected container: HTMLElement;				// Élément DOM dans lequel le contenu html sera injecté
	protected templatePath: string;					// Chemin vers le template html à charger pour cette page
	protected userController: UserController;		// Instance qui va gérer le parcourt d'authentification du current user
	protected navbarComponent?: NavbarComponent;	// Navbar component

	// Le constructeur reçoit le container DOM et le chemin du template
	constructor(container: HTMLElement, templatePath: string) {
		this.container = container;
		this.templatePath = templatePath;
		this.userController = new UserController();
	}

	/**
	 * Méthode principale de rendu.
	 */
	public async render(): Promise<void> {
		try {
			console.log(`${this.constructor.name}: Début du rendu...`);

			// Chargement asynchrone de la navbar en fonction du statut log utilisateur
			await this.loadNavbar();
			console.log(`${this.constructor.name}: Navbar générée`);

			// Chargement asynchrone du template html via fetch
			// + injection html dans la div #app
			const html = await this.loadTemplate();
			this.container.innerHTML = html;
			
			console.log(`${this.constructor.name}: HTML injecté`);

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
	 * Pour generer le contenu de la navbar en fonction de si on est log ou pas
	 */
	protected async loadNavbar(): Promise<void> {
		const navbarDiv = document.getElementById('navbar');
		if (navbarDiv) {
			this.navbarComponent = new NavbarComponent(navbarDiv, this.templatePath, this.userController);
			await this.navbarComponent.render();
		} else {
			console.warn('Container #navbar introuvable dans le DOM');
		}
	}

	/**
	 * Charge le template html via fetch.
	 * Si une erreur arrive on renvoie un message d'erreur html.
	 */
	protected async loadTemplate(): Promise<string> {
		try {
			const response = await fetch(this.templatePath);
			if (!response.ok) {
				throw new Error(`Erreur lors du chargement du template: ${response.statusText}`);
			}
			return await response.text();
		} catch (error) {
			console.error(`Erreur lors du chargement de ${this.templatePath}:`, error);
			return this.getErrorMessage();
		}
	}

	/**
	 * Méthode vide par défaut à surcharger dans les sous-classes
	 * pour attacher les eventListeners() spécifiques de chaque page.
	 */
	protected attachListeners(): void {}

	/**
	 * Méthode vide par défaut à surcharger dans les sous-classes
	 * pour generer les infos propres a chque page.
	 */
	protected async mount(): Promise<void> {}

	// Error message à afficher dans le catch de la méthode render()
	protected getErrorMessage(): string {
		return '<div id="alert">Erreur de chargement de la page.</div>';
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
}