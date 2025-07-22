import { User } from '../../models/user.model';
import { dataApi } from '../../api/index.api';
import { AuthResponse } from '../../types/api.types';
import { currentService } from '../../services/index.service';
import { showAlert } from '../../utils/dom.utils';
import { isValidImage, checkImageExists } from '../../utils/image.utils';
import { UserStatus } from '../../shared/types/user.types';
import { DB_CONST, IMAGE_CONST } from '../../shared/config/constants.config'; // en rouge car dossier local 'shared' != dossier conteneur

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
	 * @returns {Promise<boolean>} - Promesse qui se resout lorsque l'utilisateur est mis à jour
	 */
	public async updateUser(id: number, userData: Record<string, string>): Promise<boolean> {
		const result: AuthResponse = await dataApi.updateUser(id, userData);
		if (result.errorMessage) {
			console.error(`[${this.constructor.name}] Erreur de mise à jour utilisateur.`);
			showAlert(result.errorMessage);
			return false;
		}
		console.log(`[${this.constructor.name}] Utilisateur mis à jour.`);
		showAlert('Infos successfully updated.', 'alert', 'success');
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
	 * Vérifie si l'utilisateur courant est ami avec l'utilisateur d'ID `userId`.
	 * 
	 * Fait une requête API pour récupérer la liste des amis de l'utilisateur d'ID `userId`.
	 * Si la liste est vide ou si la requête échoue, return false.
	 * 
	 * Sinon, parcourt la liste des amis pour vérifier si l'utilisateur courant est présent.
	 * Si l'utilisateur courant est trouvé, return true, sinon return false.
	 * 
	 * @param {number} userId - Identifiant de l'utilisateur à vérifier.
	 * @param {User[]} userFriends - Liste des amis de l'utilisateur.
	 * @returns {Promise<boolean>} - Promesse qui se résout avec un booléen.
	 */
	public async isFriendWithCurrentUser(userId: number, userFriends: User[] | null = null): Promise<boolean> {
		if (!userFriends) {
			const friends: User[] = await dataApi.getUserFriends(userId);
			if (!friends) {
				return false;
			}
			userFriends = friends;
		}
		const currentUserId = currentService.getCurrentUser()!.id;
		return userFriends.some(friend => friend.id === currentUserId);
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