import { FriendModel, FriendStatus } from '../types/friend.types';	// en rouge car dossier local 'shared' != dossier conteneur
import { DB_CONST } from '../config/constants.config'; // en rouge car dossier local 'shared' != dossier conteneur

// ===========================================
// FRIENDS MODEL
// ===========================================

export class Friend {

	constructor(
		public id: number,
		public username: string,
		public avatar: string,
		public beginLog: string,
		public endLog: string,
		// public user1Id: number,
		// public user2Id: number,
		public friendStatus: FriendStatus,
		public isBlocked: number,
		public date: string
	) {}

	// ============================================================================
	// MÉTHODE DE SÉRIALISATION (OBJECT → JSON)
	// ============================================================================

	public toJSON(): FriendModel {
		return {
			id: this.id,
			username: this.username,
			avatar: this.avatar,
			beginLog: this.beginLog,
			endLog: this.endLog,
			// user1Id: this.user1Id,
			// user2Id: this.user2Id,
			friendStatus: this.friendStatus,
			isBlocked: this.isBlocked,
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
			data.username ?? '',
			data.avatar ?? DB_CONST.USER.DEFAULT_AVATAR,
			data.beginLog ?? '',
			data.endLog ?? '',
			// data.user1Id,
			// data.user2Id,
			data.friendStatus ?? DB_CONST.FRIENDS.STATUS.PENDING,
			data.isBlocked ?? 0,
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