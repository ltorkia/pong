import { User } from '../../models/user.model';
import { SafeUserModel, PublicUser } from '../../shared/types/user.types';	// en rouge car dossier local 'shared' != dossier conteneur
import { secureFetch } from '../../utils/app.utils';
import { dataService } from '../../services/services';
import { AuthResponse } from 'src/types/api.types';

// ===========================================
// USER CRUD API
// ===========================================
/**
 * Ce fichier contient la classe UserCrudApi, qui fournit des méthodes pour
 * interagir avec l'API de gestion des utilisateurs en utilisant la fonction
 * utilitaire secureFetch pour des requêtes HTTP sécurisées.
 * 
 * Les méthodes de cette classe permettent de créer, de modifier et de supprimer
 * des utilisateurs enregistrés en base de données. Elles utilisent secureFetch
 * pour envoyer des requêtes HTTP sécurisées au serveur afin de réaliser ces opérations.
 */
export class UserCrudApi {

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
	public async getUserFriends(id: number): Promise<User[]> {
		const res: Response = await secureFetch(`/api/users/${id}/friends`, { method: 'GET' });
		if (!res.ok) {
			throw new Error('Erreur de l\'API');
		}
		const data: PublicUser[] = await res.json();
		return User.fromPublicJSONArray(data) as User[];
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
		await dataService.updateCurrentUser(data.user);
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
		await dataService.updateCurrentUser(data.user);
		return data as AuthResponse;
	}
}
