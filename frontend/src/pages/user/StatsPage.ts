import { BasePage } from '../BasePage';

export class GamePage extends BasePage {

	constructor(container: HTMLElement) {
		// super() appelle le constructeur du parent BasePage
		// avec le container et le chemin du template HTML pour la page game
		super(container, '/templates/user/stats.html');
	}
}