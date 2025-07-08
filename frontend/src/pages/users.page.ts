import { BasePage } from './base.page';
import { userCrudApi } from '../api/user/user.api';
import { UserRowComponent } from '../components/user-row/user-row.component';
import { getHTMLElementById } from '../utils/dom.utils';
import { RouteConfig } from '../types/routes.types';
import { ComponentConfig } from '../types/components.types';
import { COMPONENT_NAMES, HTML_COMPONENT_CONTAINERS } from '../config/components.config';

// ===========================================
// USERS PAGE
// ===========================================
/**
 * Page d'affichage des utilisateurs.
 *
 * Permet d'afficher la liste des utilisateurs enregistrés sur le site.
 */
export class UsersPage extends BasePage {
	private componentConfig?: ComponentConfig;

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

	// ===========================================
	// METHODES OVERRIDES DE BASEPAGE
	// ===========================================

	/**
	 * Préparation avant le montage de la page des utilisateurs.
	 * 
	 * Vérifie que l'utilisateur est connecté et s'assure que la configuration
	 * du composant 'userRow' est valide avant de le monter. 
	 * Si la configuration est invalide, une erreur est lancée.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les composants sont chargés.
	 * @throws {Error} Lance une erreur si la configuration du composant 'userRow' est invalide.
	 */
	protected async beforeMount(): Promise<void> {
		if (!this.components) {
			return;
		}
		const config = this.components[COMPONENT_NAMES.USER_ROW];
		if (!config || !this.shouldRenderComponent(config)
			|| !this.isValidConfig(config, false)) {
			throw new Error(`Configuration du composant '${COMPONENT_NAMES.USER_ROW}' invalide`);
		}
		this.componentConfig = config;
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

	// ===========================================
	// METHODES PRIVATES
	// ===========================================

	/**
	 * Injecte les lignes du tableau de la liste des utilisateurs (user-row) dans le DOM.
	 * 
	 * Cette méthode  utilise l'API pour obtenir la liste des utilisateurs 
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
		const users = await userCrudApi.getUsers();
		const userList = getHTMLElementById(HTML_COMPONENT_CONTAINERS.USER_LIST_ID);

		let i = 1;
		for (const user of users) {
			let tempContainer = document.createElement('tbody');
			const rowComponent = new UserRowComponent(this.config, this.componentConfig!, tempContainer, user);
			await rowComponent.render();

			const tr = tempContainer.querySelector('tr');
			if (tr) {
				tr.id = `${COMPONENT_NAMES.USER_ROW}-${i}`;
				userList.appendChild(tr);
			}
			const instanceKey = `${this.componentConfig!.name}-${user.id}`;
			this.addToComponentInstances(instanceKey, rowComponent);
			i++;
		}
		console.log(`[${this.constructor.name}] Composant '${this.componentConfig!.name}' généré`);
	}
}