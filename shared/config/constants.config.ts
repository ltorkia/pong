// import { UserSortField, SortOrder } from "../types/user.types";
import { NotificationType } from "../types/notification.types";

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
		REGISTER_FROM: {
			LOCAL: 'local',
			GOOGLE: 'google',
		},
		ACTIVE_2FA: {
			EMAIL_CODE: 'email',
			QR_CODE: 'qrcode',
			DISABLED: 'disabled',
		}
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
 * Définit les états possibles d'un utilisateur en ligne.
 * Utilisés dans les notifications.
 * 
 * - `ONLINE` : L'utilisateur est en ligne.
 * - `OFFLINE` : L'utilisateur est hors ligne.
 * - `IN_GAME` : L'utilisateur est en jeu.
 */
export const USER_ONLINE_STATUS = {
	ONLINE: 'online',
	OFFLINE: 'offline',
	IN_GAME: 'in-game',
} as const;

/**
 * Définit les actions pouvant être effectuées sur une demande d'ami.
 * Utilisées dans les notifications.
 */
export const FRIEND_REQUEST_ACTIONS = {
	ADD: 'add',
	ACCEPT: 'accept',
	DECLINE: 'decline',
	DELETE: 'delete',
	BLOCK: 'block',
	UNBLOCK: 'unblock',
	UNFRIEND: 'unfriend',
	CANCEL: 'cancel',
} as const;


/**
 * Liste des types de notification autorisées.
 */
export const NOTIFICATION_TYPES: NotificationType[] = [
	...Object.values(FRIEND_REQUEST_ACTIONS),
	...Object.values(USER_ONLINE_STATUS),
	// à compléter si d'autres types de notifications sont ajoutées
];

/**
 * Liste des champs de tri et des ordres autorisés
 * pour les requêtes utilisateurs.
 */

export enum UserSortFieldEnum {
	id = 'id',
	username = 'username',
	registration = 'registration',
	game_played = 'game_played',
	game_win = 'game_win',
	game_loose = 'game_loose',
	time_played = 'time_played',
	n_friends = 'n_friends',
	status = 'status',
	is_deleted = 'is_deleted',
	register_from = 'register_from',
}

export enum SortOrderEnum {
	ASC = 'ASC',
	DESC = 'DESC',
}

export const USER_FILTERS = {
	STATUS: Object.values(USER_ONLINE_STATUS),
	LEVEL: { MIN: 0, MAX: 100 },
	FRIENDS_ONLY: ['true', 'false']
} as const;
