import { BasePage } from './BasePage';
import { getUsers, getUserFriends } from '../api/users';

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
				const clone = template.content.cloneNode(true) as DocumentFragment;

				const userAvatar = clone.querySelector('.avatar-cell') as HTMLElement;
				const img = document.createElement('img');
				img.classList.add('avatar-img');
				if (user.avatar) {
					img.src = `img/avatars/${user.avatar}`;
				} else {
					img.src = "img/avatars/default.png";
				}
				img.alt = `${user.pseudo}'s avatar`;
				userAvatar.appendChild(img);

				const userName = clone.querySelector('.name-cell') as HTMLElement;
				const a = document.createElement('a');
				a.href = `/users:${user.id}`;
				a.textContent = user.pseudo;
				userName.appendChild(a);

				const userLevel = clone.querySelector('.level-cell') as HTMLElement;
				if (user.avatar) {
					userLevel.textContent = `${user.level}`;
				} else {
					userLevel.textContent = "No level";
				}

				// const userFriendList = clone.querySelector('#friend-list') as HTMLElement;
				// const userFriends = await getUserFriends(user.id);
				// if (userFriends.length > 0) {
				// 	for (const friend of userFriends) {
				// 		const friendLi = document.createElement('li');
				// 		friendLi.textContent = `${friend.pseudo}`;
				// 		userFriendList.appendChild(friendLi);
				// 	}
				// 	const br = document.createElement('br');
				// 	userFriendList.appendChild(br);
				// } else {
				// 	const noFriends = document.createElement('span');
				// 	noFriends.classList.add('no-friend-list');
				// 	noFriends.textContent = 'No friends.';
				// 	userFriendList.appendChild(noFriends);
				// }
				userList.appendChild(clone);
			}
		} catch (err) {
			console.error('Erreur lors de la récupération des utilisateurs', err);
		}
	}

}