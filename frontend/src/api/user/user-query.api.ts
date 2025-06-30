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
		const users: User[] = await userCrudApi.getUsers();
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

}
