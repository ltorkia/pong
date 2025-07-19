import { User } from '../../models/user.model';
import { currentService } from '../index.service';
import { authApi } from '../../api/index.api';
import { animationService } from '../index.service';
import { COOKIES_CONST } from '../../shared/config/constants.config'; // en rouge car dossier local 'shared' != dossier du conteneur

// ===========================================
// SESSION SERVICE
// ===========================================
/**
 * Service centralisé pour gérer la session de l'utilisateur.
 */
export class SessionService {

	/**
	 * Charge l'utilisateur si un cookie d'authentification est présent,
	 * sinon, on lance l'application sans utilisateur.
	 *
	 * @returns {(Promise<User | null>)} L'utilisateur chargé, ou null si pas de cookie.
	 */
	public async loadUser(): Promise<User | null> {
		// Vérification rapide avec le cookie compagnon
		if (this.hasAuthCookie()) {
			console.log(`[${this.constructor.name}] Cookie auth_status présent, chargement utilisateur...`);
			// Seulement dans ce cas on charge l'utilisateur
			return await this.loadOrRestoreUser();
		}
		// Si pas de cookie:
		console.log(`[${this.constructor.name}] Pas de cookie auth_status, démarrage sans utilisateur`);
		// Pas besoin d'appeler loadOrRestoreUser(), on sait déjà qu'il n'y a pas d'utilisateur
		// Le router gérera les redirections si nécessaire
		return null;
	}

	/**
	 * Vérifie si le cookie d'authentification est présent
	 * dans le navigateur en vérifiant la présence de la clé
	 * `auth-status` avec la valeur `active` dans le document.cookie.
	 * 
	 * @returns {boolean} true si le cookie est présent, false sinon.
	 */
	public hasAuthCookie(): boolean {
		return document.cookie.includes(`${COOKIES_CONST.AUTH.STATUS_KEY}=${COOKIES_CONST.AUTH.STATUS_VALUE}`);
	}

	/**
	 * Charge ou restaure l'utilisateur en fonction de la présence d'un cookie d'authentification.
	 * 
	 * - Si pas de cookie, efface l'utilisateur actuel du store et renvoie null.
	 * - Si cookie et utilisateur en store, valide la session avec le serveur.
	 * - Si cookie mais pas d'utilisateur en store, essaie de restaurer l'utilisateur depuis le localStorage,
	 *   puis fait fallback sur l'API si nécessaire.
	 * 
	 * @returns {Promise<User | null>} L'utilisateur validé ou restauré, ou null si pas d'authentification possible.
	 */
	public async loadOrRestoreUser(): Promise<User | null> {
		const hasCookie = this.hasAuthCookie();
		const storedUser = currentService.getCurrentUser();

		// Pas de cookie = pas connecté
		if (!hasCookie) {
			if (storedUser) {
				console.log(`[${this.constructor.name}] Cookie supprimé, nettoyage store`);
				currentService.clearCurrentUser();
			}
			return null;
		}

		// Cookie présent, vérifier la validité du user
		if (storedUser) {
			// Utilisateur en store + cookie présent,
			// on vérifie la validité de la session user cote back
			console.log(`[${this.constructor.name}] Utilisateur en store, validation serveur en cours...`);
			return await this.validateAndReturn(storedUser);
		}

		// Cookie présent mais pas d'utilisateur en store → restaurer depuis localStorage et fallback API
		return await this.restoreUser();
	}

	/**
	 * Restaure l'utilisateur à partir de localStorage, puis de l'API si nécessaire.
	 * 
	 * - Tente d'abord de récupérer l'utilisateur stocké localement.
	 * - Si un utilisateur est trouvé, il est validé côté serveur.
	 * - Si aucun utilisateur n'est trouvé localement, une requête API est effectuée.
	 * - L'utilisateur est conecté et validé, on active l'animation d'entrée de la barre de navigation.
	 *
	 * @private
	 * @returns {Promise<User | null>} L'utilisateur restauré ou null si la restaurtion a échoué.
	 */
	private async restoreUser(): Promise<User | null> {

		// Essayer localStorage d'abord
		const user = currentService.restoreUser();
		if (user) {
			console.log(`[${this.constructor.name}] Utilisateur localStorage trouvé, validation serveur en cours...`);
			animationService.animateNavbarOut = true;
			return await this.validateAndReturn(user);
		}

		// Fallback API (met à jour le store + storage)
		try {
			const apiUser = await authApi.getMe();
			if (apiUser) {
				const user = currentService.getCurrentUser();
				animationService.animateNavbarOut = true;
				console.log(`[${this.constructor.name}] Utilisateur chargé via API`);
				return user;
			}
		} catch (err) {
			console.warn(`[${this.constructor.name}] Impossible de charger depuis API:`, err);
		}

		return null;
	}

	/**
	 * Valide la session user côté serveur, et renvoie l'utilisateur validé ou null si la session a expiré.
	 * 
	 * - Si la validation échoue, l'utilisateur est supprimé du store.
	 * - Si une erreur survient, l'utilisateur est quand même renvoyé 'null'.
	 *
	 * @private
	 * @param {User} user Utilisateur à valider
	 * @returns {(Promise<User | null>)} L'utilisateur validé ou null si la session a expiré
	 */
	private async validateAndReturn(user: User): Promise<User | null> {
		
		try {
			// Verifier que cette session est encore valide via requete serveur
			const isValid = await this.validateUserSession(user.id);
			
			if (isValid) {
				console.log(`[${this.constructor.name}] Session validée côté serveur`);
				return user;
			} else {
				// Si la validation échoue, c'est que l'utilisateur
				// n'est plus authentifié côté serveur.
				console.log(`[${this.constructor.name}] Session expirée côté serveur → nettoyage`);
				currentService.clearCurrentUser();
				return null;
			}
		} catch (err) {
			console.warn(`[${this.constructor.name}] Erreur validation serveur:`, err);
			return user;
		}
	}
	
	/**
	 * Vérifie la validité de la session utilisateur via une requête API.
	 * 
	 * Envoie une requête au serveur pour valider la session de l'utilisateur
	 * avec l'identifiant spécifié. Si la session est valide, retourne true.
	 * En cas d'erreur ou si la session n'est pas valide, retourne false.
	 *
	 * @param {number} userId - ID de l'utilisateur dont la session doit être validée.
	 * @returns {Promise<boolean>} true si la session est valide, false sinon.
	 */
	private async validateUserSession(userId: number): Promise<boolean> {
		try {
			const response = await authApi.validateSession(userId);
			return response.valid;
		} catch {
			return false;
		}
	}
}
