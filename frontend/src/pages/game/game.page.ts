import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';

/**
 * TODO: Suggestion d'orga pour cohérence avec structure actuelle
 * GamePage = vue principale basique pour injecter le template HTML, canvas + boutons dans le DOM
 * GameController = logique graphique et de rendu + poussée (canvas, animations, calculs, mouvements...)
 * GameManager = logique métier (WebSocket, communication serveur etc...)
 */
export class GamePage extends BasePage {

	constructor(config: RouteConfig) {
		// super() appelle le constructeur du parent BasePage
		// avec le container et le chemin du template HTML pour la page game
		super(config);
	}

	protected async mount(): Promise<void> {}

	protected attachListeners(): void {}
}