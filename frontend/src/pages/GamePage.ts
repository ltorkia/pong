import { BasePage } from './BasePage';

export class GamePage extends BasePage {
    // private gameController: GameController;

	constructor(container: HTMLElement) {
		// super() appelle le constructeur du parent BasePage
		// avec le container et le chemin du template HTML pour la page game
		super(container, '/templates/game.html');
        // this.gameController = new GameController();
	}

	protected attachListeners(): void {
		// Listener pour le bouton de démarrage du jeu
		const startButton = document.getElementById('start-game') as HTMLAnchorElement | null;
		if (startButton) {
			startButton.addEventListener('click', () => {
				// Logique de démarrage du jeu dans une méthode de GameController dans le dossier controller ?
			});
		}
	}
}