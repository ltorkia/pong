import { User } from '../models/user.model';
import { SafeUserModel, UserModel, PublicUser } from '../shared/types/user.types';	// en rouge car dossier local 'shared' != dossier conteneur
import { userStore } from '../stores/user.store';
import { BasicResponse, AuthResponse } from '../types/api.types';
import { secureFetch } from '../utils/app.utils';

// ===========================================
// USER API
// ===========================================
/**
 * Classe représentant l'API de l'utilisateur.
 * 
 * Permet d'interagir avec l'API de l'utilisateur,
 * en envoyant des requêtes HTTP pour valider les sessions,
 * s'authentifier, s'inscrire, etc.
 */
export class UserApi {

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

	// ===========================================
	// GETTERS DATABASE
	// ===========================================

	/**
	 * Récupère les informations d'un utilisateur par son identifiant.
	 *
	 * Envoie une requête GET à la route API `/users/:id` pour récupérer
	 * les informations de l'utilisateur d'identifiant `id`.
	 *
	 * Si la requête réussit, renvoie l'utilisateur stocké en base de données
	 * sous forme d'instance de la classe `User`, sans email (type SafeUserModel).
	 * Sinon, lève une erreur.
	 *
	 * @param {number} id Identifiant de l'utilisateur à récupérer.
	 * @returns {Promise<User>} Promesse qui se résout avec l'utilisateur stocké en base de données.
	 */
	public async getUserById(id: number): Promise<User> {
		const res: Response = await secureFetch(`/api/users/${id}`, { method: 'GET' });
		if (!res.ok) {
			throw new Error('Erreur de l’API');
		}
		const data: SafeUserModel = await res.json();
		return User.fromSafeJSON(data) as User;
	}

	/**
	 * Récupère tous les utilisateurs enregistrés en base de données.
	 *
	 * Envoie une requête GET à la route API `/users` pour récupérer
	 * les informations de tous les utilisateurs stockés en base de données.
	 *
	 * Si la requête réussit, renvoie un tableau d'instances `User` contenant
	 * les informations de tous les utilisateurs stockés en base de données,
	 * sans email (type `PublicUser`).
	 * Sinon, lève une erreur.
	 *
	 * @returns {Promise<User[]>} Promesse qui se résout avec un tableau d'instances `User`.
	 */
	public async getUsers(): Promise<User[]> {
		const res: Response = await secureFetch('/api/users', { method: 'GET' });
		if (!res.ok) {
			throw new Error('Erreur de l’API');
		}
		const data: PublicUser[] = await res.json();
		return User.fromPublicJSONArray(data) as User[];
	}

	/**
	 * Récupère la liste des amis d'un utilisateur.
	 *
	 * Envoie une requête GET à la route API `/users/:id/friends` pour récupérer
	 * les informations des amis de l'utilisateur d'identifiant `id`.
	 *
	 * Si la requête réussit, renvoie un tableau d'instances `User` contenant
	 * les informations des amis de l'utilisateur stockés en base de données,
	 * sans email (type `PublicUser`).
	 * Sinon, lève une erreur.
	 *
	 * @param {number} id Identifiant de l'utilisateur pour lequel récupérer la liste des amis.
	 * @returns {Promise<User[]>} Promesse qui se résout avec un tableau d'instances `User`.
	 */
	public async getUserFriends(id: number): Promise<User[]> {
		const res: Response = await secureFetch(`/api/users/${id}/friends`, { method: 'GET' });
		if (!res.ok) {
			throw new Error('Erreur de l’API');
		}
		const data: PublicUser[] = await res.json();
		return User.fromPublicJSONArray(data) as User[];
	}

	/**
	 * Récupère la liste des utilisateurs actifs.
	 *
	 * Envoie une requête pour obtenir tous les utilisateurs,
	 * puis filtre ceux qui sont actifs (non supprimés).
	 * 
	 * @returns {Promise<User[]>} - Promesse qui se résout avec un tableau d'instances `User` actifs.
	 */
	public async getActiveUsers(): Promise<User[]> {
		const users: User[] = await this.getUsers();
		return User.getActiveUsers(users) as User[];
	}

	/**
	 * Récupère la liste des utilisateurs en ligne.
	 *
	 * Envoie une requête pour obtenir tous les utilisateurs,
	 * puis filtre ceux qui sont actuellement en ligne.
	 * 
	 * @returns {Promise<User[]>} - Promesse qui se résout avec un tableau d'instances `User` en ligne.
	 */
	public async getOnlineUsers(): Promise<User[]> {
		const users: User[] = await this.getUsers();
		return User.getOnlineUsers(users) as User[];
	}

	/**
	 * Rechercher des utilisateurs par nom d'utilisateur partiel.
	 * 
	 * Envoie une requête pour récupérer tous les utilisateurs,
	 * puis filtre ceux dont le nom d'utilisateur contient le terme
	 * de recherche spécifié.
	 * 
	 * @param {string} searchTerm - Le terme de recherche partiel à utiliser pour filtrer les utilisateurs.
	 * @returns {Promise<User[]>} - Promesse qui se résout avec un tableau d'instances `User` correspondant.
	 */
	public async searchUsersByUsername(searchTerm: string): Promise<User[]> {
		const users: User[] = await this.getUsers();
		return User.searchByUsername(users, searchTerm) as User[];
	}

	/**
	 * Obtient le classement des utilisateurs actifs selon le critère de tri spécifié.
	 *
	 * Récupère les utilisateurs actifs et les trie par taux de victoire, nombre de parties jouées,
	 * ou temps de jeu selon le paramètre `sortBy`.
	 *
	 * @param {string} sortBy - Critère de tri ('winRate', 'gamesPlayed', 'timePlayed').
	 * @returns {Promise<User[]>} - Promesse qui se résout avec un tableau d'instances `User` triées.
	 */
	public async getUserRanking(sortBy: 'winRate' | 'gamesPlayed' | 'timePlayed' = 'winRate'): Promise<User[]> {
		const users: User[] = await this.getActiveUsers();
		switch (sortBy) {
			case 'winRate':
				return User.sortByWinRate(users);
			case 'gamesPlayed':
				return User.sortByGamesPlayed(users);
			case 'timePlayed':
				return User.sortByTimePlayed(users);
			default:
				return users as User[];
		}
	}

	// ===========================================
	// UPDATE DATABASE
	// ===========================================

	/**
	 * Met à jour un utilisateur.
	 *
	 * Envoie une requête PUT à la route API `/users/:id` pour mettre à jour
	 * l'utilisateur d'identifiant `id` avec les données fournies dans l'objet `data`.
	 *
	 * Si la mise à jour réussit, renvoie un objet avec la clé `message` contenant
	 * un message de confirmation.
	 * Sinon, renvoie un objet avec la clé `errorMessage` contenant le message
	 * d'erreur.
	 *
	 * @param {number} id Identifiant de l'utilisateur à mettre à jour.
	 * @param {Partial<User>} data Données à mettre à jour.
	 * @returns {Promise<BasicResponse>} Promesse qui se résout avec l'objet de mise à jour.
	 */
	public async updateUser(id: number, data: Partial<User>): Promise<BasicResponse> {
		const res: Response = await secureFetch(`/api/users/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});
		const result: BasicResponse = await res.json();
		if (!res.ok || result.errorMessage) {
			return { errorMessage: result.errorMessage || result.message || 'Erreur lors de la mise à jour' };
		}
		return result as BasicResponse;
	}

}

/**
 * Instance unique de la classe UserApi, qui fournit des méthodes pour
 * interagir avec l'API utilisateur.
 */
export const userApi = new UserApi();
