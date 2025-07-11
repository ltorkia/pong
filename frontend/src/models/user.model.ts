import { SafeUserModel, UserModel, PublicUser, UserStatus, RegisterMethod } from '../shared/types/user.types';	// en rouge car dossier local 'shared' != dossier conteneur

// ===========================================
// USER MODEL
// ===========================================
/**
 * Classe représentant un utilisateur dans l'application.
 * 
 * Cette classe encapsule toutes les informations et comportements
 * associés à un utilisateur, y compris les détails personnels,
 * les statistiques de jeu, et les fonctions utilitaires pour
 * manipuler ces données.
 * 
 * Lors des requêtes API, l'utilisateur
 * est temporairement stocké en mémoire vive, puis ses données
 * sont conservées sans l'email dans le localStorage pour un accès
 * ultérieur.
 */
export class User {

	constructor(
		public id: number,
		public username: string,
		public avatar: string,
		public email: string,
		public registration: string,
		public beginLog: string,
		public endLog: string,
		public tournament: number,
		public gamePlayed: number,
		public gameWin: number,
		public gameLoose: number,
		public timePlayed: number,
		public nFriends: number,
		public status: UserStatus,
		public isDeleted: boolean,
		public registerFrom: RegisterMethod
	) {}

	// ============================================================================
	// GETTERS POUR L'AFFICHAGE
	// ============================================================================
	
	get winRate(): number {
		if (!this.gamePlayed || this.gamePlayed === 0) return 0;
		return Math.round((this.gameWin / this.gamePlayed) * 100);
	}

	get isActive(): boolean {
		return !this.isDeleted;
	}

	get displayName(): string {
		return this.username;
	}

	isOnline(): boolean {
		return this.status === 'online';
	}

	get formattedLastLog(): string {
		return this.beginLog ? new Date(this.beginLog).toLocaleString() : 'User has never logged in';
	}

	// ============================================================================
	// MÉTHODES DE SÉRIALISATION (OBJECT → JSON)
	// ============================================================================

	/**
	 * Sérialise vers un objet PublicUser pour l'affichage public.
	 * Contient uniquement les informations non-sensibles visibles par d'autres utilisateurs.
	 * Utilisé pour: listes d'utilisateurs, classements, profils publics.
	 * 
	 * @returns {PublicUser} - Version publique sans données sensibles
	 */
	toPublicJSON(): PublicUser {
		return {
			id: this.id,
			username: this.username,
			avatar: this.avatar,
			game_played: this.gamePlayed,
			game_win: this.gameWin,
			game_loose: this.gameLoose,
			time_played: this.timePlayed,
			n_friends: this.nFriends,
		};
	}

	/**
	 * Sérialise vers un objet SafeUserModel pour les opérations internes.
	 * Contient toutes les informations excepté l'email.
	 * Utilisé pour: opérations internes où l'email n'est pas nécessaire.
	 * 
	 * @returns {SafeUserModel} - Version complète sans email
	 */
	toSafeJSON(): SafeUserModel {
		return {
			id: this.id,
			username: this.username,
			avatar: this.avatar,
			registration: this.registration,
			begin_log: this.beginLog,
			end_log: this.endLog,
			tournament: this.tournament,
			game_played: this.gamePlayed,
			game_win: this.gameWin,
			game_loose: this.gameLoose,
			time_played: this.timePlayed,
			n_friends: this.nFriends,
			status: this.status,
			is_deleted: this.isDeleted,
			register_from: this.registerFrom
		};
	}

	/**
	 * Sérialise vers un objet UserModel complet pour l'API.
	 * Contient toutes les informations, y compris les données sensibles (email).
	 * Utilisé pour: communications avec l'API, gestion complète du profil.
	 * 
	 * @returns {UserModel} - Version complète avec email
	 */
	toFullJSON(): UserModel {
		return {
			id: this.id,
			username: this.username,
			avatar: this.avatar,
			email: this.email,
			registration: this.registration,
			begin_log: this.beginLog,
			end_log: this.endLog,
			tournament: this.tournament,
			game_played: this.gamePlayed,
			game_win: this.gameWin,
			game_loose: this.gameLoose,
			time_played: this.timePlayed,
			n_friends: this.nFriends,
			status: this.status,
			is_deleted: this.isDeleted,
			register_from: this.registerFrom
		};
	}

	// ============================================================================
	// MÉTHODES DE DÉSÉRIALISATION (JSON → OBJECT)
	// ============================================================================

	/**
	 * Désérialise un objet UserModel vers une instance de User.
	 * Crée une instance complète avec toutes les méthodes disponibles.
	 * Utilisé pour: récupération depuis l'API, restauration depuis stockage.
	 * 
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
			data.begin_log ?? '',
			data.end_log ?? '',
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
	 * 
	 * @param data - Données SafeUserModel
	 * @returns {User} - Instance de User (avec email vide)
	 */
	static fromSafeJSON(data: Partial<SafeUserModel>): User {
		return this.fromJSON({ ...data, email: '' });
	}

	/**
	 * Crée une instance User à partir de données PublicUser.
	 * Utilisé pour afficher des utilisateurs publics avec fonctionnalités limitées.
	 * 
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
			'', // beginLog vide
			'', // endLog vide
			0,  // Tournament à 0
			data.game_layed ?? 0,
			data.game_win ?? 0,
			data.game_loose ?? 0,
			data.time_played ?? 0,
			data.n_friends ?? 0,
			'offline', // Status par défaut
			false, // isDeleted par défaut
			'local' // registerFrom par défaut
		);
	}

	// TODO: Déplacer logique user vers service
	// ============================================================================
	// MÉTHODES STATIQUES SUR TABLEAUX D'UTILISATEURS
	// ============================================================================

	/**
	 * Convertit un tableau d'objets UserModel en tableau d'instances User.
	 * 
	 * @param users - Tableau d'objets UserModel
	 * @returns {User[]} - Tableau d'instances User
	 */
	static fromJSONArray(users: Partial<UserModel>[]): User[] {
		return users.map(user => this.fromJSON(user));
	}

	/**
	 * Convertit un tableau d'objets SafeUserModel en tableau d'instances User.
	 * 
	 * @param users - Tableau d'objets SafeUserModel
	 * @returns {User[]} - Tableau d'instances User
	 */
	static fromSafeJSONArray(users: Partial<SafeUserModel>[]): User[] {
		return users.map(user => this.fromSafeJSON(user));
	}

	/**
	 * Convertit un tableau d'objets PublicUser en tableau d'instances User.
	 * 
	 * @param users - Tableau d'objets PublicUser
	 * @returns {User[]} - Tableau d'instances User
	 */
	static fromPublicJSONArray(users: PublicUser[]): User[] {
		return users.map(user => this.fromPublicJSON(user));
	}

	/**
	 * Convertit un tableau d'instances User en tableau d'objets PublicUser.
	 * 
	 * @param users - Tableau d'instances User
	 * @returns {PublicUser[]} - Tableau d'objets PublicUser
	 */
	static toPublicJSONArray(users: User[]): PublicUser[] {
		return users.map(user => user.toPublicJSON());
	}

	/**
	 * Convertit un tableau d'instances User en tableau d'objets SafeUserModel.
	 * 
	 * @param users - Tableau d'instances User
	 * @returns {SafeUserModel[]} - Tableau d'objets SafeUserModel
	 */
	static toSafeJSONArray(users: User[]): SafeUserModel[] {
		return users.map(user => user.toSafeJSON());
	}

	/**
	 * Convertit un tableau d'instances User en tableau d'objets UserModel.
	 * 
	 * @param users - Tableau d'instances User
	 * @returns {UserModel[]} - Tableau d'objets UserModel
	 */
	static toFullJSONArray(users: User[]): UserModel[] {
		return users.map(user => user.toFullJSON());
	}

	// ============================================================================
	// FILTRES & RECHERCHE DANS UN TABLEAU
	// ============================================================================

	/**
	 * Filtre les utilisateurs actifs (non supprimés).
	 * 
	 * @param users - Tableau d'instances User
	 * @returns {User[]} - Tableau d'utilisateurs actifs
	 */
	static getActiveUsers(users: User[]): User[] {
		return users.filter(user => user.isActive);
	}

	/**
	 * Filtre les utilisateurs en ligne.
	 * 
	 * @param users - Tableau d'instances User
	 * @returns {User[]} - Tableau d'utilisateurs en ligne
	 */
	static getOnlineUsers(users: User[]): User[] {
		return users.filter(user => user.isOnline());
	}

	/**
	 * Filtre les utilisateurs par statut.
	 * 
	 * @param users - Tableau d'instances User
	 * @param status - Statut à filtrer
	 * @returns {User[]} - Tableau d'utilisateurs avec le statut spécifié
	 */
	static getUsersByStatus(users: User[], status: 'online' | 'offline' | 'in-game'): User[] {
		return users.filter(user => user.status === status);
	}

	// ============================================================================
	// MÉTHODES D’INSTANCE POUR MANIPULATION
	// ============================================================================

	/**
	 * Met à jour les propriétés de l'utilisateur avec de nouvelles données.
	 * 
	 * @param updates - Objet contenant les propriétés à mettre à jour
	 * @returns {User} - Instance mise à jour (pour chaînage)
	 */
	update(updates: Partial<UserModel>): User {
		Object.assign(this, updates);
		return this;
	}
}