import { BasePage } from './BasePage';

export class HomePage extends BasePage {

	constructor(container: HTMLElement) {
		// super() appelle le constructeur du parent BasePage
		// avec le container et le chemin du template HTML pour la page home
		super(container, '/templates/home.html');
	}
}