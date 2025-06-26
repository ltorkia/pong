import { GameController } from '../controllers/GameController'

export class GameManager {
	private gameController: GameController;

	constructor(gameController: GameController) {
		this.gameController = gameController;
	}

	public stop(): void {
		// Arrêter communication serveur, websockets etc...
	}
}