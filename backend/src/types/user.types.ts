export interface UserBasic {
	id:number;
	pseudo : string;
	email: string;
}

export interface UserWithAvatar {
	id:number;
	pseudo : string;
	avatar : string | null;
}

export interface UserForDashboard extends UserBasic {
	id: number;
	pseudo: string;
	email: string;
	avatar?: string | null;
	lastlog: string;
	game_played: number;
	game_win: number;
	game_loose: number;
	time_played: number;
	n_friends: number;
}

export interface Friends {
	id: number;
	pseudo: string;
	avatar?: string | null;
	lastlog: number;
}