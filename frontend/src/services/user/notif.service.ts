import { ROUTE_PATHS } from '../../config/routes.config';
import { notifApi, friendApi, dataApi } from '../../api/index.api';
import { PageInstance } from '../../types/routes.types';
import { COMPONENT_NAMES } from '../../config/components.config';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { UserRowComponent } from '../../components/user-row/user-row.component';
import { currentService, storageService } from './user.service';
import { User } from '../../shared/models/user.model';
import { Friend } from '../../shared/models/friend.model';
import { AppNotification } from '../../shared/models/notification.model';
import { NotifResponse } from '../../shared/types/response.types';
import { FRIEND_REQUEST_ACTIONS, USER_ONLINE_STATUS } from '../../shared/config/constants.config'; // en rouge car dossier local 'shared' != dossier conteneur
import { isValidNotificationType, isFriendRequestAction, isUserOnlineStatus } from '../../shared/utils/app.utils';
import { getHTMLElementById, getHTMLElementByClass } from '../../utils/dom.utils';
import { FriendRequestAction, NotificationModel, NotificationType } from '../../shared/types/notification.types';

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

	private relationNotifs: AppNotification[] | null = null;
	private relationFriend: Friend | null = null;
	private notifData: NotificationModel | null = null;

	public currentNotif: AppNotification | null = null;
	public friendId: number | null = null;

	// ===========================================
	// METHODES PUBLICS
	// ===========================================

	/**
	 * Paramètre l'ID de l'ami courant.
	 *
	 * @param {number} friendId - ID de l'ami courant.
	 */
	public setFriendId(friendId: number): void {
		this.friendId = friendId;
	}

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
		} else {
			this.currentNotif = {
				id: 0,
				type: FRIEND_REQUEST_ACTIONS.ADD,
				from: this.currentUser.id,
				to: this.friendId,
				read: 0,
				createdAt: '',
			}
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
				this.friendId = notif.from;
				if (isUserOnlineStatus(notif.type)) {
					console.log('On est dans isUserOnlineStatus', notif.type);
					await this.handleUserOnlineStatus(notif);
				}
				if (isFriendRequestAction(notif.type)) {
					this.currentNotif = notif;
					console.log('On est dans isFriendRequestAction', notif.type);
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
		console.log('this.currentNotif', this.currentNotif);
		this.currentNotif.read = 1;
		const updatedRes = await notifApi.updateNotification(this.currentNotif);
		if ('errorMessage' in updatedRes) {
			console.error(updatedRes.errorMessage);
		}
		console.log(updatedRes);
		await this.handleNotifications(updatedRes);
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
		this.notifCount = this.getNewNotifCount();
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
		if (this.currentPage.config.path === ROUTE_PATHS.USERS) {
			this.currentNotif = notif;
			const user = await dataApi.getUserById(Number(this.currentNotif.from));
			this.currentPage.injectUser!(user);
		}
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
		await this.setCurrentNotifs();

		// Si il n'y a pas de notifications, affiche un message par défaut
		if (this.notifs.length === 0) {
			console.log('Pas de notifications');
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
		this.notifs = result.filter((notif: AppNotification) => !isUserOnlineStatus(notif.type));
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
		if (this.notifs && this.notifs.length > 0) {
			this.currentNotif = this.notifs.find((notif) => notif.id === id);
			console.log(this.currentNotif);
			return;
		}

		const result: NotifResponse = await notifApi.getNotificationById(id);
		if (result.errorMessage) {
			console.error(result.errorMessage);
			return;
		}
		console.log(result);
		this.currentNotif = result;
		console.log('BLA BLANotification rechargée:', this.currentNotif);
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
		console.log('On est dans displayNotif');
		this.removeDefaultNotif();
		this.notifItem = this.createNotifElement();
		if (this.needButtons()) {
			console.log('BLOUUUULJQSFHNSL/DHF');
			this.notifItem.innerHTML += this.createNotifButtonsHTML();
		}
		this.notifItem.classList.add('animate-fade-in-up');
		this.navbarInstance!.notifsWindow.prepend(this.notifItem);
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
	 * Supprime la notification correspondante à l'ID `notifId` de la liste des notifications et
	 * la retire de la fenêtre des notifications de la barre de navigation.
	 *
	 * Si `notifId` est omis, la notification courante est supprimée.
	 *
	 * @param {number} [notifId] - Identifiant de la notification à supprimer. Si omis, la notification courante est supprimée.
	 */
	private deleteNotif(notifId?: number): void {
		const id = notifId ?? this.currentNotif.id;
		const notifIndex = this.notifs.findIndex((notif) => notif.id === id);
		if (notifIndex === -1) {
			console.warn(`[${this.constructor.name}] Aucune notification à supprimer`);
			return;
		}
		this.notifs.splice(notifIndex, 1);
		storageService.setCurrentNotifs(this.notifs);

		this.notifItem = this.navbarInstance!.notifsWindow.querySelector<HTMLDivElement>(`#notif-${this.currentNotif.id}`);
		if (!this.notifItem) {
			console.warn(`[${this.constructor.name}] Aucune notification à supprimer`);
			return;
		}
		this.removeListeners();
		this.notifItem.classList.add('animate-fade-in-down');
		this.notifItem.remove();
		this.displayDefaultNotif();
		this.updateNotifsCounter();
		console.log('ON EST ARRIVE AU BOUT DE LA FONCTION');
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
		const notifItem: HTMLDivElement = document.createElement('div');
		notifItem.classList.add('notif-item');
		notifItem.id = `notif-${this.currentNotif.id}`;
		notifItem.innerHTML = `<span>${this.currentNotif.content}</span>` || '';
		if (this.currentNotif.read === 0) {
			notifItem.classList.add('new-notif');
		}
		const delBtn: HTMLDivElement = document.createElement('div');
		delBtn.classList.add('notif-del');
		delBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
		notifItem.appendChild(delBtn);
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
		if (this.notifs.length > 0)
			return;
		const notifItem = document.createElement('div');
		notifItem.classList.add('default-notif', 'animate-fade-in-up');
		notifItem.textContent = 'No notification yet.';
		this.navbarInstance!.notifsWindow.prepend(notifItem);
	}

	/**
	 * Supprime l'élément HTML indiquant qu'il n'y a pas encore de notification,
	 * s'il existe.
	 *
	 * Cette méthode recherche l'élément HTML avec la classe 'default-notif' dans la fenêtre
	 * de notifications et l'enlève du DOM en utilisant la méthode `remove()`.
	 */
	private removeDefaultNotif() {
		if (this.notifs.length > 0) {
			const notifItem = this.navbarInstance!.notifsWindow.querySelector('.default-notif');
			if (notifItem) {
				notifItem.classList.add('animate-fade-in-down');
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
		const delBtn = this.notifItem!.querySelector('div.notif-del');
		if (delBtn) {
			const notifId = this.currentNotif.id;
			delBtn.addEventListener('click', () => this.deleteNotif(notifId));
		}
	}

	private removeListeners(): void {
		const acceptBtn = this.notifItem!.querySelector('button[data-action="accept"]');
		if (acceptBtn) {
			acceptBtn.removeEventListener('click', this.handleAcceptClick);
		}
		const declineBtn = this.notifItem!.querySelector('button[data-action="decline"]');
		if (declineBtn) {
			declineBtn.removeEventListener('click', this.handleDeclineClick);
		}
		const delBtn = this.notifItem!.querySelector('div.notif-del');
		if (delBtn) {
			delBtn.removeEventListener('click', () => this.deleteNotif());
		}
	}

	/**
	 * Accepte une demande d'amitié, bloque et débloque un ami.
	 *
	 * Envoie une requête PUT à l'API pour mettre à jour l'état de la demande d'amitié.
	 * Si la mise à jour réussit, met à jour les boutons d'amitié correspondant à l'utilisateur
	 * qui a envoyé la demande d'amitié.
	 * Sinon, affiche un message d'erreur.
	 *
	 * @param {FriendRequestAction} action - Action à réaliser sur la demande d'amitié.
	 * @returns {Promise<void>}
	 */
	public async handleUpdate(action: FriendRequestAction): Promise<void> {
		let res = await friendApi.updateFriend(this.friendId!, action);
		if ('errorMessage' in res) {
			console.error(res.errorMessage);
			return;
		}
		await this.refreshFriendButtons();
		await this.setRelationship();
	}

	/**
	 * Supprime un ami de l'utilisateur courant.
	 *
	 * Envoie une requête DELETE à l'API pour supprimer l'ami de l'utilisateur courant.
	 * Si la suppression réussit, met à jour les boutons d'amitié correspondant
	 * à l'utilisateur qui a envoyé la demande d'amitié.
	 * Sinon, affiche un message d'erreur.
	 * 
	 * @param {FriendRequestAction} action - Action à-REALISER sur la demande d'amitié.
	 * @returns {Promise<void>}
	 */
	public async handleDelete(action: FriendRequestAction): Promise<void> {
		let res = await friendApi.removeFriend(this.friendId!, action);
		if ('errorMessage' in res) {
			console.error(res.errorMessage);
			return;
		}
		await this.refreshFriendButtons();
		await this.setRelationship();
	}

	// ===========================================
	// LISTENERS
	// ===========================================

	public setNotifData(type: NotificationType): void {
		this.notifData = {
			type: type,
			to: this.friendId!,
			from: this.currentUser!.id,
		}
	}

	public handleAddClick = async (): Promise<void> => {
		let res = await friendApi.addFriend(this.friendId!);
		if ('errorMessage' in res) {
			console.error(res.errorMessage);
			return;
		}
		await this.refreshFriendButtons();
		await this.setRelationship();
		this.setNotifData(FRIEND_REQUEST_ACTIONS.ADD);
		console.log(this.relationFriend);
		console.log(this.relationNotifs);
		console.log(this.notifData);
		await notifApi.addNotification(this.notifData);
	}

	public handleCancelClick = async (): Promise<void> => {
		const type: NotificationType = FRIEND_REQUEST_ACTIONS.CANCEL;
		this.setNotifData(type);
		await this.handleDelete(type);
		// await notifApi.deleteNotification(this.notifData);
	}

	public handleDeclineClick = async (): Promise<void> => {
		const type: NotificationType = FRIEND_REQUEST_ACTIONS.DECLINE;
		this.setNotifData(type);
		await this.handleDelete(type);
		await notifApi.updateNotification(this.notifData);
	}

	public handleAcceptClick = async (): Promise<void> => {
		const type: NotificationType = FRIEND_REQUEST_ACTIONS.ACCEPT;
		this.setNotifData(type);
		await this.handleUpdate(type);
		await notifApi.updateNotification(this.notifData);
	}

	public handleBlockClick = async (): Promise<void> => {
		const type: NotificationType = FRIEND_REQUEST_ACTIONS.BLOCK;
		this.setNotifData(type);
		await this.handleUpdate(type);
		await notifApi.updateNotification(this.notifData);
	}

	public handleUnblockClick = async (): Promise<void> => {
		const type: NotificationType = FRIEND_REQUEST_ACTIONS.UNBLOCK;
		this.setNotifData(type);
		await this.handleUpdate(type);
		await notifApi.updateNotification(this.notifData);
	}

	public handleUnfriendClick = async (): Promise<void> => {
		const type: NotificationType = FRIEND_REQUEST_ACTIONS.UNFRIEND;
		this.setNotifData(type);
		await this.handleDelete(type);
		// await notifApi.updateNotification(this.notifData);
	}

	// ===========================================
	// UTILS
	// ===========================================

	private getNotifItem(): HTMLDivElement | null {
		return this.navbarInstance!.notifsWindow.querySelector('.notif-item');
	}
	private async setRelationship(): Promise<void> {
		try {
			const result = await friendApi.getNotifsRelation(this.currentUser.id, this.friendId!);

			if ('errorMessage' in result) {
				console.error("Erreur setRelationship:", result.errorMessage);
				this.relationFriend = null;
				this.relationNotifs = [];
				return;
			}

			// Stockage dans les propriétés de la classe
			this.relationFriend = result.friend;
			this.relationNotifs = result.notifications;
		} catch (err) {
			console.error("Exception setRelationship:", err);
			this.relationFriend = null;
			this.relationNotifs = [];
		}
	}

	/**
	 * Retourne le nombre de notifications non lues.
	 *
	 * Recherche et retourne le nombre de notifications dont le statut est 0 (non lu) dans le tableau `notifs`.
	 *
	 * @return {number} Le nombre de notifications non lues.
	 */
	private getNewNotifCount(): number {
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