// ROUTER
import { router } from '../router/router';
import { defaultRoute, authFallbackRoute } from '../config/routes.config';

// MESSAGES
import { showError } from '../utils/app.utils';
import { REGISTERED_MSG } from '../config/messages.config';

// USER
import { userApi } from '../api/user.api';
import { userStore } from '../stores/user.store';
import { User } from '../models/user.model';
import { AuthResponse, BasicResponse } from '../types/api.types';

// UI
import { uiStore } from '../stores/ui.store';

// COOKIES
import { cookiesConst } from '../shared/config/constants'; // en rouge car dossier local != dossier du conteneur

// ===========================================
// USER SERVICE
// ===========================================
/**
 * Service centralisé pour la gestion des utilisateurs.
 * 
 * Ce service permet de gérer l'authentification des utilisateurs,
 * de stocker et de récupérer l'utilisateur courant, de gérer les opérations
 * CRUD (Create Read Update Delete) sur les utilisateurs.
 * Il est utilisé pour stocker l'utilisateur dans le store, 
 * et pour les requêtes API liées aux utilisateurs.
 */
export class UserService {

	// ===========================================
	// GESTION DE SESSION ET AUTHENTIFICATION
	// ===========================================

	/**
	 * Charge l'utilisateur si un cookie d'authentification est présent,
	 * sinon, on lance l'application sans utilisateur.
	 *
	 * @return {(Promise<User | null>)} L'utilisateur chargé, ou null si pas de cookie.
	 * @memberof UserService
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
	 * @return {boolean} true si le cookie est présent, false sinon.
	 * @memberof UserService
	 */
	public hasAuthCookie(): boolean {
		return document.cookie.includes(`${cookiesConst.authStatusKey}=${cookiesConst.authStatusValue}`);
	}

	/**
	 * Charge ou restaure l'utilisateur en fonction de la présence d'un cookie d'authentification.
	 * 
	 * - Si pas de cookie, efface l'utilisateur actuel du store et renvoie null.
	 * - Si cookie et utilisateur en store, valide la session avec le serveur.
	 * - Si cookie mais pas d'utilisateur en store, essaie de restaurer l'utilisateur depuis le localStorage, puis fait fallback sur l'API si nécessaire.
	 * 
	 * @returns {Promise<User | null>} L'utilisateur validé ou restauré, ou null si pas d'authentification possible.
	 * @memberof UserService
	 */
	public async loadOrRestoreUser(): Promise<User | null> {
		const hasCookie = this.hasAuthCookie();
		const storedUser = userStore.getCurrentUser();

		// Pas de cookie = pas connecté
		if (!hasCookie) {
			if (storedUser) {
				console.log(`[${this.constructor.name}] Cookie supprimé, nettoyage store`);
				userStore.clearCurrentUser();
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
	 *
	 * @private
	 * @return {Promise<User | null>} L'utilisateur restauré ou null si la restaurtion a échoué.
	 * @memberof UserService
	 */
	private async restoreUser(): Promise<User | null> {

		// Essayer localStorage d'abord
		const user = userStore.restoreFromStorage();
		if (user) {
			console.log(`[${this.constructor.name}] Utilisateur localStorage trouvé, validation serveur en cours...`);
			return await this.validateAndReturn(user);
		}

		// Fallback API (met à jour le store + storage)
		try {
			const apiUser = await userApi.getMe();
			if (apiUser) {
				const user = userStore.getCurrentUser();
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
	 * - Si une erreur survient, l'utilisateur est quand même renvoyé.
	 *
	 * @private
	 * @param {User} user Utilisateur à valider
	 * @return {(Promise<User | null>)} L'utilisateur validé ou null si la session a expiré
	 * @memberof UserService
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
				userStore.clearCurrentUser();
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
	 * @return {Promise<boolean>} true si la session est valide, false sinon.
	 * @memberof UserService
	 */

	private async validateUserSession(userId: number): Promise<boolean> {
		try {
			const response = await userApi.validateSession(userId);
			return response.valid;
		} catch {
			return false;
		}
	}

	// ===========================================
	// OPÉRATIONS D'AUTHENTIFICATION (LOGIN/REGISTER/LOGOUT)
	// ===========================================

	/**
	 * Inscription d'un utilisateur
	 * 
	 * Fait une requête API pour inscrire un utilisateur.
	 * Si la requête réussit, stocke l'utilisateur dans le store et
	 * redirige vers la page d'accueil.
	 * 
	 * @param {Record<string, string>} data Informations de l'utilisateur à inscrire.
	 * @return {Promise<void>} Promesse qui se résout lorsque l'opération est terminée.
	 * @throws {Error} Si la requête échoue.
	 * @memberof UserService
	 */
	public async registerUser(data: Record<string, string>): Promise<void> {
		try {
			const result: AuthResponse = await userApi.registerUser(data);
			if (result.errorMessage) {
				console.error(`[${this.constructor.name}] Erreur d\'inscription :`, result);
				showError(result.errorMessage);
				return;
			}
			
			console.log(`[${this.constructor.name}] Utilisateur inscrit :`, result);
			uiStore.animateNavbar = true;
			
			// Redirection home
			alert(REGISTERED_MSG);
			await router.redirectPublic(defaultRoute);

		} catch (err) {
			console.error(`[${this.constructor.name}] Erreur réseau ou serveur`, err);
			showError('Erreur réseau');
		}
	}

	/**
	 * Authentifie un utilisateur.
	 * 
	 * Effectue une requête API pour connecter un utilisateur avec ses
	 * informations d'identification. Si la connexion réussit, stocke 
	 * l'utilisateur dans le store et redirige vers la page d'accueil.
	 * 
	 * @param {Record<string, string>} data Informations de l'utilisateur à connecter.
	 * @return {Promise<void>} Promesse qui se résout lorsque l'opération est terminée.
	 * @throws {Error} Si la requête échoue ou en cas d'erreur réseau.
	 * @memberof UserService
	 */
	public async loginUser(data: Record<string, string>): Promise<void> {
		try {
			const result: AuthResponse = await userApi.loginUser(data);
			if (result.errorMessage) {
				console.error(`[${this.constructor.name}] Erreur d'authentification :`, result);
				showError(result.errorMessage);
				return;
			}
			
			console.log(`[${this.constructor.name}] Utilisateur connecté :`, result);
			uiStore.animateNavbar = true;
			
			// Redirection home
			await router.redirectPublic(defaultRoute);

		} catch (err) {
			console.error(`[${this.constructor.name}] Erreur réseau ou serveur`, err);
			showError('Erreur réseau');
		}
	}

	/**
	 * Déconnecte un utilisateur.
	 * 
	 * Effectue une requête API pour déconnecter l'utilisateur. 
	 * Si la déconnexion réussit, vide le store et redirige vers la page de login.
	 * 
	 * @return {Promise<void>} Promesse qui se résout lorsque l'opération est terminée.
	 * @throws {Error} Si la requête échoue ou en cas d'erreur réseau.
	 * @memberof UserService
	 */
	public async logoutUser(): Promise<void> {
		try {
			const result: BasicResponse = await userApi.logoutUser();
			if (result.errorMessage) {
				console.error(`[${this.constructor.name}] Erreur lors du logout :`, result);
				showError(result.errorMessage);
				return;
			}
			
			console.log(`[${this.constructor.name}] Utilisateur déconnecté :`, result);
			uiStore.animateNavbar = true;
			
			// Redirection SPA vers login
			console.log(`[${this.constructor.name}] Déconnexion réussie. Redirection /login`);
			await router.redirectPublic(authFallbackRoute);

		} catch (err) {
			console.error(`[${this.constructor.name}] Erreur réseau ou serveur`, err);
			showError('Erreur réseau');
		}
	}
}

/**
 * Instance unique du service d'authentification.
 * 
 * Permet de gérer l'authentification des utilisateurs en stockant
 * l'utilisateur courant dans le store et en gérant les requêtes API
 * liées à l'authentification.
 */
export const userService = new UserService();
