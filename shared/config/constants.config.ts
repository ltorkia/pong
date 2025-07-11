import path from 'node:path';

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
 * Constantes utilisées pour stocker des informations
 * relatives aux images d'avatar.
 */
export const IMAGE_CONST = {
	/**
	 * Associe les types MIME d'images d'avatar pris en charge à leurs extensions de fichier correspondantes.
	 */
	EXTENSIONS: {
		'image/jpeg': '.jpeg',
		'image/png': '.png',
		'image/jpg': '.jpg',
		'image/webp': '.webp',
		'image/gif': '.gif'
	} as const,
	/**
	 * Taille maximale autorisée pour une image d'avatar, en octets.
	 * La valeur est exprimée en bytes.
	 */
	MAX_SIZE: 5 * 1024 * 1024,
	/**
	 * URL publique des avatars, utilisée dans les balises <img src="..."> côté frontend.
	 * Correspond à la route exposée par le serveur via NGINX.
	 * Exemple : '/uploads/avatars/bla.jpeg'
	 */
	ROUTE_API: '/uploads/avatars/'
}
