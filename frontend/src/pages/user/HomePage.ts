import { BasePage } from '../BasePage';

export class HomePage extends BasePage {
	 // TODO: changer la logique pour injecter le user ??

	constructor(container: HTMLElement) {
		// super() appelle le constructeur du parent BasePage
		// avec le container et le chemin du template HTML pour la page home
		super(container, '/templates/user/home.html');
	}

	protected async mount(): Promise<void> {
		try {
			this.loadAvatar();
			this.welcomeUser();

		} catch (err) {
			console.error('Erreur lors de la récupération du user', err);
		}
	}

	private welcomeUser() {
		const h1 = this.container.querySelector('.page-title') as HTMLElement;
		if (this.currentUser && h1) {
			h1.textContent = `Hi ${this.currentUser.username} !`;
		}
	}

	private loadAvatar() {
		const avatar = this.container.querySelector('.avatar') as HTMLElement;
		if (this.currentUser && avatar) {
			Object.assign(avatar.style, {
				backgroundImage: `url('/img/avatars/${this.currentUser.avatar}')`,
				backgroundSize: "cover",
				backgroundPosition: "center"
			});
		}
	}
}