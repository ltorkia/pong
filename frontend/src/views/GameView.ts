import { BaseView } from './BaseView';
import { GameController } from '../controllers/GameController';

/**
 * TODO: Suggestion d'orga pour Kiki pour rester cohérent avec notre structure existante
 * GameView = vue principale basique pour injecter le template HTML, canvas + boutons dans le DOM
 * GameController = logique graphique et de rendu + poussée (canvas, animations, calculs, mouvements...)
 * GameManager = logique métier (WebSocket, communication serveur etc...)
 */
export class GameView extends BaseView {
	private gameController: GameController;

	constructor(container: HTMLElement) {
		// super() appelle le constructeur du parent BaseView
		// avec le container et le chemin du template HTML pour la page game
		super(container, '/templates/game.html');
		this.gameController = new GameController();
	}

	protected attachListeners(): void {
		// Exemple de listener sur bouton "Quit"
		const quitBtn = document.getElementById('quit-btn');
		if (!quitBtn) {
			console.error('Bouton Quit non trouvé');
			return;
		}
		quitBtn.addEventListener('click', async (event) => {
			event.preventDefault();
			// appelle la méthode quit du controller qui gère tout
			await this.gameController.quit();
		});
	}

	protected async mount(): Promise<void> {
		try {
			this.injectTemplate();
			this.initGame();
		} catch (err) {
			console.error('[GamePage] Erreur :', err);
		}
	}
	
	private injectTemplate(): void {
		const gameSection = document.getElementById('game-section') as HTMLTemplateElement;
		const template = document.getElementById('game-template') as HTMLTemplateElement;
		if (!gameSection || !template) {
			throw new Error('game-section ou game-template introuvable');
		}

		const clone = template.content.cloneNode(true) as DocumentFragment;
		gameSection.appendChild(clone);
	}

	private initGame(): void {
		const canvas = document.getElementById('pong-canvas');
		if (!canvas) {
			throw new Error('Canvas introuvable');
		}

		// Exemple de méthode appelée dans le controller pour démarrer le jeu
		this.gameController.start();
	}
}