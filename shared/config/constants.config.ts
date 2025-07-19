import { UserSortField, SortOrder } from "../types/user.types";

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
	GAME: {
		STATUS: {
			WAITING: 'waiting',
			IN_PROGRESS: 'in_progress',
			CANCELLED: 'cancelled',
			FINISHED: 'finished',
		},
	},
	FRIENDS: {
		STATUS: {
			PENDING: 'pending',
			ACCEPTED: 'accepted',
			BLOCKED: 'blocked',
		},
	}
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
	ROUTE_API: '/uploads/avatars/',
	/**
	 * Erreurs possibles lors de l'enregistrement d'un avatar.
	 */
	ERRORS: {
		EMPTY_FILE: 'The selected image is empty.',
		SIZE_LIMIT: 'Image size must be less than 5MB.',
		TYPE_ERROR: 'Select a valid image (JPG, PNG, GIF, WebP).'
	}
}

/**
 * Liste des champs de tri et des ordres autorisés
 * pour les requêtes utilisateurs.
 */

export const ALLOWED_SORT_FIELDS: Record<UserSortField, string> = {
	id: 'id',
	username: 'username',
	registration: 'registration',
	game_played: 'game_played',
	game_win: 'game_win',
	game_loose: 'game_loose',
	time_played: 'time_played',
	n_friends: 'n_friends',
	status: 'status',
	is_deleted: 'is_deleted',
	register_from: 'register_from'
};
export const ALLOWED_SEARCH_FIELDS: Record<UserSortField, string> = ALLOWED_SORT_FIELDS;
export const ALLOWED_SORT_ORDERS: Record<SortOrder, string> = {
	ASC: 'ASC',
	DESC: 'DESC'
};
