import { ROUTE_PATHS } from '../../config/routes.config';
import { dataApi, notifApi } from '../../api/index.api';
import { PageInstance } from '../../types/routes.types';
import { COMPONENT_NAMES } from '../../config/components.config';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { UserRowComponent } from '../../components/user-row/user-row.component';
import { currentService } from './user.service';
import { User } from '../../shared/models/user.model';
import { Notification } from '../../shared/models/notification.model';
import { NotificationModel, FriendRequestAction } from '../../shared/types/notification.types';
import { FRIEND_REQUEST_ACTIONS } from '../../shared/config/constants.config'; // en rouge car dossier local 'shared' != dossier conteneur
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
	private notifs: Notification[] = [];
	private currentNotif: Notification | NotificationModel | null = null;
	private notifItem: HTMLElement | null = null;

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
	 * Enregistre les données de la notification reçue par socket.
	 * 
	 * @param {Notification | NotificationModel} data - Données de la notification.
	 */
	public setNotifData(data: Notification | NotificationModel): void {
		this.currentNotif = data;
		if (this.currentNotif.id && this.notifItem) {
			this.notifItem.id = `notif-${this.currentNotif.id}`;
			this.notifItem.innerHTML = this.currentNotif!.content || '';
			this.notifItem = getHTMLElementById(`${this.notifItem.id}`, this.navbarInstance!.notifsWindow);
			this.attachListeners();
			if (this.currentNotif!.status === 0) {
				this.notifItem.classList.add('new-notif');
				this.updateNotifsCounter();
			}
		}
	}

	/**
	 * Vérifie si l'objet `data` correspond à une demande d'amitié.
	 *
	 * Une demande d'amitié est un objet qui contient les propriétés suivantes:
	 *
	 * - `action`: une valeur du type `FRIEND_REQUEST_ACTIONS` qui indique
	 *   l'action demandée (envoi, acceptation, suppression, blocage).
	 * - `from`: l'identifiant de l'utilisateur qui envoie la demande.
	 * - `to`: l'identifiant de l'utilisateur destinataire de la demande.
	 *
	 * Si l'objet `data` correspond à ces critères, la fonction renvoie `true`.
	 * Sinon, la fonction renvoie `false`.
	 *
	 * @returns {boolean} Si l'objet `this.currentNotif` correspond à une demande
	 * d'amitié, la fonction renvoie `true`. Sinon, la fonction renvoie `false`.
	 */
	public isFriendRequest(): boolean {
		return (
			this.currentNotif &&
			Object.values(FRIEND_REQUEST_ACTIONS).includes(this.currentNotif.type) &&
			typeof this.currentNotif.from === "number" &&
			typeof this.currentNotif.to === "number"
		);
	}

	/**
	 * Traite une demande d'amitié reçue par socket.
	 *
	 * Selon l'action de la demande, cette fonctionnalité effectue:
	 * - Ajoute une nouvelle notification si l'action est l'envoi d'une demande
	 *   d'amitié (FRIEND_REQUEST_ACTIONS.ADD).
	 * - Ajoute une nouvelle notification si l'action est l'acceptation d'une
	 *   demande d'amitié (FRIEND_REQUEST_ACTIONS.ACCEPT).
	 * - N'affecte pas les notifications si l'action est la suppression d'une
	 *   demande d'amitié (FRIEND_REQUEST_ACTIONS.DELETE).
	 * - N'affecte pas les notifications si l'action est le blocage d'un utilisateur
	 *   (FRIEND_REQUEST_ACTIONS.BLOCK).
	 * - Affiche une erreur si l'action est inconnue.
	 */
	public async handleFriendRequest() {
		if (!this.currentNotif) {
			console.error('currentNotif est null dans handleFriendRequest');
			return;
		}
		switch (this.currentNotif.type) {
			case FRIEND_REQUEST_ACTIONS.ADD:
				console.log("New friend request from user ID:", this.currentNotif.from, "to user ID:", this.currentNotif.to);
				await this.addNewNotification();
				break;
			case FRIEND_REQUEST_ACTIONS.ACCEPT:
				console.log("Friend request accepted from user ID:", this.currentNotif.from, "to user ID:", this.currentNotif.to);
				this.addNewNotification();
				break;
			case FRIEND_REQUEST_ACTIONS.DELETE:
				console.log("Friend request deleted from user ID:", this.currentNotif.from, "to user ID:", this.currentNotif.to);
				break;
			case FRIEND_REQUEST_ACTIONS.BLOCK:
				console.log("User ID:", this.currentNotif.from, "blocked user ID:", this.currentNotif.to);
				break;
			default:
				console.error("Unknown friend request action:", this.currentNotif.type);
				break;
		}
		this.refreshFriendButtons();
	}

	/**
	 * Ajoute une nouvelle notification basée sur le type de socket reçu.
	 *
	 * Cette méthode traite différents types de notifications, en se concentrant
	 * principalement sur les demandes d'amitié. Selon l'action de la demande
	 * (envoi ou acceptation), elle génère le contenu de la notification et,
	 * le cas échéant, crée les boutons d'action correspondants.
	 *
	 * - Vérifie d'abord si la notification est destinée à l'utilisateur actuel.
	 * - Récupère l'utilisateur expéditeur à partir de l'ID fourni.
	 * - Génère le contenu de la notification en fonction de l'action.
	 * - Ajoute la notification à la base de données via l'API.
	 * - Recharge les notifications de l'utilisateur actuel après l'ajout.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout lorsque la notification
	 * a été ajoutée et les notifications rechargées.
	 */
	public async addNewNotification(): Promise<void> {
		if (this.currentNotif.to != this.currentUser!.id) {
			console.error('Notif sans destinataire');
			return;
		}
		const user = await dataApi.getUserById(this.currentNotif.from);
		let notif = '';
		let buttons = null;
		if (this.isFriendRequest()) {
			if (this.currentNotif.type === FRIEND_REQUEST_ACTIONS.ADD) {
				notif = `has sent you a friend request.`;
				buttons = await this.createNotifButtonsHTML();
			}
			if (this.currentNotif.type === FRIEND_REQUEST_ACTIONS.ACCEPT) {
				notif = `has accepted your friend request.`;
			}
		}
		this.currentNotif.content = `<span>${user.username} ${notif}</span>`;
		if (buttons) {
			this.currentNotif.content += buttons;
		}

		const data = this.getNotifData();
		const addNotifDb = await notifApi.addNotification(data);
		if (addNotifDb.errorMessage) {
			console.error(addNotifDb.errorMessage);
			return;
		}
		console.log('Notif ajoutée en bdd:', addNotifDb);
		this.loadNotifs();
	}

	/**
	 * Recharge les notifications de l'utilisateur actuel.
	 *
	 * - Supprime le contenu actuel de la fenêtre de notifications.
	 * - Récupère les notifications de l'utilisateur actuel via l'API.
	 * - Si il n'y a pas de notifications, affiche un message par défaut.
	 * - Sinon, parcourt les notifications et :
	 *   - Crée un élément HTML pour chaque notification.
	 *   - Ajoute l'élément HTML à la fenêtre de notifications.
	 *   - Attache des listeners pour gérer les événements de clic sur les notifications.
	 *   - Si la notification est non-lue, ajoute la classe 'new-notif' et met à jour le compteur de notifications non-lues.
	 */
	// public async loadNotifs(): Promise<void> {
	// 	this.navbarInstance!.notifsWindow.replaceChildren();
	// 	this.notifs = await notifApi.getUserNotifications();
	// 	if (!this.notifs || this.notifs.length === 0) {
	// 		this.updateNotifsCounter(true);
	// 		const notifItem = document.createElement('div');
	// 		notifItem.classList.add('default-notif');
	// 		notifItem.textContent = 'No notification yet.';
	// 		this.navbarInstance!.notifsWindow.appendChild(notifItem);
	// 		return;
	// 	}
	// 	this.notifs.forEach((notifDb: Notification) => {
	// 		this.setNotifData(notifDb);
	// 		const notifItem = document.createElement('div');
	// 		notifItem.classList.add('notif-item');
	// 		notifItem.id = `notif-${this.currentNotif.id}`;
	// 		notifItem.innerHTML = this.currentNotif.content;
	// 		this.navbarInstance!.notifsWindow.appendChild(notifItem);
	// 		this.notifItem = getHTMLElementById(`${notifItem.id.toString()}`, this.navbarInstance!.notifsWindow);
	// 		this.attachListeners();
	// 		if (this.currentNotif.status === 0) {
	// 			this.notifItem.classList.add('new-notif');
	// 			this.updateNotifsCounter();
	// 		}
	// 	});	
	// }
	public async loadNotifs(): Promise<void> {
		this.navbarInstance!.notifsWindow.replaceChildren();
		
		try {
			this.notifs = await notifApi.getUserNotifications();
			console.log('Notifications rechargées:', this.notifs);
			if (!this.notifs || this.notifs.length === 0) {
				this.updateNotifsCounter(true);
				const notifItem = document.createElement('div');
				notifItem.classList.add('default-notif');
				notifItem.textContent = 'No notification yet.';
				this.navbarInstance!.notifsWindow.appendChild(notifItem);
				return;
			}
			
			this.notifs.forEach((notifDb: Notification) => {
				const notifItem = document.createElement('div');
				notifItem.classList.add('notif-item');
				this.navbarInstance!.notifsWindow.appendChild(notifItem);
				this.notifItem = notifItem;
				this.setNotifData(notifDb);
			});
		} catch (error) {
			console.error('Erreur lors du chargement des notifications:', error);
		}
	}

	/**
	 * Met à jour l'affichage d'une notification dans la fenêtre des notifications.
	 *
	 * - Récupère la notification en base de données via l'API.
	 * - Si la notification n'existe pas, affiche un message d'erreur.
	 * - Si la notification est non-lue, retire la classe 'new-notif' et met à jour le compteur de notifications non-lues.
	 * - Met à jour le contenu HTML de la notification.
	 *
	 * @returns {Promise<void>} Promesse qui se résout lorsque la mise à jour est terminée.
	 */
	// public async updateNotifDisplay(): Promise<void> {
	// 	console.log(this.currentNotif);
	// 	if (!this.currentNotif || !this.currentNotif.id) {
	// 		return;
	// 	}
	// 	const notifDb: Notification = await notifApi.getNotificationById(this.currentNotif.id);
	// 	if (!notifDb) {
	// 		console.log(`La notification ${this.currentNotif.id} n'existe pas en base de données`);
	// 		return;
	// 	}
	// 	if (notifDb.status === 1) {
	// 		this.notifItem!.classList.remove('new-notif');
	// 		this.updateNotifsCounter();
	// 	}
	// 	this.notifItem!.innerHTML = notifDb.content;
	// }
	public async updateNotifDisplay(): Promise<void> {
		console.log(this.currentNotif);
		if (!this.currentNotif || !this.currentNotif.id) {
			return;
		}
		
		try {
			const notifDb: Notification = await notifApi.getNotificationById(this.currentNotif.id);
			if (!notifDb) {
				console.log(`La notification ${this.currentNotif.id} n'existe pas en base de données`);
				return;
			}
			
			// Vérifier que this.notifItem existe avant de l'utiliser
			if (!this.notifItem) {
				console.error('notifItem est null, on ne peut pas update le display des notifs');
				return;
			}
			
			if (notifDb.status === 1) {
				this.notifItem.classList.remove('new-notif');
				this.updateNotifsCounter();
			}
			this.notifItem.innerHTML = notifDb.content;
		} catch (error) {
			console.error('Erreur lors de la mise à jour de la notification:', error);
		}
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
	public async createNotifButtonsHTML(): Promise<string> {
		let html = `<div class="notif-actions flex justify-center space-x-4">`;
		if (this.isFriendRequest()
			&& this.currentNotif.type === FRIEND_REQUEST_ACTIONS.ADD) {
			
			html += `
				<button class="btn smaller-btn" data-action="accept" data-to="${this.currentNotif.to}" data-from="${this.currentNotif.from}">
					Accept
				</button>
				<button class="btn smaller-btn" data-action="decline" data-to="${this.currentNotif.to}" data-from="${this.currentNotif.from}">
					Decline
				</button>
			`;
		}
		html += `</div>`;
		return html;
	}

	/**
	 * Met à jour le compteur de notifications non lues dans la navbar.
	 * 
	 * Si `reset` est à `true`, remet le compteur à 0 et le rend invisible.
	 * Sinon, incrémente le compteur de 1 et le rend visible.
	 * @param {boolean} reset - Si `true`, remet le compteur à 0 et le rend invisible.
	 * @returns {void}
	 */
	public updateNotifsCounter(reset: boolean = false): void {
		let currentCount: number = 0;
		if (reset) {
			this.navbarInstance!.notifsCounter.textContent = '0';
			if (!this.navbarInstance!.notifsCounter.classList.contains('hidden')) {
				this.navbarInstance!.notifsCounter.classList.add('hidden');
			}
			return;
		}
		currentCount = parseInt(this.navbarInstance!.notifsCounter.textContent || '0', 10);
		this.navbarInstance!.notifsCounter.textContent = (currentCount + 1).toString();
		if (this.navbarInstance!.notifsCounter.classList.contains('hidden')) {
			this.navbarInstance!.notifsCounter.classList.remove('hidden');
		}
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
	// public async refreshFriendButtons(userRowInstance?: UserRowComponent): Promise<void> {
	// 	if (this.currentPage.config.path === ROUTE_PATHS.USERS) {
	// 		await this.currentPage.updateFriendButtons!(this.currentNotif!, userRowInstance);
	// 	}
	// 	const notifTwins: Notification[] = this.getUserNotifsByTypeAndFrom(this.currentNotif.type, this.currentNotif.from);
	// 	for (const notif of notifTwins) {
	// 		this.setNotifData(notif);
	// 		await this.updateNotifDisplay();
	// 	}
	// }
	public async refreshFriendButtons(userRowInstance?: UserRowComponent): Promise<void> {
		if (this.currentPage.config.path === ROUTE_PATHS.USERS) {
			await this.currentPage.updateFriendButtons!(this.currentNotif!, userRowInstance);
		}
		
		// Correction: vérifier que currentNotif a les bonnes propriétés
		if (!this.currentNotif || typeof this.currentNotif.type === 'undefined' || typeof this.currentNotif.from === 'undefined') {
			console.error('currentNotif invalide pour refreshFriendButtons');
			return;
		}
		
		const notifTwins: Notification[] = this.getUserNotifsByTypeAndFrom(this.currentNotif.type, this.currentNotif.from);
		for (const notif of notifTwins) {
			this.setNotifData(notif);
			await this.updateNotifDisplay();
		}
	}

	/**
	 * Retourne un objet contenant les informations de la notification.
	 *
	 * L'objet contient les clés suivantes :
	 * - action : l'action de la notification (par exemple, FRIEND_REQUEST_ACTIONS.ADD)
	 * - from : l'identifiant de l'utilisateur qui a envoyé la notification
	 * - to : l'identifiant de l'utilisateur qui reçoit la notification (l'utilisateur actuel)
	 * - type : le type de la notification (par exemple, "friendRequest")
	 * - content : le contenu de la notification, qui peut inclure des balises HTML
	 *
	 * @returns {Notification | NotificationModel} L'objet contenant les informations de la notification.
	 */
	public getNotifData(): Notification | NotificationModel {
		return {
			from: this.currentNotif.from, 
			to: this.currentUser!.id, 
			type: this.currentNotif.type, 
			content: this.currentNotif.content
		};
	}

	/**
	 * Filtre les notifications de l'utilisateur par type et par expéditeur.
	 * 
	 * @param {FriendRequestAction} type - Type à filtrer
	 * @param {number} fromId - ID de l'expéditeur
	 * @returns {Notification[]} Tableau de notifications filtrées
	 */
	public getUserNotifsByTypeAndFrom(type: FriendRequestAction, fromId: number): Notification[] {
		return this.notifs.filter(notification => 
			notification.type === type && notification.from === fromId
		);
	}

	// ===========================================
	// LISTENERS
	// ===========================================

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

	/**
	 * Gère l'événement de clic pour l'acceptation d'une notification de demande d'ami.
	 *
	 * Cette méthode effectue les actions suivantes :
	 * 1. Appelle l'API pour accepter la demande d'ami entre l'expéditeur et le destinataire de la notification courante.
	 * 2. Met à jour le contenu de la notification pour indiquer que la demande a été acceptée.
	 * 3. Met à jour le statut et le contenu de la notification via l'API.
	 * 4. Rafraîchit l'affichage de la notification et les boutons liés à l'amitié dans l'interface.
	 *
	 * @returns Une promesse qui se résout lorsque toutes les actions sont terminées.
	 */
	// private handleAcceptClick = async (): Promise<void> => {
	// 	console.log("ACCEPPPPPT Accepting friend request from user ID:", this.currentNotif.from, "to user ID:", this.currentNotif.to);
	// 	await dataApi.acceptFriend(this.currentNotif.to, this.currentNotif.from);
	// 	const notifFrom: User = await dataApi.getUserById(this.currentNotif.from);
	// 	if (!notifFrom) {
	// 		console.error("User not found");
	// 	}
	// 	const notifContent = `<span>'Friend request from ${notifFrom.username} accepted ✅</span>`;
	// 	await notifApi.updateNotifStatus(this.currentNotif.id);
	// 	await notifApi.updateNotifContent(this.currentNotif.id, notifContent);
	// 	await this.refreshFriendButtons();
	// }
	private handleAcceptClick = async (): Promise<void> => {
		if (!this.currentNotif || typeof this.currentNotif.from === 'undefined' || typeof this.currentNotif.to === 'undefined') {
			console.error('currentNotif invalide pour handleAcceptClick');
			return;
		}
		
		try {
			console.log("ACCEPPPPPT Accepting friend request from user ID:", this.currentNotif.from, "to user ID:", this.currentNotif.to);
			await dataApi.acceptFriend(this.currentNotif.to, this.currentNotif.from);
			const notifFrom: User = await dataApi.getUserById(this.currentNotif.from);
			if (!notifFrom) {
				console.error("User not found");
				return;
			}
			const notifContent = `<span>Friend request from ${notifFrom.username} accepted ✅</span>`;
			
			// Vérifier que l'ID existe avant de faire les requêtes
			if (!this.currentNotif.id) {
				console.error('currentNotif.id manquant');
				return;
			}
			
			await notifApi.updateNotifStatus(this.currentNotif.id);
			await notifApi.updateNotifContent(this.currentNotif.id, notifContent);
			await this.refreshFriendButtons();
		} catch (error) {
			console.error('Erreur lors de l\'acceptation de la demande d\'ami:', error);
		}
	}

	/**
	 * Gère l'action de refus pour une notification de demande d'ami.
	 *
	 * Cette méthode asynchrone effectue les étapes suivantes :
	 * 1. Supprime la relation d'amitié entre l'expéditeur et le destinataire de la notification.
	 * 2. Met à jour le contenu de la notification pour indiquer que la demande a été refusée.
	 * 3. Met à jour le statut de la notification pour refléter le changement.
	 * 4. Rafraîchit l'affichage de la notification et les boutons liés à l'amitié dans l'interface.
	 *
	 * @returns {Promise<void>} Une promesse qui se résout lorsque toutes les actions de refus sont terminées.
	 */
	// private handleDeclineClick = async (): Promise<void> => {
	// 	console.log("DECLINE CLICK: Decline friend request from user ID:", this.currentNotif.from, "to user ID:", this.currentNotif.to);
	// 	await dataApi.removeFriend(this.currentNotif.to, this.currentNotif.from);
	// 	const notifFrom: User = await dataApi.getUserById(this.currentNotif.from);
	// 	if (!notifFrom) {
	// 		console.error("User not found");
	// 	}
	// 	const notifContent = `<span>'Friend request from ${notifFrom.username} declined ❌</span>`;
	// 	await notifApi.updateNotifStatus(this.currentNotif.id);
	// 	await notifApi.updateNotifContent(this.currentNotif.id, notifContent);
	// 	await this.refreshFriendButtons();
	// }
	private handleDeclineClick = async (): Promise<void> => {
		if (!this.currentNotif || typeof this.currentNotif.from === 'undefined' || typeof this.currentNotif.to === 'undefined') {
			console.error('currentNotif invalide pour handleDeclineClick');
			return;
		}
		
		try {
			console.log("DECLINE CLICK: Decline friend request from user ID:", this.currentNotif.from, "to user ID:", this.currentNotif.to);
			await dataApi.removeFriend(this.currentNotif.to, this.currentNotif.from);
			const notifFrom: User = await dataApi.getUserById(this.currentNotif.from);
			if (!notifFrom) {
				console.error("User not found");
				return;
			}
			const notifContent = `<span>Friend request from ${notifFrom.username} declined ❌</span>`;
			
			// Vérifier que l'ID existe avant de faire les requêtes
			if (!this.currentNotif.id) {
				console.error('currentNotif.id manquant');
				return;
			}
			
			await notifApi.updateNotifStatus(this.currentNotif.id);
			await notifApi.updateNotifContent(this.currentNotif.id, notifContent);
			await this.refreshFriendButtons();
		} catch (error) {
			console.error('Erreur lors du refus de la demande d\'ami:', error);
		}
	}
}