import { BaseComponent } from '../../BaseComponent';
import { OptionalUser } from '../../../types/model.types';

export class UserRowComponent extends BaseComponent {
	constructor(container: HTMLElement, currentUser: OptionalUser) {
		super(container, '/components/user/users/user-row.html');
		this.currentUser = currentUser;
	}

	protected async mount(): Promise<void> {
		const avatarImg = this.container.querySelector('.avatar-img') as HTMLImageElement;
		const usernameLink = this.container.querySelector('.username-link') as HTMLAnchorElement;
		const levelCell = this.container.querySelector('.level-cell') as HTMLElement;

		if (this.currentUser) {
			if (avatarImg) {
				avatarImg.setAttribute('src', `/img/avatars/${this.currentUser.avatar}`);
				avatarImg.setAttribute('alt', `${this.currentUser.username}'s avatar`);
			}

			if (usernameLink) {
				usernameLink.setAttribute('href', `/users/${this.currentUser.id}`);
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