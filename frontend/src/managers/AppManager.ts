import { tsParticles } from "@tsparticles/engine";
import { loadFull } from "tsparticles";
import { ParticlesManager } from './ParticlesManager';
import { RouteManager } from './RouteManager';
import { PageManager } from './PageManager';
import { hasAuthCookie, loadOrRestoreUser } from '../controllers/UserController';
import { wait } from '../utils/helpers';

export class AppManager {
	private particlesManager: ParticlesManager;		// Gestionnaire des particules d'arrière-plan
	private routeManager: RouteManager;				// Gestionnaire des routes/navigation
	private pageManager: PageManager;				// Gestionnaire de rendu des pages

	constructor() {
		this.particlesManager = new ParticlesManager();
		this.pageManager = new PageManager();
		this.routeManager = new RouteManager(this.pageManager, this.particlesManager);
	}

	/**
	 * Méthode principale pour démarrer l'app.
	 * 
	 * - Charge ou restaure un utilisateur
	 * - Initialise le moteur tsParticles
	 * - Attend que le DOM soit prêt: wait (await new Promise())
	 * - Supprime la class Load sur le body qui empêche les transitions au refresh
	 * - Vérifie que le container principal #app existe dans le DOM
	 * - Charge les particules d'arrière-plan
	 * - Lance le RouteManager pour gérer la navigation et afficher la bonne page
	 */
	public async start(): Promise<void> {
		console.log('=== DEMARRAGE APP ===');
		await this.loadUser();
		await this.tsParticlesInit();
		await wait(100);
		document.body.classList.remove('load');
		
		const appDiv = document.getElementById('app');
		if (!appDiv) {
			console.error('Container #app introuvable dans le DOM');
			return;
		}
		
		console.log('Container #app trouvé:', appDiv);
		console.log('Pathname actuel:', location.pathname);
		
		await this.particlesManager.load();
		await this.routeManager.start();

		console.log('App démarrée');
	}

	/**
	 * Charge ou restaure un utilisateur à l'aide du cookie compagnon,
	 * le store, localStorage, et enfin l'api avec requête à /api/me
	 */
	private async loadUser(): Promise<void> {
		// Vérification rapide avec le cookie compagnon
		const authCookieIsActive = hasAuthCookie();
		if (authCookieIsActive) {
			console.log('[AppManager] Cookie auth_status présent, chargement utilisateur...');
			// Seulement dans ce cas on charge l'utilisateur
			// Cette fonction utilisera localStorage en priorité, puis API si nécessaire
			await loadOrRestoreUser();
			return;
		}
		// Si pas de cookie:
		console.log('[AppManager] Pas de cookie auth_status, démarrage sans utilisateur');
		// Pas besoin d'appeler loadOrRestoreUser(), on sait déjà qu'il n'y a pas d'utilisateur
		// Le router gérera les redirections si nécessaire
	}

	/**
	 * Initialise le moteur tsParticles avec toutes ses fonctionnalités.
	 * Cette méthode est appelée ue seule fois au démarrage de l'app.
	 * Doit être appelée avant toute utilisation de tsParticles.load().
	 */
	private async tsParticlesInit(): Promise<void> {
		try {
			await loadFull(tsParticles);
			console.log('tsParticles initialisé');
		} catch (error) {
			console.error('Error init tsParticles:', error);
		}
	}

	/**
	 * Permet d'accéder au router pour debug
	 */
	public getRouter() {
		return this.routeManager.getRouter();
	}
}