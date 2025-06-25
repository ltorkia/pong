import { BaseView } from './BaseView';
import { userApi } from '../api/user.api';

export class UsersView extends BaseView {

	constructor(container: HTMLElement) {
		// super() appelle le constructeur du parent BaseView
		// avec le container et le chemin du template HTML pour la page home
		super(container, '/templates/users.html');
	}

	async mount() {
		try {
			const users = await userApi.getUsers();
			const userList = document.getElementById('user-list') as HTMLTableElement;
			const template = document.getElementById('users-template') as HTMLTemplateElement;
			if (!userList || !template) return;

			if (users.length === 0) {
				const div = document.createElement('div');
				div.textContent = "No user registered";
				userList.appendChild(div);
				return;
			}

			for (const user of users) {
				const clone = template.content.cloneNode(true) as DocumentFragment;

				const userAvatar = clone.querySelector('.avatar-cell') as HTMLElement;
				const img = document.createElement('img');
				img.classList.add('avatar-img');
				img.src = `/img/avatars/${user.avatar || 'default.png'}`;
				img.alt = `${user.displayName}'s avatar`;
				userAvatar.appendChild(img);

				const userName = clone.querySelector('.name-cell') as HTMLElement;
				const a = document.createElement('a');
				a.href = `/user/${user.id}`;
				a.textContent = user.displayName;
				a.setAttribute('data-link', '');
				userName.appendChild(a);

				const userLevel = clone.querySelector('.level-cell') as HTMLElement;
				userLevel.textContent = user.winRate !== undefined ? `Win rate: ${user.winRate}%` : "No stats";

				userList.appendChild(clone);
			}
		} catch (err) {
			console.error('Erreur lors de la récupération des utilisateurs', err);
		}
	}
}