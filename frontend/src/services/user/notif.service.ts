import { ROUTE_PATHS } from '../../config/routes.config';
import { dataApi } from '../../api/index.api';
import { PageInstance } from '../../types/routes.types';
import { COMPONENT_NAMES } from '../../config/components.config';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { UserRowComponent } from '../../components/user-row/user-row.component';
import { FRIEND_REQUEST_ACTIONS } from '../../shared/config/constants.config'; // en rouge car dossier local 'shared' != dossier conteneur
import type { FriendRequest } from "../../shared/types/websocket.types";

// ============================================================================
// NOTIF SERVICE
// ============================================================================
/**
 * Service de gestion des notifications.
 */
export class NotifService {
	private currentPage!: PageInstance;
	private navbarInstance!: NavbarComponent | undefined;

	/**
	 * Initialise le service de notifications avec la page actuelle.
	 * 
	 * - Stocke l'instance de la page actuelle dans `currentPage`.
	 * - Récupère et stocke l'instance du composant Navbar à partir de la page actuelle.
	 *
	 * @param {PageInstance} currentPage - Instance de la page actuellement affichée.
	 */

	public init(currentPage: PageInstance): void {
		this.currentPage = currentPage;
		this.navbarInstance = this.currentPage.getComponentInstance!<NavbarComponent>(COMPONENT_NAMES.NAVBAR);
	}

	/**
	 * Met à jour le compteur de notifications.
	 * 
	 * Incrémente le compteur de notifications et l'affiche si il était caché.
	 */
	private updateNotifsCounter(): void {
		const currentCount = parseInt(this.navbarInstance!.notifsCounter.textContent || '0', 10);
		this.navbarInstance!.notifsCounter.textContent = (currentCount + 1).toString();
		if (this.navbarInstance!.notifsCounter.classList.contains('hidden')) {
			this.navbarInstance!.notifsCounter.classList.remove('hidden');
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
	 * @param {any} data - L'objet à vérifier.
	 * @returns {data is FriendRequest} Si l'objet `data` correspond à une demande
	 * d'amitié, la fonction renvoie `true`. Sinon, la fonction renvoie `false`.
	 */
	public isFriendRequest(data: any): data is FriendRequest {
		return (
			data &&
			Object.values(FRIEND_REQUEST_ACTIONS).includes(data.action) &&
			typeof data.from === "number" &&
			typeof data.to === "number"
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
	 *
	 * @param {FriendRequest} data - L'objet contenant les informations de la demande
	 *   d'amiti  (action, from, to).
	 */
	public async handleFriendRequest(data: FriendRequest) {
		switch (data.action) {
			case FRIEND_REQUEST_ACTIONS.ADD:
				console.log("New friend request from user ID:", data.from, "to user ID:", data.to);
				await this.addNewNotification(data);
				break;
			case FRIEND_REQUEST_ACTIONS.ACCEPT:
				console.log("Friend request accepted from user ID:", data.from, "to user ID:", data.to);
				this.addNewNotification(data);
				break;
			case FRIEND_REQUEST_ACTIONS.DELETE:
				console.log("Friend request deleted from user ID:", data.from, "to user ID:", data.to);
				break;
			case FRIEND_REQUEST_ACTIONS.BLOCK:
				console.log("User ID:", data.from, "blocked user ID:", data.to);
				break;
			default:
				console.error("Unknown friend request action:", data.action);
				break;
		}
		this.refreshFriendButtons(data);
	}

	/**
	 * Ajoute une nouvelle notification à la liste des notifications de la navbar.
	 * 
	 * Crée un élément HTML div avec les classes 'notif-item' et 'new-notif'.
	 * Ajoute le texte de la notification à l'élément créé.
	 * Ajoute l'élément créé à la liste des notifications dans la navbar.
	 * Met à jour le compteur de notifications.
	 * 
	 * Permet d'afficher de nouvelles notifications en temps réel.
	 * 
	 * @param {any} socketType - La notif envoyée par l'utilisateur.
	 */
	public async addNewNotification(socketType?: any): Promise<void> {
		const notifItem = document.createElement('div');
		notifItem.classList.add('notif-item');

		if (!socketType) {
			notifItem.classList.add('default-notif');
			notifItem.textContent = 'No notification yet.';
			this.navbarInstance!.notifsWindow.appendChild(notifItem);
			return;
		}

		const user = await dataApi.getUserById(socketType.from);
		notifItem.classList.add('new-notif');
		const textSpan = document.createElement('span');
		let notif = '';
		let buttons = null;
		if (this.isFriendRequest(socketType)) {
			if (socketType.action === FRIEND_REQUEST_ACTIONS.ADD) {
				notif = `has sent you a friend request.`;
				buttons = await this.createNotifButtons(socketType);
			}
			if (socketType.action === FRIEND_REQUEST_ACTIONS.ACCEPT) {
				notif = `has accepted your friend request.`;
			}
		}
		textSpan.textContent = `${user.username} ${notif}`;
		notifItem.appendChild(textSpan);
		if (buttons) {
			notifItem.appendChild(buttons);
		}
		this.navbarInstance!.notifsWindow.appendChild(notifItem);
		this.updateNotifsCounter();
	}

	/**
	 * Crée les boutons de notification pour une demande d'amitié.
	 *
	 * Les boutons sont placés dans un élément `<div>` avec la classe `notif-actions`.
	 * Si la demande d'amitié n'a pas encore été acceptée, deux boutons sont créés:
	 * - "Accept" : accepte la demande d'amitié et remplace le contenu de l'élément par "Request accepted ✅".
	 * - "Decline" : refuse la demande d'amitié et remplace le contenu de l'élément par "Request declined ❌".
	 * Si la demande d'amitié a déjà été acceptée, le contenu de l'élément est simplement "Request accepted ✅".
	 *
	 * @param {any} socketType - La notif envoyée par l'utilisateur.
	 * @returns {HTMLDivElement} L'élément `<div>` contenant les boutons de notification.
	 */
	public async createNotifButtons(socketType: any): Promise<HTMLDivElement> {
		const actionsDiv = document.createElement('div');
		actionsDiv.classList.add('notif-actions', 'flex', 'justify-center', 'space-x-4');

		if (this.isFriendRequest(socketType)
			&& socketType.action === FRIEND_REQUEST_ACTIONS.ADD) {
			const acceptButton = document.createElement('button');
			acceptButton.textContent = 'Accept';
			acceptButton.classList.add('btn', 'smaller-btn');
			acceptButton.addEventListener('click', async () => {
				await dataApi.acceptFriend(socketType.to, socketType.from);
				actionsDiv.replaceChildren(document.createTextNode('Request accepted ✅'));
				this.refreshFriendButtons(socketType);
			});
			actionsDiv.appendChild(acceptButton);

			const declineButton = document.createElement('button');
			declineButton.textContent = 'Decline';
			declineButton.classList.add('btn', 'smaller-btn');
			declineButton.addEventListener('click', async () => {
				await dataApi.removeFriend(socketType.to, socketType.from);
				actionsDiv.replaceChildren(document.createTextNode('Request declined ❌'));
				this.refreshFriendButtons(socketType);
			});
			actionsDiv.appendChild(declineButton);
		}
		return actionsDiv;
	}

	/**
	 * Met à jour les boutons d'amitié pour la page des utilisateurs si elle est affichée.
	 *
	 * Si la page des utilisateurs est affichée, appelle la méthode updateFriendButtons de la page
	 * pour mettre à jour les boutons d'amitié correspondant à l'utilisateur d'ID "from" en fonction
	 * de la demande d'amitié reçue.
	 *
	 * @param {FriendRequest} data La demande d'amitié reçue.
	 * @returns {Promise<void>} Une promesse qui se résout lorsque les boutons d'amitié ont été mis à jour.
	 */
	public async refreshFriendButtons(data: FriendRequest, userRowInstance?: UserRowComponent): Promise<void> {
		if (this.currentPage.config.path === ROUTE_PATHS.USERS) {
			await this.currentPage.updateFriendButtons!(data, userRowInstance);
		}
		
		// -- Trouver la bonne notif en bdd
		// -- changer le contenu
		// const content = 'Request accepted ✅';
		// const actionsDiv = page.container.querySelector('.actions') as HTMLDivElement;
		// notifService.replaceContent(actionsDiv, content);
	}

	public replaceContent(div: HTMLDivElement, content: string): void {
		div.replaceChildren(document.createTextNode(content));
	};
}