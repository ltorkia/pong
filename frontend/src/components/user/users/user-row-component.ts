// Pour hot reload Vite
import template from './user-row-component.html?raw'

import { BaseComponent } from '../../base-component';
import { OptionalUser } from '../../../types/user.types';

export class UserRowComponent extends BaseComponent {
	constructor(container: HTMLElement, currentUser: OptionalUser) {
		super(container, '/components/user/users/user-row-component.html');
		this.currentUser = currentUser;
	}

	protected async mount(): Promise<void> {
		if (import.meta.env.DEV === true) {
			// code exécuté uniquement en dev pour le hot reload Vite
			// des fichiers HTML qui sont dans src au lieu de public
			this.container.innerHTML = template;
			// console.log(this.componentPath, this.container.innerHTML);
			console.log('[UserRowComponent] Hot-reload actif');
		}

		const avatarImg = this.container.querySelector('.avatar-img') as HTMLImageElement;
		const usernameLink = this.container.querySelector('.username-link') as HTMLAnchorElement;
		const levelCell = this.container.querySelector('.level-cell') as HTMLElement;

		if (this.currentUser) {
			if (avatarImg) {
				avatarImg.setAttribute('src', `/img/avatars/${this.currentUser.avatar}`);
				avatarImg.setAttribute('alt', `${this.currentUser.username}'s avatar`);
			}

			if (usernameLink) {
				usernameLink.setAttribute('href', `/user/${this.currentUser.id}`);
				usernameLink.textContent = this.currentUser.username;
			}

			if (levelCell) {
				if ('winRate' in this.currentUser && this.currentUser.winRate !== undefined) {
					levelCell.textContent = `Win rate: ${this.currentUser.winRate}%`;
				} else {
					levelCell.textContent = 'No stats';
				}
			}
		}
	}
}