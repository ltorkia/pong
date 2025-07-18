import { User } from '../../models/user.model';
import { userStore } from '../../stores/user.store';
import { UserModel, SafeUserModel, UserStatus } from '../shared/types/user.types';

/**
 * Service de gestion des utilisateurs et de la logique métier.
 * 
 * Centralise toutes les opérations sur les utilisateurs :
 * - Gestion de l'utilisateur courant
 * - Opérations métier sur les utilisateurs
 * - Orchestration entre le store et l'API
 */
export class DataService {
	private currentUser: User | null = null;

	// ============================================================================
	// GESTION DE L'UTILISATEUR COURANT
	// ============================================================================
	/**
	 * Classe de gestion de l'utilisateur courant (singleton).
	 *
	 * Stocke l'utilisateur courant en mémoire vive (this.currentUser)
	 * et en local storage (sans email).
	 * Permet de récupérer l'utilisateur courant, de l'initialiser
	 * et de le mettre à jour.
	 *
	 * L'utilisateur courant est stocké en local storage
	 * sous forme de JSON avec les propriétés de l'utilisateur
	 * sauf l'email. Cela permet de récupérer l'utilisateur
	 * même après fermeture du navigateur.
	 *
	 * La méthode setCurrentUserFromServer met à jour l'utilisateur
	 * courant avec les données complètes du serveur (y compris l'email)
	 * mais n'enregistre que les données sans email en local storage.
	 */

	/**
	 * Vérifie si l'utilisateur courant existe.
	 * 
	 * @returns {boolean} true si l'utilisateur courant existe, false sinon.
	 */
	public hasCurrentUser(): boolean {
		return this.currentUser !== null;
	}

	/**
	 * Renvoie l'utilisateur courant en mémoire vive.
	 *
	 * @returns {User | null} L'utilisateur courant, ou null si pas d'utilisateur connecté.
	 */
	public getCurrentUser(): User | null {
		return this.currentUser;
	}

	/**
	 * Définit l'utilisateur courant en mémoire vive et le stocke dans le localStorage.
	 * 
	 * - Met à jour l'utilisateur courant avec les données fournies.
	 * - Sérialise l'utilisateur en un objet SafeUserModel (sans email) pour le stockage local.
	 * - Enregistre les données sérialisées dans le localStorage sous le nom "currentUser".
	 * 
	 * @param {User} user L'utilisateur à définir comme utilisateur courant.
	 */
	public setCurrentUser(user: User) {
		this.currentUser = user;
		userStore.setCurrentUser(this.currentUser);
	}

	/**
	 * Met à jour l'utilisateur courant avec les données complètes du serveur (y compris l'email).
	 * 
	 * - Crée l'instance de l'utilisateur courant avec l'email (en mémoire).
	 * - Sauvegarde un objet SafeUserModel (sans email) dans le localStorage sous le nom "currentUser".
	 * 
	 * @param {UserModel} userData Les données de l'utilisateur courant fournies par le serveur.
	 */
	public async setCurrentUserFromServer(userData: UserModel): Promise<void> {
		this.currentUser = User.fromJSON(userData);
		userStore.setCurrentUser(this.currentUser);
		console.log(`[${this.constructor.name}] Utilisateur mis à jour depuis serveur (email en mémoire uniquement):`, this.currentUser);
	}

	/**
	 * Met à jour les propriétés de l'utilisateur avec de nouvelles données.
	 * 
	 * @param {Partial<UserModel>} updates - Objet contenant les propriétés à mettre à jour
	 * @returns {User} - Instance mise à jour (pour chaînage)
	 */
	public async updateCurrentUser(updates: Partial<UserModel>): Promise<User | null> {
		if (!this.currentUser) {
			console.warn(`[${this.constructor.name}] Aucun utilisateur courant à mettre à jour`);
			return null;
		}
		Object.assign(this.currentUser, updates);
		userStore.setCurrentUser(this.currentUser);
		console.log(`[${this.constructor.name}] Utilisateur courant mis à jour`);
		return this.currentUser;
	}

	/**
	 * Supprime l'utilisateur courant du store et du localStorage.
	 * 
	 * - Met l'utilisateur courant à null.
	 * - Supprime l'entrée "currentUser" du localStorage.
	 * 
	 */
	public clearCurrentUser() {
		if (!this.currentUser) {
			return;
		}
		this.currentUser = null;
		userStore.clearCurrentUser();
		console.log(`[${this.constructor.name}] Utilisateur supprimé`);
	}

	/**
	 * Restaure l'utilisateur courant stocké en local storage.
	 * 
	 * - Tente de restaurer l'utilisateur stocké localement.
	 * - Si un utilisateur est trouvé, il est dé-sérialisé vers une instance de User.
	 * - Si aucun utilisateur n'est trouvé, l'utilisateur courant est laissé à null.
	 * 
	 * @returns {User | null} L'utilisateur restauré, ou null si la restaurtion a échoué.
	 */
	public restoreUser(): User | null {
		const storedUser: SafeUserModel | null = userStore.restoreFromStorage();
		if (!storedUser) {
			console.log(`[${this.constructor.name}] Pas d'utilisateur stocké localement`);
			return null;
		}
		const user = User.fromSafeJSON(storedUser);
		this.setCurrentUser(user);
		console.log(`[${this.constructor.name}] User restauré:`, this.currentUser);
		return this.currentUser;
	}

	// ============================================================================
	// MÉTHODES UTILITAIRES
	// ============================================================================

	/**
	 * Convertit un statut en libellé lisible.
	 * 
	 * @returns Libellé lisible
	 */
	public showStatusLabel(): string {
		switch (this.currentUser!.status) {
			case 'online': return '<span class="text-green-500">🟢 online </span>';
			case 'offline': return '<span class="text-red-500">🔴 offline </span>';
			case 'in-game': return '<span class="text-yellow-500">🟡 in game</span>';
			default: return 'Unknown';
		}
	}

	// ============================================================================
	// MANIPULATION DES COLLECTIONS D'UTILISATEURS
	// ============================================================================

	/**
	 * Filtre les utilisateurs actifs (non supprimés).
	 * 
	 * @param {User[]} users - Tableau d'instances User
	 * @returns {User[]} Tableau d'utilisateurs actifs
	 */
	public static getActiveUsers(users: User[]): User[] {
		return users.filter(user => user.isActive);
	}

	/**
	 * Filtre les utilisateurs en ligne.
	 * 
	 * @param {User[]} users - Tableau d'instances User
	 * @returns {User[]} Tableau d'utilisateurs en ligne
	 */
	public static getOnlineUsers(users: User[]): User[] {
		return users.filter(user => user.isOnline());
	}

	/**
	 * Filtre les utilisateurs par statut.
	 * 
	 * @param {User[]} users - Tableau d'instances User
	 * @param {UserStatus} status - Statut à filtrer
	 * @returns {User[]} Tableau d'utilisateurs avec le statut spécifié
	 */
	public static getUsersByStatus(users: User[], status: UserStatus): User[] {
		return users.filter(user => user.status === status);
	}

	/**
	 * Recherche des utilisateurs par nom d'utilisateur.
	 * 
	 * @param {User[]} users - Tableau d'instances User
	 * @param {string} searchTerm - Terme de recherche
	 * @returns {User[]} Tableau d'utilisateurs correspondants
	 */
	public static searchByUsername(users: User[], searchTerm: string): User[] {
		const term = searchTerm.toLowerCase();
		return users.filter(user => 
			user.username.toLowerCase().includes(term)
		);
	}

	/**
	 * Trie les utilisateurs par taux de victoire décroissant.
	 * 
	 * @param {User[]} users - Tableau d'instances User
	 * @returns {User[]} Tableau d'utilisateurs triés
	 */
	public static sortByWinRate(users: User[]): User[] {
		return [...users].sort((a, b) => b.winRate - a.winRate);
	}

	/**
	 * Trie les utilisateurs par nombre de parties jouées décroissant.
	 * 
	 * @param {User[]} users - Tableau d'instances User
	 * @returns {User[]} Tableau d'utilisateurs triés
	 */
	public static sortByGamesPlayed(users: User[]): User[] {
		return [...users].sort((a, b) => b.gamePlayed - a.gamePlayed);
	}
}