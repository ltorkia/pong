import { BasePage } from '../base/base.page';
import { userApi } from '../../api/user-crud.api';
import { UserRowComponent } from '../../components/user-row/user-row.component';
import { getHTMLElementById } from '../../utils/dom.utils';
import { componentNames, HTMLContainers } from '../../config/constants.config';
import { RouteConfig } from '../../types/routes.types';

export class UsersPage extends BasePage {

	constructor(config: RouteConfig) {
		super(config);
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
			const rowComponent = new UserRowComponent(this.config, componentConfig, tempContainer, user);
			await rowComponent.render();

			const tr = tempContainer.querySelector('tr');
			if (tr) {
				userList.appendChild(tr);
			}
		}
		console.log(`[${this.constructor.name}] Composant '${componentConfig.name}' généré`);
	}
}