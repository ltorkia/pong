import { BaseView } from '../BaseView';

export class HomeView extends BaseView {
	 // TODO: changer la logique pour injecter le user ??
	private userId: number;

	constructor(container: HTMLElement, userId: number) {
		// super() appelle le constructeur du parent BaseView
		// avec le container et le chemin du template HTML pour la page home
		super(container, '/templates/user/home.html');
		this.userId = userId;
	}

	protected async mount(): Promise<void> {
		try {
			this.loadAvatar();
			this.welcomeUser();

		} catch (err) {
			console.error('Erreur lors de la récupération du user', err);
		}
	}
	
	protected async beforeMount(): Promise<void> {
		// On load le current user.
		// Si introuvable on return pour catch une erreur qui sera affichée sur la page.
		await this.loadUserData();
		if (!this.currentUser) {
			return;
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