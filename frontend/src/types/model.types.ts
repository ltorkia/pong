export interface UserModel {
	id: number;
	username: string;
	avatar: string;
	email: string;
	registration: string;
	lastlog: string;
	tournament: number;
	game_played: number;
	game_win: number;
	game_loose: number;
	time_played: number;
	n_friends: number;
	status: 'online' | 'offline' | 'in-game';
	is_deleted: boolean;
	register_from: 'local' | 'google';
}