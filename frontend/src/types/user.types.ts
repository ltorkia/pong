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

export interface PublicUser {
	id?: number;
	username?: string;
	avatar?: string;
	game_played?: number;
	game_win?: number;
	game_loose?: number;
	time_played?: number;
	n_friends?: number;
}

/**
 * Alias de type pour représenter un utilisateur qui peut être null.
 * -> utile dans les cas de déconnexion ou les vérifications de session.
 * ? A voir si ça vaut le coup de garder
 */
export type OptionalUser = UserModel | null;