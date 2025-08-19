import { Friend } from '../../shared/models/friend.model';
import { AppNotification } from '../../shared/models/notification.model';
import { FriendModel } from '../../shared/types/friend.types';	// en rouge car dossier local 'shared' != dossier conteneur
import { secureFetch } from '../../utils/app.utils';
import { FriendResponse } from '../../shared/types/response.types';

// ===========================================
// FIREND API
// ===========================================
/**
 * Cette classe fournit des métodes pour interagir avec l'API de gestion des amis.
 * Elle fournit des métodes pour ajouter, supprimer et obtenir des amis.
 */
export class FriendApi {

	// ===========================================
	// FRIEND GET REQUEST - DATABASE SELECT
	// ===========================================

	/**
	 * Récupère la liste des amis d'un utilisateur.
	 *
	 * Envoie une requête GET à la route API `/users/:id/friends` pour récupérer
	 * les informations des amis de l'utilisateur d'identifiant `id`.
	 *
	 * Si la requête réussit, renvoie un tableau d'instances `User` contenant
	 * les informations des amis de l'utilisateur stockés en base de données,
	 * sans email (type `Friends`).
	 * Sinon, lève une erreur.
	 *
	 * @param {number} id Identifiant de l'utilisateur pour lequel récupérer la liste des amis.
	 * @returns {Promise<User[]>} Promesse qui se résout avec un tableau d'instances `User`.
	 */
	public async getUserFriends(id: number): Promise<Friend[]> {
		const res: Response = await secureFetch(`/api/friends/${id}`, { method: 'GET' });
		if (!res.ok) {
			throw new Error('Erreur de l\'API');
		}
		const data: FriendModel[] = await res.json();
		return Friend.fromJSONArray(data) as Friend[];
	}

	// ===========================================
	// FRIEND ADD REQUEST - DATABASE ADD
	// ===========================================

	/**
	 * Ajoute un ami à l'utilisateur spécifié.
	 * 
	 * Envoie une requête POST à la route API `/users/:userId/friends/add` pour ajouter
	 * un utilisateur ami d'identifiant `friendId` à l'utilisateur d'identifiant `userId`.
	 * 
	 * Si l'ajout réussit, renvoie un objet contenant les informations de l'opération.
	 * Sinon, renvoie un objet contenant un message d'erreur.
	 * 
	 * @param {number} friendId - Identifiant de l'ami à ajouter.
	 * @returns {Promise<AppNotification[] | { errorMessage: string }>} Promesse qui se résout avec les informations
	 * de l'opération ou un message d'erreur.
	 */
	public async addFriend(friendId: number): Promise<AppNotification[] | { errorMessage: string }> {
		const res: Response = await secureFetch(`/api/friends`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: friendId })
		});
		const data: FriendResponse = await res.json();
		if (!res.ok || 'errorMessage' in data || !data) {
			return { errorMessage: data.errorMessage || 'Erreur lors de l\'ajout d\'ami' };
		}
		console.log(data);
		return AppNotification.fromJSON(data) as AppNotification[];
	}

	// ===========================================
	// FRIEND PUT REQUESTS - DATABASE UPDATE
	// ===========================================

	/**
	 * Bloque ou accepte un ami.
	 * 
	 * Envoie une requête PUT à la route API `/api/friends/:friendId` pour bloquer
	 * l'ami d'identifiant `friendId` par l'utilisateur courant.
	 * 
	 * Si le blocage réussit, renvoie un objet contenant les informations de l'opération.
	 * Sinon, renvoie un objet contenant un message d'erreur.
	 * 
	 * @param {AppNotification} notif - Notification liée à mettre à jour. 
	 * Contient le type d'action (ACCEPT ou BLOCK).
	 * @returns {Promise<AppNotification[] | { errorMessage: string }>} Promesse qui se résout avec les informations
	 * de l'opération ou un message d'erreur.
	 */
	public async updateFriend(notif: AppNotification): Promise<AppNotification[] | { errorMessage: string }> {
		console.log('updateFriend dans FriendApi', notif);
		const res: Response = await secureFetch(`/api/friends/${notif.to}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify( notif )
		});
		const data: FriendResponse = await res.json();
		if (!res.ok || 'errorMessage' in data || !data) {
			return { errorMessage: data.errorMessage || 'Erreur lors de l\'acceptation / le blocage d\'ami' };
		}
		console.log(data);
		return AppNotification.fromJSONArray(data) as AppNotification[];
	}

	// ===========================================
	// FRIEND DELETE REQUESTS - DATABASE DELETE
	// ===========================================

	/**
	 * Supprime un ami de l'utilisateur.
	 * 
	 * Envoie une requête DELETE à la route API `/api/friends/:friendId` pour supprimer
	 * l'ami d'identifiant `friendId` de l'utilisateur courant.
	 * 
	 * Si la suppression réussit, renvoie un objet contenant les informations de l'opération.
	 * Sinon, renvoie un objet contenant un message d'erreur.
	 * 
	 * @param {Partial<AppNotification>} notif - Notification liée à supprimer.
	 * @returns {Promise<AppNotification[] | { errorMessage: string }>} Promesse qui se résout avec les informations
	 * de l'opération ou un message d'erreur.
	 */
	public async removeFriend(notif: Partial<AppNotification>): Promise<AppNotification[] | { errorMessage: string }> {
		console.log(`[${this.constructor.name}] Suppression de l'ami ${notif.to}`);
		console.log("notif", notif);
		
		// Construction de la query param pour l'id de la notif
		const res: Response = await secureFetch(`/api/friends/${notif.to}?id=${notif.id ?? 0}`, {
			method: 'DELETE'
		});
		const data: FriendResponse = await res.json();
		if (!res.ok || 'errorMessage' in data || notif.id && notif.id > 0 && !data) {
			return { errorMessage: data.errorMessage || 'Erreur lors de l\'acceptation d\'ami' };
		}
		if (data)
			return AppNotification.fromJSONArray(data) as AppNotification[];
		return [] as AppNotification[];
	}
}
