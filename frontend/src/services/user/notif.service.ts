import { ROUTE_PATHS } from '../../config/routes.config';
import { notifApi, friendApi } from '../../api/index.api';
import { PageInstance } from '../../types/routes.types';
import { COMPONENT_NAMES } from '../../config/components.config';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { UserRowComponent } from '../../components/user-row/user-row.component';
import { currentService, storageService } from './user.service';
import { User } from '../../shared/models/user.model';
import { AppNotification } from '../../shared/models/notification.model';
import { NotifResponse } from '../../shared/types/response.types';
import { FRIEND_REQUEST_ACTIONS } from '../../shared/config/constants.config'; // en rouge car dossier local 'shared' != dossier conteneur
import { isValidNotificationType, isFriendRequestAction, isUserOnlineStatus } from '../../shared/utils/app.utils';
import { getHTMLElementById } from '../../utils/dom.utils';
import { FriendRequestAction } from '../../shared/types/notification.types';

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

	// ===========================================
	// METHODES PUBLICS
	// ===========================================

	/**
	 * Paramètre les données lorsque l'utilisateur clique sur un bouton avec un handler
	 * de demande d'amitié.
	 * 
	 * Cette méthode indique quelle ligne se rapporte l'ami 
	 * pour lequel les boutons d'amitié doivent être mis à jour.
	 * 
	 * @param {number} friendId - L'identifiant de l'ami de la ligne.
	 * @param {FriendRequestAction} type - Le type de la demande d'amitié.
	 * @returns {void}
	 */
	public setNotifsData(friendId: number, type?: FriendRequestAction, ): void {
		console.log(`setNotifsData: ${friendId}`);
		this.friendId = friendId;
		if (type) {
			this.currentNotif = this.notifs.find(n => 
				n.type === type &&
				n.from === this.friendId && 
				n.to === this.currentUser.id
			);
		} 
	}

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
		console.log('On est dans handleNotifications')
		for (const notif of notifs) {
			console.log('On est dans la boucle')
			if (isValidNotificationType(notif.type)) {
				this.currentNotif = notif;
				this.friendId = notif.from;
				if (isUserOnlineStatus(notif.type)) {
					await this.handleUserOnlineStatus(notif);
				}
				console.log('notiftype', notif.type);
				if (isFriendRequestAction(notif.type)) {
					await this.handleNotification();
				}
			}
		}
		this.refreshFriendButtons();
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
	 * Met à jour le compteur de notifications non lues.
	 *
	 * - Si le compteur est égal à zéro, cache le compteur.
	 * - Sinon, affiche le compteur avec la valeur donnée.
	 *
	 * @returns {void}
	 */
	public updateNotifsCounter(): void {
		this.notifCount = this.getNotifCount();
		console.log('this.notifCount', this.notifCount);
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

	private async handleUserOnlineStatus(notif: AppNotification): Promise<void> {
		console.log('On est dans handleUserOnlineStatus');
	}

	/**
	 * Charge les notifications de l'utilisateur courant et les affiche dans la fenêtre de notifications.
	 * Si il n'y a pas de notifications, affiche un message par défaut.
	 *
	 * @returns {Promise<void>} Une promesse qui est resolvée lorsque les notifications sont chargées et affichées.
	 */
	private async loadNotifs(): Promise<void> {
		this.navbarInstance!.notifsWindow.replaceChildren();
		console.log('On est dans loadNotifs');
		this.setCurrentNotifs();
		this.updateNotifsCounter();

		// Si il n'y a pas de notifications, affiche un message par défaut
		if (this.notifCount === 0) {
			this.displayDefaultNotif();
			return;
		}

		// Sinon, parcourt les notifications et crée un élément HTML pour chacune
		this.updateNotifsCounter();
		this.notifs.forEach((notifDb: AppNotification) => {
			this.currentNotif = notifDb;
			this.displayNotif();
		});
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
		console.log('On est dans handleNotification');
		const notifIndex = this.notifs.findIndex((notif) => notif.id === this.currentNotif.id);
		if (notifIndex === -1) {
			this.notifs.push(this.currentNotif);
			storageService.setCurrentNotifs(this.notifs);
			console.log('this.notifs apres push', this.notifs);
			this.updateNotifsCounter();
			this.displayNotif();
			return;
		};
		switch (this.currentNotif.type) {
			case FRIEND_REQUEST_ACTIONS.ADD:
			case FRIEND_REQUEST_ACTIONS.DELETE:
				this.notifs.splice(notifIndex, 1);
				this.deleteNotif();
				this.updateNotifsCounter();
				console.log('this.notifs apres delete', this.notifs);
				break;
			default:
				this.notifs[notifIndex] = this.currentNotif;
				this.replaceNotif();
				console.log('this.notifs apres replace', this.notifs);
				break;
		}
		storageService.setCurrentNotifs(this.notifs);
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
		if (this.currentUser.notifications.length > 0) {
			console.log("bla");
			this.notifs = this.currentUser.notifications;
			console.log(this.notifs);
			return;
		}
		const result: NotifResponse = await notifApi.getUserNotifications();
		if (result.errorMessage) {
			console.error(result.errorMessage);
			return;
		}
		console.log(result);
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
	 *
	 * Si la notification nécessite des boutons d'action, les boutons
	 * sont créés en utilisant `this.createNotifButtonsHTML()` et des écouteurs d'événements sont attachés
	 * en utilisant `this.attachListeners()`.
	 */
	private displayNotif(): void {
		this.removeDefaultNotif();
		this.notifItem = this.createNotifElement();
		if (this.needButtons()) {
			console.log('BLOUUUULJQSFHNSL/DHF');
			this.notifItem.innerHTML += this.createNotifButtonsHTML();
		}
		this.navbarInstance!.notifsWindow.appendChild(this.notifItem);
		this.notifItem = getHTMLElementById(`notif-${this.currentNotif.id}`, this.navbarInstance!.notifsWindow) as HTMLDivElement;
		this.attachListeners();
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
		this.displayDefaultNotif();
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
			await this.currentPage.updateFriendButtons!(this.friendId!, userRowInstance);
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
		if (this.getNotifCount() > 0)
			return;
		const notifItem = document.createElement('div');
		notifItem.classList.add('default-notif');
		notifItem.textContent = 'No notification yet.';
		this.navbarInstance!.notifsWindow.appendChild(notifItem);
	}

	/**
	 * Supprime l'élément HTML indiquant qu'il n'y a pas encore de notification,
	 * s'il existe.
	 *
	 * Cette méthode recherche l'élément HTML avec la classe 'default-notif' dans la fenêtre
	 * de notifications et l'enlève du DOM en utilisant la méthode `remove()`.
	 */
	private removeDefaultNotif() {
		if (this.getNotifCount() > 0) {
			const notifItem = this.navbarInstance!.notifsWindow.querySelector('.default-notif');
			if (notifItem) {
				notifItem.remove();
			}
		}
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
		let res = await friendApi.addFriend(this.friendId!);
		if ('errorMessage' in res) {
			console.error(res.errorMessage);
			return;
		}
		await this.refreshFriendButtons();
	}

	public handleCancelClick = async (): Promise<void> => {
		console.log("CANCEL CLICK: Cancel friend request from user ID:", this.currentUser.id, "to user ID:", this.friendId!);
		const data = {
			id: 0,
			to: this.friendId
		}
		let res = await friendApi.removeFriend(this.friendId!, data);
		if ('errorMessage' in res) {
			console.error(res.errorMessage);
			return;
		}
		await this.refreshFriendButtons();
	}

	public handleDeclineClick = async (): Promise<void> => {
		console.log("DECLINE CLICK: Decline friend request from user ID:", this.currentUser.id, "to user ID:", this.friendId!);
		let res = await friendApi.removeFriend(this.friendId!, this.currentNotif);
		if ('errorMessage' in res) {
			console.error(res.errorMessage);
			return;
		}
		await this.handleNotifications(res);
	}

	public handleAcceptClick = async (): Promise<void> => {
		console.log("ACCEPPPPPT Accepting friend request from user ID:", this.currentUser.id, "to user ID:", this.friendId!);
		console.log(this.currentNotif);
		if (this.currentNotif.type !== FRIEND_REQUEST_ACTIONS.ADD) {
			console.error("Invalid notification type for accepting friend request", this.currentNotif.type);
			return;
		}
		this.currentNotif.toType = FRIEND_REQUEST_ACTIONS.ACCEPT;
		let res = await friendApi.updateFriend(this.friendId!, this.currentNotif);
		if ('errorMessage' in res) {
			console.error(res.errorMessage);
			return;
		}
		await this.handleNotifications(res);
	}

	public handleBlockClick = async (): Promise<void> => {
		console.log("BLOCKKKKK Blocking friend:", this.friendId!);
		if (this.currentNotif.type !== FRIEND_REQUEST_ACTIONS.ACCEPT) {
			console.error("Invalid notification type for accepting friend request", this.currentNotif.type);
			return;
		}
		this.currentNotif.toType = FRIEND_REQUEST_ACTIONS.BLOCK;
		let res = await friendApi.updateFriend(this.friendId!, this.currentNotif);
		if ('errorMessage' in res) {
			console.error(res.errorMessage);
			return;
		}
		await this.handleNotifications(res);
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
	 * @returns {string} Le HTML des boutons d'actions.
	 */
	private createNotifButtonsHTML(): string {
		let html = `<div class="notif-actions flex justify-center space-x-4">`;
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
		html += `</div>`;
		return html;
	}
}