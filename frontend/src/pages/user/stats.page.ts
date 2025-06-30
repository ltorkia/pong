import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';

export class GamePage extends BasePage {

	constructor(config: RouteConfig) {
		// super() appelle le constructeur du parent BasePage
		// avec le container et le chemin du template HTML pour la page game
		super(config);
	}
}