import { BasePage } from '../BasePage';
import { RouteConfig, RouteParams } from '../../types/routes.types';
import { User } from '../../models/user.model';
import { userApi } from '../../api/user.api';

export class ProfilePage extends BasePage {
	protected userId?: number | RouteParams;

	constructor(config: RouteConfig, container: HTMLElement, currentUser: User | null, userId?: number | RouteParams) {
		// super() appelle le constructeur du parent BasePage
		// avec le container et le chemin du template HTML pour la page profile
		super(config, container, currentUser);
		this.userId = userId;
	}
	
	// TODO: Tout virer et créer des components
	protected async mount(): Promise<void> {
		if (typeof this.userId !== 'number') {
			throw new Error('User ID invalide ou manquant');
		}
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
	}
}