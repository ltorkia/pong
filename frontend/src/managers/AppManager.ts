import { tsParticles } from "@tsparticles/engine";
import { loadFull } from "tsparticles";
import { ParticlesManager } from './ParticlesManager';
import { RouteManager } from './RouteManager';
import { PageManager } from './PageManager';

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
	 * - Initialise le moteur tsParticles
	 * - Attend que le DOM soit prêt: await new Promise();
	 * - Vérifie que le container principal #app existe dans le DOM
	 * - Charge les particules d'arrière-plan
	 * - Lance le RouteManager pour gérer la navigation et afficher la bonne page
	 */
	public async start() {
		console.log('=== DEMARRAGE APP ===');
		await this.tsParticlesInit();
		await new Promise(resolve => setTimeout(resolve, 100));
		
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
	 * Initialise le moteur tsParticles avec toutes ses fonctionnalités.
	 * Cette méthode est appelée ue seule fois au démarrage de l'app.
	 * Doit être appelée avant toute utilisation de tsParticles.load().
	 */
	private async tsParticlesInit() {
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