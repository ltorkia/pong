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



/**
 * Constantes pour les routes API.
 */
export const API_ROUTES = {
	ME: '/api/me',
	VALIDATE_SESSION: '/api/validate-session/',
	REGISTER: '/api/auth/register',
	LOGIN: '/api/auth/login',
	SEND_2FA: '/api/auth/2FAsend',
	VERIFY_2FA: '/api/auth/2FAreceive',
	LOGOUT: '/api/auth/logout',
	GET_USER: '/api/users/:id',
	GET_ALL_USERS: '/api/users',
	GET_USER_P: '/api/user/password',
	GET_USER_2FA: '/api/user/2FA',
	GET_FRIENDS: '/api/user/friends',
	GET_FRIENDS_CHAT: '/api/user/friends/chat',
	GET_FRIENDS_CHAT_MESSAGES: '/api/user/friends/chat/messages',
} as const;