import { BaseView } from '../BaseView';
import { userApi } from '../../api/user.api';

export class ProfileView extends BaseView {
	private userId: number;

	constructor(container: HTMLElement, userId: number) {
		// super() appelle le constructeur du parent BaseView
		// avec le container et le chemin du template HTML pour la page profile
		super(container, '/templates/user/profile.html');
		this.userId = userId;
	}
	
	// TODO: Tout virer et créer des components
	protected async mount(): Promise<void> {
		try {
			const user = await userApi.getUserById(this.userId);
			const profileSection = document.getElementById('profile-section') as HTMLDivElement;
			const template = document.getElementById('user-template') as HTMLTemplateElement;
			if (!profileSection || !template || !user) return;

			const clone = template.content.cloneNode(true) as DocumentFragment;

			const userAvatar = clone.querySelector('.avatar-cell') as HTMLElement;
			const img = document.createElement('img');
			img.classList.add('avatar-img');
			img.src = `/img/avatars/${user.avatar}`;
				console.log(user.avatar);
			img.alt = `${user.username}'s avatar`;
			userAvatar.appendChild(img);

			const userName = clone.querySelector('.name-cell') as HTMLElement;
			const a = document.createElement('a');
			a.href = `/users/${user.id}`;
			a.textContent = user.username;
			userName.appendChild(a);

			const userLevel = clone.querySelector('.level-cell') as HTMLElement;
			userLevel.textContent = user.winRate !== undefined ? `Win rate: ${user.winRate}%` : "No stats";

			// const userFriendList = clone.querySelector('#friend-list') as HTMLElement;
			// const userFriends = await getUserFriends(user.id);
			// if (userFriends.length > 0) {
			// 	for (const friend of userFriends) {
			// 		const friendLi = document.createElement('li');
			// 		friendLi.textContent = `${friend.username}`;
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
			console.error('Erreur lors de la récupération du user', err);
		}
	}
}