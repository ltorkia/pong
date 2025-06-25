import { userApi } from '../api/user.api';
import { userStore } from '../store/UserStore';
import { User } from '../types/store.types';

/**
 * Utilisée en singleton, class axée logique métier qui gère le userStore 
 * + user dans localStorage,
 * + réception des requêtes API liées à l'authentification.
 */
export class UserManager {
	private lastValidationTime = 0;			// derniere validation cookie dans cache
	private validationCacheDuration = 5000;	// duree validation cache 5 secondes pour eviter spam
	private isValidating = false;			// flag pour éviter les validations multiples

	/**
	 * Méthode appelée au start de AppManager.
	 * Charge ou restaure un utilisateur à l'aide du cookie compagnon,
	 * le store, localStorage, et enfin l'api avec requête à /api/me
	 */
	public async loadUser(): Promise<void> {
		// Vérification rapide avec le cookie compagnon
		if (this.hasAuthCookie()) {
			console.log('[UserManager] Cookie auth_status présent, chargement utilisateur...');
			// Seulement dans ce cas on charge l'utilisateur
			// Cette fonction utilisera localStorage en priorité, puis API si nécessaire
			await this.loadOrRestoreUser();
			return;
		}
		// Si pas de cookie:
		console.log('[UserManager] Pas de cookie auth_status, démarrage sans utilisateur');
		// Pas besoin d'appeler loadOrRestoreUser(), on sait déjà qu'il n'y a pas d'utilisateur
		// Le router gérera les redirections si nécessaire
	}

	/**
	 * Vérifie si le cookie d'authentification est présent
	 * sans faire d'appel API ni accéder au store
	 */
	public hasAuthCookie(): boolean {
		return document.cookie.includes('auth_status=active');
	}

	/**
	 * Méthode principale qui gère la désynchronisation cookie/serveur
	 * - Priorité au serveur: si API dit "non connecté", on efface tout
	 * - Cache intelligent pour éviter le spam
	 */
	public async loadOrRestoreUser(): Promise<User | null> {
		// Check store en mémoire
		const storedUser = userStore.getCurrentUser();
		const hasCookie = this.hasAuthCookie();

		// Pas de cookie = pas connecté
		if (!hasCookie) {
			if (storedUser) {
				console.log('[UserManager] Cookie supprimé, nettoyage store');
				userStore.clearCurrentUser();
			}
			return null;
		}

		// Cookie présent, vérifier la validité du user
		if (storedUser) {
			// Utilisateur en store + cookie présent,
			// on vérifie la validité de la session user cote back
			if (this.needsServerValidation() && !this.isValidating) {
				return await this.validateAndReturn(storedUser);
			}
			return storedUser;
		}

		// Cookie présent mais pas d'utilisateur en store → restaurer depuis localStorage et fallback API
		return await this.restoreUser();
	}


	/**
	 * Si le delai du cache est depasse, il faut revalider la session user
	 */
	private needsServerValidation(): boolean {
		return (Date.now() - this.lastValidationTime) > this.validationCacheDuration;
	}

	/**
	 * Validation serveur avec cache anti-spam
	 */
	private async validateAndReturn(user: User): Promise<User | null> {
		this.isValidating = true;
		
		try {
			const isValid = await this.validateUserSession(user.id);
			this.lastValidationTime = Date.now();
			
			if (isValid) {
				console.log('[UserManager] Session validée côté serveur');
				return user;
			} else {
				console.log('[UserManager] Session expirée côté serveur → nettoyage');
				userStore.clearCurrentUser();
				return null;
			}
		} catch (err) {
			console.warn('[UserManager] Erreur validation serveur:', err);
			// En cas d'erreur réseau, on garde l'utilisateur pour le moment
			return user;
		} finally {
			this.isValidating = false;
		}
	}

	private async validateUserSession(userId: number): Promise<boolean> {
		try {
			const response = await userApi.validateSession(userId);
			return response.valid;
		} catch {
			return false;
		}
	}

	/**
	 * Restauration depuis localStorage puis fallback API
	 */
	private async restoreUser(): Promise<User | null> {

		// Essayer localStorage d'abord
		const user = userStore.restoreFromStorage();
		if (user) {
			// Verifier que cette session est encore valide via requete serveur
			const isValid = await this.validateUserSession(user.id);
			if (isValid) {
				this.lastValidationTime = Date.now();
				console.log('[UserManager] Utilisateur restauré depuis localStorage');
				return user;
			} else {
				// Si la validation échoue, c'est que l'utilisateur
				// n'est plus authentifié côté serveur.
				console.log('[UserManager] Session localStorage expirée → nettoyage');
				userStore.clearCurrentUser();
				return null;
			}
		}

		// Fallback API
		try {
			const apiUser = await userApi.getMe();
			if (apiUser) {
				userStore.setCurrentUser(apiUser);
				this.lastValidationTime = Date.now();
				return apiUser;
			}
		} catch (err) {
			console.warn('[UserManager] Impossible de restaurer depuis API:', err);
		}

		return null;
	}

	/**
	 * Reception requête form Register
	 * User stocké dans store + localStorage
	 */
	public async register(data: Record<string, string>): Promise<{ user?: User; errorMessage?: string }> {
		const result = await userApi.registerUser(data);
		if (result.errorMessage) {
			return { errorMessage: result.errorMessage };
		}
		console.log('Utilisateur inscrit :', result);
		userStore.setCurrentUser(result.user!);
		return { user: result.user };
	}
	
	/**
	 * Reception requête form Login
	 * User stocké dans store + localStorage
	 */
	public async login(data: Record<string, string>): Promise<{ user?: User; errorMessage?: string }> {
		const result = await userApi.loginUser(data);
		if (result.errorMessage) {
			return { errorMessage: result.errorMessage };
		}
		console.log('Utilisateur connecté :', result);
		userStore.setCurrentUser(result.user!);
		return { user: result.user };
	}

	/**
	 * Gestion Logout
	 * User cleared de store + localStorage
	 */
	public async logout(): Promise<{ success: boolean; errorMessage?: string }> {
		const result = await userApi.logoutUser();
		if (result.errorMessage) {
			return { success: false, errorMessage: result.errorMessage };
		}
		console.log('Utilisateur déconnecté :', result);
		userStore.clearCurrentUser();
		return { success: true };
	}

	/**
	 * Getter current user in store
	 */	
	public getCurrentUser(): User | null {
		return userStore.getCurrentUser();
	}
}  

export const userManager = new UserManager();
