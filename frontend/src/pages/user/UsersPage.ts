import { BasePage } from '../BasePage';
import { userApi } from '../../api/user.api';
import { UserRowComponent } from '../../components/user/users/user-row-component';
import { getHTMLElementById } from '../../helpers/dom.helper';
import { componentNames, HTMLContainers } from '../../config/constants';
import { RouteConfig } from '../../types/routes.types';
import { User } from '../../models/user.model';

export class UsersPage extends BasePage {

	constructor(config: RouteConfig, container: HTMLElement, currentUser: User | null) {
		super(config, container, currentUser);
	}

	protected async mount() {
		await this.loadSpecificComponents();
	}

	/**
	 * Génère les components relatifs à cette page
	 * ex: les lignes du tableau de la liste des utilisateurs (user-row)
	 */
	protected async loadSpecificComponents(): Promise<void> {
		await this.injectUserList();
	}

	/**
	 * Injecte les lignes du tableau de la liste des utilisateurs (user-row)
	 */
	protected async injectUserList(): Promise<void> {
		// On vérifie si le composant a bien une config valide
		const componentConfig = this.components?.[componentNames.userRow];
		if (!componentConfig || !this.isValidConfig) {
			throw new Error(`Configuration du composant '${componentNames.userRow}' invalide`);
		}

		const users = await userApi.getUsers();
		const userList = getHTMLElementById(HTMLContainers.userListId);

		for (const user of users) {
			let tempContainer = document.createElement('tbody');
			const rowComponent = new UserRowComponent(this.config, componentConfig, tempContainer, user, this.currentUser, this.userController);
			await rowComponent.render();

			const tr = tempContainer.querySelector('tr');
			if (tr) {
				userList.appendChild(tr);
			}
		}
		console.log(`[${this.constructor.name}] Composant '${componentConfig.name}' généré`);
	}
}