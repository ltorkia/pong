import DOMPurify from "dompurify";
import { DEFAULT_ROUTE, ROUTE_PATHS } from '../../config/routes.config';
import { notifApi, friendApi, dataApi } from '../../api/index.api';
import { PageInstance } from '../../types/routes.types';
import { COMPONENT_NAMES } from '../../config/components.config';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { UserRowComponent } from '../../components/user-row/user-row.component';
import { User } from '../../shared/models/user.model';
import { GamePage } from '../../pages/game/game.page';
import { AppNotification } from '../../shared/models/notification.model';
import { NotifResponse } from '../../shared/types/response.types';
import { FRIEND_REQUEST_ACTIONS, FRIEND_NOTIF_CONTENT } from '../../shared/config/constants.config'; // en rouge car dossier local 'shared' != dossier conteneur
import { isValidNotificationType, isFriendRequestAction, isUserOnlineStatus } from '../../shared/utils/app.utils';
import { getHTMLElementById } from '../../utils/dom.utils';
import { FriendRequestAction, NotificationModel, NotificationType } from '../../shared/types/notification.types';
import { currentService, storageService, translateService, gameService, friendService } from '../index.service';
import { router } from '../../router/router';

// ============================================================================
// NOTIF SERVICE
// ============================================================================
/**
 * Service de gestion des notifications.
 */
export class NotifService {
	private currentUser: User | null = null;
	private currentPage!: PageInstance;
	public navbarInstance!: NavbarComponent | undefined;

	public notifs: AppNotification[] = [];
	private notifData: Partial<NotificationModel> | null = null;
	private notifCount: number = 0;
	private notifItem: HTMLDivElement | null = null;
	private notifDeleteHandlers: Map<number, EventListener> = new Map();

	public currentNotif: AppNotification | null = null;
	public friendId: number | null = null;
	public friendName: string | null = null;	
	
	private notifHandlers: Map<number, {
		accept?: EventListener;
		decline?: EventListener;
		play?: EventListener;
		delete?: EventListener;
	}> = new Map();

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
		translateService.updateLanguage(undefined, this.navbarInstance!.notifsWindow);
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
					this.friendId = this.currentNotif.from;
					const friend = await dataApi.getUserById(Number(this.friendId!));
					this.friendName = friend!.username;
					await this.handleNotification();
				}
			}
		}
		this.updateNotifsCounter();
		await this.refreshFriendButtons();
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
		this.notifs[index] = updatedRes as AppNotification;
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
		if (this.currentPage.config.path === ROUTE_PATHS.USERS
			|| this.currentPage.config.path === ROUTE_PATHS.PROFILE) {
			this.currentNotif = notif;
			const user = await dataApi.getUserById(Number(this.currentNotif.from));
			if (!user)
				return;
			switch (this.currentPage.config.path) {
				case ROUTE_PATHS.USERS:
					await this.currentPage.injectUser!(user);
					break;
				case ROUTE_PATHS.PROFILE:
					this.currentPage.renderUserStatus!(user);
					break;
			}
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
		this.notifs.forEach(async (notifDb: AppNotification) => {
			this.currentNotif = notifDb;
			this.friendId = this.currentNotif.from;
			const friend = await dataApi.getUserById(Number(this.friendId!));
			this.friendName = friend!.username;
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
	 * - Dans le cas d'une nouvelle invitation à jouer, met à jour le bouton 'Replay' en 'Accept new game'.
	 * 
	 * @returns {Promise<void>} Une promesse qui est résolue lorsque la notification est traitée.
	 */
	private async handleNotification(): Promise<void> {
		const notifIndex = this.notifs.findIndex((notif) => notif.id === this.currentNotif!.id);
		if (notifIndex === -1) {
			this.notifs.push(this.currentNotif!);
			storageService.setCurrentNotifs([...this.notifs]);
			this.displayNotif();
			await this.deleteAllNotifsFromUser(this.currentNotif!.from, this.currentNotif!.id);
			if (this.currentPage instanceof GamePage) {
				if (this.currentPage.config.path === ROUTE_PATHS.GAME_MULTI
					&& this.currentPage.challengedFriendID === this.currentNotif!.from) {
					switch (this.currentNotif!.type) {
						case FRIEND_REQUEST_ACTIONS.INVITE:
							// TODO: fix update bouton
							// console.log('ON EST DANS LA CONDITION DE handleNotification');
							this.currentPage.changeReplayButtonForInvite()!;
							this.currentPage.setCleanInvite();
							break;
					}
				} 
				else {
					switch (this.currentNotif!.type) {
						case FRIEND_REQUEST_ACTIONS.INVITE:
							this.currentPage.setCleanInvite();
							break;
					}
				}
			}
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
		if (this.currentUser!.notifications.length > 0) {
			this.notifs = this.currentUser!.notifications;
			return;
		}
		const response = await notifApi.getUserNotifications();
		let result: NotifResponse;
		if (Array.isArray(response))
			result = { notifs: response }; 
		else
			result = { errorMessage: response.errorMessage };

		if ('notifs' in result) {
			const notifs = result.notifs as AppNotification[];
			this.notifs = notifs.filter(
				notif => !isUserOnlineStatus(notif.type) 
				&& notif.content != null && notif.content !== '');
		} else {
			this.notifs = [];
			console.warn(result.errorMessage);
		}
		storageService.setCurrentNotifs([...this.notifs]);
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
		if (!this.currentNotif!.content)
			return;
		this.removeDefaultNotif();
		this.notifItem = this.createNotifElement();
		if (this.needButtons())
  			this.notifItem.insertAdjacentHTML("beforeend", this.createNotifButtonsHTML());
		translateService.updateLanguage(undefined, this.notifItem);
		this.notifItem.classList.add('animate-fade-in-up');
		this.navbarInstance!.notifsWindow.prepend(this.notifItem);
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
		const id = notifId ?? this.currentNotif!.id;
		const notifIndex = this.notifs.findIndex((notif) => notif.id === id);

		if (notifIndex === -1) {
			console.warn(`[${this.constructor.name}] Notification ${id} introuvable dans la liste`);
			return;
		}
		const notifItem = this.navbarInstance!.notifsWindow.querySelector<HTMLDivElement>(`#notif-${id}`);
		if (!notifItem) {
			console.warn(`[${this.constructor.name}] Élément DOM #notif-${id} introuvable`);
			return;
		}
		await notifApi.deleteNotification(id);
		this.notifs.splice(notifIndex, 1);
		storageService.setCurrentNotifs([...this.notifs]);
		this.displayDefaultNotif();
		this.removeListeners(id);
		notifItem.classList.remove("animate-fade-in-up");
		notifItem.classList.add("animate-fade-out-down");

		notifItem.addEventListener("animationend", () => {
			notifItem!.remove();
			this.navbarInstance!.notifsWindow.classList.add("scrolled");
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
	 * Met à jour les boutons d'amitié pour la page des utilisateurs ou du profil si affichée.
	 *
	 * Si la page des utilisateurs est affichée, appelle la méthode toggleFriendButtons de friendService
	 * pour mettre à jour les boutons d'amitié correspondant.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les boutons d'amitié ont été mis à jour.
	 */
	private async refreshFriendButtons(): Promise<void> {
		await friendService.toggleFriendButton();
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
		notifItem.id = `notif-${this.currentNotif!.id}`;
		const dataTsLabel = this.getDataTsLabel(this.currentNotif!.content);
		notifItem.innerHTML = DOMPurify.sanitize(`<div>${this.friendName!} <span data-ts="${dataTsLabel}">${this.currentNotif!.content}</span></div>`) || '';
		if (this.currentNotif!.read === 0) {
			notifItem.classList.add('new-notif');
		}
		const delBtn: HTMLDivElement = document.createElement('div');

      	(delBtn as HTMLDivElement).setAttribute("data-friend-id", this.currentNotif!.from.toString());
		delBtn.classList.add('notif-del');
		delBtn.innerHTML = DOMPurify.sanitize('<i class="fa-solid fa-xmark"></i>');
		notifItem.appendChild(delBtn);
		return notifItem;
	}

	/**
	 * Crée un élément HTML pour indiquer qu'il n'y a pas encore de notification,
	 * et l'ajoute à la fenêtre de notifications.
	 *
	 * Cette méthode crée un élément HTML avec la classe 'default-notif' et le texte
	 * "No new notifications.", puis l'ajoute à la fenêtre de notifications.
	 */
	public displayDefaultNotif() {
		const displayedNotifsLength = this.getDisplayedNotifsCount();
		const defaultItem = this.navbarInstance!.notifsWindow.querySelector('.default-notif');
		if (displayedNotifsLength > 0 || defaultItem)
			return;
		const notifItem = document.createElement('div');
		notifItem.classList.add('default-notif', 'animate-fade-in-up');
		notifItem.setAttribute('data-ts', 'notif.noNew');
		notifItem.textContent = 'No new notifications.';
		this.navbarInstance!.notifsWindow.prepend(notifItem);
		const newDefaultItem = this.navbarInstance!.notifsWindow.querySelector('.default-notif');
		translateService.updateLanguage(undefined, newDefaultItem!);
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
	 * - Récupère les boutons 'accept', 'decline', 'play' et 'delete' de la notification actuelle.
	 * - Si les boutons existent, ajoute des listeners pour gérer les événements de clic.
	 * - Les handlers sont stockés dans une Map pour pouvoir les supprimer proprement.
	 */
	private attachListeners(): void {
		const notifId = this.currentNotif!.id;
		const handlers: any = {};

		// Bouton Accept
		const acceptBtn = this.notifItem!.querySelector('button[data-action="accept"]');
		if (acceptBtn) {
			handlers.accept = (ev: Event) => this.handleAcceptClick(ev);
			acceptBtn.addEventListener('click', handlers.accept);
		}

		// Bouton Decline
		const declineBtn = this.notifItem!.querySelector('button[data-action="decline"]');
		if (declineBtn) {
			handlers.decline = (ev: Event) => this.handleDeclineClick(ev);
			declineBtn.addEventListener('click', handlers.decline);
		}

		// Bouton Play
		const playBtn = this.notifItem!.querySelector('button[data-action="play"]');
		if (playBtn) {
			handlers.play = (ev: Event) => this.handlePlayClick(ev);
			playBtn.addEventListener('click', handlers.play);
		}

		// Bouton Delete
		const delBtn = this.notifItem!.querySelector('div.notif-del');
		if (delBtn) {
			handlers.delete = async (ev: Event) => await this.deleteNotif(notifId);
			delBtn.addEventListener('click', handlers.delete);
		}

		// Stocker tous les handlers pour cette notification
		this.notifHandlers.set(notifId, handlers);
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
	 * Elle enlève les listeners de clic sur les boutons 'accept', 'decline', 'play' et 'delete'
	 * de la notification correspondante.
	 *
	 * @param {number} notifId - Identifiant de la notification pour laquelle enlever les listeners.
	 */
	private removeListeners(notifId: number): void {
		const notifItem = this.navbarInstance!.notifsWindow.querySelector<HTMLDivElement>(`#notif-${notifId}`);
		if (!notifItem) {
			console.warn(`[${this.constructor.name}] Élément DOM #notif-${notifId} introuvable pour suppression des listeners`);
			return;
		}

		const handlers = this.notifHandlers.get(notifId);
		if (!handlers) {
			console.warn(`[${this.constructor.name}] Aucun handler trouvé pour la notification ${notifId}`);
			return;
		}

		// Supprimer le listener du bouton Accept
		const acceptBtn = notifItem.querySelector('button[data-action="accept"]');
		if (acceptBtn && handlers.accept) {
			acceptBtn.removeEventListener('click', handlers.accept);
		}

		// Supprimer le listener du bouton Decline
		const declineBtn = notifItem.querySelector('button[data-action="decline"]');
		if (declineBtn && handlers.decline) {
			declineBtn.removeEventListener('click', handlers.decline);
		}

		// Supprimer le listener du bouton Play
		const playBtn = notifItem.querySelector('button[data-action="play"]');
		if (playBtn && handlers.play) {
			playBtn.removeEventListener('click', handlers.play);
		}

		// Supprimer le listener du bouton Delete
		const delBtn = notifItem.querySelector('div.notif-del');
		if (delBtn && handlers.delete) {
			delBtn.removeEventListener('click', handlers.delete);
		}

		// Nettoyer la Map
		this.notifHandlers.delete(notifId);
	}

	/**
	 * Méthode utilitaire pour nettoyer tous les listeners en cas de destruction du service
	 */
	public cleanupListeners(): void {
		for (const notifId of this.notifHandlers.keys())
			this.removeListeners(notifId);
		this.notifHandlers.clear();
	}

	/**
	 * Accepte une demande d'amitié, bloque et débloque un ami.
	 *
	 * Envoie une requête PUT à l'API pour mettre à jour l'état de la demande d'amitié.
	 * Si la mise à jour réussit, met à jour les boutons d'amitié correspondant à l'utilisateur
	 * qui a envoyé la demande d'amitié.
	 * Sinon, affiche un message d'erreur.
	 * ! Dans le cas d'une invitation à jouer, 'handleUpdate' n'est pas appelée car 
	 * ! la mise à jour en db + envoi de la notif se font directement dans le back.
	 *
	 * @param {FriendRequestAction} action - Action à réaliser sur la demande d'amitié.
	 * @returns {Promise<void>}
	 */
	public async handleUpdate(action: FriendRequestAction): Promise<void> {
		if (!this.friendId || !this.notifData) {
			console.warn("FriendId et/ou notifData manquant(s)");
			return;
		}
		const res = await friendApi.updateFriend(this.friendId, action);
		if ('errorMessage' in res) {
			console.error(res.errorMessage);
			return;
		}
		await this.refreshFriendButtons();
		await this.deleteAllNotifsFromUser(this.notifData.to!);
		this.displayDefaultNotif();
		await notifApi.addNotification(this.notifData!);
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
		if (!this.friendId || !this.notifData) {
			console.warn("FriendId et/ou notifData manquant(s)");
			return;
		}
		let res = await friendApi.removeFriend(this.friendId, action);
		if ('errorMessage' in res) {
			console.error(res.errorMessage);
			return;
		}
		await this.refreshFriendButtons();
		await this.deleteAllNotifsFromUser(this.notifData!.to!);
		this.displayDefaultNotif();
		await notifApi.addNotification(this.notifData!);
	}

	// ===========================================
	// LISTENERS
	// ===========================================

	public handleAddClick = async (event: Event): Promise<void> => {
		const target = event.target as HTMLElement;
		this.setFriendId(target);
		let res = await friendApi.addFriend(this.friendId!);
		if ('errorMessage' in res) {
			console.error(res.errorMessage);
			return;
		}
		await this.refreshFriendButtons();
		this.setNotifData(FRIEND_REQUEST_ACTIONS.ADD);
		await notifApi.addNotification(this.notifData!);
	}

	public handleCancelClick = async (event: Event): Promise<void> => {
		const type: NotificationType = FRIEND_REQUEST_ACTIONS.CANCEL;
		const target = event.target as HTMLElement;
		this.setFriendId(target);
		this.setNotifData(type, 1);
		await this.handleDelete(type);
	}

	public handleDeclineClick = async (event: Event): Promise<void> => {
		const type: NotificationType = FRIEND_REQUEST_ACTIONS.DECLINE;
		const target = event.target as HTMLElement;
		this.setFriendId(target);
		this.setNotifData(type, 1);
		await this.handleDelete(type);
	}

	public handleAcceptClick = async (event: Event): Promise<void> => {
		const type: NotificationType = FRIEND_REQUEST_ACTIONS.ACCEPT;
		const target = event.target as HTMLElement;
		this.setFriendId(target);
		this.setNotifData(type);
		await this.handleUpdate(type);
	}

	public handleBlockClick = async (event: Event): Promise<void> => {
		const type: NotificationType = FRIEND_REQUEST_ACTIONS.BLOCK;
		const target = event.target as HTMLElement;
		this.setFriendId(target);
		this.setNotifData(type, 1);
		await this.handleUpdate(type);
	}

	public handleUnblockClick = async (event: Event): Promise<void> => {
		const type: NotificationType = FRIEND_REQUEST_ACTIONS.UNBLOCK;
		const target = event.target as HTMLElement;
		this.setFriendId(target);
		this.setNotifData(type, 1);
		await this.handleUpdate(type);
	}

	public handleUnfriendClick = async (event: Event): Promise<void> => {
		const type: NotificationType = FRIEND_REQUEST_ACTIONS.UNFRIEND;
		const target = event.target as HTMLElement;
		this.setFriendId(target);
		this.setNotifData(type, 1);
		await this.handleDelete(type);
	}

	public handleChallengeClick = async (event: Event): Promise<void> => {
		const type: NotificationType = FRIEND_REQUEST_ACTIONS.INVITE;
		const target = event.target as HTMLElement;
		this.setFriendId(target);
		this.setNotifData(type);
		const relation = await friendApi.getRelation(this.currentUser!.id, this.friendId!);
		if (!relation || "errorMessage" in relation || relation.challengedBy != this.friendId!) {
			console.error("errorMessage" in relation ? relation.errorMessage : "Invitation invalide.");
			return;
		}
		await this.handleUpdate(type);
		if ((this.currentPage.config.path !== ROUTE_PATHS.GAME_MULTI 
				&& !(this.currentPage instanceof GamePage))
			|| ((this.currentPage instanceof GamePage)
			&& this.currentPage.challengedFriendID !== this.friendId)) {
			try {
				await gameService.invitePlayer(FRIEND_REQUEST_ACTIONS.INVITE, this.friendId!);
			} catch (err) {
				console.error(err);
			}
			await router.navigate(`/game/multi/${this.friendId!}`);
		} else if (this.currentPage.challengedFriendID! === this.friendId!)
			await this.currentPage.checkInviteReplayRequest!();
	}

	public handlePlayClick = async (event: Event): Promise<void> => {
		const type: NotificationType = FRIEND_REQUEST_ACTIONS.INVITE_ACCEPT;
		const target = event.target as HTMLElement;
		this.setFriendId(target);
		this.setNotifData(type);
		const relation = await friendApi.getRelation(this.currentUser!.id, this.friendId!);
		if (!relation || "errorMessage" in relation || relation.challengedBy != this.friendId!) {
			console.error("errorMessage" in relation ? relation.errorMessage : "Invitation invalide.");
			return;
		}

		if (this.currentPage instanceof GamePage
			&& this.currentPage.challengedFriendID === this.friendId) {
			await this.currentPage.checkInviteReplayRequest?.();
			this.currentPage.setCleanInvite(true);
			await this.handleUpdate(type);
			return;
		}
		await router.navigate(`/game/multi/${this.friendId!}`);
		await this.handleUpdate(type);
	}

	public handleCancelInvite = async (friendId: number): Promise<void> => {
		const type: NotificationType = FRIEND_REQUEST_ACTIONS.INVITE_CANCEL;
		this.setFriendId(friendId);
		this.setNotifData(type);
		await this.handleUpdate(type);
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
	private setFriendId(target: HTMLElement | number): void { 
		if (typeof target === 'number') {
			this.friendId = target;
			return;
		}
		const button = target.closest('button[data-friend-id]') as HTMLElement | null;
		if (!button) {
			console.error("Pas de friendId sur le bouton ou parent");
			return;
		}
		const friendId = button.getAttribute("data-friend-id");
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
		const type = this.currentNotif!.type;
		return type === FRIEND_REQUEST_ACTIONS.ADD || type === FRIEND_REQUEST_ACTIONS.INVITE;
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
		switch (this.currentNotif!.type) {
			case FRIEND_REQUEST_ACTIONS.ADD:
				html += `
					<button class="btn smaller-btn" data-ts="notif.accept" data-action="accept" data-friend-id="${this.currentNotif!.from}">
						Accept
					</button>
					<button class="btn smaller-btn" data-ts="notif.decline" data-action="decline" data-friend-id="${this.currentNotif!.from}">
						Decline
					</button>
				`;
				break;
			case FRIEND_REQUEST_ACTIONS.INVITE:
				html += `
					<button class="btn smaller-btn" data-ts="notif.invite" data-action="play" data-friend-id="${this.currentNotif!.from}">
						Play
					</button>
				`;
				break;
			default:
		}
		html += `</div>`;
		return DOMPurify.sanitize(html);
	}

	/**
	 * Renvoie le label de traduction en fonction du contenu de la notification.
	 *
	 * @param content Le contenu de la notification.
	 * @returns Le label de traduction correspondant.
	 */
	private getDataTsLabel(content: string | null): string {
		if (!content)
			return '';
		if (content.includes(FRIEND_NOTIF_CONTENT.ADD)) 
			return 'notif.friendRequest';
		if (content.includes(FRIEND_NOTIF_CONTENT.ACCEPT)) 
			return 'notif.friendAccept';
		if (content.includes(FRIEND_NOTIF_CONTENT.INVITE)) 
			return 'notif.friendInvite';
		if (content.includes(FRIEND_NOTIF_CONTENT.INVITE_ACCEPT)) 
			return 'notif.friendInviteAccept';
		if (content.includes(FRIEND_NOTIF_CONTENT.INVITE_CANCEL)) 
			return 'notif.friendInviteCancel';
		return '';
	}
}