import { FriendModel, FriendStatus } from '../types/friend.types';	// en rouge car dossier local 'shared' != dossier conteneur
import { UserStatus } from '../types/user.types';
import { DB_CONST, USER_ONLINE_STATUS } from '../config/constants.config'; // en rouge car dossier local 'shared' != dossier conteneur

// ===========================================
// FRIENDS MODEL
// ===========================================

export class Friend {

	constructor(
		public id: number,
		public requesterId: number,
		public username: string,
		public avatar: string,
		public beginLog: string,
		public endLog: string,
		public tournament: number,
		public friendStatus: FriendStatus,
		public blockedBy: number,
		public meetDate: string,
		public status: UserStatus,
		public gamePlayed: number,
		public gameWin: number,
		public gameLoose: number,
		public timePlayed: number,
		public isDesactivated: number
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

	get formattedLastLog(): string {
		return this.beginLog ? new Date(this.beginLog).toLocaleString() : 'User has never logged in';
	}
	
	get winRate(): number {
		if (!this.gamePlayed || this.gamePlayed === 0) return 0;
		return Math.round((this.gameWin / this.gamePlayed) * 100);
	}

	// ============================================================================
	// MÉTHODE DE SÉRIALISATION (OBJECT → JSON)
	// ============================================================================

	public toJSON(): FriendModel {
		return {
			id: this.id,
			requesterId: this.requesterId,
			username: this.username,
			avatar: this.avatar,
			beginLog: this.beginLog,
			endLog: this.endLog,
			tournament: this.tournament,
			friendStatus: this.friendStatus,
			blockedBy: this.blockedBy,
			meetDate: this.meetDate,
			status: this.status,
			gamePlayed: this.gamePlayed,
			gameWin: this.gameWin,
			gameLoose: this.gameLoose,
			timePlayed: this.timePlayed,
			isDesactivated: this.isDesactivated
		};
	}

	// ============================================================================
	// MÉTHODE DE DÉSÉRIALISATION (JSON → OBJECT)
	// ============================================================================

	public static fromJSON(data: Partial<FriendModel>): Friend {

		if (!data.id) {
			throw new Error('id manquant dans les données du modèle Friend');
		}

		return new Friend(
			data.id ?? 0,
			data.requesterId ?? 0,
			data.username ?? '',
			data.avatar ?? DB_CONST.USER.DEFAULT_AVATAR,
			data.beginLog ?? '',
			data.endLog ?? '',
			data.tournament ?? 0,
			data.friendStatus ?? DB_CONST.FRIENDS.STATUS.PENDING,
			data.blockedBy ?? 0,
			data.meetDate ?? new Date().toISOString(),
			data.status ?? USER_ONLINE_STATUS.OFFLINE,
			data.gamePlayed ?? 0,
			data.gameWin ?? 0,
			data.gameLoose ?? 0,
			data.timePlayed ?? 0,
			data.isDesactivated ?? 0
		);
	}

	// ============================================================================
	// MÉTHODES STATIQUES SUR TABLEAUX D'UTILISATEURS
	// ============================================================================

	public static fromJSONArray(friends: Partial<FriendModel>[]): Friend[] {
		return friends.map(friend => this.fromJSON(friend));
	}

	public static toJSONArray(friends: Friend[]): FriendModel[] {
		return friends.map(friend => friend.toJSON());
	}
}