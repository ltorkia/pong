import { getUserLog, loginUser, logoutUser, registerUser } from '../api/users';
import { userStore, User } from '../store/UserStore';

/**
 * Utilisée en singleton, class axée logique métier qui gère le userStore 
 * + user dans localStorage,
 * + réception des requêtes API liées à l'authentification.
 */
export class UserManager {

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
	 * Vérifie si un utilisateur est déjà chargé dans le store,
	 * sinon tente de le restaurer depuis localStorage ou l'API.
	 */
	public async loadOrRestoreUser(): Promise<User | null> {
		// Si un utilisateur est déjà dans le store, pas besoin de vérifier
		if (userStore.getCurrentUser()) {
			return userStore.getCurrentUser();
		}

		// Vérification du cookie compagnon en premier
		if (!this.hasAuthCookie()) {
			console.log('[UserManager] Pas de cookie auth_status, utilisateur non connecté');
			userStore.clearCurrentUser();
			return null;
		}

		console.log('[UserManager] Cookie auth_status présent, tentative de restauration utilisateur');

		// Essayer de restaurer depuis localStorage d'abord
		userStore.restoreFromStorage();
		if (userStore.getCurrentUser()) {
			console.log('[UserManager] Utilisateur restauré depuis localStorage');
			return userStore.getCurrentUser();
		}

		// Si pas d'utilisateur en localStorage mais cookie présent,
		// faire l'appel API pour récupérer les données utilisateur
		try {
			const user = await getUserLog(); // GET /api/me
			if (user) {
				userStore.setCurrentUser(user);
				console.log('[UserManager] Utilisateur restauré via /api/me');
				return user;
			} else {
				// Cookie présent mais API retourne null/undefined
				console.warn('[UserManager] Cookie présent mais API ne retourne pas d\'utilisateur');
				userStore.clearCurrentUser();
				return null;
			}
		} catch (err) {
			console.warn('[UserManager] Erreur lors de la restauration via /api/me:', err);
			userStore.clearCurrentUser();
			return null;
		}
	}

	/**
	 * Reception requête form Register
	 * User stocké dans store + localStorage
	 */
	public async register(data: Record<string, string>): Promise<{ user?: User; errorMessage?: string }> {
		const result = await registerUser(data);
		if (result.errorMessage) {
			return { errorMessage: result.errorMessage };
		}
		console.log('Utilisateur inscrit :', result);
		userStore.setCurrentUser(result.user);
		return { user: result.user };
	}
	/**
	 * Reception requête form Login
	 * User stocké dans store + localStorage
	 */
	public async login(data: Record<string, string>): Promise<{ user?: User; errorMessage?: string }> {
		const result = await loginUser(data);
		if (result.errorMessage) {
			return { errorMessage: result.errorMessage };
		}
		console.log('Utilisateur connecté :', result);
		userStore.setCurrentUser(result.user);
		return { user: result.user };
	}

	/**
	 * Gestion Logout
	 * User cleared de store + localStorage
	 */
	public async logout(): Promise<{ success: boolean; errorMessage?: string }> {
		const result = await logoutUser();
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
