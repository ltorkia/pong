import { BaseView } from '../BaseView';
import { userApi } from '../../api/user.api';

export class HomeView extends BaseView {
	private userId: number;

	constructor(container: HTMLElement, userId: number) {
		// super() appelle le constructeur du parent BaseView
		// avec le container et le chemin du template HTML pour la page home
		super(container, '/templates/user/home.html');
		this.userId = userId;
	}

	protected async mount(): Promise<void> {
		try {
			const user = await userApi.getUserById(this.userId);
			const avatar = document.querySelector('.avatar') as HTMLElement;
			const h1 = document.querySelector('.page-title') as HTMLElement;
			if (!h1 || !avatar || !user) return;

			Object.assign(avatar.style, {
				backgroundImage: `url('/img/avatars/${user.avatar}')`,
				backgroundSize: "cover",
				backgroundPosition: "center"
			});
			h1.textContent = `Hi ${user.username} !`;

		} catch (err) {
			console.error('Erreur lors de la récupération du user', err);
		}
	}
}