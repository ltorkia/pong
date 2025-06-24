import { BasePage } from './BaseView';

export class GamePage extends BasePage {

	constructor(container: HTMLElement) {
		// super() appelle le constructeur du parent BaseView
		// avec le container et le chemin du template HTML pour la page game
		super(container, '/templates/stats.html');
	}
}