import { BasePage } from '../BasePage';
import { RouteConfig } from '../../types/routes.types';
import { User } from '../../models/user.model';

export class GamePage extends BasePage {

	constructor(config: RouteConfig, container: HTMLElement, currentUser: User | null) {
		// super() appelle le constructeur du parent BasePage
		// avec le container et le chemin du template HTML pour la page game
		super(config, container, currentUser);
	}
}