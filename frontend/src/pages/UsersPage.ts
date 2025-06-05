import { BasePage } from './BasePage';
import { getUsers } from '../api/users';
import { getUserFriends } from '../api/users';

export class UsersPage extends BasePage {

	constructor(container: HTMLElement) {
		// super() appelle le constructeur du parent BasePage
		// avec le container et le chemin du template HTML pour la page home
		super(container, '/templates/users.html');
	}

	async mount() {
		try {
			const users = await getUsers();
			const userList = document.getElementById('user-list') as HTMLUListElement;
			const template = document.getElementById('user-template') as HTMLTemplateElement;
			if (!userList || !template) return;

			for (const user of users) {
				const template = document.getElementById('user-template') as HTMLTemplateElement;
				const clone = template.content.cloneNode(true) as HTMLElement;

				const userInfos = clone.querySelector('.user-infos') as HTMLElement;
				userInfos.textContent = `${user.id}: ${user.pseudo} - ${user.email}`;

				const friendList = clone.querySelector('.friend-list') as HTMLElement;
				const userFriends = await getUserFriends(user.id);
				if (userFriends.length > 0) {
					for (const friend of userFriends) {
						const friendLi = document.createElement('li');
						friendLi.textContent = `${friend.pseudo}`;
						friendList.appendChild(friendLi);
					}
					const br = document.createElement('br');
					friendList.appendChild(br);
				} else {
					const noFriends = document.createElement('span');
					noFriends.classList.add('friend-list');
					noFriends.textContent = 'Aucun ami.';
					friendList.appendChild(noFriends);
				}
				userList.appendChild(clone);
			}
		} catch (err) {
			console.error('Erreur lors de la récupération des utilisateurs', err);
		}
	}

}