import { User } from '../../shared/models/user.model';
import { UserModel, TwoFaMethod } from '../../shared/types/user.types';	// en rouge car dossier local 'shared' != dossier conteneur
import { DB_CONST } from '../../shared/config/constants.config';
import { currentService, webSocketService } from '../../services/index.service';
import { BasicResponse, AuthResponse } from '../../shared/types/response.types';
import { secureFetch } from '../../utils/app.utils';

// ===========================================
// AUTH API
// ===========================================
/**
 * Classe d'authentication de l'API de l'utilisateur.
 * 
 * Permet d'interagir avec l'API de l'utilisateur,
 * en envoyant des requêtes HTTP pour récupérer l'utilisateur
 * en ligne avec le token JWT, valider les sessions, 
 * s'authentifier, s'inscrire, se déconnecter.
 */
export class AuthApi {

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
		await currentService.setCurrentUserFromServer(data);

		// Instance avec email en mémoire
		return currentService.getCurrentUser() as User;
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
	 * un nouvel utilisateur avec les informations données dans l'objet `formData`.
	 * 
	 * En cas d'erreur, renvoie un objet avec la clé `errorMessage` contenant le message
	 * d'erreur.
	 * 
	 * @param {FormData} formData Les données utilisateur extraites du formulaire.
	 * @returns {Promise<AuthResponse>} Promesse qui se résout avec l'utilisateur créé
	 *  ou un objet d'erreur.
	 */
	public async registerUser(formData: FormData): Promise<AuthResponse> {
		const tabID = webSocketService.getTabID();
		const res: Response = await fetch('/api/auth/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json',
				'x-tab-id': tabID },
			body: formData,
			credentials: 'include',
		});
		const data: AuthResponse = await res.json();
		if (!res.ok || data.errorMessage || !data.user) {
			return { errorMessage: data.errorMessage || data.message || 'Erreur avec la récupération de l\'utilisateur' } as AuthResponse;
		}
		await currentService.setCurrentUserFromServer(data.user);
		return data as AuthResponse;
	}

	/**
	 * Procède à la première étape de l'authentification.
	 * 
	 * Envoie une requête POST à la route API `/auth/login` pour connecter
	 * un utilisateur avec les informations fournies dans l'objet `userData`.
	 * Si la première "tape de l'authentification réussit, renvoie un objet contenant les informations
	 * de l'utilisateur qui tente de se connecter. Si l'utilisateur a activé le 2FA, le champ
	 * `user.active2Fa` est mis à `true` et on ne stocke pas l'utilisateur tout de suite.
	 * 
	 * @param {Record<string, string>} userData Informations de l'utilisateur à connecter.
	 * @returns {Promise<AuthResponse>} Promesse qui se résout avec les informations de
	 * l'utilisateur authentifié ou un message d'erreur.
	 */
	public async loginUser(userData: Record<string, string>): Promise<AuthResponse> {
		const tabID = webSocketService.getTabID();
		const res: Response = await fetch('/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json',
				'x-tab-id': tabID },
			body: JSON.stringify(userData),
			credentials: 'include',
		});
		const data: AuthResponse = await res.json();
		if (!res.ok || data.errorMessage || !data.user) {
			return { errorMessage: data.errorMessage || data.message || 'Erreur inconnue' } as AuthResponse;
		}
		if (data.user.active2Fa === DB_CONST.USER.ACTIVE_2FA.DISABLED) {
			await currentService.setCurrentUserFromServer(data.user);
		}
		return data as AuthResponse;
	}

	/**
	 * Envoie un code de vérification pour l'authentification à deux facteurs (2FA).
	 * 
	 * Si la vérification 2FA échoue, renvoie un objet contenant un message d'erreur.
	 * Si la vérification réussit, renvoie un objet avec un message de confirmation,
	 * et l'url du QrCode a générer si c'est l'option choisie par l'utilisateur.
	 * 
	 * @param {Record<string, string>} userData Informations de l'utilisateur à connecter.
	 * @param {TwoFaMethod} method Méthode de 2FA choisie.
	 * @returns {Promise<AuthResponse>} Promesse résolue avec une fois que le code est envoyé.
	 */
	public async send2FA(userData: Record<string, string>, method: TwoFaMethod): Promise<AuthResponse> {
		const tabID = webSocketService.getTabID();
		const res: Response = await fetch(`/api/auth/2FAsend/${method}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json',
				'x-tab-id': tabID },
			body: JSON.stringify(userData),
			credentials: 'include',
		});
		const data = await res.json();
		if (!res.ok || data.errorMessage) {
			return { errorMessage: data.errorMessage || data.message || 'Erreur inconnue' };
		}
		return data;
	}

	/**
	 * Vérifie l'authentification à deux facteurs (2FA) pour un utilisateur.
	 * 
	 * Envoie une requête POST à la route API `/auth/2FAreceive` avec le code
	 * de vérification fournit dans l'objet `data`. Si la vérification réussit, 
	 * renvoie un objet contenant les informations de l'utilisateur authentifié.
	 * Sinon, renvoie un objet contenant un message d'erreur.
	 * 
	 * Si la vérification réussit, stocke l'utilisateur en mémoire vive avec email,
	 * et localStorage sans email. Renvoie un objet avec la clé `user` contenant
	 * l'utilisateur connecté. Sinon, renvoie un objet avec la clé `errorMessage`
	 * contenant le message d'erreur.
	 * 
	 * @param {Record<string, string>} userData Informations de l'utilisateur à connecter.
	 * @param {TwoFaMethod} method Méthode de 2FA choisie.
	 * @returns {Promise<AuthResponse>} Promesse résolue avec les informations de l'utilisateur
	 * authentifié ou un message d'erreur.
	 */
	public async twofaConnectUser(userData: Record<string, string>, method: TwoFaMethod): Promise<AuthResponse> {
		const tabID = webSocketService.getTabID();
		const res: Response = await fetch(`/api/auth/2FAreceive/${method}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json',
				'x-tab-id': tabID },
			body: JSON.stringify(userData),
			credentials: 'include',
		});
		const data: AuthResponse = await res.json();
		if (!res.ok || data.errorMessage || !data.user) {
			return { errorMessage: data.errorMessage || data.message || 'Erreur avec la récupération de l\'utilisateur' };
		}
		await currentService.setCurrentUserFromServer(data.user);
		return data as AuthResponse;
	}

	/**
	 * Connecte un utilisateur via Google.
	 * 
	 * Envoie une requête POST à la route API `/auth/google` pour connecter
	 * un utilisateur via Google avec le token d'accès `id_token`.
	 * Si la connexion réussit, stocke l'utilisateur en mémoire vive avec email,
	 * et localStorage sans email. Renvoie un objet avec la clé `user` contenant
	 * l'utilisateur connecté. Sinon, renvoie un objet avec la clé `errorMessage`
	 * contenant le message d'erreur.
	 * 
	 * @param {string} id_token Le token d'accès Google.
	 * @returns {Promise<AuthResponse>} Promesse qui se résout lorsque l'opération est terminée.
	 */
	public async googleConnectUser(id_token: string): Promise<AuthResponse> {
		const tabID = webSocketService.getTabID();
		const res = await fetch('/api/auth/google', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json',
				'x-tab-id': tabID },
			body: JSON.stringify({ id_token }),
			credentials: 'include',
		});
		const data: AuthResponse = await res.json();
		if (!res.ok || data.errorMessage || !data.user) {
			return { errorMessage: data.errorMessage || data.message || 'Erreur lors de la connexion Google' };
		}
		await currentService.setCurrentUserFromServer(data.user);
		return data as AuthResponse;
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
		const tabID = webSocketService.getTabID();
		const res: Response = await fetch('/api/auth/logout', {
			method: 'POST',
			credentials: 'include',
			headers: {'x-tab-id': tabID},
		});
		const data: BasicResponse = await res.json();
		if (!res.ok || data.errorMessage) {
			return { errorMessage: data.errorMessage || data.message || 'Erreur inconnue' } as BasicResponse;
		}
		currentService.clearCurrentUser();
		return data as BasicResponse;
	}

}
