import { getUserById } from '../api/users';

export abstract class BasePage {
	protected container: HTMLElement;	// Élément DOM dans lequel le contenu html sera injecté
	protected templatePath: string;		// Chemin vers le template html à charger pour cette page

	// Le constructeur reçoit le container DOM et le chemin du template
	constructor(container: HTMLElement, templatePath: string) {
		this.container = container;
		this.templatePath = templatePath;
	}

	/**
	 * Méthode principale de rendu.
	 * On charge le template, on l'injecte dans le container (div #app),
	 * et on attache les listeners spécifiques.
	 */
	public async render(): Promise<void> {
		try {
			console.log(`${this.constructor.name}: Début du rendu...`);

			// Chargement asynchrone de la navbar en fonction du statut log utilisateur
			this.generateNavbar();
			console.log(`${this.constructor.name}: Navbar générée`);

			// Chargement asynchrone du template html via fetch
			// + injection html dans la div #app
			const html = await this.loadTemplate(this.templatePath);
			this.container.innerHTML = html;
			
			console.log(`${this.constructor.name}: HTML injecté`);

			// On attache les listeners relatifs à la page (ex gestion de clic LOGIN pour gérer la logique de connexion)
			this.attachListeners();
			console.log(`${this.constructor.name}: Listeners attachés`);

			// On genere les infos propres a chaque page
			await this.mount();
			console.log(`${this.constructor.name}: Page montée`);

			console.log(`${this.constructor.name}: Rendu terminé`);
			
		} catch (error) {
			// En cas d'erreur (ex fetch qui échoue) afficher un message d'erreur dans le container
			console.error(`Erreur lors du rendu de ${this.constructor.name}:`, error);
			this.container.innerHTML = this.getErrorMessage();
		}
	}

	/**
	 * Pour generer le contenu de la navbar en fonction de si on est log ou pas
	 */
	protected async generateNavbar(): Promise<void> {
		// const res = await fetch('/api/me');
		// const data = await res.json();
		const navbar = document.getElementById('navbar');
		// let navbarPath;

		// if (data && res.ok && data.loggedIn) {
		// 	navbarPath = '/templates/navbar-logged.html';
		// }

		if (this.templatePath !== '/templates/login.html'
			&& this.templatePath !== '/templates/register.html') {
			let navbarPath = '/templates/navbar.html';
			const html = await this.loadTemplate(navbarPath);
			navbar!.innerHTML = html;

			// Personnalisation du lien profil avec l'ID utilisateur
			try {
				// const user = await getUserById(1);
				const profileLink = document.querySelector('[data-link][href="/profile"]') as HTMLAnchorElement;
				// if (profileLink && user?.id) {
				// 	profileLink.href = `/users/${user.id}`;
				// } else {
				// 	console.warn("Lien non trouvé ou user.id manquant");
				// }
				profileLink.href = `/user/1`;
			} catch (e) {
				console.warn("Impossible d'ajuster le lien profil : ", e);
			}
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