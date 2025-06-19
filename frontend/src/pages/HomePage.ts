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
			const h1 = document.querySelector('.page-title') as HTMLElement;
			if (!h1 || !user) return;
			h1.textContent = `Hello ${user.username} !`;
		} catch (err) {
			console.error('Erreur lors de la récupération du user', err);
		}
	}
}