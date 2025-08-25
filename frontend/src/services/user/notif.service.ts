import { ROUTE_PATHS } from '../../config/routes.config';
import { notifApi, friendApi, dataApi } from '../../api/index.api';
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
	private notifData: NotificationModel | null = null;
	private notifCount: number = 0;
	private notifItem: HTMLDivElement | null = null;
	private notifDeleteHandlers: Map<number, EventListener> = new Map();

	public currentNotif: AppNotification | null = null;
	public notifFromCurrentFlag: boolean = false;
	public friendId: number | null = null;

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
			if (isValidNotificationType(notif.type)) {
				this.friendId = notif.from;
				if (isUserOnlineStatus(notif.type)) {
					await this.handleUserOnlineStatus(notif);
				}
				if (isFriendRequestAction(notif.type)) {
					this.currentNotif = notif;
					await this.handleNotification();
				}
			}
		}
		this.updateNotifsCounter();
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
		const updatedRes = await notifApi.updateNotification(id);
		if ('errorMessage' in updatedRes) {
			console.error(updatedRes.errorMessage);
		}
		const index = this.notifs.findIndex((notif) => notif.id === id);
		this.notifs[index] = updatedRes;
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
		if (this.currentPage.config.path === ROUTE_PATHS.USERS) {
			this.currentNotif = notif;
			const user = await dataApi.getUserById(Number(this.currentNotif.from));
			if (!user)
				return;
			await this.currentPage.injectUser!(user);
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
		await this.setCurrentNotifs();

		// Si il n'y a pas de notifications, affiche un message par défaut
		if (this.notifs.length === 0) {
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
		const notifIndex = this.notifs.findIndex((notif) => notif.id === this.currentNotif.id);
		if (notifIndex === -1) {
			this.notifs.push(this.currentNotif);
			storageService.setCurrentNotifs(this.notifs);
			this.displayNotif();
			await this.deleteAllNotifsFromUser(this.currentNotif.from, this.currentNotif.id);
		};
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
			this.notifs = this.currentUser.notifications;
			return;
		}
		const result: NotifResponse = await notifApi.getUserNotifications();
		if (result.errorMessage) {
			console.error(result.errorMessage);
			return;
		}
		this.notifs = result.filter((notif: AppNotification) => 
			!isUserOnlineStatus(notif.type) &&
        	notif.content != null && notif.content !== '');
		storageService.setCurrentNotifs(this.notifs);
		console.log('Notifications rechargées:', this.notifs);
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
		if (!this.currentNotif.content)
			return;
		this.removeDefaultNotif();
		this.notifItem = this.createNotifElement();
		if (this.needButtons()) {
			this.notifItem.innerHTML += this.createNotifButtonsHTML();
		}
		this.notifItem.classList.add('animate-fade-in-up');
		this.navbarInstance!.notifsWindow.prepend(this.notifItem);
		this.notifItem = getHTMLElementById(`notif-${this.currentNotif.id}`, this.navbarInstance!.notifsWindow) as HTMLDivElement;
		this.attachListeners();
	}

	/**
	 * Supprime une notification de la liste des notifications de l'utilisateur courant.
	 *
	 * Si l'identifiant de la notification est fourni, la méthode supprime la notification
	 * correspondante. Sinon, la méthode supprime la notification courante.
	 *
	 * La méthode supprime également l'élément HTML de la notification de la fenêtre des
	 * notifications et met à jour le compteur de notifications.
	 *
	 * @param {number} [notifId] - Identifiant de la notification à supprimer.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque la notification est supprimée.
	 */
	private async deleteNotif(notifId?: number): Promise<void> {
		const id = notifId ?? this.currentNotif.id;
		const notifIndex = this.notifs.findIndex((notif) => notif.id === id);
		if (notifIndex === -1) {
			console.warn(`[${this.constructor.name}] Aucune notification à supprimer`);
			return;
		}

		this.notifItem = this.navbarInstance!.notifsWindow.querySelector<HTMLDivElement>(`#notif-${id}`);
		if (!this.notifItem) {
			console.warn(`[${this.constructor.name}] Aucune notification à supprimer`);
			return;
		}

		await notifApi.deleteNotification(id);
		this.notifs.splice(notifIndex, 1);
		storageService.setCurrentNotifs(this.notifs);
		this.displayDefaultNotif();

		this.removeListeners(id);
		this.notifItem.classList.remove('animate-fade-in-up');
		this.notifItem.classList.add('animate-fade-out-down');
		
		this.notifItem.addEventListener('animationend', () => {
			this.notifItem?.remove();
			this.navbarInstance!.notifsWindow.classList.add('scrolled');
			this.updateNotifsCounter();
		}, { once: true });
	}

	/**
	 * Supprime toutes les notifications envoyées par l'utilisateur d'identifiant `userId`.
	 *
	 * @param {number} userId - Identifiant de l'utilisateur qui a envoyé les notifications.
	 * @param {number} notifId - Identifiant de la notification courante à garder.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les notifications sont supprimées.
	 */
	private async deleteAllNotifsFromUser(userId: number, notifId?: number): Promise<void> {
		let notifs;
		if (notifId)
			notifs = this.notifs.filter((notif) => notif.from == userId && notif.id != notifId 
				&& notif.content !== null && notif.content !== '');
		else
			notifs = this.notifs.filter((notif) => notif.from == userId 
				&& notif.content !== null && notif.content !== '');

		if (notifs.length === 0)
			return;
		for (const notif of notifs)
			await this.deleteNotif(notif.id);
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

      	(delBtn as HTMLDivElement).setAttribute("data-friend-id", this.currentNotif.from.toString());
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
		const displayedNotifsLength = this.getDisplayedNotifsCount();
		const defaultItem = this.navbarInstance!.notifsWindow.querySelector('.default-notif');
		if (displayedNotifsLength > 0 || defaultItem)
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
		const displayedNotifsLength = this.getDisplayedNotifsCount();
		const defaultItem = this.navbarInstance!.notifsWindow.querySelector('.default-notif');
		if (displayedNotifsLength > 0 || defaultItem) {
			if (defaultItem) {
				defaultItem.classList.add('animate-fade-out-down');
				defaultItem.remove();
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
			acceptBtn.addEventListener('click', this.handleAcceptClick as (ev: Event) => void);
		}
		const declineBtn = this.notifItem!.querySelector('button[data-action="decline"]');
		if (declineBtn) {
			declineBtn.addEventListener('click', this.handleDeclineClick as (ev: Event) => void);
		}
		const delBtn = this.notifItem!.querySelector('div.notif-del');
		if (delBtn) {
			const notifId = this.currentNotif.id;
			this.attachDeleteListener(notifId, delBtn as HTMLElement);
		}
	}

	/**
	 * Ajoute un listener pour gérer le clic sur le bouton de suppression
	 * d'une notification.
	 *
	 * Lorsque le bouton est cliqué, la méthode `deleteNotif` est appelée
	 * avec l'identifiant de la notification en paramètre.
	 * Le listener est stocké dans l'objet `notifDeleteHandlers` pour
	 * être enlevé plus tard.
	 *
	 * @param {number} notifId - Identifiant de la notification pour laquelle
	 * ajouter le listener.
	 * @param {HTMLElement} delBtn - Bouton de suppression de la notification.
	 */
	private attachDeleteListener(notifId: number, delBtn: HTMLElement) {
		const handler = async () => this.deleteNotif(notifId);
		delBtn.addEventListener('click', handler);
		this.notifDeleteHandlers.set(notifId, handler);
	}

	/**
	 * Enlève les listeners ajoutés par `attachListeners` pour une notification spécifique.
	 *
	 * Cette méthode est appelée lorsque la notification est supprimée ou remplacée.
	 * Elle enlève les listeners de clic sur les boutons 'accept', 'decline' et 'delete'
	 * de la notification correspondante.
	 *
	 * @param {number} notifId - Identifiant de la notification pour laquelle enlever les listeners.
	 */
	private removeListeners(notifId: number): void {
		const acceptBtn = this.notifItem!.querySelector('button[data-action="accept"]');
		if (acceptBtn) {
			acceptBtn.removeEventListener('click', this.handleAcceptClick as (ev: Event) => void);
		}
		const declineBtn = this.notifItem!.querySelector('button[data-action="decline"]');
		if (declineBtn) {
			declineBtn.removeEventListener('click', this.handleDeclineClick as (ev: Event) => void);
		}
		const delBtn = this.notifItem!.querySelector('div.notif-del');
		if (delBtn) {
			const handler = this.notifDeleteHandlers.get(notifId);
			if (handler)
				delBtn.removeEventListener('click', handler);
			this.notifDeleteHandlers.delete(notifId);
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
		await this.deleteAllNotifsFromUser(this.notifData.to);
		this.displayDefaultNotif();
		await notifApi.addNotification(this.notifData);
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
		await this.deleteAllNotifsFromUser(this.notifData.to);
		this.displayDefaultNotif();
		await notifApi.addNotification(this.notifData);
	}

	// ===========================================
	// LISTENERS
	// ===========================================

	public handleAddClick = async (event: Event): Promise<void> => {
  		const target = event.currentTarget as HTMLElement;
		this.setFriendId(target);
		let res = await friendApi.addFriend(this.friendId!);
		if ('errorMessage' in res) {
			console.error(res.errorMessage);
			return;
		}
		await this.refreshFriendButtons();
		this.setNotifData(FRIEND_REQUEST_ACTIONS.ADD);
		await notifApi.addNotification(this.notifData);
	}

	public handleCancelClick = async (event: Event): Promise<void> => {
		const type: NotificationType = FRIEND_REQUEST_ACTIONS.CANCEL;
  		const target = event.currentTarget as HTMLElement;
		this.setFriendId(target);
		this.setNotifData(type, 1);
		await this.handleDelete(type);
	}

	public handleDeclineClick = async (event: Event): Promise<void> => {
		const type: NotificationType = FRIEND_REQUEST_ACTIONS.DECLINE;
  		const target = event.currentTarget as HTMLElement;
		this.setFriendId(target);
		this.setNotifData(type, 1);
		await this.handleDelete(type);
	}

	public handleAcceptClick = async (event: Event): Promise<void> => {
		const type: NotificationType = FRIEND_REQUEST_ACTIONS.ACCEPT;
  		const target = event.currentTarget as HTMLElement;
		this.setFriendId(target);
		this.setNotifData(type);
		await this.handleUpdate(type);
	}

	public handleBlockClick = async (event: Event): Promise<void> => {
		const type: NotificationType = FRIEND_REQUEST_ACTIONS.BLOCK;
  		const target = event.currentTarget as HTMLElement;
		this.setFriendId(target);
		this.setNotifData(type, 1);
		await this.handleUpdate(type);
	}

	public handleUnblockClick = async (event: Event): Promise<void> => {
		const type: NotificationType = FRIEND_REQUEST_ACTIONS.UNBLOCK;
  		const target = event.currentTarget as HTMLElement;
		this.setFriendId(target);
		this.setNotifData(type, 1);
		await this.handleUpdate(type);
	}

	public handleUnfriendClick = async (event: Event): Promise<void> => {
		const type: NotificationType = FRIEND_REQUEST_ACTIONS.UNFRIEND;
		const target = event.currentTarget as HTMLElement;
		this.setFriendId(target);
		this.setNotifData(type, 1);
		await this.handleDelete(type);
	}

	// ===========================================
	// UTILS
	// ===========================================

	/**
	 * Définit les informations de la notification qui sera envoyée à l'utilisateur qui
	 * a envoyé la demande d'amitié.
	 *
	 * @param {NotificationType} type - Type de la notification.
	 * @param {number} [read = 0] - Statut de lecture de la notification.
	 */
	private setNotifData(type: NotificationType, read: number = 0): void {
		if (!this.friendId) {
			return;
		}
		this.notifData = {
			type: type,
			to: this.friendId,
			from: this.currentUser!.id,
			read: read
		};
	}

	/**
	 * Définit l'identifiant de l'ami en fonction du bouton cliqué.
	 *
	 * @param {HTMLElement} target - Bouton cliqué.
	 */
	private setFriendId(target: HTMLElement): void { 
		const friendId = target.getAttribute("data-friend-id");
		if (!friendId) {
			console.error("Pas de friendId sur le bouton");
			return;
		}
		this.friendId = Number(friendId);
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
	 * Retourne le tableau des notifications qui ont un contenu non vide.
	 *
	 * @return {number} Le nombre de notifications non affichées.
	 */
	private getDisplayedNotifsCount(): number {
		return this.notifs.filter(n => n.content !== '' && n.content !== null).length;
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
			FRIEND_REQUEST_ACTIONS.INVITE
		]
		return Object.values(buttonCases).includes(this.currentNotif.type);
	}

	/**
	 * Crée le HTML pour les boutons d'actions dans une notification.
	 * 
	 * Les boutons sont affichés en fonction de l'action de la notification.
	 * Si la notification est une demande d'amitié, les boutons "Accept" et "Decline"
	 * sont affichés.
	 * Si la notification est une invitation, le bouton "Play" est affiché.
	 * 
	 * @returns {string} Le HTML des boutons d'actions.
	 */
	private createNotifButtonsHTML(): string {
		let html = `<div class="notif-actions flex justify-center space-x-4">`;
		switch (this.currentNotif.type) {
			case FRIEND_REQUEST_ACTIONS.ADD:
				html += `
					<button class="btn smaller-btn" data-action="accept" data-friend-id="${this.currentNotif.from}">
						Accept
					</button>
					<button class="btn smaller-btn" data-action="decline" data-friend-id="${this.currentNotif.from}">
						Decline
					</button>
				`;
				break;
			case FRIEND_REQUEST_ACTIONS.INVITE:
				html += `
					<button class="btn smaller-btn" data-action="invite" data-friend-id="${this.currentNotif.from}">
						Play
					</button>
				`;
				break;
			default:
		}
		html += `</div>`;
		return html;
	}
}