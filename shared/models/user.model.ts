import { SafeUserModel, UserModel, PublicUser, UserStatus, RegisterMethod, TwoFaMethod } from '../types/user.types';	// en rouge car dossier local 'shared' != dossier conteneur
import { AppNotification } from './notification.model';
import { DB_CONST, USER_ONLINE_STATUS } from '../config/constants.config';
import { formatRelativeDate } from '../utils/app.utils';
import { FriendStatus } from '../types/friend.types';	// en rouge car dossier local 'shared' != dossier conteneur

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
 * est temporairement stocké en mémoire vive (services/user/user.service.ts), puis ses données
 * sont conservées sans l'email dans le localStorage pour un accès
 * ultérieur (stores/user.store.ts).
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
		public isDesactivated: number,
		public registerFrom: RegisterMethod,
		public active2Fa: TwoFaMethod,
		public notifications: AppNotification[],
		public friendStatus: FriendStatus | '',
	) {}

	// ============================================================================
	// GETTERS POUR L'AFFICHAGE
	// ============================================================================

	get displayName(): string {
		return this.username;
	}

	get isActive(): boolean {
		return !this.isDesactivated;
	}

	isOnline(): boolean {
		return this.status === USER_ONLINE_STATUS.ONLINE;
	}

	get formattedBeginLog(): string {
		return formatRelativeDate(this.beginLog);
	}

	get formattedEndLog(): string {
		return formatRelativeDate(this.endLog);
	}
	
	get winRate(): number {
		if (!this.gamePlayed || this.gamePlayed === 0) return 0;
		return Math.round((this.gameWin / this.gamePlayed) * 100);
	}

	// ============================================================================
	// MÉTHODES DE SÉRIALISATION (OBJECT → JSON)
	// ============================================================================

	/**
	 * Sérialise vers un objet PublicUser.
	 * Contient uniquement le strict minimum d'informations pour l'affichage public
	 * et la gestion simple des données utilisateur.
	 * 
	 * @returns {PublicUser} - Version publique sans données sensibles
	 */
	public toPublicJSON(): PublicUser {
		return {
			id: this.id,
			username: this.username,
			avatar: this.avatar,
			beginLog: this.beginLog,
			endLog: this.endLog,
			status: this.status
		};
	}

	/**
	 * Sérialise vers un objet SafeUserModel pour les opérations internes.
	 * Contient toutes les informations excepté les données sensibles.
	 * Utilisé pour: opérations internes où l'email n'est pas nécessaire
	 * et la gestion complète du profil, les classements etc.
	 * 
	 * @returns {SafeUserModel} - Version complète sans email
	 */
	public toSafeJSON(): SafeUserModel {
		return {
			id: this.id,
			username: this.username,
			avatar: this.avatar,
			registration: this.registration,
			beginLog: this.beginLog,
			endLog: this.endLog,
			tournament: this.tournament,
			gamePlayed: this.gamePlayed,
			gameWin: this.gameWin,
			gameLoose: this.gameLoose,
			timePlayed: this.timePlayed,
			nFriends: this.nFriends,
			status: this.status,
			registerFrom: this.registerFrom,
			isDesactivated: this.isDesactivated
		};
	}

	/**
	 * Sérialise vers un objet UserModel complet pour l'API.
	 * Contient toutes les informations, y compris les données sensibles (email etc.).
	 * Utilisé pour: communications avec l'API, gestion complète du profil.
	 * 
	 * @returns {UserModel} - Version complète avec email
	 */
	public toFullJSON(): UserModel {
		return {
			id: this.id,
			username: this.username,
			avatar: this.avatar,
			email: this.email,
			registration: this.registration,
			beginLog: this.beginLog,
			endLog: this.endLog,
			tournament: this.tournament,
			gamePlayed: this.gamePlayed,
			gameWin: this.gameWin,
			gameLoose: this.gameLoose,
			timePlayed: this.timePlayed,
			nFriends: this.nFriends,
			status: this.status,
			isDesactivated: this.isDesactivated,
			registerFrom: this.registerFrom,
			active2Fa: this.active2Fa,
			notifications: this.notifications
		};
	}

	// ============================================================================
	// MÉTHODES DE DÉSÉRIALISATION (JSON → OBJECT)
	// ============================================================================

	/**
	 * Désérialise un objet UserModel vers une instance de User.
	 * Crée une instance complète avec toutes les méthodes disponibles.
	 * Utilisé pour: récupération depuis l'API, restauration depuis storage.
	 * 
	 * @param data - Données partielles de l'utilisateur
	 * @returns {User} - Instance de User avec toutes ses méthodes
	 */
	public static fromJSON(data: Partial<UserModel>): User {

		if (!data.id || !data.username) {
			throw new Error('ID et username sont requis pour créer un utilisateur');
		}

		return new User(
			data.id,
			data.username,
			data.avatar ?? DB_CONST.USER.DEFAULT_AVATAR,
			data.email ?? '',
			data.registration ?? '',
			data.beginLog ?? '',
			data.endLog ?? '',
			data.tournament ?? 0,
			data.gamePlayed ?? 0,
			data.gameWin ?? 0,
			data.gameLoose ?? 0,
			data.timePlayed ?? 0,
			data.nFriends ?? 0,
			data.status ?? USER_ONLINE_STATUS.OFFLINE,
			data.isDesactivated ?? 0,
			data.registerFrom ?? DB_CONST.USER.REGISTER_FROM.LOCAL,
			data.active2Fa ?? DB_CONST.USER.ACTIVE_2FA.DISABLED,
			data.notifications ?? [],
			data.friendStatus ?? '',
		);
	}

	/**
	 * Crée une instance User à partir de données SafeUserModel (sans données sensibles).
	 * 
	 * @param data - Données SafeUserModel
	 * @returns {User} - Instance de User (avec email vide)
	 */
	public static fromSafeJSON(data: Partial<SafeUserModel>): User {
		return this.fromJSON({ ...data, email: '' });
	}

	/**
	 * Crée une instance User à partir de données PublicUser.
	 * Utilisé pour afficher des utilisateurs publics avec fonctionnalités limitées.
	 * 
	 * @param data - Données PublicUser
	 * @returns {User} - Instance de User (avec données minimales)
	 */
	public static fromPublicJSON(data: PublicUser): User {
		if (!data.id || !data.username) {
			throw new Error('ID et username sont requis');
		}

		return new User(
			data.id,
			data.username,
			data.avatar ?? DB_CONST.USER.DEFAULT_AVATAR,
			'', // Email vide pour les données publiques
			'', // Registration vide
			data.beginLog ?? '',
			data.endLog ?? '',
			0,  // Tournament à 0
			0,
			0,
			0,
			0,
			0,
			data.status ?? USER_ONLINE_STATUS.OFFLINE,
			0, // isDesactivated à 0 par défaut
			data.registerFrom ?? DB_CONST.USER.REGISTER_FROM.LOCAL, // registerFrom par défaut
			DB_CONST.USER.ACTIVE_2FA.DISABLED, // active2Fa à disabled par défaut,
			[], // notifications vides par défaut
			'' // friendStatus vide par défaut
		);
	}

	// ============================================================================
	// MÉTHODES STATIQUES SUR TABLEAUX D'UTILISATEURS
	// ============================================================================

	/**
	 * Convertit un tableau d'objets UserModel en tableau d'instances User.
	 * 
	 * @param users - Tableau d'objets UserModel
	 * @returns {User[]} - Tableau d'instances User
	 */
	public static fromJSONArray(users: Partial<UserModel>[]): User[] {
		return users.map(user => this.fromJSON(user));
	}

	/**
	 * Convertit un tableau d'objets SafeUserModel en tableau d'instances User.
	 * 
	 * @param users - Tableau d'objets SafeUserModel
	 * @returns {User[]} - Tableau d'instances User
	 */
	public static fromSafeJSONArray(users: Partial<SafeUserModel>[]): User[] {
		return users.map(user => this.fromSafeJSON(user));
	}

	/**
	 * Convertit un tableau d'objets PublicUser en tableau d'instances User.
	 * 
	 * @param users - Tableau d'objets PublicUser
	 * @returns {User[]} - Tableau d'instances User
	 */
	public static fromPublicJSONArray(users: PublicUser[]): User[] {
		return users.map(user => this.fromPublicJSON(user));
	}

	/**
	 * Convertit un tableau d'instances User en tableau d'objets PublicUser.
	 * 
	 * @param users - Tableau d'instances User
	 * @returns {PublicUser[]} - Tableau d'objets PublicUser
	 */
	public static toPublicJSONArray(users: User[]): PublicUser[] {
		return users.map(user => user.toPublicJSON());
	}

	/**
	 * Convertit un tableau d'instances User en tableau d'objets SafeUserModel.
	 * 
	 * @param users - Tableau d'instances User
	 * @returns {SafeUserModel[]} - Tableau d'objets SafeUserModel
	 */
	public static toSafeJSONArray(users: User[]): SafeUserModel[] {
		return users.map(user => user.toSafeJSON());
	}

	/**
	 * Convertit un tableau d'instances User en tableau d'objets UserModel.
	 * 
	 * @param users - Tableau d'instances User
	 * @returns {UserModel[]} - Tableau d'objets UserModel
	 */
	public static toFullJSONArray(users: User[]): UserModel[] {
		return users.map(user => user.toFullJSON());
	}
}