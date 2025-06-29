import { BasePage } from '../BasePage';
import { RouteConfig } from '../../types/routes.types';
import { User } from '../../models/user.model';
import { getHTMLElementByClass } from '../../helpers/dom.helper';

export class HomePage extends BasePage {

	constructor(config: RouteConfig, container: HTMLElement, currentUser: User | null) {
		// super() appelle le constructeur du parent BasePage
		// avec le container et le chemin du template HTML pour la page home
		super(config, container, currentUser);
	}

	protected async mount(): Promise<void> {
		this.loadAvatar();
		this.welcomeUser();
	}

	private welcomeUser() {
		const h1 = getHTMLElementByClass('page-title');
		if (this.currentUser && h1) {
			h1.textContent = `Hi ${this.currentUser.username} !`;
		}
	}

	private loadAvatar() {
		const avatar = getHTMLElementByClass('avatar');
		Object.assign(avatar.style, {
			backgroundImage: `url('/img/avatars/${this.currentUser!.avatar}')`,
			backgroundSize: "cover",
			backgroundPosition: "center"
		});
	}
}