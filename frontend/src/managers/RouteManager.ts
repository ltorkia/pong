import { router } from '../router/router';
import { HomePage } from '../pages/HomePage';
import { RegisterPage } from '../pages/RegisterPage';
import { LoginPage } from '../pages/LoginPage';
import { GamePage } from '../pages/GamePage';
import { UsersPage } from '../pages/UsersPage';
import { ProfilePage } from '../pages/ProfilePage';
import { PageManager } from './PageManager';
import { ParticlesManager } from './ParticlesManager';

export class RouteManager {
	private pageManager: PageManager;
	private particlesManager: ParticlesManager;

	/**
	 * Constructeur de RouteManager.
	 * 
	 * Prend en paramètres:
	 * - pageManager pour gérer le rendu et le nettoyage des pages,
	 * - particlesManager pour gérer les effets visuels de particules.
	 * 
	 * - Initialise les routes en appelant setupRoutes() qui enregistre
	 * les différentes routes dans le router global (la map dans Router.ts).
	 */
	constructor(pageManager: PageManager, particlesManager: ParticlesManager) {
		this.pageManager = pageManager;
		this.particlesManager = particlesManager;
		this.setupRoutes();
	}
	
	/**
	 * Méthode publique pour démarrer la gestion des routes.
	 * 
	 * - Affiche dans la console la liste des routes enregistrées (utile pour debug)
	 * - Appelle router.handleLocationPublic() qui va lire l’URL courante
	 *   et déclencher le rendu de la page correspondante.
	 * 
	 * Cette méthode est appelée par AppManager lors du démarrage de l’application.
	 */
	public async start() {
		console.log('Routes enregistrées:', Array.from(router.getRoutes().keys()));
		await router.handleLocationPublic();
	}

	/**
	 * Méthode privée pour enregistrer toutes les routes utilisées dans l’application.
	 * 
	 * Pour chaque route :
	 * - On utilise router.register() pour associer un chemin (ex: '/login') 
	 *   à une fonction asynchrone qui :
	 *     - Nettoie la page actuelle avec pageManager.cleanup()
	 *     - Cherche la div principale (#app) dans le DOM
	 *     - Active ou désactive les particules via particlesManager
	 *     - Crée une instance de la page correspondante (HomePage, LoginPage, etc.)
	 *     - Appelle loadPage() pour gérer les particules
	 *       et demande au pageManager de rendre la nouvelle page via renderPage()
	 *     - Met à jour le lien actif dans la barre de navigation avec setActiveLink()
	 *     - Mount la page si nécessaire (ex: UsersPage)
	 */
	private setupRoutes() {

		// Route Accueil
		router.register('/', async () => {
			console.log('Exec route: navigation vers Accueil');
			const appDiv = document.getElementById('app') as HTMLElement | null;
			if (!appDiv) {
				console.error("div #app introuvable");
				return;
			}
			console.log('div #app trouvée, création HomePage');
			const homePage = new HomePage(appDiv) as HomePage;
			await this.loadPage(homePage, true);
			this.setActiveLink('/');
			console.log('HomePage rendue');
		});

		// Route Register
		router.register('/register', async () => {
			console.log('Exec route: navigation vers Register');
			const appDiv = document.getElementById('app') as HTMLElement | null;
			if (!appDiv) {
				console.error("div #app introuvable");
				return;
			}
			console.log('div #app trouvée, création RegisterPage');
			const registerPage = new RegisterPage(appDiv) as RegisterPage;
			await this.loadPage(registerPage, true);
			this.setActiveLink('/register');
			console.log('RegisterPage rendue');
		});

		// Route Login
		router.register('/login', async () => {
			console.log('Exec route: navigation vers Login');
			const appDiv = document.getElementById('app') as HTMLElement | null;
			if (!appDiv) {
				console.error("div #app introuvable");
				return;
			}
			console.log('div #app trouvée, création LoginPage');
			const loginPage = new LoginPage(appDiv) as LoginPage;
			await this.loadPage(loginPage, true);
			this.setActiveLink('/login');
			console.log('LoginPage rendue');
		});

		// Route Game
		router.register('/game', async () => {
			console.log('Exec route: navigation vers Game');
			const appDiv = document.getElementById('app') as HTMLElement | null;
			if (!appDiv) {
				console.error("div #app introuvable");
				return;
			}
			console.log('div #app trouvée, création GamePage');
			const gamePage = new GamePage(appDiv) as GamePage;
			await this.loadPage(gamePage, false);
			this.setActiveLink('/game');
			console.log('GamePage rendue');
		});

		// Route Users
		router.register('/users', async () => {
			console.log('Exec route: navigation vers Users');
			const appDiv = document.getElementById('app') as HTMLElement | null;
			if (!appDiv) {
				console.error("div #app introuvable");
				return;
			}
			console.log('div #app trouvée, création UsersPage');
			const usersPage = new UsersPage(appDiv) as UsersPage;
			await this.loadPage(usersPage, true);
			this.setActiveLink('/users');
			console.log('UsersPage rendue');
		});

		// Route Profile
		router.register('/users/:id', async (params?: Record<string, string>) => {
			if (!params?.id) {
				console.error("Params manquants pour la route /users/:id");
				return;
			}
			console.log(`Exec route: navigation vers Profile de l'utilisateur ${params.id}`);
			const appDiv = document.getElementById('app');
			if (!appDiv) {
				console.error("div #app introuvable");
				return;
			}
			console.log('div #app trouvée, création ProfilePage');
			const profilePage = new ProfilePage(appDiv, Number(params.id));
			await this.loadPage(profilePage, true);
			this.setActiveLink(`/users`);
			console.log('ProfilePage rendue');
		});

	}

	/**
	 * Nettoie la page courante,
	 * active ou désactive les particules,
	 * charge et affiche une nouvelle page.
	*/
	private async loadPage(pageInstance: any, enableParticles: boolean): Promise<void> {
		const appDiv = document.getElementById('app') as HTMLElement | null;
		if (!appDiv) {
			console.error("div #app introuvable");
			return;
		}
		await this.pageManager.cleanup();

		if (enableParticles) {
			await this.particlesManager.enable();
		} else {
			await this.particlesManager.disable();
		}

		await this.pageManager.renderPage(pageInstance);
	}

	/**
	 * Met à jour la navigation active dans le header.
	 * 
	 * - Sélectionne tous les liens avec l'attribut data-link.
	 * - Supprime la classe active de tous les liens.
	 * - Compare leur pathname avec celui passé en paramètre.
	 * - Ajoute la classe active au lien correspondant.
	 * 
	 * Permet de styliser le lien actif dans la navbar.
	 */
	public setActiveLink(pathname: string): void {
		const navLinks = document.querySelectorAll('.navbar-links a[data-link]') as NodeListOf<HTMLElement>;
		navLinks.forEach(link => {
			const anchor = link as HTMLAnchorElement;
			anchor.classList.remove('active');
			const linkPath = new URL(anchor.href).pathname;
			if (linkPath === pathname) {
				anchor.classList.add('active');
			}
		});
	}

	/**
	 * Getter public pour récupérer le router.
	 * Utile pour le debug ou pour des interactions directes avec le router
	 * depuis d'autres classes comme AppManager.
	 */
	public getRouter() {
		return router;
	}
}