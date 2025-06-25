import { GameManager } from '../managers/GameManager';
import { router } from '../router/router';

export class GameController {
	private gameManager: GameManager;

	constructor() {
		this.gameManager = new GameManager(this);
	}

	public start(): void {
		// Démarrage du jeu, animations, etc.
	}

	async quit(): Promise<void> {
		if (!this.gameManager) {
			console.error('GameManager non défini dans GameController');
			return;
		}
		// Exemple de méthode pour gérer l'arrêt de la logique métier, WebSocket, timers etc...
		this.gameManager.stop();
	}
}