import { BasePage } from './BasePage';
import { getUserById, getUserFriends } from '../api/users';

export class ProfilePage extends BasePage {
	private userId: number;

	constructor(container: HTMLElement, userId: number) {
		// super() appelle le constructeur du parent BasePage
		// avec le container et le chemin du template HTML pour la page profile
		super(container, '/templates/profile.html');
		this.userId = userId;
	}
	
	protected async mount(): Promise<void> {
		try {
			const user = await getUserById(this.userId);
			const profileSection = document.getElementById('profile-section') as HTMLUListElement;
			const template = document.getElementById('user-template') as HTMLTemplateElement;
			if (!profileSection || !template) return;

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
			a.href = `/users/${user.id}`;
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
			profileSection.appendChild(clone);
		} catch (err) {
			console.error('Erreur lors de la récupération des utilisateurs', err);
		}
	}
}