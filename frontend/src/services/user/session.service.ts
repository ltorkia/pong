import { User } from '../../shared/models/user.model';
import { currentService } from '../index.service';
import { authApi } from '../../api/index.api';
import { animationService } from '../index.service';
import { COOKIES_CONST } from '../../shared/config/constants.config';

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
		// Nettoyer au cas où il y aurait des restes
		currentService.clearCurrentUser();
		return null;
	}

	/**
	 * Vérifie si le cookie d'authentification est présent
	 */
	public hasAuthCookie(): boolean {
		return document.cookie.includes(`${COOKIES_CONST.AUTH.STATUS_KEY}=${COOKIES_CONST.AUTH.STATUS_VALUE}`);
	}

	/**
	 * Charge ou restaure l'utilisateur en fonction de la présence d'un cookie d'authentification.
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
			// Vérifier que l'utilisateur a un ID valide
			if (!storedUser.id) {
				console.warn(`[${this.constructor.name}] Utilisateur en store sans ID valide, nettoyage`);
				currentService.clearCurrentUser();
				return await this.restoreUser();
			}

			// Utilisateur en store + cookie présent, on vérifie la validité
			console.log(`[${this.constructor.name}] Utilisateur en store, validation serveur en cours...`);
			return await this.validateAndReturn(storedUser);
		}

		// Cookie présent mais pas d'utilisateur en store => restaurer depuis localStorage et fallback API
		return await this.restoreUser();
	}

	/**
	 * Restaure l'utilisateur à partir de localStorage, puis de l'API si nécessaire.
	 */
	private async restoreUser(): Promise<User | null> {
		// Essayer localStorage d'abord
		try {
			const user = await currentService.restoreUser();
			if (user && user.id) {
				console.log(`[${this.constructor.name}] Utilisateur localStorage trouvé, validation serveur en cours...`);
				const validatedUser = await this.validateAndReturn(user);
				if (validatedUser) {
					animationService.animateNavbarOut = true;
					return validatedUser;
				}
			}
		} catch (error) {
			console.warn(`[${this.constructor.name}] Erreur lors de la restauration depuis localStorage:`, error);
		}

		// Fallback API seulement si localStorage a échoué
		try {
			console.log(`[${this.constructor.name}] Tentative de récupération via API...`);
			const apiUser = await authApi.getMe();
			if (apiUser && apiUser.id) {
				animationService.animateNavbarOut = true;
				console.log(`[${this.constructor.name}] Utilisateur chargé via API`);
				return apiUser;
			}
		} catch (err) {
			console.warn(`[${this.constructor.name}] Impossible de charger depuis API:`, err);
		}

		console.log(`[${this.constructor.name}] Aucune méthode de restauration n'a fonctionné`);
		return null;
	}

	/**
	 * Valide la session user côté serveur, et renvoie l'utilisateur validé ou null.
	 */
	private async validateAndReturn(user: User): Promise<User | null> {
		// Vérifier que l'utilisateur a un ID valide avant validation
		if (!user.id) {
			console.warn(`[${this.constructor.name}] Tentative de validation d'un utilisateur sans ID`);
			currentService.clearCurrentUser();
			return null;
		}

		try {
			// Verifier que cette session est encore valide via requete serveur
			const isValid = await this.validateUserSession(user.id);
			if (isValid) {
				console.log(`[${this.constructor.name}] Session validée côté serveur`);
				return user;
			} else {
				console.log(`[${this.constructor.name}] Session expirée côté serveur → nettoyage`);
				currentService.clearCurrentUser();
				return null;
			}
		} catch (err) {
			console.warn(`[${this.constructor.name}] Erreur validation serveur:`, err);
			return null;
		}
	}
	
	/**
	 * Vérifie la validité de la session utilisateur via une requête API.
	 */
	private async validateUserSession(userId: number): Promise<boolean> {
		try {
			const response = await authApi.validateSession(userId);
			return response.valid;
		} catch (error) {
			console.error(`[${this.constructor.name}] Erreur lors de la validation:`, error);
			return false;
		}
	}
}