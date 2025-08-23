import { BasePage } from '../base/base.page';
import { User } from '../../shared/models/user.model';
import { dataApi } from '../../api/index.api';
import { dataService } from '../../services/index.service';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { UserRowComponent } from '../../components/user-row/user-row.component';
import { PaginationComponent } from '../../components/pagination/pagination.component';
import { getHTMLElementById, getHTMLElementByClass } from '../../utils/dom.utils';
import { RouteConfig } from '../../types/routes.types';
import { COMPONENT_NAMES, HTML_COMPONENT_CONTAINERS } from '../../config/components.config';
import { ComponentConfig, ComponentName, PaginationParams } from '../../types/components.types';
import { SafeUserModel, PaginatedUsers, PaginationInfos, SearchParams } from '../../shared/types/user.types';
import { USER_ONLINE_STATUS } from '../../shared/config/constants.config';

// ===========================================
// USERS PAGE
// ===========================================
/**
 * Page d'affichage des utilisateurs.
 *
 * Permet d'afficher la liste des utilisateurs enregistrés sur le site.
 */
export class UsersPage extends BasePage {
	private users: SafeUserModel[] | User[] | null = null;
	private paginationInfos: PaginationInfos | null = null;
	private paginationParams: PaginationParams | null = null;
	private currentPage: number = 1;

	private searchBarConfig: ComponentConfig | null = null;
	private userRowConfig: ComponentConfig | null = null;
	private paginationConfig: ComponentConfig | null = null;

	private searchBar!: HTMLElement;
	private userList!: HTMLElement;
	private paginationContainer!: HTMLElement;

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
		this.paginationConfig = this.checkComponentConfig(COMPONENT_NAMES.PAGINATION);
		
		this.searchBar = getHTMLElementById(HTML_COMPONENT_CONTAINERS.SEARCH_BAR_ID);
		this.userList = getHTMLElementById(HTML_COMPONENT_CONTAINERS.USER_LIST_ID);
		this.paginationContainer = getHTMLElementById(HTML_COMPONENT_CONTAINERS.PAGINATION_ID);
	}

	/**
	 * Charge les composants propres à cette page.
	 * 
	 * Cette méthode charge la barre de recherche,
	 * les lignes du tableau de la liste des utilisateurs (user-row),
	 * et la pagination.
	 * 
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les composants sont chargés.
	 */
	protected async loadSpecificComponents(): Promise<void> {
		await this.injectSearchBar();
		await this.injectUserList();
		this.paginationInfos.incCurrUser = true;
		await this.injectPagination();
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
	private checkComponentConfig(componentName: ComponentName): ComponentConfig {
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
	private async injectSearchBar(): Promise<void> {
		const searchBarComponent = new SearchBarComponent(this.config, this.searchBarConfig!, this.searchBar);
		await searchBarComponent.render();
		console.log(`[${this.constructor.name}] Composant '${this.searchBarConfig!.name}' généré`);
		
		searchBarComponent.container.addEventListener('search', async (event: Event) => {
		const params = (event as CustomEvent).detail;
			console.log(params);
			await this.injectUserList(params);
			if (!params.searchTerm && !params.status && !params.friendsOnly)
				this.paginationInfos.incCurrUser = true;
			else
				this.paginationInfos.incCurrUser = false;
			await this.injectPagination();
		});
	}

	/**
	 * Injecte les lignes du tableau de la liste des utilisateurs (user-row) dans le DOM.
	 * 
	 * Cette méthode crée dynamiquement un UserRowComponent pour chaque utilisateur.
	 * Chaque ligne utilisateur est stockée dans un tableau de promesses 
	 * qui sont résolues en même temps (traitement asynchrone de chaque ligne).
	 * Les instances de chaque ligne sont stockées dans la propriété componentInstances 
	 * avec l'ID de la ligne comme clé. L'ID de chaque ligne est incrémenté en ajoutant 
	 * l'index de la boucle à la clé de l'instance de composant.
	 * 
	 * @param {SearchParams} [params] Paramètres de recherche.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque tous les composants utilisateur 
	 * sont injectés dans le DOM.
	 */
	private async injectUserList(params?: SearchParams): Promise<void> {

		let searchParams: SearchParams = {};
		if (params)
			searchParams = params;
			
		const req: PaginatedUsers = await dataApi.getUsersByPage(searchParams, this.currentPage);
		this.users = req.users;
		this.paginationInfos = req.pagination;
		if (!this.users || !this.paginationInfos) {
			return;
		}
		this.userList.replaceChildren();
		await this.injectUser(this.currentUser);

		for (const user of this.users! as User[]) {
			if (!user.isActive)
				continue;
			await this.injectUser(user);
		}
		console.log(`[${this.constructor.name}] Composant '${this.userRowConfig!.name}' généré`);
	}

	/**
	 * Injecte le composant de pagination dans le DOM.
	 *
	 * Crée une instance du composant PaginationComponent avec la configuration
	 * actuelle et l'injecte dans le conteneur HTML spécifié. Enregistre
	 * l'instance dans la liste des instances de composants. Affiche un message
	 * de log une fois que le composant est généré.
	 * 
	 * @returns {Promise<void>} Une promesse qui se resilve lorsque le composant de pagination est injecté.
	 */
	private async injectPagination(): Promise<void> {
		this.paginationParams = { 
			infos: this.paginationInfos!, 
			onPageChange: (page: number) => this.handlePageChange(page),
		};
		const paginationComponent = new PaginationComponent(this.config, this.paginationConfig!, this.paginationContainer, null, this.paginationParams!);
		await paginationComponent.render();
		this.addToComponentInstances(COMPONENT_NAMES.PAGINATION, paginationComponent);
		console.log(`[${this.constructor.name}] Composant '${this.paginationConfig!.name}' généré`);
	}

	/**
	 * Gère le changement de page dans la pagination.
	 * 
	 * @param {number} page Le numéro de la page sélectionnée.
	 */
	private async handlePageChange(page: number): Promise<void> {
		this.currentPage = page;
		await this.injectUserList();
		await this.injectPagination();
	}

	// ===========================================
	// METHODES PUBLICS
	// ===========================================

	/**
	 * Injecte un utilisateur dans la liste des utilisateurs.
	 * 
	 * Cette méthode crée dynamiquement un UserRowComponent pour l'utilisateur
	 * passé en paramètre et l'injecte dans le DOM en utilisant la balise HTML
	 * dont l'id est passé en paramètre.
	 * 
	 * Utilisée lors de la réception d'une notification quand un utilisateur se connecte.
	 * 
	 * @param {User} user - L'utilisateur à injecter.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque le composant utilisateur est injecté.
	 */
	public async injectUser(user: User): Promise<void> {
		let tempContainer = document.createElement('div');
		const rowComponent = new UserRowComponent(this.config, this.userRowConfig!, tempContainer, user);
		const instanceKey = `${this.userRowConfig!.name}-${user.id}`;
		this.addToComponentInstances(instanceKey, rowComponent);
		rowComponent.render().then(() => {
			const userLine = tempContainer.querySelector('.user-line');
			if (userLine) {
				userLine.id = instanceKey;
				if (user.id === this.currentUser!.id) {
					(userLine as HTMLElement).style.backgroundColor = '#5e8ca591';
				}
				userLine.classList.add('animate-fade-in-up');
				this.removeUser(user);

				if (user.status === USER_ONLINE_STATUS.ONLINE) {
					const currentUserLine = this.userList.querySelector(`#${this.userRowConfig!.name}-${this.currentUser!.id}`);
					if (currentUserLine)
						currentUserLine.insertAdjacentElement('afterend', userLine);
					else
						this.userList.prepend(userLine);
				} else {
					userLine.classList.add('line-offline');
					this.userList.appendChild(userLine);
				}
			}
		})
	}

	/**
	 * Supprime un utilisateur de la liste des utilisateurs.
	 * 
	 * Recherche la ligne utilisateur correspondant à l'ID de l'utilisateur
	 * passé en paramètre et la supprime du DOM.
	 * 
	 * Utilisée lorsque l'utilisateur se déconnecte.
	 * 
	 * @param {User} user - L'utilisateur à supprimer.
	 */
	public removeUser(user: User): void {
		const userLine = document.getElementById(`${this.userRowConfig!.name}-${user.id}`);
		if (userLine) {
			userLine.remove();
		}
	}

	/**
	 * Met à jour le statut en ligne d'un utilisateur.
	 *
	 * Recherche la ligne utilisateur correspondant à l'ID de l'utilisateur
	 * passé en paramètre et met à jour son statut en ligne.
	 *
	 * @param {User} user - L'utilisateur dont le statut est à mettre à jour.
	 */
	public changeOnlineStatus(user: User): void {
		const userRow = document.getElementById(`${this.userRowConfig!.name}-${user.id}`);
		console.log(userRow);
		if (userRow) {
			const statusCell = getHTMLElementByClass('status-cell', userRow) as HTMLElement;
			console.log(statusCell);
			statusCell.innerHTML = dataService.showStatusLabel(user);
		}
	}

	/**
	 * Met à jour les boutons d'amitié pour une ligne utilisateur
	 * suite à une modification de la demande d'amitié.
	 *
	 * Si un instance de UserRowComponent est fournie, met à jour
	 * les boutons d'amitié correspondant à l'utilisateur d'ID "from"
	 * en fonction de la demande d'amitié reçue. Sinon, cherche
	 * l'instance de UserRowComponent correspondante à l'ID "from"
	 * dans la liste des instances de composants stockées et la met
	 * à jour.
	 *
	 * @param {number} friendId L'identifiant de l'utilisateur qui a envoyé la demande d'amitié.
	 * @param {UserRowComponent} userRowInstance L'instance de UserRowComponent
	 * à mettre à jour. Si non fourni, cherche l'instance dans la liste
	 * des instances de composants stockées.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les boutons
	 * d'amitié ont été mis à jour.
	 */
	public async updateFriendButtons(friendId?: number, userRowInstance?: UserRowComponent): Promise<void> {
		if (!userRowInstance) {
			const key = `${COMPONENT_NAMES.USER_ROW}-${friendId}`;
			userRowInstance = this.getComponentInstance!<UserRowComponent>(key);
		}
		await (userRowInstance as UserRowComponent).toggleFriendButton();
	}
}