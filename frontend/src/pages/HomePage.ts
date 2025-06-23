import { BasePage } from './BasePage';
import { getUserById } from '../api/users';

export class HomePage extends BasePage {
	private userId: number;

	constructor(container: HTMLElement, userId: number) {
		// super() appelle le constructeur du parent BasePage
		// avec le container et le chemin du template HTML pour la page home
		super(container, '/templates/home.html');
		this.userId = userId;
	}

	protected async mount(): Promise<void> {
		try {
			const user = await getUserById(this.userId);
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