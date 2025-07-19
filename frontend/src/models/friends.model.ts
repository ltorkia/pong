import { FriendsModel, FriendStatus } from '../shared/types/friends.types';	// en rouge car dossier local 'shared' != dossier conteneur
import { DB_CONST } from '../shared/config/constants.config'; // en rouge car dossier local 'shared' != dossier conteneur

// ===========================================
// FRIENDS MODEL
// ===========================================

export class Friends {

	constructor(
		public user1Id: number,
		public user2Id: number,
		public status: FriendStatus,
		public isBlocked: number,
		public date: string
	) {}

	// ============================================================================
	// MÉTHODE DE SÉRIALISATION (OBJECT → JSON)
	// ============================================================================

	public toJSON(): FriendsModel {
		return {
			user1Id: this.user1Id,
			user2Id: this.user2Id,
			status: this.status,
			isBlocked: this.isBlocked,
			date: this.date
		};
	}

	// ============================================================================
	// MÉTHODE DE DÉSÉRIALISATION (JSON → OBJECT)
	// ============================================================================

	public static fromJSON(data: Partial<FriendsModel>): Friends {

		if (!data.user1Id || !data.user2Id) {
			throw new Error('Deux iDs utilisateurs sont requis pour créer un jeu');
		}

		return new Friends(
			data.user1Id,
			data.user2Id,
			data.status ?? DB_CONST.FRIENDS.STATUS.PENDING,
			data.isBlocked ?? 0,
			data.date ?? new Date().toISOString()
		);
	}

	// ============================================================================
	// MÉTHODES STATIQUES SUR TABLEAUX D'UTILISATEURS
	// ============================================================================

	public static fromJSONArray(friends: Partial<FriendsModel>[]): Friends[] {
		return friends.map(friend => this.fromJSON(friend));
	}

	public static toJSONArray(friends: Friends[]): FriendsModel[] {
		return friends.map(friend => friend.toJSON());
	}
}