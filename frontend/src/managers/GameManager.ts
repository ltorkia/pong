import { GameController } from '../controllers/GameController'

export class GameManager {
	constructor(private controller: GameController) {}

	public stop(): void {
		// Arrêter communication serveur, websockets etc...
	}
}