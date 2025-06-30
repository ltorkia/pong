import { SafeUserModel, UserModel, PublicUser } from '../../../shared/types/user.types';

export class User {

	constructor(
		public id: number,
		public username: string,
		public avatar: string,
		public email: string,
		public registration: string,
		public lastlog: string,
		public tournament: number,
		public game_played: number,
		public game_win: number,
		public game_loose: number,
		public time_played: number,
		public n_friends: number,
		public status: 'online' | 'offline' | 'in-game',
		public is_deleted: boolean,
		public register_from: 'local' | 'google'
	) {}

	// ============================================================================
	// GETTERS ET MÉTHODES UTILITAIRES
	// ============================================================================

	// TODO: A développer
	
	get winRate(): number {
		if (!this.game_played || this.game_played === 0) return 0;
		return Math.round((this.game_win / this.game_played) * 100);
	}

	get isActive(): boolean {
		return !this.is_deleted;
	}

	get displayName(): string {
		return this.username;
	}

	isOnline(): boolean {
		return this.status === 'online';
	}

	get formattedLastLog(): string {
		return this.lastlog ? new Date(this.lastlog).toLocaleString() : 'Jamais connecté';
	}

	get formattedTimePlayed(): string {
		const hours = Math.floor(this.time_played / 3600);
		const minutes = Math.floor((this.time_played % 3600) / 60);
		return `${hours}h ${minutes}m`;
	}

	// ============================================================================
	// MÉTHODES DE SÉRIALISATION / DÉSÉRIALISATION
	// ============================================================================

	/**
	 * Sérialise vers un objet PublicUser pour l'affichage public.
	 * Contient uniquement les informations non-sensibles visibles par d'autres utilisateurs.
	 * Utilisé pour: listes d'utilisateurs, classements, profils publics.
	 * @returns {PublicUser} - Version publique sans données sensibles
	 */
	toPublicJSON(): PublicUser {
		return {
			id: this.id,
			username: this.username,
			avatar: this.avatar,
			game_played: this.game_played,
			game_win: this.game_win,
			game_loose: this.game_loose,
			time_played: this.time_played,
			n_friends: this.n_friends,
		};
	}

	/**
	 * Sérialise vers un objet SafeUserModel pour les opérations internes.
	 * Contient toutes les informations excepté l'email.
	 * Utilisé pour: opérations internes où l'email n'est pas nécessaire.
	 * @returns {SafeUserModel} - Version complète sans email
	 */
	toSafeJSON(): SafeUserModel {
		return {
			id: this.id,
			username: this.username,
			avatar: this.avatar,
			registration: this.registration,
			lastlog: this.lastlog,
			tournament: this.tournament,
			game_played: this.game_played,
			game_win: this.game_win,
			game_loose: this.game_loose,
			time_played: this.time_played,
			n_friends: this.n_friends,
			status: this.status,
			is_deleted: this.is_deleted,
			register_from: this.register_from
		};
	}

	/**
	 * Sérialise vers un objet UserModel complet pour l'API.
	 * Contient toutes les informations, y compris les données sensibles (email).
	 * Utilisé pour: communications avec l'API, gestion complète du profil.
	 * @returns {UserModel} - Version complète avec email
	 */
	toFullJSON(): UserModel {
		return {
			id: this.id,
			username: this.username,
			avatar: this.avatar,
			email: this.email,
			registration: this.registration,
			lastlog: this.lastlog,
			tournament: this.tournament,
			game_played: this.game_played,
			game_win: this.game_win,
			game_loose: this.game_loose,
			time_played: this.time_played,
			n_friends: this.n_friends,
			status: this.status,
			is_deleted: this.is_deleted,
			register_from: this.register_from
		};
	}

	/**
	 * Désérialise un objet UserModel vers une instance de User.
	 * Crée une instance complète avec toutes les méthodes disponibles.
	 * Utilisé pour: récupération depuis l'API, restauration depuis stockage.
	 * @param data - Données partielles de l'utilisateur
	 * @returns {User} - Instance de User avec toutes ses méthodes
	 */
	static fromJSON(data: Partial<UserModel>): User {

		if (!data.id || !data.username) {
			throw new Error('ID et username sont requis pour créer un utilisateur');
		}

		return new User(
			data.id,
			data.username,
			data.avatar ?? 'default.png',
			data.email ?? '',
			data.registration ?? '',
			data.lastlog ?? '',
			data.tournament ?? 0,
			data.game_played ?? 0,
			data.game_win ?? 0,
			data.game_loose ?? 0,
			data.time_played ?? 0,
			data.n_friends ?? 0,
			data.status ?? 'offline',
			data.is_deleted ?? false,
			data.register_from ?? 'local'
		);
	}

	/**
	 * Crée une instance User à partir de données SafeUserModel.
	 * Utilisé quand on a des données sans email.
	 * @param data - Données SafeUserModel
	 * @returns {User} - Instance de User (avec email vide)
	 */
	static fromSafeJSON(data: Partial<SafeUserModel>): User {
		return this.fromJSON({ ...data, email: '' });
	}

	/**
	 * Crée une instance User à partir de données PublicUser.
	 * Utilisé pour afficher des utilisateurs publics avec fonctionnalités limitées.
	 * @param data - Données PublicUser
	 * @returns {User} - Instance de User (avec données minimales)
	 */
	static fromPublicJSON(data: PublicUser): User {
		if (!data.id || !data.username) {
			throw new Error('ID et username sont requis');
		}

		return new User(
			data.id,
			data.username,
			data.avatar ?? 'default.png',
			'', // Email vide pour les données publiques
			'', // Registration vide
			'', // Lastlog vide
			0,  // Tournament à 0
			data.game_played ?? 0,
			data.game_win ?? 0,
			data.game_loose ?? 0,
			data.time_played ?? 0,
			data.n_friends ?? 0,
			'offline', // Status par défaut
			false, // is_deleted par défaut
			'local' // register_from par défaut
		);
	}

	// ============================================================================
	// MÉTHODES UTILITAIRES POUR RÉCUPÉRER ET MANIPULER LES UTILISATEURS
	// ============================================================================

	/**
	 * Convertit un tableau d'objets UserModel en tableau d'instances User.
	 * @param users - Tableau d'objets UserModel
	 * @returns {User[]} - Tableau d'instances User
	 */
	static fromJSONArray(users: Partial<UserModel>[]): User[] {
		return users.map(user => this.fromJSON(user));
	}

	/**
	 * Convertit un tableau d'objets SafeUserModel en tableau d'instances User.
	 * @param users - Tableau d'objets SafeUserModel
	 * @returns {User[]} - Tableau d'instances User
	 */
	static fromSafeJSONArray(users: Partial<SafeUserModel>[]): User[] {
		return users.map(user => this.fromSafeJSON(user));
	}

	/**
	 * Convertit un tableau d'objets PublicUser en tableau d'instances User.
	 * @param users - Tableau d'objets PublicUser
	 * @returns {User[]} - Tableau d'instances User
	 */
	static fromPublicJSONArray(users: PublicUser[]): User[] {
		return users.map(user => this.fromPublicJSON(user));
	}

	/**
	 * Convertit un tableau d'instances User en tableau d'objets PublicUser.
	 * @param users - Tableau d'instances User
	 * @returns {PublicUser[]} - Tableau d'objets PublicUser
	 */
	static toPublicJSONArray(users: User[]): PublicUser[] {
		return users.map(user => user.toPublicJSON());
	}

	/**
	 * Convertit un tableau d'instances User en tableau d'objets SafeUserModel.
	 * @param users - Tableau d'instances User
	 * @returns {SafeUserModel[]} - Tableau d'objets SafeUserModel
	 */
	static toSafeJSONArray(users: User[]): SafeUserModel[] {
		return users.map(user => user.toSafeJSON());
	}

	/**
	 * Convertit un tableau d'instances User en tableau d'objets UserModel.
	 * @param users - Tableau d'instances User
	 * @returns {UserModel[]} - Tableau d'objets UserModel
	 */
	static toFullJSONArray(users: User[]): UserModel[] {
		return users.map(user => user.toFullJSON());
	}

	/**
	 * Filtre les utilisateurs actifs (non supprimés).
	 * @param users - Tableau d'instances User
	 * @returns {User[]} - Tableau d'utilisateurs actifs
	 */
	static getActiveUsers(users: User[]): User[] {
		return users.filter(user => user.isActive);
	}

	/**
	 * Filtre les utilisateurs en ligne.
	 * @param users - Tableau d'instances User
	 * @returns {User[]} - Tableau d'utilisateurs en ligne
	 */
	static getOnlineUsers(users: User[]): User[] {
		return users.filter(user => user.isOnline());
	}

	/**
	 * Filtre les utilisateurs par statut.
	 * @param users - Tableau d'instances User
	 * @param status - Statut à filtrer
	 * @returns {User[]} - Tableau d'utilisateurs avec le statut spécifié
	 */
	static getUsersByStatus(users: User[], status: 'online' | 'offline' | 'in-game'): User[] {
		return users.filter(user => user.status === status);
	}

	/**
	 * Trie les utilisateurs par taux de victoire décroissant.
	 * @param users - Tableau d'instances User
	 * @returns {User[]} - Tableau d'utilisateurs triés par winRate
	 */
	static sortByWinRate(users: User[]): User[] {
		return [...users].sort((a, b) => b.winRate - a.winRate);
	}

	/**
	 * Trie les utilisateurs par nombre de parties jouées décroissant.
	 * @param users - Tableau d'instances User
	 * @returns {User[]} - Tableau d'utilisateurs triés par game_played
	 */
	static sortByGamesPlayed(users: User[]): User[] {
		return [...users].sort((a, b) => b.game_played - a.game_played);
	}

	/**
	 * Trie les utilisateurs par temps de jeu décroissant.
	 * @param users - Tableau d'instances User
	 * @returns {User[]} - Tableau d'utilisateurs triés par time_played
	 */
	static sortByTimePlayed(users: User[]): User[] {
		return [...users].sort((a, b) => b.time_played - a.time_played);
	}

	/**
	 * Recherche un utilisateur par ID dans un tableau.
	 * @param users - Tableau d'instances User
	 * @param id - ID de l'utilisateur à rechercher
	 * @returns {User | undefined} - Utilisateur trouvé ou undefined
	 */
	static findById(users: User[], id: number): User | undefined {
		return users.find(user => user.id === id);
	}

	/**
	 * Recherche un utilisateur par nom d'utilisateur dans un tableau.
	 * @param users - Tableau d'instances User
	 * @param username - Nom d'utilisateur à rechercher
	 * @returns {User | undefined} - Utilisateur trouvé ou undefined
	 */
	static findByUsername(users: User[], username: string): User | undefined {
		return users.find(user => user.username.toLowerCase() === username.toLowerCase());
	}

	/**
	 * Recherche des utilisateurs par nom d'utilisateur partiel.
	 * @param users - Tableau d'instances User
	 * @param searchTerm - Terme de recherche
	 * @returns {User[]} - Tableau d'utilisateurs correspondants
	 */
	static searchByUsername(users: User[], searchTerm: string): User[] {
		const term = searchTerm.toLowerCase();
		return users.filter(user => user.username.toLowerCase().includes(term));
	}

	/**
	 * Obtient les statistiques globales d'un groupe d'utilisateurs.
	 * @param users - Tableau d'instances User
	 * @returns {Object} - Statistiques globales
	 */
	static getGlobalStats(users: User[]): {
		totalUsers: number;
		activeUsers: number;
		onlineUsers: number;
		totalGamesPlayed: number;
		totalTimePlayed: number;
		averageWinRate: number;
	} {
		const activeUsers = this.getActiveUsers(users);
		const onlineUsers = this.getOnlineUsers(users);
		
		const totalGamesPlayed = users.reduce((sum, user) => sum + user.game_played, 0);
		const totalTimePlayed = users.reduce((sum, user) => sum + user.time_played, 0);
		const averageWinRate = users.length > 0 
			? users.reduce((sum, user) => sum + user.winRate, 0) / users.length 
			: 0;

		return {
			totalUsers: users.length,
			activeUsers: activeUsers.length,
			onlineUsers: onlineUsers.length,
			totalGamesPlayed,
			totalTimePlayed,
			averageWinRate: Math.round(averageWinRate * 100) / 100
		};
	}

	/**
	 * Clone une instance User.
	 * @returns {User} - Nouvelle instance User identique
	 */
	clone(): User {
		return User.fromJSON(this.toFullJSON());
	}

	/**
	 * Met à jour les propriétés de l'utilisateur avec de nouvelles données.
	 * @param updates - Objet contenant les propriétés à mettre à jour
	 * @returns {User} - Instance mise à jour (pour chaînage)
	 */
	update(updates: Partial<UserModel>): User {
		Object.assign(this, updates);
		return this;
	}

	/**
	 * Vérifie si deux utilisateurs sont identiques (même ID).
	 * @param other - Autre utilisateur à comparer
	 * @returns {boolean} - True si les utilisateurs sont identiques
	 */
	equals(other: User): boolean {
		return this.id === other.id;
	}

	/**
	 * Compare deux utilisateurs pour le tri.
	 * @param other - Autre utilisateur à comparer
	 * @param sortBy - Critère de tri ('username', 'winRate', 'gamesPlayed', 'timePlayed')
	 * @returns {number} - Résultat de la comparaison (-1, 0, 1)
	 */
	compareTo(other: User, sortBy: 'username' | 'winRate' | 'gamesPlayed' | 'timePlayed' = 'username'): number {
		switch (sortBy) {
			case 'username':
				return this.username.localeCompare(other.username);
			case 'winRate':
				return other.winRate - this.winRate; // Décroissant
			case 'gamesPlayed':
				return other.game_played - this.game_played; // Décroissant
			case 'timePlayed':
				return other.time_played - this.time_played; // Décroissant
			default:
				return 0;
		}
	}
}