import { ROUTE_PATHS } from '../../config/routes.config';
import { COMPONENT_NAMES } from '../../config/components.config';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { UserRowComponent } from '../../components/user-row/user-row.component';
import { User } from '../../shared/models/user.model';
import { Friend } from '../../shared/models/friend.model';
import { dataApi } from '../../api/index.api';
import { AuthResponse } from '../../types/api.types';
import { currentService, pageService } from '../../services/index.service';
import { showAlert } from '../../utils/dom.utils';
import { isValidImage, checkImageExists } from '../../utils/image.utils';
import { UserStatus } from '../../shared/types/user.types';
import { DB_CONST, IMAGE_CONST, FRIEND_REQUEST_ACTIONS } from '../../shared/config/constants.config'; // en rouge car dossier local 'shared' != dossier conteneur
import type { FriendRequest } from "../../shared/types/websocket.types";

// ============================================================================
// DATA SERVICE
// ============================================================================
/**
 * Service de gestion des utilisateurs et de la logique métier.
 * 
 * Centralise toutes les opérations sur les utilisateurs.
 */
export class DataService {

	/**
	 * Met à jour les propriétés de l'utilisateur avec de nouvelles données.
	 * 
	 * @param {number} id - Identifiant de l'utilisateur à mettre à jour
	 * @param {Record<string, string>} userData - Objet contenant les propriétés à mettre à jour
	 * @param {string} [alertDivId] - Identifiant de de la div où afficher l'alerte
	 * @returns {Promise<boolean>} - Promesse qui se resout lorsque l'utilisateur est mis à jour
	 */
	public async updateUser(id: number, userData: Record<string, string>, alertDivId?: string): Promise<boolean> {
		const result: AuthResponse = await dataApi.updateUser(id, userData);
		if (result.errorMessage) {
			console.error(`[${this.constructor.name}] Erreur de mise à jour utilisateur.`);
			showAlert(result.errorMessage, alertDivId);
			return false;
		}
		console.log(`[${this.constructor.name}] Utilisateur mis à jour.`);
		showAlert('Infos successfully updated.', alertDivId, 'success');
		return true;
	}

	/**
	 * Met à jour l'avatar de l'utilisateur courant.
	 * 
	 * Fait une requête API pour mettre à jour l'avatar de l'utilisateur courant.
	 * Si la requête réussit, affiche un message de succès et return true.
	 * 
	 * @param {number} id - Identifiant de l'utilisateur courant.
	 * @param {File} file Le fichier image à uploader.
	 * @returns {Promise<boolean>} - Promesse qui se resout lorsque l'avatar est mis à jour.
	 */ 
	public async updateAvatar(id: number, file: File): Promise<boolean> {
		const validImage = isValidImage(file);
		if (!validImage) {
			return false;
		}
		const formData = new FormData();
		formData.append('avatar', file);
		const result: AuthResponse = await dataApi.updateAvatar(id, formData);
		if (result.errorMessage) {
			console.error(`[${this.constructor.name}] Erreur de mise à jour de l'avatar utilisateur.`);
			showAlert(result.errorMessage);
			return false;
		}
		console.log(`[${this.constructor.name}] Avatar de l'utilisateur mis à jour.`);
		showAlert('Image successfully uploaded.', 'alert-avatar', 'success');
		return true;
	}

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
	 * Gère une demande d'amitié reçue via une requête WebSocket.
	 *
	 * Une demande d'amitié est un objet qui contient les propriétés suivantes:
	 *
	 * - `action`: une valeur du type `FRIEND_REQUEST_ACTIONS` qui indique
	 *   l'action demandée (envoi, acceptation, suppression, blocage).
	 * - `from`: l'identifiant de l'utilisateur qui envoie la demande.
	 * - `to`: l'identifiant de l'utilisateur destinataire de la demande.
	 */
	public async handleFriendRequest(data: FriendRequest) {
		console.log("BLOUUUUUUUU");
		const page = pageService.getCurrentPage()!;
		if (page.config.path === ROUTE_PATHS.USERS) {
			console.log("BLAAAAAA");
			const userRowInstance = page.getComponentInstance!<UserRowComponent>(COMPONENT_NAMES.USER_ROW);
			await (userRowInstance as UserRowComponent).toggleFriendButton();
		}
		const navbarInstance = page.getComponentInstance!<NavbarComponent>(COMPONENT_NAMES.NAVBAR);
		switch (data.action) {
			case FRIEND_REQUEST_ACTIONS.ADD:
				alert(`New friend request from ${data.from}`);
				console.log("New friend request from user ID:", data.from, "to user ID:", data.to);
				navbarInstance!.updateNotifsCounter();
				navbarInstance!.addNewNotification(`${data.from} has sent you a friend request.`);
				break;
			case FRIEND_REQUEST_ACTIONS.ACCEPT:
				console.log("Friend request accepted from user ID:", data.from, "to user ID:", data.to);
				navbarInstance!.updateNotifsCounter();
				navbarInstance!.addNewNotification(`${data.from} has accepted your friend request.`);
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
	}

	// ============================================================================
	// MÉTHODES UTILITAIRES
	// ============================================================================
	
	/**
	 * Récupère l'URL complète de l'avatar d'un utilisateur.
	 *
	 * Si l'utilisateur n'a pas d'avatar défini, ou que le fichier n'existe pas
	 * sur le serveur, retourne l'URL de l'avatar par défaut.
	 *
	 * @param {User} user - L'utilisateur pour lequel récupérer l'avatar.
	 * @returns {Promise<string>} L'URL complète de l'avatar de l'utilisateur.
	 */
	public async getUserAvatarURL(user: User): Promise<string> {
		const defaultUrl = `${IMAGE_CONST.ROUTE_API}${DB_CONST.USER.DEFAULT_AVATAR}`;
		if (!user.avatar) {
			return defaultUrl;
		}
		const avatarUrl = `${IMAGE_CONST.ROUTE_API}${user.avatar}`;
		const exists = await checkImageExists(avatarUrl);
		return exists ? avatarUrl : defaultUrl;
	}
	
	public async returnDefaultAvatarURL(): Promise<string> {
		return `${IMAGE_CONST.ROUTE_API}${DB_CONST.USER.DEFAULT_AVATAR}`;
	}

	/**
	 * Convertit un statut en libellé lisible.
	 * 
	 * @returns Libellé lisible
	 */
	public showStatusLabel(user: User): string {
		switch (user.status) {
			case 'online': return '<span class="text-green-500">🟢 online </span>';
			case 'offline': return '<span class="text-red-500">🔴 offline </span>';
			case 'in-game': return '<span class="text-yellow-500">🟡 in game</span>';
			default: return 'Unknown';
		}
	}

	// ============================================================================
	// MANIPULATION DES COLLECTIONS D'UTILISATEURS
	// ============================================================================

	/**
	 * Filtre les utilisateurs actifs (non supprimés).
	 * 
	 * @param {User[]} users - Tableau d'instances User
	 * @returns {User[]} Tableau d'utilisateurs actifs
	 */
	public getActiveUsers(users: User[]): User[] {
		return users.filter(user => user.isActive);
	}

	/**
	 * Filtre les utilisateurs en ligne.
	 * 
	 * @param {User[]} users - Tableau d'instances User
	 * @returns {User[]} Tableau d'utilisateurs en ligne
	 */
	public getOnlineUsers(users: User[]): User[] {
		return users.filter(user => user.isOnline());
	}

	/**
	 * Filtre les utilisateurs par statut.
	 * 
	 * @param {User[]} users - Tableau d'instances User
	 * @param {UserStatus} status - Statut à filtrer
	 * @returns {User[]} Tableau d'utilisateurs avec le statut spécifié
	 */
	public getUsersByStatus(users: User[], status: UserStatus): User[] {
		return users.filter(user => user.status === status);
	}

	/**
	 * Recherche des utilisateurs par nom d'utilisateur.
	 * 
	 * @param {User[]} users - Tableau d'instances User
	 * @param {string} searchTerm - Terme de recherche
	 * @returns {User[]} Tableau d'utilisateurs correspondants
	 */
	public searchByUsername(users: User[], searchTerm: string): User[] {
		const term = searchTerm.toLowerCase();
		return users.filter(user => 
			user.username.toLowerCase().includes(term)
		);
	}

	/**
	 * Trie les utilisateurs par taux de victoire décroissant.
	 * 
	 * @param {User[]} users - Tableau d'instances User
	 * @returns {User[]} Tableau d'utilisateurs triés
	 */
	public sortByWinRate(users: User[]): User[] {
		return [...users].sort((a, b) => b.winRate - a.winRate);
	}

	/**
	 * Trie les utilisateurs par nombre de parties jouées décroissant.
	 * 
	 * @param {User[]} users - Tableau d'instances User
	 * @returns {User[]} Tableau d'utilisateurs triés
	 */
	public sortByGamesPlayed(users: User[]): User[] {
		return [...users].sort((a, b) => b.gamePlayed - a.gamePlayed);
	}
}