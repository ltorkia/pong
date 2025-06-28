import { userApi } from '../api/user.api';
import { userStore } from '../stores/UserStore';
import { User } from '../models/user.model';
import { cookiesConst } from '../shared/config/constants'; // en rouge car dossier local != dossier du conteneur

// import path from 'path';
// const dbPath = path.resolve('../shared/config/constants');
/**
 * Utilisée en singleton, class qui gère la
 * récupération / chargement du user via userStore,
 * localStorage, requêtes API.
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
			console.log('[${this.constructor.name}] Cookie auth_status présent, chargement utilisateur...');
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
	 * sans faire d'appel API ni accéder au store
	 */
	public hasAuthCookie(): boolean {
		return document.cookie.includes(`${cookiesConst.authStatusKey}=${cookiesConst.authStatusValue}`);
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
	 * Restauration depuis localStorage puis fallback API
	 */
	private async restoreUser(): Promise<User | null> {

		// Essayer localStorage d'abord
		const user = userStore.restoreFromStorage();
		if (user) {
			console.log(`[${this.constructor.name}] Utilisateur localStorage trouvé, validation serveur en cours...`);
			return await this.validateAndReturn(user);
		}

		// Fallback API
		try {
			const apiUser = await userApi.getMe();
			if (apiUser) {
				console.log(`[${this.constructor.name}] Utilisateur chargé via API`);
				const user = User.fromJSON(apiUser);
				userStore.setCurrentUser(user);
				return user;
			}
		} catch (err) {
			console.warn(`[${this.constructor.name}] Impossible de charger depuis API:`, err);
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
