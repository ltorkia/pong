import { Notification } from '../../shared/models/notification.model';
import { NotifResponse, NotificationModel } from '../../shared/types/notification.types';	// en rouge car dossier local 'shared' != dossier conteneur
import { secureFetch } from '../../utils/app.utils';
import { BasicResponse } from '../../types/api.types';

// ===========================================
// NOTIF API
// ===========================================
/**
 * API de gestion des notifications utilisateur.
 *
 * Fournit des méthodes pour récupérer, ajouter et mettre à jour les notifications
 * d'un utilisateur via des requêtes HTTP vers l'API backend.
 */
export class NotifApi {

	/**
	 * Récupère la liste des notifications d'un utilisateur.
	 *
	 * Envoie une requête GET à la route API `/api/notifs/:id` pour récupérer
	 * les informations des notifications de l'utilisateur courant.
	 *
	 * Si la requête réussit, renvoie un tableau d'instances `Notification`
	 * contenant les informations des notifications de l'utilisateur stockées en base de données.
	 * Sinon, lève une erreur.
	 *
	 * @returns {Promise<Notification>} Promesse qui se résout avec un tableau d'instances `Notification`.
	 */
	public async getUserNotifications(): Promise<Notification[]> {
		const res: Response = await secureFetch(`/api/notifs`, { method: 'GET' });
		const data: NotifResponse = await res.json();
		if (!res.ok || data.errorMessage) {
			console.error(data.errorMessage);
		}
		return Notification.fromJSONArray(data.notifs) as Notification[];
	}

	/**
	 * Récupère une notification par son identifiant.
	 *
	 * Envoie une requête GET à la route API `/api/notifs?id=:notifId` pour
	 * récupérer les informations de la notification d'identifiant `notifId` de l'utilisateur
	 * courant.
	 *
	 * Si la requête réussit, renvoie l'instance `Notification` contenant les informations
	 * de la notification stockée en base de données.
	 * Sinon, lève une erreur.
	 *
	 * @param {number} notifId Identifiant de la notification à récupérer.
	 * @returns {Promise<Notification>} Promesse qui se résout avec l'instance `Notification`.
	 */
	public async getNotificationById(notifId: number): Promise<Notification> {
		const res: Response = await secureFetch(`/api/notifs?id=${notifId}`, { method: 'GET' });
		const data: NotifResponse = await res.json();
		if (!res.ok || data.errorMessage) {
			console.error(data.errorMessage);
		}
		return Notification.fromJSON(data.notif) as Notification;
	}

	// ===========================================
	// NOTIFICATION PUT REQUESTS - DATABASE UPDATE
	// ===========================================

	/**
	 * Envoie une requête POST à la route API `/users/:userId/notifs/add` pour envoyer
	 * une notification à l'utilisateur d'identifiant `receiverId` provenant de l'utilisateur
	 * courant.
	 * 
	 * Si la requête réussit, renvoie un objet contenant les informations de l'opération.
	 * Sinon, renvoie un objet contenant un message d'erreur.
	 * 
	 * @param {any} notifData - Objet contenant les données de la notification.
	 * @returns {Promise<BasicResponse>} Promesse qui se résout avec les informations
	 * de l'opération ou un message d'erreur.
	 */
	public async addNotification(notifData: NotificationModel): Promise<BasicResponse> {
		console.log(notifData);
		const res: Response = await secureFetch(`/api/notifs/add`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(notifData)
		});
		const data: BasicResponse = await res.json();
		if (!res.ok || data.errorMessage) {
			return { errorMessage: data.errorMessage || 'Erreur lors de la suppression d\'ami' };
		}
		return data as BasicResponse;
	}

	/**
	 * Met à jour une notification.
	 * 
	 * Envoie une requête PUT à la route API `/users/notifs/:notifId/update` pour
	 * mettre à jour la notification d'identifiant `notifId` pour passer du statut unread vers read.
	 * 
	 * Si la requête réussit, renvoie un objet contenant les informations de l'opération.
	 * Sinon, renvoie un objet contenant un message d'erreur.
	 * 
	 * @param {number} notifId - Identifiant de la notification à mettre à jour.
	 * @returns {Promise<BasicResponse>} Promesse qui se résout avec les informations
	 * de l'opération ou un message d'erreur.
	 */
	public async updateNotifStatus(notifId: number): Promise<BasicResponse> {
		const res = await secureFetch(`/api/notifs/update`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ notifId })
		});
		const data: BasicResponse = await res.json();
		if (!res.ok || data.errorMessage) {
			return { errorMessage: data.errorMessage || 'Erreur lors de la mise à jour de la notif' };
		}
		return data;
	}

	/**
	 * Met à jour le contenu d'une notification.
	 *
	 * Envoie une requête PUT à la route API `/users/notifs/:notifId/update` pour
	 * mettre à jour le contenu de la notification d'identifiant `notifId` avec le contenu
	 * `notifContent`.
	 *
	 * Si la requête réussit, renvoie un objet contenant les informations de l'opération.
	 * Sinon, renvoie un objet contenant un message d'erreur.
	 *
	 * @param {number} notifId - Identifiant de la notification à mettre à jour.
	 * @param {string} notifContent - Nouveau contenu de la notification.
	 * @returns {Promise<BasicResponse>} Promesse qui se résout avec les informations
	 * de l'opération ou un message d'erreur.
	 */
	public async updateNotifContent(notifId: number, notifContent: string): Promise<BasicResponse> {
		const res = await secureFetch(`/api/notifs/update`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ notifId, notifContent })
		});
		const data: BasicResponse = await res.json();
		if (!res.ok || data.errorMessage) {
			return { errorMessage: data.errorMessage || 'Erreur lors de la mise à jour de la notif' };
		}
		return data;
	}

}
