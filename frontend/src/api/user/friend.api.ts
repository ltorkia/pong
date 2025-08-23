import { Friend } from '../../shared/models/friend.model';
import { AppNotification } from '../../shared/models/notification.model';
import { FriendModel } from '../../shared/types/friend.types';	// en rouge car dossier local 'shared' != dossier conteneur
import { FriendRequestAction } from '../../shared/types/notification.types';
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
	 * Ajoute un ami à un utilisateur.
	 *
	 * Envoie une requête POST à la route API `/api/friends` pour ajouter
	 * l'utilisateur d'identifiant `friendId` comme ami de l'utilisateur courant.
	 *
	 * Si la requête réussit, renvoie un objet contenant les informations de l'ami
	 * stockées en base de données, sans email (type `FriendResponse`).
	 * Sinon, renvoie un objet contenant un message d'erreur.
	 *
	 * @param {number} friendId Identifiant de l'utilisateur à ajouter comme ami.
	 * @returns {Promise<FriendResponse>} Promesse qui se résout
	 * avec un objet FriendResponse contenant les informations de l'ami ou un message d'erreur.
	 */
	public async addFriend(friendId: number): Promise<FriendResponse> {
		const res: Response = await secureFetch(`/api/friends`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: friendId })
		});
		const data: FriendResponse = await res.json();
		if (!res.ok || 'errorMessage' in data) {
			return { errorMessage: data.errorMessage || 'Erreur lors de l\'ajout d\'ami' };
		}
		return data;
	}

	// ===========================================
	// FRIEND PUT REQUESTS - DATABASE UPDATE
	// ===========================================

	/**
	 * Met à jour l'état d'une demande d'ami.
	 *
	 * Envoie une requête PUT à la route API `/api/friends/:friendId` pour mettre
	 * à jour l'état de la demande d'ami d'identifiant `friendId` avec l'action
	 * spécifiée dans `action`.
	 *
	 * Si la mise à jour réussit, renvoie un objet contenant les informations de
	 * l'opération.
	 * Sinon, renvoie un objet contenant un message d'erreur.
	 *
	 * @param {number} friendId - Identifiant de la demande d'ami à mettre à jour.
	 * @param {FriendRequestAction} action - Action à réaliser sur la demande d'ami.
	 * @returns {Promise<FriendResponse>} Promesse qui se résout avec un objet
	 * contenant les informations de l'opération ou un message d'erreur.
	 */
	public async updateFriend(friendId: number, action: FriendRequestAction): Promise<FriendResponse> {
		const res: Response = await secureFetch(`/api/friends/${friendId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify( action )
		});
		const data: FriendResponse = await res.json();
		if (!res.ok || 'errorMessage' in data) {
			return { errorMessage: data.errorMessage || 'Erreur lors de l\'acceptation / le blocage d\'ami' };
		}
		return data;
	}

	// ===========================================
	// FRIEND DELETE REQUESTS - DATABASE DELETE
	// ===========================================

	/**
	 * Supprime un ami de l'utilisateur courant.
	 * 
	 * Envoie une requête DELETE à la route API `/api/friends/:friendId` pour supprimer
	 * l'ami d'identifiant `friendId` de l'utilisateur courant.
	 * 
	 * Si la suppression réussit, renvoie un objet contenant les informations de l'opération.
	 * Sinon, renvoie un objet contenant un message d'erreur.
	 * 
	 * @param {number} friendId - Identifiant de l'ami à supprimer.
	 * @param {FriendRequestAction} action - Action à réaliser sur la demande d'ami (cancel, decline...).
	 * @returns {Promise<FriendResponse>} Promesse qui se résout avec un objet
	 * contenant les informations de l'opération ou un message d'erreur.
	 */
	public async removeFriend(friendId: number, action: FriendRequestAction): Promise<FriendResponse> {
		const res: Response = await secureFetch(`/api/friends/${friendId}?action=${action}`, {
			method: 'DELETE'
		});
		const data: FriendResponse = await res.json();
		if (!res.ok || 'errorMessage' in data) {
			return { errorMessage: data.errorMessage || 'Erreur lors de l\'acceptation d\'ami' };
		}
		return data;
	}
}
