import { User } from '../../models/user.model';
import { UserModel } from '../../shared/types/user.types';	// en rouge car dossier local 'shared' != dossier conteneur
import { userStore } from '../../stores/user.store';
import { BasicResponse, AuthResponse } from '../../types/api.types';
import { secureFetch } from '../../utils/app.utils';

// ===========================================
// USER AUTH API
// ===========================================
/**
 * Classe d'authentication de l'API de l'utilisateur.
 * 
 * Permet d'interagir avec l'API de l'utilisateur,
 * en envoyant des requêtes HTTP pour récupérer l'utilisateur
 * en ligne avec le token JWT, valider les sessions, 
 * s'authentifier, s'inscrire, se déconnecter.
 */
export class UserAuthApi {

	// ===========================================
	// GET REQUESTS - ROUTES PROTEGEES PAR JWT
	// ===========================================

	/**
	 * Getter de l'utilisateur en ligne.
	 * 
	 * Charge l'utilisateur courant enregistré sur le serveur via la route
	 * API `/me` protégée par un token JWT.
	 * Stocke l'utilisateur en mémoire vive avec email, et localStorage sans email.
	 * Si la session a expiré, renvoie null.
	 *
	 * @returns {Promise<User | null>} L'utilisateur courant, ou null si pas d'utilisateur connecté.
	 */
	public async getMe(): Promise<User | null> {
		const res: Response = await secureFetch('/api/me', { method: 'GET' });
		if (!res.ok) {
			return null;
		}

		// Données complètes avec email
		const data: UserModel = await res.json();
		
		// Stockage sécurisé via le store
		userStore.setCurrentUserFromServer(data);

		// Instance avec email en mémoire
		return userStore.getCurrentUser() as User;
	}

	/**
	 * Valide la session d'un utilisateur en fonction de son ID.
	 * 
	 * Envoie une requête GET à la route API `/validate-session/:id` pour valider
	 * la session de l'utilisateur d'ID `:id`. Si la session est valide, renvoie
	 * un objet avec la clé `valid` à `true`. Sinon, la clé est à `false`.
	 * 
	 * @param {number} id L'ID de l'utilisateur à valider.
	 * @returns {Promise<{ valid: boolean }>} La réponse de validation.
	 */
	public async validateSession(id: number): Promise<{ valid: boolean }> {
		const res: Response = await secureFetch(`/api/validate-session/${id}`, { method: 'GET' });
		if (!res.ok) {
			return { valid: false };
		}
		return res.json() as Promise<{ valid: boolean }>;
	}

	// ===========================================
	// POST REQUESTS - AUTHENTIFICATION
	// ===========================================

	/**
	 * Inscrit un nouvel utilisateur.
	 * 
	 * Envoie une requête POST à la route API `/auth/register` pour inscrire
	 * un nouvel utilisateur avec les informations données dans l'objet `data`.
	 * 
	 * Si l'inscription réussit, stocke l'utilisateur en mémoire vive avec email, 
	 * en localStorage sans email, et renvoie un objet avec la clé `user` contenant l'utilisateur
	 * créé. Sinon, renvoie un objet avec la clé `errorMessage` contenant le message
	 * d'erreur.
	 * 
	 * @param {Record<string, string>} data Informations de l'utilisateur à inscrire.
	 * @returns {Promise<AuthResponse>} Promesse qui se résout avec l'utilisateur créé
	 *  ou un objet d'erreur.
	 */
	public async registerUser(data: Record<string, string>): Promise<AuthResponse> {
		const res: Response = await fetch('/api/auth/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
			credentials: 'include',
		});
		const result: AuthResponse = await res.json();
		if (!res.ok || result.errorMessage || !result.user) {
			return { errorMessage: result.errorMessage || result.message || 'Erreur avec la récupération de l\'utilisateur' } as AuthResponse;
		}
		userStore.setCurrentUserFromServer(result.user);
		return result as AuthResponse;
	}

	/**
	 * Connecte un utilisateur.
	 * 
	 * Envoie une requête POST à la route API `/auth/login` pour connecter
	 * un utilisateur avec les informations fournies dans l'objet `data`.
	 * 
	 * Si la connexion réussit, stocke l'utilisateur en mémoire vive avec email,
	 * et localStorage sans email. Renvoie un objet avec la clé `user` contenant
	 * l'utilisateur connecté. Sinon, renvoie un objet avec la clé `errorMessage`
	 * contenant le message d'erreur.
	 * 
	 * @param {Record<string, string>} data Informations de l'utilisateur à connecter.
	 * @returns {Promise<AuthResponse>} Promesse qui se résout avec l'utilisateur connecté
	 *  ou un objet d'erreur.
	 */
	public async loginUser(data: Record<string, string>): Promise<AuthResponse> {
		const res: Response = await fetch('/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
			credentials: 'include',
		});
		const result: AuthResponse = await res.json();
		if (!res.ok || result.errorMessage || !result.user) {
			return { errorMessage: result.errorMessage || result.message || 'Erreur avec la récupération de l\'utilisateur' } as AuthResponse;
		}
		userStore.setCurrentUserFromServer(result.user);
		return result as AuthResponse;
	}

	/**
	 * Vérifie l'authentification à deux facteurs (2FA) pour un utilisateur.
	 * 
	 * Envoie une requête POST à la route API `/auth/2FAreceive` avec les
	 * données fournies dans l'objet `data`. Si la vérification réussit, 
	 * renvoie un objet contenant les informations de l'utilisateur authentifié.
	 * Sinon, renvoie un objet contenant un message d'erreur.
	 * 
	 * @param {Record<string, string>} data Informations nécessaires pour la vérification 2FA.
	 * @returns {Promise<AuthResponse>} Promesse résolue avec les informations de l'utilisateur
	 * authentifié ou un message d'erreur.
	 */
	public async twofaConnectUser(data: Record<string, string>): Promise<AuthResponse> {
		const res = await fetch('/api/auth/2FAreceive', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
			credentials: 'include',
		});
		const result: AuthResponse = await res.json();
		if (!res.ok || result.errorMessage) {
			return { errorMessage: result.errorMessage || result.message || 'Erreur inconnue' };
		}
		return result as AuthResponse;
	}

	/**
	 * Déconnecte l'utilisateur.
	 * 
	 * Envoie une requête POST à l'API `/auth/logout` pour déconnecter
	 * l'utilisateur. Si la déconnexion réussit, l'utilisateur est supprimé
	 * du store et du localStorage. Les cookies de session 'auth_token' et 'auth-status' sont effacés.
	 * 
	 * @returns {Promise<BasicResponse>} Promesse qui se résout avec un objet
	 * de réponse basique, ou un objet d'erreur si la déconnexion échoue.
	 */
	public async logoutUser(): Promise<BasicResponse> {
		const res: Response = await fetch('/api/auth/logout', {
			method: 'POST',
			credentials: 'include'
		});
		const result: BasicResponse = await res.json();
		if (!res.ok || result.errorMessage) {
			return { errorMessage: result.errorMessage || result.message || 'Erreur inconnue' } as BasicResponse;
		}
		userStore.clearCurrentUser();
		return result as BasicResponse;
	}

}
