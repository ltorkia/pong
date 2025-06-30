// ROUTER + SERVICES
import { Router } from '../router/router';
import { userService, routingService, particlesService } from './services';

// PARTICLES
import { loadFull } from "tsparticles";
import { tsParticles } from "@tsparticles/engine";

// UTILS
import { wait } from '../utils/app.utils';
import { getHTMLElementById } from '../utils/dom.utils';

// ===========================================
// GAME SERVICE
// ===========================================
/**
 * Service principal de l'application.
 *
 * Cette classe gère le cycle de vie principal de l'application,
 * incluant l'initialisation des services et la configuration
 * de l'interface utilisateur.
 */
export class AppService {

	/**
	 * Démarre l'application.
	 * 
	 * - Charge le moteur tsParticles
	 * - Attend que le DOM soit prêt
	 * - Supprime la classe 'load' sur le body qui empêche les transitions au refresh
	 * - Vérifie que le container principal #app existe dans le DOM
	 * - Charge les particules d'arrière-plan
	 * - Lance le routingService pour gérer la navigation et afficher la bonne page
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque tsParticles est initialisé.
	 */
	public async start(): Promise<void> {
		console.log('=== DEMARRAGE APP ===');
		// await userService.loadUser();
		await this.tsParticlesInit();
		await wait(100);
		document.body.classList.remove('load');
		console.log(`[${this.constructor.name}] Pathname actuel:`, location.pathname);
		
		await particlesService.load();
		await routingService.start();

		console.log('App démarrée');
	}

	/**
	 * Initialise le moteur tsParticles avec toutes ses fonctionnalités.
	 * 
	 * Cette méthode est appelée une seule fois au démarrage de l'app.
	 * Doit être appelée avant toute utilisation de tsParticles.load().
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque tsParticles est initialisé.
	 */
	private async tsParticlesInit(): Promise<void> {
		try {
			await loadFull(tsParticles);
			console.log(`[${this.constructor.name}] tsParticles initialisé`);
		} catch (error) {
			console.error(`[${this.constructor.name}] Error init tsParticles:`, error);
		}
	}

	/**
	 * Permet d'accéder au router pour le debug, les tests, etc.
	 * 
	 * @returns {Router} Le router de l'application.
	 */
	public getRouter(): Router {
		return routingService.getRouter();
	}
}