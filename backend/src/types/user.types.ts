export interface UserBasic {
	id:number;
	username : string;
	email: string;
	avatar: string;
}

export interface UserWithAvatar {
	id:number;
	username : string;
	avatar : string;
}

export interface UserForDashboard extends UserBasic {
	id: number;
	username: string;
	email: string;
	begin_log: string | null;
	end_log: string | null;
	registration: Date;
	tournament: string;
	avatar: string;
	game_played: number;
	game_win: number;
	game_loose: number;
	time_played: number;
	n_friends: number;
	status: string;
	is_deleted: number;
	register_from: string;
}

export interface Friends {
	id: number;
	username: string;
	avatar?: string | null;
	begin_log: number;
	end_log: number;
}