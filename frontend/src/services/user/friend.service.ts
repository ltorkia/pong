import { Friend } from '../../shared/models/friend.model';
import { dataApi, friendApi } from '../../api/index.api';
import { currentService } from '../../services/index.service';
import { UserStatus } from '../../shared/types/user.types';
import { AppNotification } from '../../shared/models/notification.model';
import { FriendModel } from '../../shared/types/friend.types';	// en rouge car dossier local 'shared' != dossier conteneur
import { secureFetch } from '../../utils/app.utils';
import { FriendResponse } from '../../shared/types/response.types';

// ============================================================================
// FRIEND SERVICE
// ============================================================================
/**
 * Service de gestion des amis.
 * Centralise toutes les opérations sur les amis.
 */	
export class FriendService {
	
	// ===========================================
	// QUERIES / SELECT / POST REQUEST
	// ===========================================

	/**
	 * Vérifie si un utilisateur est ami avec l'utilisateur courant.
	 * 
	 * Récupère la liste des amis de l'utilisateur courant et vérifie si l'utilisateur
	 * d'identifiant `userId` est présent dans cette liste. Si l'utilisateur est un ami,
	 * renvoie un objet contenant les informations de l'ami et le statut d'amitié.
	 * Sinon, renvoie `null`.
	 * 
	 * @param {number} userId - Identifiant de l'utilisateur à vérifier.
	 * @returns {Promise<Friend | null>} - Promesse qui se résout
	 * avec un objet contenant l'ami ou `null` si l'utilisateur n'est pas ami.
	 */
	public async isFriendWithCurrentUser(userId: number): Promise<Friend | null> {
		const currentUserId = currentService.getCurrentUser()!.id;
		const userFriends: Friend[] = await dataApi.getUserFriends(currentUserId);
		if (!userFriends || userFriends.length === 0) {
			return null;
		}
		return userFriends.some(friend => friend.id === userId)
			? userFriends.find(friend => friend.id === userId)!
			: null;
	}
	
	// ===========================================
	// FRIEND ADD REQUEST - DATABASE ADD
	// ===========================================

	/**
	 * Ajoute un ami à l'utilisateur spécifié.
	 *
	 * @param {number} userId - Identifiant de l'utilisateur qui ajoute l'ami.
	 * @param {number} friendId - Identifiant de l'ami à ajouter.
	 * @returns {Promise<FriendResponse>} - Promesse qui se résout avec les informations de l'opération ou `null` en cas d'erreur.
	 */
	public async addFriend(userId: number, friendId: number): Promise<FriendResponse> {
		let friendResult: FriendResponse = await friendApi.addFriend(userId, friendId);
		if (friendResult.errorMessage) {
			return { errorMessage: friendResult.errorMessage };
		}
		friendResult.relation = Friend.fromJSON(friendResult.relation) as FriendModel;
		friendResult.notif = AppNotification.fromJSON(friendResult.notif) as AppNotification;
		return friendResult as FriendResponse;
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
		let friendResult: FriendResponse = await friendApi.acceptFriend(userId, friendId);
		if (friendResult.errorMessage) {
			return { errorMessage: friendResult.errorMessage };
		}
		friendResult.relation = Friend.fromJSON(friendResult.relation) as FriendModel;
		friendResult.notif = AppNotification.fromJSON(friendResult.notif) as AppNotification;
		friendResult.notifs = AppNotification.fromJSONArray(friendResult.notifs) as AppNotification[];
		return friendResult as FriendResponse;
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
		let friendResult: FriendResponse = await friendApi.blockFriend(userId, friendId);
		if (friendResult.errorMessage) {
			return { errorMessage: friendResult.errorMessage };
		}
		friendResult.relation = Friend.fromJSON(friendResult.relation) as FriendModel;
		friendResult.notif = AppNotification.fromJSON(friendResult.notif) as AppNotification;
		friendResult.notifs = AppNotification.fromJSONArray(friendResult.notifs) as AppNotification[];
		return friendResult as FriendResponse;
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
		let friendResult: FriendResponse = await friendApi.removeFriend(userId, friendId);
		if (friendResult.errorMessage) {
			console.error(friendResult.errorMessage);
			return;
		}
		friendResult.relation = Friend.fromJSON(friendResult.relation) as FriendModel;
		friendResult.notifs = AppNotification.fromJSONArray(friendResult.notifs) as AppNotification[];
		return friendResult as FriendResponse;
	}

	// ============================================================================
	// MANIPULATION DES COLLECTIONS D'AMIS
	// ============================================================================

	/**
	 * Filtre les amis actifs (non supprimés).
	 * 
	 * @param {Friend[]} friends - Tableau d'instances Friend
	 * @returns {Friend[]} Tableau d'utilisateurs actifs
	 */
	public getActiveFriends(friends: Friend[]): Friend[] {
		return friends.filter(friend => friend.isActive);
	}

	/**
	 * Filtre les utilisateurs en ligne.
	 * 
	 * @param {Friend[]} friends - Tableau d'instances Friend
	 * @returns {Friend[]} Tableau d'utilisateurs en ligne
	 */
	public getOnlineFriends(friends: Friend[]): Friend[] {
		return friends.filter(friend => friend.isOnline());
	}

	/**
	 * Filtre les utilisateurs par statut.
	 * 
	 * @param {Friend[]} friends - Tableau d'instances Friend
	 * @param {friendstatus} status - Statut à filtrer
	 * @returns {Friend[]} Tableau d'utilisateurs avec le statut spécifié
	 */
	public getFriendsByStatus(friends: Friend[], status: UserStatus): Friend[] {
		return friends.filter(friend => friend.status === status);
	}

	/**
	 * Recherche des utilisateurs par nom d'utilisateur.
	 * 
	 * @param {Friend[]} friends - Tableau d'instances Friend
	 * @param {string} searchTerm - Terme de recherche
	 * @returns {Friend[]} Tableau d'utilisateurs correspondants
	 */
	public searchFriendByFriendname(friends: Friend[], searchTerm: string): Friend[] {
		const term = searchTerm.toLowerCase();
		return friends.filter(friend => 
			friend.Friendname.toLowerCase().includes(term)
		);
	}

	/**
	 * Trie les utilisateurs par taux de victoire décroissant.
	 * 
	 * @param {Friend[]} friends - Tableau d'instances Friend
	 * @returns {Friend[]} Tableau d'utilisateurs triés
	 */
	public sortFriendsByWinRate(friends: Friend[]): Friend[] {
		return [...friends].sort((a, b) => b.winRate - a.winRate);
	}

	/**
	 * Trie les utilisateurs par nombre de parties jouées décroissant.
	 * 
	 * @param {Friend[]} friends - Tableau d'instances Friend
	 * @returns {Friend[]} Tableau d'utilisateurs triés
	 */
	public sortFriendsByGamesPlayed(friends: Friend[]): Friend[] {
		return [...friends].sort((a, b) => b.gamePlayed - a.gamePlayed);
	}
}