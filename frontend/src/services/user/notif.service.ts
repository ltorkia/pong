import { ROUTE_PATHS } from '../../config/routes.config';
import { notifApi } from '../../api/index.api';
import { PageInstance } from '../../types/routes.types';
import { COMPONENT_NAMES } from '../../config/components.config';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { UserRowComponent } from '../../components/user-row/user-row.component';
import { currentService, storageService, friendService } from './user.service';
import { User } from '../../shared/models/user.model';
import { AppNotification } from '../../shared/models/notification.model';
import { NotifResponse, FriendResponse } from '../../shared/types/response.types';
import { FRIEND_REQUEST_ACTIONS } from '../../shared/config/constants.config'; // en rouge car dossier local 'shared' != dossier conteneur
import { isValidNotificationType } from '../../shared/utils/app.utils';
import { getHTMLElementById } from '../../utils/dom.utils';

// ============================================================================
// NOTIF SERVICE
// ============================================================================
/**
 * Service de gestion des notifications.
 */
export class NotifService {
	private currentUser: User | null = null;
	private currentPage!: PageInstance;
	private navbarInstance!: NavbarComponent | undefined;
	private notifs: AppNotification[] = [];
	private notifCount: number = 0;
	private notifItem: HTMLDivElement | null = null;

	public currentNotif: AppNotification | null = null;
	public friendId: number | null = null;
	public rowFriendId: number | null = null;

	// ===========================================
	// METHODES PUBLICS
	// ===========================================

	/**
	 * Initialise le service de notifications avec la page actuelle.
	 * 
	 * - Stocke l'instance de la page actuelle dans `currentPage`.
	 * - Récupère et stocke l'instance du composant Navbar à partir de la page actuelle.
	 *
	 * @param {PageInstance} currentPage - Instance de la page actuellement affichée.
	 * @returns {Promise<void>} Une promesse qui est resolvée lorsque le service est initialisé.
	 */
	public async init(currentPage: PageInstance): Promise<void> {
		this.currentUser = currentService.getCurrentUser();
		this.currentPage = currentPage;
		this.navbarInstance = this.currentPage.getComponentInstance!<NavbarComponent>(COMPONENT_NAMES.NAVBAR);
		await this.loadNotifs();
	}

	/**
	 * Gère une liste de notifications en les traitant en fonction de leur type.
	 * 
	 * Parcourt chaque notification de la liste et appelle `handleNotification` si le type de la notification est valide.
	 * 
	 * @param {AppNotification[]} notifs - La liste des notifications à gérer.
	 * @returns {Promise<void>} Une promesse qui est résolue lorsque toutes les notifications ont été traitées.
	 */
	public async handleNotifications(notifs: AppNotification[]): Promise<void> {
		for (const notif of notifs) {
			if (isValidNotificationType()) {
				this.currentNotif = notif;
				this.friendId = notif.from;
				this.rowFriendId = this.friendId;
				await this.handleNotification();
			}
		}
	}

	/**
	 * Marque une notification comme lue en utilisant l'API envoyant une requête PUT
	 * à la route `/api/notifs/:notifId/update` pour mettre à jour le statut de
	 * la notification d'identifiant `notifId` de 0 à 1 (soit non lu à lu).
	 *
	 * Si la requête réussit, la notification est mise à jour dans l'état de l'application.
	 *
	 * @param {number} id - L'identifiant de la notification à marquer comme lue.
	 * @returns {Promise<void>} Une promesse qui se résout une fois la notification marquée comme lue.
	 */
	public async markAsRead(id: number): Promise<void> {
		this.setCurrentNotif(id);
		this.currentNotif.read = 1;
		const updatedRes = await notifApi.updateNotification(this.currentNotif);
		if (updatedRes.errorMessage) {
			console.error(updatedRes.errorMessage);
		}
		this.currentNotif = updatedRes.notif;
	}

	/**
	 * Définit l'identifiant de l'ami de la ligne utilisée pour mettre à jour les boutons
	 * de l'utilisateur dans la page de la liste des utilisateurs.
	 * 
	 * Cette méthode est utilisée pour indiquer à quelle ligne se rapporte l'ami pour lequel
	 * les boutons d'amitié doivent être mis à jour.
	 * 
	 * @param {number} id - L'identifiant de l'ami de la ligne.
	 * @returns {void}
	 */
	public setRowFriendId(id: number): void {
		console.log(`setRowFriendId: ${id}`);
		this.rowFriendId = id;
		this.friendId = id;
	}

	/**
	 * Met à jour le compteur de notifications non lues.
	 *
	 * - Si le compteur est égal à zéro, cache le compteur.
	 * - Sinon, affiche le compteur avec la valeur donnée.
	 *
	 * @returns {void}
	 */
	public updateNotifsCounter(): void {
		this.notifCount = this.getNotifCount();
		if (this.notifCount === 0) {
			this.navbarInstance!.notifsCounter.textContent = '0';
			if (!this.navbarInstance!.notifsCounter.classList.contains('hidden')) {
				this.navbarInstance!.notifsCounter.classList.add('hidden');
			}
			return;
		}
		this.navbarInstance!.notifsCounter.textContent = this.notifCount.toString();
		if (this.navbarInstance!.notifsCounter.classList.contains('hidden')) {
			this.navbarInstance!.notifsCounter.classList.remove('hidden');
		}
	}

	// ===========================================
	// METHODES PRIVATES
	// ===========================================

	/**
	 * Charge les notifications de l'utilisateur courant et les affiche dans la fenêtre de notifications.
	 * Si il n'y a pas de notifications, affiche un message par défaut.
	 *
	 * @returns {Promise<void>} Une promesse qui est resolvée lorsque les notifications sont chargées et affichées.
	 */
	private async loadNotifs(): Promise<void> {
		this.navbarInstance!.notifsWindow.replaceChildren();
		this.setCurrentNotifs();
		this.updateNotifsCounter();

		// Si il n'y a pas de notifications, affiche un message par défaut
		if (this.notifCount === 0) {
			this.displayDefaultNotif();
			return;
		}
		
		// Sinon, parcourt les notifications et crée un élément HTML pour chacune
		this.notifs.forEach((notifDb: AppNotification) => {
			this.currentNotif = notifDb;
			this.displayNotif();
		});
		this.updateNotifsCounter();
	}

	/**
	 * Gère une notification en la traitant en fonction de son type.
	 * 
	 * - Stocke la notification en cours dans `currentNotif`.
	 * - Vérifie si la notification est déjà chargée en utilisant `find` sur `notifs`.
	 * - Si la notification n'est pas chargée, la stocke dans `notifs`, la sauvegarde en local,
	 *   affiche la notification et met à jour le compteur de notifications.
	 * - Sinon, selon le type de la notification, supprime ou remplace la notification existante.
	 * - Met à jour les boutons d'amitié si la page des utilisateurs est affichée.
	 * 
	 * @returns {Promise<void>} Une promesse qui est résolue lorsque la notification est traitée.
	 */
	private async handleNotification(): Promise<void> {
		const isLoaded = this.notifs.find((notif) => notif.id === this.currentNotif.id);
		if (!isLoaded()) {
			this.notifs.push(this.currentNotif);
			storageService.setCurrentNotifs(this.notifs);
			this.displayNotif();
			this.updateNotifsCounter();
			return;
		};
		switch (this.currentNotif.type) {
			case FRIEND_REQUEST_ACTIONS.DELETE:
				this.deleteNotif();
				this.updateNotifsCounter();
				break;
			default:
				this.replaceNotif();
				break;
		}
		await this.refreshFriendButtons();
	}

	/**
	 * Charge les notifications de l'utilisateur courant.
	 *
	 * Si les notifications de l'utilisateur courant sont déjà stockées en mémoire,
	 * elles sont directement copiées dans `this.notifs`. Sinon, une requête à l'API
	 * est envoyée pour récupérer les notifications de l'utilisateur courant.
	 *
	 * Si la requête réussit, les notifications sont stockées dans `this.notifs` et
	 * stockées en local storage.
	 *
	 * @returns {Promise<void>} Une promesse qui est resolvée lorsque les notifications sont chargées.
	 */
	private async setCurrentNotifs(): Promise<void> {
		if (this.currentUser.notifications) {
			this.notifs = this.currentUser.notifications;
			return;
		}
		const result: NotifResponse = await notifApi.getUserNotifications();
		if (result.errorMessage) {
			console.error(result.errorMessage);
			return;
		}
		this.notifs = result;
		storageService.setCurrentNotifs(this.notifs);
		console.log('Notifications rechargées:', this.notifs);
	}

	/**
	 * Charge les informations d'une notification en fonction de son identifiant.
	 *
	 * Cette méthode envoie une requête à l'API pour récupérer les informations de la
	 * notification d'identifiant `id`. Si la requête réussit, les informations sont
	 * stockées dans `this.currentNotif`.
	 *
	 * @param {number} id - Identifiant de la notification à charger.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les informations de la
	 * notification sont chargées.
	 */
	private async setCurrentNotif(id: number): Promise<void> {
		const result: NotifResponse = await notifApi.getNotificationById(id);
		if (result.errorMessage) {
			console.error(result.errorMessage);
			return;
		}
		this.currentNotif = result;
	}

	/**
	 * Affiche une notification en créant un élément de notification et en l'ajoutant
	 * à la fenêtre des notifications dans la barre de navigation.
	 */
	private displayNotif(): void {
		this.notifItem = this.createNotifElement();
		this.navbarInstance!.notifsWindow.appendChild(this.notifItem);
	}
	
	/**
	 * Remplace l'élément HTML de la notification par un nouvel élément HTML généré à partir de la
	 * notification courante.
	 */
	private replaceNotif(): void {
		this.notifItem = getHTMLElementById(`notif-${this.currentNotif.id}`, this.navbarInstance!.notifsWindow) as HTMLDivElement;
		if (!this.notifItem) {
			console.warn(`[${this.constructor.name}] Aucune notification à mettre à jour`);
			return;
		}
		const newNotifItem = this.createNotifElement();
		this.notifItem.replaceWith(newNotifItem);
	}

	/**
	 * Supprime la notification actuelle de la fenêtre des notifications dans la barre de navigation.
	 */
	private deleteNotif(): void {
		this.notifItem = getHTMLElementById(`notif-${this.currentNotif.id}`, this.navbarInstance!.notifsWindow) as HTMLDivElement;
		if (!this.notifItem) {
			console.warn(`[${this.constructor.name}] Aucune notification à supprimer`);
			return;
		}
		this.notifItem.remove();
	}
	/**
	 * Met à jour les boutons d'amitié pour la page des utilisateurs si elle est affichée.
	 *
	 * Si la page des utilisateurs est affichée, appelle la méthode updateFriendButtons de la page
	 * pour mettre à jour les boutons d'amitié correspondant à l'utilisateur d'ID "from" en fonction
	 * de la demande d'amitié reçue.
	 *
	 * @param {UserRowComponent} [userRowInstance] - L'instance du composant UserRowComponent qui a envoyé la demande d'amitié.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les boutons d'amitié ont été mis à jour.
	 */
	private async refreshFriendButtons(userRowInstance?: UserRowComponent): Promise<void> {
		if (this.currentPage.config.path === ROUTE_PATHS.USERS) {
			await this.currentPage.updateFriendButtons!(this.rowFriendId!, userRowInstance);
		}
	}

	/**
	 * Crée et retourne un élément HTML représentant une notification.
	 *
	 * L'élément HTML est créé en utilisant la méthode `document.createElement()`. Il est
	 * configuré avec les classes CSS `.notif-item` et `.new-notif` en fonction du statut de la notification.
	 * L'identifiant de l'élément est généré en utilisant l'identifiant de la notification. Le contenu de la
	 * notification est ajouté en tant que contenu de l'élément.
	 *
	 * Si la notification nécessite des boutons (c'est-à-dire si elle est en statut "unread"), les boutons
	 * sont créés en utilisant `this.createNotifButtonsHTML()` et des écouteurs d'événements sont attachés
	 * en utilisant `this.attachListeners()`.
	 *
	 * @returns {HTMLDivElement} L'élément HTML représentant la notification.
	 */
	private createNotifElement(): HTMLDivElement {
		const notifItem = document.createElement('div');
		notifItem.classList.add('notif-item');
		notifItem.id = `notif-${this.currentNotif.id}`;
		notifItem.innerHTML = `<span>${this.currentNotif.content}</span>` || '';
		if (this.currentNotif.read === 0) {
			notifItem.classList.add('new-notif');
		}
		if (this.needButtons()) {
			this.createNotifButtonsHTML();
			this.attachListeners();
		}
		return notifItem;
	}

	/**
	 * Crée un élément HTML pour indiquer qu'il n'y a pas encore de notification,
	 * et l'ajoute à la fenêtre de notifications.
	 *
	 * Cette méthode crée un élément HTML avec la classe 'default-notif' et le texte
	 * "No notification yet", puis l'ajoute à la fenêtre de notifications.
	 */
	private displayDefaultNotif() {
		const notifItem = document.createElement('div');
		notifItem.classList.add('default-notif');
		notifItem.textContent = 'No notification yet.';
		this.navbarInstance!.notifsWindow.appendChild(notifItem);
	}

	/**
	 * Ajoute des listeners pour gérer les événements de clic sur les boutons des notifications.
	 *
	 * - Récupère les boutons 'accept' et 'decline' de la notification actuelle.
	 * - Si les boutons existent, ajoute des listeners pour gérer les événements de clic.
	 * - Les handlers de clic sont définis comme des propriétés de l'objet : `handleAcceptClick` et `handleDeclineClick`.
	 */
	private attachListeners(): void {
		const acceptBtn = this.notifItem!.querySelector('button[data-action="accept"]');
		if (acceptBtn) {
			acceptBtn.addEventListener('click', this.handleAcceptClick);
		}
		const declineBtn = this.notifItem!.querySelector('button[data-action="decline"]');
		if (declineBtn) {
			declineBtn.addEventListener('click', this.handleDeclineClick);
		}
	}

	// ===========================================
	// LISTENERS
	// ===========================================

	public handleAddClick = async (): Promise<void> => {
		console.log("ADDDD Add friend request from user ID:", this.currentUser.id, "to user ID:", this.friendId!);
		let friendResult: FriendResponse = await friendService.addFriend(this.currentUser.id, this.friendId!);
		if (friendResult.errorMessage) {
			console.error(friendResult.errorMessage);
			return;
		}
		this.currentNotif = friendResult.notif;
		await this.refreshFriendButtons();
	}

	public handleAcceptClick = async (): Promise<void> => {
		console.log("ACCEPPPPPT Accepting friend request from user ID:", this.currentUser.id, "to user ID:", this.friendId!);
		this.currentNotif.type = FRIEND_REQUEST_ACTIONS.ACCEPT;
		this.currentNotif.read = 1;
		let notifResult: NotifResponse = await notifApi.updateNotification(this.currentNotif);
		if (notifResult.errorMessage) {
			console.error(notifResult.errorMessage);
			return;
		}
		this.currentNotif = notifResult.notif;
		let friendResult: FriendResponse = await friendService.acceptFriend(this.currentUser.id, this.friendId!);
		if (friendResult.errorMessage) {
			console.error(friendResult.errorMessage);
			return;
		}
		await this.refreshFriendButtons();
		await this.handleNotifications(friendResult.notifs);
		this.currentNotif = friendResult.notif;
	}

	public handleDeclineClick = async (): Promise<void> => {
		console.log("DECLINE CLICK: Decline friend request from user ID:", this.currentUser.id, "to user ID:", this.friendId!);
		this.currentNotif.type = FRIEND_REQUEST_ACTIONS.DELETE;
		this.currentNotif.read = 1;
		let notifResult: NotifResponse = await notifApi.updateNotification(this.currentNotif);
		if (notifResult.errorMessage) {
			console.error(notifResult.errorMessage);
			return;
		}
		this.currentNotif = notifResult.notif;
		let friendResult: FriendResponse = await friendService.removeFriend(this.currentUser.id, this.friendId!);
		if (friendResult.errorMessage) {
			console.error(friendResult.errorMessage);
			return;
		}
		await this.refreshFriendButtons();
		await this.handleNotifications(friendResult.notifs);
	}

	public handleBlockClick = async (): Promise<void> => {
		console.log("BLOCKKKKK Blocking friend:", this.friendId!);
		this.currentNotif.type = FRIEND_REQUEST_ACTIONS.BLOCK;
		this.currentNotif.read = 1;
		let notifResult: NotifResponse = await notifApi.updateNotification(this.currentNotif);
		if (notifResult.errorMessage) {
			console.error(notifResult.errorMessage);
			return;
		}
		this.currentNotif = notifResult.notif;
		let friendResult: FriendResponse = await friendService.blockFriend(this.currentUser.id, this.friendId!);
		if (friendResult.errorMessage) {
			console.error(friendResult.errorMessage);
			return;
		}
		await this.refreshFriendButtons();
		await this.handleNotifications(friendResult.notifs);
		this.currentNotif = friendResult.notif;
	}

	// ===========================================
	// UTILS
	// ===========================================

	/**
	 * Retourne le nombre de notifications non lues.
	 *
	 * Recherche et retourne le nombre de notifications dont le statut est 0 (non lu) dans le tableau `notifs`.
	 *
	 * @return {number} Le nombre de notifications non lues.
	 */
	private getNotifCount(): number {
		return this.notifs.filter(n => n.read === 0).length;
	}

	/**
	 * Détermine si les boutons d'actions sont nécessaires pour la notification courante.
	 * 
	 * @returns {boolean} True si le type de la notification est FRIEND_REQUEST_ACTIONS.ADD,
	 *                   sinon False.
	 */
	private needButtons(): boolean {
		const buttonCases = [
			FRIEND_REQUEST_ACTIONS.ADD,
		]
		return Object.values(buttonCases).includes(this.currentNotif.type);
	}

	/**
	 * Crée le HTML pour les boutons d'actions dans une notification.
	 * 
	 * Les boutons sont affichés en fonction de l'action de la notification.
	 * Si la notification est une demande d'amitié, les boutons "Accept" et "Decline"
	 * sont affichés.
	 * 
	 * @returns {Promise<string>} Le HTML des boutons d'actions.
	 */
	private async createNotifButtonsHTML(): Promise<string> {
		let html = `<div class="notif-actions flex justify-center space-x-4">`;
		if (this.currentNotif.type === FRIEND_REQUEST_ACTIONS) {
			switch (this.currentNotif.type) {
				case FRIEND_REQUEST_ACTIONS.ADD:
					html += `
						<button class="btn smaller-btn" data-action="accept" data-to="${this.currentNotif.to}" data-from="${this.currentNotif.from}">
							Accept
						</button>
						<button class="btn smaller-btn" data-action="decline" data-to="${this.currentNotif.to}" data-from="${this.currentNotif.from}">
							Decline
						</button>
					`;
					break;
			}
		}
		html += `</div>`;
		return html;
	}
}