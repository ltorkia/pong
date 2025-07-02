import { UserModel } from '../types/model.types';

export class User {

	constructor(
		public id: number,
		public username: string,
		public avatar: string,
		public email: string,
		public registration: string,
		public lastlog: string,
		// public begin_log: string,
		// public end_log: string,
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

	static fromJson(data: UserModel): User {
		return new User(
			data.id,
			data.username,
			data.avatar,
			data.email,
			data.registration,
			data.lastlog,
			data.tournament,
			data.game_played,
			data.game_win,
			data.game_loose,
			data.time_played,
			data.n_friends,
			data.status,
			data.is_deleted,
			data.register_from
		);
	}
}