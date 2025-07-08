import { BasePage } from './base.page';
import { RouteConfig, RouteParams } from '../types/routes.types';
import { AVATARS_ROUTE_API } from '../config/routes.config';
import { userCrudApi } from '../api/user/user.api';

// ===========================================
// PROFILE PAGE
// ===========================================
/**
 * Page de profil, permet d'afficher les informations
 * d'un utilisateur.
 */
export class ProfilePage extends BasePage {
	private userId?: number | RouteParams;

	/**
	 * Constructeur de la page de profil.
	 *
	 * @param {RouteConfig} config La configuration de la route.
	 * @param {number | RouteParams} [userId] L'ID de l'utilisateur à afficher.
	 */
	constructor(config: RouteConfig, userId?: number | RouteParams) {
		super(config);
		this.userId = userId;
	}
	
	// TODO: Tout virer et créer des components

	// ===========================================
	// METHODES OVERRIDES DE BASEPAGE
	// ===========================================

	/**
	 * Méthode de montage de la page de profil utilisateur.
	 *
	 * Cette méthode vérifie d'abord la validité de l'ID utilisateur. Si l'ID 
	 * est invalide ou manquant, elle lance une erreur. Ensuite, elle récupère 
	 * les informations de l'utilisateur à partir de l'API en utilisant cet ID.
	 * 
	 * Si les éléments HTML nécessaires pour afficher le profil utilisateur 
	 * (section de profil et template utilisateur) sont présents, elle clone 
	 * le template et met à jour le contenu avec les informations de l'utilisateur 
	 * telles que l'avatar, le nom d'utilisateur et le taux de victoire.
	 * 
	 * Les informations de l'utilisateur sont ensuite insérées dans la section 
	 * de profil de la page.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout lorsque le composant 
	 * est monté.
	 * @throws {Error} Si l'ID utilisateur est invalide ou manquant.
	 */
	protected async mount(): Promise<void> {
		if (typeof this.userId !== 'number') {
			throw new Error('User ID invalide ou manquant');
		}
		const user = await userCrudApi.getUserById(this.userId);
		const profileSection = document.getElementById('profile-section') as HTMLDivElement;
		const template = document.getElementById('user-template') as HTMLTemplateElement;
		if (!profileSection || !template || !user) return;

		const clone = template.content.cloneNode(true) as DocumentFragment;

		const userAvatar = clone.querySelector('.avatar-cell') as HTMLElement;
		const img = document.createElement('img');
		img.classList.add('avatar-img');
		img.src = `${AVATARS_ROUTE_API}${user.avatar}`;
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

	// ===========================================
	// METHODES PRIVATES
	// ===========================================
}