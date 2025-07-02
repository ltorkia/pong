import { User } from '../../models/user.model';
import { userCrudApi } from './user.api';

// ===========================================
// USER QUERY API
// ===========================================
/**
 * Classe représentant l'API de requêtes utilisateur.
 * 
 * Fournit des méthodes pour interagir avec l'API utilisateur,
 * y compris la récupération des utilisateurs actifs, en ligne,
 * la recherche par nom d'utilisateur, et le classement des utilisateurs.
 */
export class UserQueryApi {

	// ===========================================
	// GET REQUESTS - QUERIES
	// ===========================================

	/**
	 * Récupère la liste des utilisateurs actifs.
	 *
	 * Envoie une requête pour obtenir tous les utilisateurs,
	 * puis filtre ceux qui sont actifs (non supprimés).
	 * 
	 * @returns {Promise<User[]>} - Promesse qui se résout avec un tableau d'instances `User` actifs.
	 */
	public async getActiveUsers(): Promise<User[]> {
		const users: User[] = await userCrudApi.getUsers();
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
		const users: User[] = await userCrudApi.getUsers();
		return User.getOnlineUsers(users) as User[];
	}

}
