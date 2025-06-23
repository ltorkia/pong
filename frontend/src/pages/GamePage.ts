import { BasePage } from './BasePage';
import { GameManager } from '../managers/GameManager';
import { GameController } from '../controllers/GameController';

/**
 * TODO: Suggestion d'orga pour Kiki pour rester cohérent avec notre structure
 * GamePage = vue principale pour injecter le canvas + boutons dans le DOM
 * GameController = logique graphique et de rendu (canvas, animations, mouvements...)
 * GameManager = logique métier (WebSocket, communication serveur...)
 */
export class GamePage extends BasePage {
	private manager: GameManager;
	private controller: GameController;

	constructor(container: HTMLElement) {
		// super() appelle le constructeur du parent BasePage
		// avec le container et le chemin du template HTML pour la page game
		super(container, '/templates/game.html');
		this.controller = new GameController();
		this.manager = new GameManager(this.controller);
		this.controller.setManager(this.manager);
	}

	protected attachListeners(): void {
		// Exemple listener sur bouton "Quit"
		const quitBtn = document.getElementById('quit-btn');
		if (!quitBtn) {
			console.error('Bouton Quit non trouvé');
			return;
		}
		quitBtn.addEventListener('click', async (event) => {
			event.preventDefault();
			// appelle la méthode quit qui gère tout
			await this.controller.quit();
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
		this.controller.start();
	}
}