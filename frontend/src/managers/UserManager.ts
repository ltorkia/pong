import { userApi } from '../api/user.api';
import { userStore } from '../store/UserStore';
import { User } from '../models/User.model';

/**
 * Utilisée en singleton, class qui gère le userStore 
 * + user dans localStorage,
 * + réception des requêtes API liées à l'authentification.
 */
export class UserManager {

	/**
	 * Méthode appelée au start de AppManager.
	 * Charge ou restaure un utilisateur à l'aide du cookie compagnon,
	 * le store, localStorage avec validation cote serveur,
	 * et enfin l'api avec requête à /api/me
	 */
	public async loadUser(): Promise<User | null> {
		// Vérification rapide avec le cookie compagnon
		if (this.hasAuthCookie()) {
			console.log('[UserManager] Cookie auth_status présent, chargement utilisateur...');
			// Seulement dans ce cas on charge l'utilisateur
			return await this.loadOrRestoreUser();
		}
		// Si pas de cookie:
		console.log('[UserManager] Pas de cookie auth_status, démarrage sans utilisateur');
		// Pas besoin d'appeler loadOrRestoreUser(), on sait déjà qu'il n'y a pas d'utilisateur
		// Le router gérera les redirections si nécessaire
		return null;
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
	 * - Priorité au serveur: si API ne valide pas la session user, on efface tout
	 */
	public async loadOrRestoreUser(): Promise<User | null> {
		const hasCookie = this.hasAuthCookie();
		const storedUser = this.getCurrentUser();

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
			console.log('[UserManager] Utilisateur en store, validation serveur en cours...');
			return await this.validateAndReturn(storedUser);
		}

		// Cookie présent mais pas d'utilisateur en store → restaurer depuis localStorage et fallback API
		return await this.restoreUser();
	}

	/**
	 * Restauration depuis localStorage puis fallback API
	 */
	private async restoreUser(): Promise<User | null> {

		// Essayer localStorage d'abord
		const user = userStore.restoreFromStorage();
		if (user) {
			console.log('[UserManager] Utilisateur localStorage trouvé, validation serveur en cours...');
			return await this.validateAndReturn(user);
		}

		// Fallback API
		try {
			const apiUser = await userApi.getMe();
			if (apiUser) {
				console.log('[UserManager] Utilisateur chargé via API');
				const user = User.fromJSON(apiUser);
				userStore.setCurrentUser(user);
				return user;
			}
		} catch (err) {
			console.warn('[UserManager] Impossible de charger depuis API:', err);
		}

		return null;
	}


	/**
	 * Validation de la session user côté serveur
	 */
	private async validateAndReturn(user: User): Promise<User | null> {
		
		try {
			// Verifier que cette session est encore valide via requete serveur
			const isValid = await this.validateUserSession(user.id);
			
			if (isValid) {
				console.log('[UserManager] Session validée côté serveur');
				return user;
			} else {
				// Si la validation échoue, c'est que l'utilisateur
				// n'est plus authentifié côté serveur.
				console.log('[UserManager] Session expirée côté serveur → nettoyage');
				userStore.clearCurrentUser();
				return null;
			}
		} catch (err) {
			console.warn('[UserManager] Erreur validation serveur:', err);
			return user;
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
	 * Getter current user in store
	 */	
	public getCurrentUser(): User | null {
		return userStore.getCurrentUser();
	}
}  

export const userManager = new UserManager();
