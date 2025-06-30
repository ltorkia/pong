// Pour hot reload Vite
import template from './user-row.component.html?raw'

import { BaseComponent } from '../base/base.component';
import { User } from '../../models/user.model';
import { userStore } from '../../stores/user.store';
import { RouteConfig } from '../../types/routes.types';
import { ComponentConfig } from '../../types/components.types';

export class UserRowComponent extends BaseComponent {
	protected routeConfig: RouteConfig;
	protected user?: User | null = null;
	protected currentUser: User | null = null;

	constructor(routeConfig: RouteConfig, componentConfig: ComponentConfig, container: HTMLElement, user?: User | null) {
		super(componentConfig, container);
				
		this.routeConfig = routeConfig;
		this.user = user;
		this.currentUser = userStore.getCurrentUser();
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

		if (this.user) {
			if (avatarImg) {
				avatarImg.setAttribute('src', `/img/avatars/${this.user.avatar}`);
				avatarImg.setAttribute('alt', `${this.user.username}'s avatar`);
			}

			if (usernameLink) {
				usernameLink.setAttribute('href', `/user/${this.user.id}`);
				usernameLink.textContent = this.user.username;
			}

			if (levelCell) {
				if ('winRate' in this.user && this.user.winRate !== undefined) {
					levelCell.textContent = `Win rate: ${this.user.winRate}%`;
				} else {
					levelCell.textContent = 'No stats';
				}
			}
		}
	}
}