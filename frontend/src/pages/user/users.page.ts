import { BasePage } from '../base/base.page';
import { userCrudApi } from '../../api/user/user.api';
import { UserRowComponent } from '../../components/user-row/user-row.component';
import { getHTMLElementById } from '../../utils/dom.utils';
import { componentNames, componentContainers } from '../../config/components.config';
import { RouteConfig } from '../../types/routes.types';

// ===========================================
// USERS PAGE
// ===========================================
/**
 * Page d'affichage des utilisateurs.
 *
 * Permet d'afficher la liste des utilisateurs enregistrés sur le site.
 */
export class UsersPage extends BasePage {

	/**
	 * Constructeur de la page des utilisateurs.
	 *
	 * Initialise la page avec la configuration de la route.
	 *
	 * @param {RouteConfig} config La configuration de la route actuelle.
	 */
	constructor(config: RouteConfig) {
		super(config);
	}

	/**
	 * Méthode de montage de la page.
	 * 
	 * Appelle loadSpecificComponents() pour charger les composants propres à cette page.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les composants sont chargés.
	 */
	protected async mount(): Promise<void> {
		await this.loadSpecificComponents();
	}

	/**
	 * Charge les composants propres à cette page.
	 * 
	 * Cette méthode charge les lignes du tableau de la liste des utilisateurs (user-row).
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les composants sont chargés.
	 */
	protected async loadSpecificComponents(): Promise<void> {
		await this.injectUserList();
	}

	/**
	 * Injecte les lignes du tableau de la liste des utilisateurs (user-row) dans le DOM.
	 * 
	 * Cette méthode récupère la configuration du composant user-row et vérifie 
	 * sa validité. Elle utilise l'API pour obtenir la liste des utilisateurs 
	 * et crée dynamiquement un UserRowComponent pour chaque utilisateur.
	 * Chaque ligne utilisateur est ensuite rendue et ajoutée à l'élément HTML 
	 * identifié par `userListId`. L'ID de chaque ligne est incrémenté en 
	 * ajoutant l'index de la boucle à la clé de l'instance de composant.
	 * Les instances de chaque ligne sont stockées dans la propriété 
	 * componentInstances avec l'ID de la ligne comme clé.
	 * 
	 * @throws {Error} Lance une erreur si la configuration du composant user-row est invalide.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque tous les composants utilisateur 
	 * sont injectés dans le DOM.
	 */
	protected async injectUserList(): Promise<void> {
		const componentConfig = this.components?.[componentNames.userRow];
		if (!componentConfig || !this.isValidConfig) {
			throw new Error(`Configuration du composant '${componentNames.userRow}' invalide`);
		}
		const users = await userCrudApi.getUsers();
		const userList = getHTMLElementById(componentContainers.userListId);

		let i = 1;
		for (const user of users) {
			let tempContainer = document.createElement('tbody');
			const rowComponent = new UserRowComponent(this.config, componentConfig, tempContainer, user);
			await rowComponent.render();

			const tr = tempContainer.querySelector('tr');
			if (tr) {
				tr.id = `${componentNames.userRow}-${i}`;
				userList.appendChild(tr);
			}
			componentConfig.name += user.id;
			this.addToComponentInstances(componentConfig.name, rowComponent);
			i++;
		}
		console.log(`[${this.constructor.name}] Composant '${componentConfig.name}' généré`);
	}
}