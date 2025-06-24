import { shouldShowNavbar, setupNavbar } from '../controllers/NavbarController';
import { UserController } from '../controllers/UserController';

export abstract class BasePage {
	protected container: HTMLElement;			// Élément DOM dans lequel le contenu html sera injecté
	protected templatePath: string;				// Chemin vers le template html à charger pour cette page
	protected userController: UserController;	// Instance qui va gérer le parcourt d'authentification du current user

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
			await this.generateNavbar();
			console.log(`${this.constructor.name}: Navbar générée`);

			// Chargement asynchrone du template html via fetch
			// + injection html dans la div #app
			const html = await this.loadTemplate(this.templatePath);
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

	protected async beforeMount(): Promise<void> {

		// Chargement asynchrone de la navbar en fonction du statut log utilisateur
		await this.generateNavbar();
		console.log(`${this.constructor.name}: Navbar générée`);

		// Chargement asynchrone du template html via fetch
		// + injection html dans la div #app
		const html = await this.loadTemplate(this.templatePath);
		this.container.innerHTML = html;
		
		console.log(`${this.constructor.name}: HTML injecté`);

		// On attache les listeners relatifs à la page (ex gestion de clic LOGIN pour gérer la logique de connexion)
		this.attachListeners();
		console.log(`${this.constructor.name}: Listeners attachés`);
	}

	/**
	 * Pour generer le contenu de la navbar en fonction de si on est log ou pas
	 */
	protected async generateNavbar(): Promise<void> {

		// On return si on est sur une page publique (login / register = pas de navbar)
		// et on clean la navbar pour qu'elle ne reste pas sur la prochaine page
		const navbar = document.getElementById('navbar');
		const showNavbar = shouldShowNavbar(this.templatePath);
		if (!showNavbar) {
			if (navbar) navbar.innerHTML = '';
			return;
		}

		// On ajoute un margin à la balise 'main' qui correspond à ola hauteur de la navbar
		const main = document.querySelector('main');
		if (main) {
			main.classList.add('mt-main');
		}

		// Injection de la navbar
		const navbarPath = '/templates/navbar.html';
		const htmlNavbar = await this.loadTemplate(navbarPath);
		navbar!.innerHTML = htmlNavbar;

		try {
			// Personnalisation de la navbar (lien profil avec l'ID utilisateur, notifs ?)
			await setupNavbar();
			
			// Listener sur le bouton logout
			await this.listenLogout();
			
		} catch (e) {
			console.warn("Impossible de générer la navbar : ", e);
		}
	}

	/**
	 * Listener sur le bouton logout de la navbar
	 */
	protected async listenLogout(): Promise<void> {
		const logoutLink = document.querySelector('a[href="/logout"]');
		if (logoutLink) {
			logoutLink.addEventListener('click', async (e) => {
				e.preventDefault();
				await this.userController.logoutController();
			});
		}
	}

	/**
	 * Charge le template html via fetch.
	 * Si une erreur arrive on renvoie un message d'erreur html.
	 */
	protected async loadTemplate(templatePath: string): Promise<string> {
		try {
			const response = await fetch(templatePath);
			if (!response.ok) {
				throw new Error(`Erreur lors du chargement du template: ${response.statusText}`);
			}
			return await response.text();
		} catch (error) {
			console.error(`Erreur lors du chargement de ${templatePath}:`, error);
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
		return '<p>Erreur de chargement de la page.</p>';
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