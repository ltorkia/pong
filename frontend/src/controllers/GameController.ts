import { GameManager } from '../managers/GameManager';
import { router } from '../router/router';

export class GameController {
	private manager?: GameManager;

	public setManager(manager: GameManager): void {
		this.manager = manager;
	}

	public start(): void {
		// Démarrage du jeu, animations, etc.
	}

	async quit(): Promise<void> {
		if (!this.manager) {
			console.error('GameManager non défini dans GameController');
			return;
		}
		// Exemple de méthode pour gérer l'arrêt de la logique métier, WebSocket, timers etc...
		this.manager.stop();
		// Méthode existante dans router pour rediriger vers la page d’accueil
		router.navigate('/');
	}
}