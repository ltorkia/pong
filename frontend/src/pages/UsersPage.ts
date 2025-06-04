import { BasePage } from './BasePage';
import { getUsers } from '../api/users';

export class UsersPage extends BasePage {

	constructor(container: HTMLElement) {
		// super() appelle le constructeur du parent BasePage
		// avec le container et le chemin du template HTML pour la page home
		super(container, '/templates/users.html');
	}

	async mount() {
		try {
			const users = await getUsers();
			const userList = document.getElementById('user-list');
			if (!userList) return;

			users.forEach((user: any) => {
				const li = document.createElement('li');
				li.textContent = `${user.id}: ${user.pseudo} - ${user.email}`;
				userList.appendChild(li);
			});
		} catch (err) {
			console.error('Erreur lors de la récupération des utilisateurs', err);
		}
	}

}