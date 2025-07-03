// ===========================================
// CONSTANTS CONFIG
// ===========================================

/**
 * Constantes utilisées pour stocker des informations
 * dans les cookies du navigateur
 */
export const COOKIES_CONST = {
	AUTH: {
		TOKEN_KEY: 'auth_token',
		STATUS_KEY: 'auth-status',
		STATUS_VALUE: 'active'
	}
}

/**
 * Constantes utilisées pour stocker des informations
 * dans la base de données.
 */
export const DB_CONST = {
	USER: {
		DEFAULT_AVATAR: 'default.png',
		STATUS: {
			ONLINE: 'online',
			OFFLINE: 'offline',
			IN_GAME: 'in-game',
		},
		REGISTER_FROM: {
			LOCAL: 'local',
			GOOGLE: 'google',
		},
	},
} as const;