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
	 * @param {number} userId - Identifiant de l'utilisateur ajoutant un ami.
	 * @param {number} friendId - Identifiant de l'ami à ajouter.
	 * @returns {Promise<FriendResponse>} Promesse qui se résout avec les informations
	 * de l'opération ou un message d'erreur.
	 */
	public async addFriend(userId: number, friendId: number): Promise<FriendResponse> {
		const res: Response = await secureFetch(`/api/users/${userId}/friends/add`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ friendId })
		});
		const data: FriendResponse = await res.json();
		if (!res.ok || data.errorMessage || !data.relation || !data.notifs) {
			return { errorMessage: data.errorMessage || 'Erreur lors de l\'ajout d\'ami' };
		}
		data.relation = Friend.fromJSON(data.relation) as FriendModel;
		data.notif = AppNotification.fromJSON(data.notif) as AppNotification;
		return data as FriendResponse;
	}

	// ===========================================
	// FRIEND PUT REQUESTS - DATABASE UPDATE
	// ===========================================

	/**
	 * Accepte une demande d'amitié envoyée par un utilisateur.
	 * 
	 * Envoie une requête POST à la route API `/users/:userId/friends/accept` pour accepter
	 * une demande d'amitié envoyée par l'utilisateur d'identifiant `friendId` à l'utilisateur
	 * d'identifiant `userId`.
	 * 
	 * Si l'acceptation réussit, renvoie un objet contenant les informations de l'opération.
	 * Sinon, renvoie un objet contenant un message d'erreur.
	 * 
	 * @param {number} userId - Identifiant de l'utilisateur acceptant la demande d'amitié.
	 * @param {number} friendId - Identifiant de l'utilisateur qui a envoyé la demande d'amitié.
	 * @returns {Promise<FriendResponse>} Promesse qui se résout avec les informations
	 * de l'opération ou un message d'erreur.
	 */
	public async acceptFriend(userId: number, friendId: number): Promise<FriendResponse> {
		const res: Response = await secureFetch(`/api/users/${userId}/friends/accept`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ friendId })
		});
		const data: FriendResponse = await res.json();
		if (!res.ok || data.errorMessage || !data.relation || !data.notifs) {
			return { errorMessage: data.errorMessage || 'Erreur lors de l\'acceptation d\'ami' };
		}
		data.relation = Friend.fromJSON(data.relation) as FriendModel;
		data.notif = AppNotification.fromJSON(data.notif) as AppNotification;
		data.notifs = AppNotification.fromJSONArray(data.notifs) as AppNotification[];
		return data as FriendResponse;
	}

	/**
	 * Bloque un utilisateur en tant qu'ami.
	 * 
	 * Envoie une requête PUT à la route API `/users/:userId/friends/block` pour
	 * bloquer l'utilisateur d'identifiant `friendId` par l'utilisateur d'identifiant `userId`.
	 * 
	 * Si le blocage réussit, renvoie un objet contenant les informations de l'opération.
	 * Sinon, renvoie un objet contenant un message d'erreur.
	 * 
	 * @param {number} userId - Identifiant de l'utilisateur bloquant l'ami.
	 * @param {number} friendId - Identifiant de l'ami à bloquer.
	 * @returns {Promise<FriendResponse>} Promesse qui se résout avec les informations
	 * de l'opération ou un message d'erreur.
	 */
	public async blockFriend(userId: number, friendId: number): Promise<FriendResponse> {
		const res: Response = await secureFetch(`/api/users/${userId}/friends/block`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ friendId })
		});
		const data: FriendResponse = await res.json();
		if (!res.ok || data.errorMessage || !data.relation || !data.notifs) {
			return { errorMessage: data.errorMessage || 'Erreur lors de l\'acceptation d\'ami' };
		}
		data.relation = Friend.fromJSON(data.relation) as FriendModel;
		data.notif = AppNotification.fromJSON(data.notif) as AppNotification;
		data.notifs = AppNotification.fromJSONArray(data.notifs) as AppNotification[];
		return data as FriendResponse;
	}

	// ===========================================
	// FRIEND DELETE REQUESTS - DATABASE DELETE
	// ===========================================

	/**
	 * Supprime un ami de l'utilisateur.
	 * 
	 * Envoie une requête DELETE à la route API `/users/:userId/friends/delete` pour supprimer
	 * l'ami d'identifiant `friendId` de l'utilisateur d'identifiant `userId`.
	 * 
	 * Si la suppression réussit, renvoie un objet contenant les informations de l'opération.
	 * Sinon, renvoie un objet contenant un message d'erreur.
	 * 
	 * @param {number} userId - Identifiant de l'utilisateur qui supprime l'ami.
	 * @param {number} friendId - Identifiant de l'ami à supprimer.
	 * @returns {Promise<FriendResponse>} Promesse qui se résout avec les informations
	 * de l'opération ou un message d'erreur.
	 */
	public async removeFriend(userId: number, friendId: number): Promise<FriendResponse> {
		const res: Response = await secureFetch(`/api/users/${userId}/friends/delete`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ friendId })
		});
		const data: FriendResponse = await res.json();
		if (!res.ok || data.errorMessage || !data.notifs) {
			return { errorMessage: data.errorMessage || 'Erreur lors de l\'acceptation d\'ami' };
		}
		data.relation = Friend.fromJSON(data.relation) as FriendModel;
		data.notifs = AppNotification.fromJSONArray(data.notifs) as AppNotification[];
		return data as FriendResponse;
	}
}
