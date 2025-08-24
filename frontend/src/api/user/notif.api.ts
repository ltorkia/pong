import { AppNotification } from '../../shared/models/notification.model';
import { NotificationModel } from '../../shared/types/notification.types';
import { BasicResponse, NotifResponse } from '../../shared/types/response.types';
import { secureFetch } from '../../utils/app.utils';

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
	 * @returns {Promise<AppNotification[] | { errorMessage: string }>} Promesse qui se résout avec un tableau d'instances `Notification`.
	 */
	public async getUserNotifications(): Promise<AppNotification[] | { errorMessage: string }> {
		const res: Response = await secureFetch(`/api/notifs`, { method: 'GET' });
		const data = await res.json();
		if (!res.ok || 'errorMessage' in data || !data) {
			return { errorMessage: data.errorMessage || data.message || 'Erreur inconnue' };
		}
		return AppNotification.fromJSONArray(data.notifs) as AppNotification[];
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
	 * @returns {Promise<AppNotification | { errorMessage: string }>} Promesse qui se résout avec l'instance `Notification`.
	 */
	public async getNotificationById(notifId: number): Promise<AppNotification | { errorMessage: string }> {
		const res: Response = await secureFetch(`/api/notifs?id=${notifId}`, { method: 'GET' });
		const data = await res.json();
		if (!res.ok || 'errorMessage' in data || !data) {
			return { errorMessage: data.errorMessage || data.message || 'Erreur inconnue' };
		}
		return AppNotification.fromJSON(data) as AppNotification;
	}

	// ===========================================
	// NOTIFICATION PUT REQUESTS - DATABASE UPDATE
	// ===========================================

	/**
	 * Ajoute une notification à un utilisateur.
	 *
	 * Envoie une requête POST à la route API `/api/notifs` pour ajouter
	 * la notification `notifData` à l'utilisateur courant.
	 *
	 * Si la requête réussit, renvoie un objet contenant les informations de l'opération.
	 * Sinon, renvoie un objet contenant un message d'erreur.
	 *
	 * @param {NotificationModel} notifData - Les informations de la notification à ajouter.
	 * @returns {Promise<NotifResponse | { errorMessage: string }>} Promesse qui se résout avec les informations
	 * de l'opération ou un message d'erreur.
	 */
	public async addNotification(notifData: NotificationModel): Promise<NotifResponse | { errorMessage: string }> {
		const res = await secureFetch(`/api/notifs`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify( notifData )
		});
		const data = await res.json();
		if (!res.ok || 'errorMessage' in data || !data) {
			return { errorMessage: data.errorMessage || 'Erreur lors de l\'ajout de la notif' };
		}
		return AppNotification.fromJSON(data) as AppNotification;
	}

	/**
	 * Met à jour une notification.
	 *
	 * Envoie une requête PUT à la route API `/api/notifs/update` pour mettre à jour
	 * la notification `notifData`.
	 *
	 * Si la requête réussit, renvoie un objet contenant les informations de l'opération.
	 * Sinon, renvoie un objet contenant un message d'erreur.
	 *
	 * @param {number} notifId - L'identifiant de la notification à mettre à jour comme lue.
	 * @returns {Promise<AppNotification | { errorMessage: string }>} Promesse qui se résout avec les informations
	 * de l'opération ou un message d'erreur.
	 */
	public async updateNotification(notifId: number): Promise<AppNotification | { errorMessage: string }> {
		const res = await secureFetch(`/api/notifs`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify( notifId )
		});
		const data = await res.json();
		if (!res.ok || 'errorMessage' in data || !data) {
			return { errorMessage: data.errorMessage || 'Erreur lors de la mise à jour de la notif' };
		}
		return AppNotification.fromJSON(data) as AppNotification;
	}

	/**
	 * Supprime une notification par son identifiant.
	 *
	 * Envoie une requête DELETE à la route API `/api/notifs/:notifId` pour supprimer
	 * la notification d'identifiant `notifId` de l'utilisateur courant.
	 *
	 * Si la suppression réussit, renvoie un objet contenant les informations de l'opération.
	 * Sinon, renvoie un objet contenant un message d'erreur.
	 *
	 * @param {number} notifId - Identifiant de la notification à supprimer.
	 * @returns {Promise<BasicResponse | { errorMessage: string }>} Promesse qui se résout avec les informations
	 * de l'opération ou un message d'erreur.
	 */
	public async deleteNotification(notifId: number): Promise<BasicResponse | { errorMessage: string }> {
		const res = await secureFetch(`/api/notifs/${notifId}`, { method: 'DELETE' });
		const data = await res.json();
		if (!res.ok || 'errorMessage' in data || !data) {
			return { errorMessage: data.errorMessage || 'Erreur lors de la suppression de la notif' };
		}
		return data as BasicResponse;
	}
}
