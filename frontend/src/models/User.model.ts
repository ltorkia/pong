import { UserModel, PublicUser } from '../types/user.types';

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

	// ============================================================================
	// MÉTHODES DE SÉRIALISATION / DÉSÉRIALISATION
	// ============================================================================

	/**
	 * Sérialisation: convertit l’instance de classe User vers un objet simple
	 * (équivalent à ce que la bdd ou l’API attend).
	 * Utile quand on veut:
	 * - envoyer les données dans un fetch ou API
	 * - stocker une version pure genre dans le localStorage
	 * @returns UserModel: version brute, sans méthode
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
	 * Désérialisation: crée une instance de User à partir d’un objet UserModel.
	 * Utile quand on récupère des données depuis:
	 * - API (GET)
	 * - un localStorage
	 * @returns une instance de User avec toutes ses méthodes
	 */
	static fromJSON(data: Partial<UserModel>): User {
		return new User(
			data.id ?? 0,
			data.username ?? 'Inconnu',
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
}