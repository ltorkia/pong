import { User } from '../../shared/models/user.model';
import { Friend } from '../../shared/models/friend.model';
import { dataApi } from '../../api/index.api';
import { UserResponse } from '../../shared/types/response.types';
import { showAlert } from '../../utils/dom.utils';
import { isValidImage, checkImageExists } from '../../utils/image.utils';
import { UserStatus } from '../../shared/types/user.types';
import { DB_CONST, IMAGE_CONST, USER_ONLINE_STATUS } from '../../shared/config/constants.config'; // en rouge car dossier local 'shared' != dossier conteneur

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
		const result: UserResponse = await dataApi.updateUser(id, userData);
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
		const result: UserResponse = await dataApi.updateAvatar(id, formData);
		if (result.errorMessage) {
			console.error(`[${this.constructor.name}] Erreur de mise à jour de l'avatar utilisateur.`);
			showAlert(result.errorMessage);
			return false;
		}
		console.log(`[${this.constructor.name}] Avatar de l'utilisateur mis à jour.`);
		showAlert('Image successfully uploaded.', 'alert-avatar', 'success');
		return true;
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
	 * Renvoie la date de fin de la dernière session de l'utilisateur sous forme
	 * de string formatée, si l'utilisateur est hors ligne. Sinon, renvoie
	 * `undefined`.
	 * 
	 * @param {User} user - L'utilisateur dont on veut afficher la date de fin
	 * de la dernière session.
	 * @returns {string | undefined} La date de fin de la dernière session de l'utilisateur
	 * formatée, ou `undefined` si l'utilisateur est en ligne.
	 */
	public showLogDate(user: User): string | void {
		if (!user.isOnline())
			return `online ${user.formattedEndLog}`;
	}

	/**
	 * Convertit un statut en libellé lisible.
	 * 
	 * @returns Libellé lisible
	 */
	public showStatusLabel(user: User): string {
		console.log(user.status);
		switch (user.status) {
			case USER_ONLINE_STATUS.ONLINE: 
				return `<div class="online" title="online"></div>`;
			case USER_ONLINE_STATUS.OFFLINE:
				return `<div class="offline" title="offline"></div>`;
			case USER_ONLINE_STATUS.IN_GAME:
				return `<div class="ingame" title="in game"></div>`;
			default: return 'Unknown';
		}
	}

	/**
	 * Renvoie le libellé correspondant au statut d'ami de l'utilisateur,
	 * ou `undefined` si l'utilisateur n'est pas un ami.
	 * 
	 * @param {User | Friend} user - L'utilisateur dont on veut afficher le statut d'ami.
	 * @returns {string} Le libellé correspondant au statut d'ami
	 * de l'utilisateur.
	 */
	public showFriendLogo(user: User | Friend): string {
		console.log(user.friendStatus);
		switch (user.friendStatus) {
			case DB_CONST.FRIENDS.STATUS.ACCEPTED:
				return `<i class="fa-solid fa-user-check" title="Friend !"></i>`;
			case DB_CONST.FRIENDS.STATUS.PENDING:
				return `<i class="fa-solid fa-user-clock" title="Pending resquest..."></i>`;
			case DB_CONST.FRIENDS.STATUS.BLOCKED:
				return `<i class="fa-solid fa-user-slash" title="Blocked !"></i>`;
			default: 
				return `<i class="fa-solid fa-minus"></i>`;
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