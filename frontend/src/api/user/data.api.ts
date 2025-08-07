import { User } from '../../shared/models/user.model';
import { Game } from '../../shared/models/game.model';
import { Friend } from '../../shared/models/friend.model';
import { SafeUserModel, PublicUser, PaginatedUsers } from '../../shared/types/user.types';	// en rouge car dossier local 'shared' != dossier conteneur
import { FriendModel } from '../../shared/types/friend.types';	// en rouge car dossier local 'shared' != dossier conteneur
import { dataService, currentService } from '../../services/index.service';
import { secureFetch } from '../../utils/app.utils';
import { BasicResponse, AuthResponse } from '../../types/api.types';

// ===========================================
// DATA API
// ===========================================
/**
 * Ce fichier contient la classe DataApi, qui fournit des méthodes pour
 * interagir avec l'API de gestion des utilisateurs en utilisant la fonction
 * utilitaire secureFetch pour des requêtes HTTP sécurisées.
 * 
 * Les méthodes de cette classe permettent de créer, de modifier et de supprimer
 * des utilisateurs enregistrés en base de données. Elles utilisent secureFetch
 * pour envoyer des requêtes HTTP sécurisées au serveur afin de réaliser ces opérations.
 */
export class DataApi {

	// ===========================================
	// GET REQUESTS - DATABASE SELECT
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
			throw new Error('Erreur de l\'API');
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
	 * sans email (type `SafeUserModel`).
	 * Sinon, lève une erreur.
	 *
	 * @returns {Promise<User[]>} Promesse qui se résout avec un tableau d'instances `User`.
	 */
	public async getUsers(): Promise<User[]> {
		const res: Response = await secureFetch('/api/users', { method: 'GET' });
		if (!res.ok) {
			throw new Error('Erreur de l\'API');
			
		}
		const data: SafeUserModel[] = await res.json();
		return User.fromSafeJSONArray(data) as User[];
	}

	/**
	 * Récupère une page de la liste des utilisateurs enregistrés en base de données.
	 *
	 * Envoie une requête GET à la route API `/users/page/:page/:limit` pour récupérer
	 * les informations de `limit` utilisateurs stockés en base de données, en commençant
	 * par le `page`-ième élément.
	 *
	 * Si la requête réussit, renvoie un objet contenant un tableau d'instances `User`
	 * contenant les informations de `limit` utilisateurs stockés en base de données,
	 * ainsi que des informations de pagination.
	 * Sinon, lève une erreur.
	 *
	 * @param {number} page Numéro de la page à récupérer.
	 * @param {number} limit Nombre d'utilisateurs à récupérer.
	 * @returns {Promise<PaginatedUsers>} Promesse qui se résout avec un objet contenant
	 *  un tableau d'instances `User` et des informations de pagination.
	 */
	public async getUsersByPage(page: number = 1, limit: number = 10): Promise<PaginatedUsers> {
		const res: Response = await secureFetch(`/api/users/page/${page}/${limit}`, { method: 'GET' });
		if (!res.ok) {
			throw new Error('Erreur de l\'API');
		}
		const data: PaginatedUsers = await res.json();
		data.users = User.fromSafeJSONArray(data.users) as User[];
		return data as PaginatedUsers;
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
		return dataService.getActiveUsers(users) as User[];
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
		return dataService.getOnlineUsers(users) as User[];
	}

	/**
	 * Récupère la liste des amis d'un utilisateur.
	 *
	 * Envoie une requête GET à la route API `/users/:id/friends` pour récupérer
	 * les informations des amis de l'utilisateur d'identifiant `id`.
	 *
	 * Si la requête réussit, renvoie un tableau d'instances `User` contenant
	 * les informations des amis de l'utilisateur stockés en base de données,
	 * sans email (type `Friends`).
	 * Sinon, lève une erreur.
	 *
	 * @param {number} id Identifiant de l'utilisateur pour lequel récupérer la liste des amis.
	 * @returns {Promise<User[]>} Promesse qui se résout avec un tableau d'instances `User`.
	 */
	public async getUserFriends(id: number): Promise<Friend[]> {
		const res: Response = await secureFetch(`/api/users/${id}/friends`, { method: 'GET' });
		if (!res.ok) {
			throw new Error('Erreur de l\'API');
		}
		const data: FriendModel[] = await res.json();
		return Friend.fromJSONArray(data) as Friend[];
	}

	/**
	 * Récupère la liste des jeux d'un utilisateur.
	 *
	 * Envoie une requête pour obtenir tous les jeux liés à un utilisateur.
	 * 
	 * @param {number} id - L'identifiant de l'utilisateur.
	 * @returns {Promise<Game[]>} - Promesse qui se résout avec un tableau d'instances `Game` jouables par l'utilisateur.
	 */
	public async getUserGames(id: number): Promise<Game[]> {
		const res: Response = await secureFetch(`/api/users/${id}/games`, { method: 'GET' });
		if (!res.ok) {
			throw new Error('Erreur de l\'API');
		}
		const data: Game[] = await res.json();
		return Game.fromJSONArray(data) as Game[];
	}

	// ===========================================
	// PUT REQUESTS - DATABASE UPDATE
	// ===========================================

	/**
	 * Met à jour un utilisateur.
	 *
	 * Envoie une requête PUT à la route API `/users/:id` pour mettre à jour
	 * l'utilisateur d'identifiant `id` avec les données fournies.
	 *
	 * Si la requête réussit, renvoie un objet contenant l'objet `User` mis à jour.
	 * Sinon, renvoie une erreur.
	 *
	 * @param {number} id Identifiant de l'utilisateur à mettre à jour.
	 * @param {Record<string, string>} userData Données à mettre à jour.
	 * @returns {Promise<AuthResponse>} Promesse qui se résout avec un objet User ou un message d'erreur.
	 */
	public async updateUser(id: number, userData: Record<string, string>): Promise<AuthResponse> {
		const res: Response = await secureFetch(`/api/users/${id}/moduser`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(userData)
		});
		const data: AuthResponse = await res.json();
		if (!res.ok || data.errorMessage || !data.user) {
			return { errorMessage: data.errorMessage || data.message || 'Erreur lors de la mise à jour' };
		}
		await currentService.updateCurrentUser(data.user);
		return data as AuthResponse;
	}

/**
 * Met à jour l'avatar d'un utilisateur.
 * 
 * Envoie une requête PUT à la route API `/users/:id/modavatar` pour mettre à jour
 * l'avatar de l'utilisateur d'identifiant `id` avec l'avatar fourni.
 * 
 * Si la requête réussit, met à jour les informations de l'utilisateur en mémoire
 * et renvoie un objet contenant les informations mises à jour de l'utilisateur.
 * Sinon, renvoie un objet contenant un message d'erreur.
 * 
 * @param {number} userId - Identifiant de l'utilisateur à mettre à jour.
 * @param {FormData} formData - Données de l'avatar à mettre à jour.
 * @returns {Promise<AuthResponse>} Promesse qui se résout avec les informations mises à jour de l'utilisateur ou un message d'erreur.
 */

	public async updateAvatar(userId: number, formData: FormData): Promise<AuthResponse> {
		const res: Response = await secureFetch(`/api/users/${userId}/moduser/avatar`, {
			method: 'PUT',
			body: formData,
		});
		const data = await res.json();
		if (!res.ok || data.errorMessage || !data.user) {
			return { errorMessage: data.errorMessage || 'Erreur lors de la mise à jour' };
		}			
		await currentService.updateCurrentUser(data.user);
		return data as AuthResponse;
	}

	/**
	 * Ajoute un ami à l'utilisateur spécifié.
	 * 
	 * Envoie une requête POST à la route API `/users/:userId/friends/add` pour ajouter
	 * un utilisateur ami d'identifiant `friendId` à l'utilisateur d'identifiant `userId`.
	 * 
	 * Si l'ajout réussit, renvoie un objet contenant les informations de l'opération.
	 * Sinon, renvoie un objet contenant un message d'erreur.
	 * 
	 * @param {number} userId - Identifiant de l'utilisateur ajoutant un ami.
	 * @param {number} friendId - Identifiant de l'ami à ajouter.
	 * @returns {Promise<BasicResponse>} Promesse qui se résout avec les informations
	 * de l'opération ou un message d'erreur.
	 */
	public async addFriend(userId: number, friendId: number): Promise<BasicResponse> {
		const res: Response = await secureFetch(`/api/users/${userId}/friends/add`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ friendId })
		});
		const data: BasicResponse = await res.json();
		if (!res.ok || data.errorMessage) {
			return { errorMessage: data.errorMessage || 'Erreur lors de l\'ajout d\'ami' };
		}
		return data as BasicResponse;
	}

	/**
	 * Accepte une demande d'amitié envoyée par un utilisateur.
	 * 
	 * Envoie une requête POST à la route API `/users/:userId/friends/accept` pour accepter
	 * une demande d'amitié envoyée par l'utilisateur d'identifiant `friendId` à l'utilisateur
	 * d'identifiant `userId`.
	 * 
	 * Si l'acceptation réussit, renvoie un objet contenant les informations de l'opération.
	 * Sinon, renvoie un objet contenant un message d'erreur.
	 * 
	 * @param {number} userId - Identifiant de l'utilisateur acceptant la demande d'amitié.
	 * @param {number} friendId - Identifiant de l'utilisateur qui a envoyé la demande d'amitié.
	 * @returns {Promise<BasicResponse>} Promesse qui se résout avec les informations
	 * de l'opération ou un message d'erreur.
	 */
	public async acceptFriend(userId: number, friendId: number): Promise<BasicResponse> {
		const res: Response = await secureFetch(`/api/users/${userId}/friends/accept`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ friendId })
		});
		const data: BasicResponse = await res.json();
		if (!res.ok || data.errorMessage) {
			return { errorMessage: data.errorMessage || 'Erreur lors de l\'acceptation d\'ami' };
		}
		return data as BasicResponse;
	}

	/**
	 * Bloque un utilisateur en tant qu'ami.
	 * 
	 * Envoie une requête PUT à la route API `/users/:userId/friends/block` pour
	 * bloquer l'utilisateur d'identifiant `friendId` par l'utilisateur d'identifiant `userId`.
	 * 
	 * Si le blocage réussit, renvoie un objet contenant les informations de l'opération.
	 * Sinon, renvoie un objet contenant un message d'erreur.
	 * 
	 * @param {number} userId - Identifiant de l'utilisateur bloquant l'ami.
	 * @param {number} friendId - Identifiant de l'ami à bloquer.
	 * @returns {Promise<BasicResponse>} Promesse qui se résout avec les informations
	 * de l'opération ou un message d'erreur.
	 */
	public async blockFriend(userId: number, friendId: number): Promise<BasicResponse> {
		const res: Response = await secureFetch(`/api/users/${userId}/friends/block`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ friendId })
		});
		const data: BasicResponse = await res.json();
		if (!res.ok || data.errorMessage) {
			return { errorMessage: data.errorMessage || 'Erreur lors de la suppression d\'ami' };
		}
		return data as BasicResponse;
	}

	/**
	 * Supprime un ami de l'utilisateur.
	 * 
	 * Envoie une requête DELETE à la route API `/users/:userId/friends/delete` pour supprimer
	 * l'ami d'identifiant `friendId` de l'utilisateur d'identifiant `userId`.
	 * 
	 * Si la suppression réussit, renvoie un objet contenant les informations de l'opération.
	 * Sinon, renvoie un objet contenant un message d'erreur.
	 * 
	 * @param {number} userId - Identifiant de l'utilisateur qui supprime l'ami.
	 * @param {number} friendId - Identifiant de l'ami à supprimer.
	 * @returns {Promise<BasicResponse>} Promesse qui se résout avec les informations
	 * de l'opération ou un message d'erreur.
	 */
	public async removeFriend(userId: number, friendId: number): Promise<BasicResponse> {
		const res: Response = await secureFetch(`/api/users/${userId}/friends/delete`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ friendId })
		});
		const data: BasicResponse = await res.json();
		if (!res.ok || data.errorMessage) {
			return { errorMessage: data.errorMessage || 'Erreur lors de la suppression d\'ami' };
		}
		return data as BasicResponse;
	}
}
