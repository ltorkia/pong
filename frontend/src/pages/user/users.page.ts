import { BasePage } from '../base/base.page';
import { dataApi } from '../../api/index.api';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { UserRowComponent } from '../../components/user-row/user-row.component';
import { getHTMLElementById } from '../../utils/dom.utils';
import { RouteConfig } from '../../types/routes.types';
import { ComponentConfig } from '../../types/components.types';
import { COMPONENT_NAMES, HTML_COMPONENT_CONTAINERS } from '../../config/components.config';
import { ComponentName } from '../../types/components.types';

// ===========================================
// USERS PAGE
// ===========================================
/**
 * Page d'affichage des utilisateurs.
 *
 * Permet d'afficher la liste des utilisateurs enregistrés sur le site.
 */
export class UsersPage extends BasePage {
	private searchBarConfig: ComponentConfig | null = null;
	private userRowConfig: ComponentConfig | null = null;
	private searchBar!: HTMLElement;
	private userList!: HTMLElement;

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
	 * des composants 'searchBar' et 'userRow' est valide avant de les monter. 
	 * Si une configuration est invalide, une erreur est lancée.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les composants sont chargés.
	 * @throws {Error} Lance une erreur si la configuration du composant 'userRow' est invalide.
	 */
	protected async beforeMount(): Promise<void> {
		if (!this.components) {
			return;
		}
		this.searchBarConfig = this.checkComponentConfig(COMPONENT_NAMES.SEARCH_BAR);
		this.userRowConfig = this.checkComponentConfig(COMPONENT_NAMES.USER_ROW);
	}

	/**
	 * Charge les composants propres à cette page.
	 * 
	 * Cette méthode charge la barre de recherche et les lignes du tableau de la liste des utilisateurs (user-row).
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les composants sont chargés.
	 */
	protected async loadSpecificComponents(): Promise<void> {
		await this.injectSearchBar();
		await this.injectUserList();
	}

	// ===========================================
	// METHODES PRIVATES
	// ===========================================

	/**
	 * Vérifie que la configuration d'un composant est valide et la retourne.
	 *
	 * Vérifie que la configuration du composant est présente dans la configuration
	 * de la page, que le composant doit être rendu et que la configuration est
	 * valide. Si une des conditions n'est pas remplie, une erreur est lancée.
	 * 
	 * @param {ComponentName} componentName Le nom du composant à vérifier.
	 * @returns {ComponentConfig} La configuration valide du composant.
	 * @throws {Error} Si la configuration est invalide.
	 */
	protected checkComponentConfig(componentName: ComponentName): ComponentConfig {
		const config: ComponentConfig | undefined = this.components?.[componentName];
		if (!config || !this.shouldRenderComponent(config) || !this.isValidConfig(config, false)) {
			throw new Error(`Configuration du composant '${componentName}' invalide`);
		}
		return config;
	}

	/**
	 * Injecte la barre de recherche dans le DOM.
	 * 
	 * Cette méthode charge le composant de la barre de recherche (search-bar) et l'injecte
	 * dans le DOM en utilisant la balise HTML dont l'id est passé en paramètre.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque le composant est injecté.
	 */
	protected async injectSearchBar(): Promise<void> {
		this.searchBar = getHTMLElementById(HTML_COMPONENT_CONTAINERS.SEARCH_BAR_ID);
		const searchBarComponent = new SearchBarComponent(this.config, this.searchBarConfig!, this.searchBar);
		await searchBarComponent.render();
	}

	/**
	 * Injecte les lignes du tableau de la liste des utilisateurs (user-row) dans le DOM.
	 * 
	 * Cette méthode utilise l'API pour obtenir la liste des utilisateurs 
	 * et crée dynamiquement un UserRowComponent pour chaque utilisateur.
	 * Chaque ligne utilisateur est stockée dans un tableau de promesses 
	 * qui sont résolues en même temps (traitement asynchrone de chaque ligne).
	 * Les instances de chaque ligne sont stockées dans la propriété componentInstances 
	 * avec l'ID de la ligne comme clé. L'ID de chaque ligne est incrémenté en ajoutant 
	 * l'index de la boucle à la clé de l'instance de composant.
	 * 
	 * @throws {Error} Lance une erreur si la configuration du composant user-row est invalide.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque tous les composants utilisateur 
	 * sont injectés dans le DOM.
	 */
	protected async injectUserList(): Promise<void> {
		const users = await dataApi.getUsers();
		this.userList = getHTMLElementById(HTML_COMPONENT_CONTAINERS.USER_LIST_ID);

		const renderPromises: Promise<void>[] = [];

		let i = 1;
		for (const user of users) {
			let tempContainer = document.createElement('div');
			const rowComponent = new UserRowComponent(this.config, this.userRowConfig!, tempContainer, user);
			const instanceKey = `${this.userRowConfig!.name}-${user.id}`;
			this.addToComponentInstances(instanceKey, rowComponent);

			renderPromises.push(
				rowComponent.render().then(() => {
					const userLine = tempContainer.querySelector('.user-line');
					if (userLine) {
						userLine.id = `${COMPONENT_NAMES.USER_ROW}-${i++}`;
						if (user.id === this.currentUser!.id) {
							(userLine as HTMLElement).style.backgroundColor = '#5e8ca5';
						}
						userLine.classList.add('animate-fadeInUp');
						this.userList.appendChild(userLine);
					}
				})
			);
		}
		await Promise.all(renderPromises);
		console.log(`[${this.constructor.name}] Composant '${this.userRowConfig!.name}' généré`);
	}
}