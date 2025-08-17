import { AppNotification } from '../../shared/models/notification.model';
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
	 * @returns {Promise<AppNotification>} Promesse qui se résout avec un tableau d'instances `Notification`.
	 */
	public async getUserNotifications(): Promise<NotifResponse> {
		const res: Response = await secureFetch(`/api/notifs`, { method: 'GET' });
		const data: NotifResponse = await res.json();
		if (!res.ok || data.errorMessage || !data.notifs) {
			return { errorMessage: data.errorMessage || data.message || 'Erreur inconnue' } as NotifResponse;
		}
		return AppNotification.fromJSONArray(data.notifs) as NotifResponse;
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
	 * @returns {Promise<AppNotification>} Promesse qui se résout avec l'instance `Notification`.
	 */
	public async getNotificationById(notifId: number): Promise<NotifResponse> {
		const res: Response = await secureFetch(`/api/notifs?id=${notifId}`, { method: 'GET' });
		const data: NotifResponse = await res.json();
		if (!res.ok || data.errorMessage || !data.notif) {
			return { errorMessage: data.errorMessage || data.message || 'Erreur inconnue' } as NotifResponse;
		}
		return AppNotification.fromJSON(data.notif) as NotifResponse;
	}

	// ===========================================
	// NOTIFICATION PUT REQUESTS - DATABASE UPDATE
	// ===========================================

	/**
	 * Met à jour une notification.
	 *
	 * Envoie une requête PUT à la route API `/api/notifs/update` pour mettre à jour
	 * la notification `notifData`.
	 *
	 * Si la requête réussit, renvoie un objet contenant les informations de l'opération.
	 * Sinon, renvoie un objet contenant un message d'erreur.
	 *
	 * @param {AppNotification} notifData - Les informations de la notification à mettre à jour.
	 * @returns {Promise<BasicResponse>} Promesse qui se résout avec les informations
	 * de l'opération ou un message d'erreur.
	 */
	public async updateNotification(notifData: AppNotification): Promise<BasicResponse> {
		const res = await secureFetch(`/api/notifs/update`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ notifData })
		});
		const data: BasicResponse = await res.json();
		if (!res.ok || data.errorMessage || !data.notifs) {
			return { errorMessage: data.errorMessage || 'Erreur lors de la mise à jour de la notif' };
		}
		data.notif = AppNotification.fromJSON(data.notifs) as AppNotification;
		data.notifs = AppNotification.fromJSONArray(data.notifs) as AppNotification[];
		return data as NotifResponse;
	}
}
