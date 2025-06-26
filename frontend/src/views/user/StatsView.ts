import { BaseView } from '../BaseView';

export class GameView extends BaseView {

	constructor(container: HTMLElement) {
		// super() appelle le constructeur du parent BaseView
		// avec le container et le chemin du template HTML pour la page game
		super(container, '/templates/user/stats.html');
	}
}