import DOMPurify from "dompurify";
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
	 * @param {User | Friend} user - L'utilisateur pour lequel récupérer l'avatar.
	 * @returns {Promise<string>} L'URL complète de l'avatar de l'utilisateur.
	 */
	public async getUserAvatarURL(user: User | Friend | null): Promise<string> {
		const defaultUrl = `${IMAGE_CONST.ROUTE_API}${DB_CONST.USER.DEFAULT_AVATAR}`;
		if (!user || !user.avatar) {
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
			return DOMPurify.sanitize(`<span data-ts="users.online">online</span> ${user.formattedEndLog}`);
	}

	/**
	 * Convertit un statut en libellé lisible.
	 * 
	 * @returns Libellé lisible
	 */
	public showStatusLabel(user: User): string {
		switch (user.status) {
			case USER_ONLINE_STATUS.ONLINE: 
				return DOMPurify.sanitize(`<div class="online" data-ts="users.online" data-type="title" title="online"></div>`);
			case USER_ONLINE_STATUS.OFFLINE:
				return DOMPurify.sanitize(`<div class="offline" data-ts="users.offline" data-type="title" title="offline"></div>`);
			// case USER_ONLINE_STATUS.IN_GAME:
			// 	return DOMPurify.sanitize(`<div class="ingame" data-ts="users.ingame" title="in game"></div>`);
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
		switch (user.friendStatus) {
			case DB_CONST.FRIENDS.STATUS.ACCEPTED:
				return DOMPurify.sanitize(`<i class="fa-solid fa-user-check" data-ts="users.acceptedFriend" data-type="title" title="Friend !"></i>`);
			case DB_CONST.FRIENDS.STATUS.PENDING:
				return DOMPurify.sanitize(`<i class="fa-solid fa-user-clock" data-ts="users.pendingFriend" data-type="title" title="Pending resquest..."></i>`);
			case DB_CONST.FRIENDS.STATUS.BLOCKED:
				return DOMPurify.sanitize(`<i class="fa-solid fa-user-slash" data-ts="users.blockedFriend" data-type="title" title="Blocked !"></i>`);
			default: 
				return DOMPurify.sanitize(`<i class="fa-solid fa-minus"></i>`);
		}
	}

	// ============================================================================
	// MANIPULATION DES COLLECTIONS D'UTILISATEURS
	// ============================================================================

	/**
	 * Filtre les utilisateurs en ligne.
	 * 
	 * @param {User[]} users - Tableau d'instances User
	 * @returns {User[]} Tableau d'utilisateurs en ligne
	 */
	public getOnlineUsers(users: User[]): User[] {
		return users.filter(user => user.isOnline());
	}

}
