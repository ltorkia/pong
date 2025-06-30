import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';
import { getHTMLElementByClass } from '../../utils/dom.utils';

export class HomePage extends BasePage {

	constructor(config: RouteConfig) {
		// super() appelle le constructeur du parent BasePage
		// avec le container et le chemin du template HTML pour la page home
		super(config);
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