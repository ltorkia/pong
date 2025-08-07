import { FriendModel, FriendStatus } from '../types/friend.types';	// en rouge car dossier local 'shared' != dossier conteneur
import { DB_CONST } from '../config/constants.config'; // en rouge car dossier local 'shared' != dossier conteneur

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
		public friendStatus: FriendStatus,
		public blockedBy: number,
		public date: string
	) {}

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
			friendStatus: this.friendStatus,
			blockedBy: this.blockedBy,
			date: this.date
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
			data.friendStatus ?? DB_CONST.FRIENDS.STATUS.PENDING,
			data.blockedBy ?? 0,
			data.date ?? new Date().toISOString()
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