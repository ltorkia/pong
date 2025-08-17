import { DB_CONST, IMAGE_CONST } from '../config/constants.config';
import { User } from '../models/user.model';
import { AppNotification } from '../models/notification.model';

// ===========================================
// USER TYPES
// ===========================================
/**
 * Ce fichier contient les définitions de types pour représenter les informations relatives
 * à un utilisateur.
 */

/**
 * Type d'état d'un utilisateur.
 */
export type UserStatus = 
	typeof DB_CONST.USER.STATUS[keyof typeof DB_CONST.USER.STATUS];

/**
 * Type de méthode d'inscription.
 */
export type RegisterMethod =
	typeof DB_CONST.USER.REGISTER_FROM[keyof typeof DB_CONST.USER.REGISTER_FROM];

/**
 * Type de méthode de double authentification.
 */
export type TwoFaMethod =
	typeof DB_CONST.USER.ACTIVE_2FA[keyof typeof DB_CONST.USER.ACTIVE_2FA];

/**
 * Type MIME des formats d'image supportés pour les avatars.
 */

export type AvatarMimeType = keyof typeof IMAGE_CONST.EXTENSIONS;  // 'image/jpeg' | 'image/png' | ...
export type AvatarExtension = typeof IMAGE_CONST.EXTENSIONS[AvatarMimeType];  // '.jpeg' | '.png' | ...

/**
 * Interface représentant le modèle de base de l'utilisateur.
 * Contient toutes les informations excepté les données sensibles.
 * 
 * Utilisé pour: opérations internes où l'email n'est pas nécessaire
 * et la gestion complète du profil, les classements etc.
 */
export interface SafeUserModel {
	id: number;
	username: string;
	avatar: string;
	registration: string;
	beginLog: string;
	endLog: string;
	tournament: number;
	gamePlayed: number;
	gameWin: number;
	gameLoose: number;
	timePlayed: number;
	nFriends: number;
	status: UserStatus;
	isDesactivated: number;
	notifications?: AppNotification[];
}

/**
 * Interface représentant le modèle complet de l'utilisateur.
 * Contient toutes les informations, y compris les données sensibles (email etc.).
 * 
 * Utilisée pour les communications avec l'API et la gestion complète du profil.
 * Reçue après login/register et pour les opérations sur son propre profil.
 */
export interface UserModel extends SafeUserModel {
	email: string;
	registerFrom: RegisterMethod;
	active2Fa: TwoFaMethod;
}

/**
 * Interface représentant les informations de base d'un utilisateur.
 * Contient l'identifiant, le nom d'utilisateur, l'adresse e-mail et l'avatar.
 * Utilisée pour les opérations internes simples.
 */
export interface UserBasic {
	id:number;
	username: string;
	email: string;
	avatar: string;
}

/**
 * Interface représentant les informations de base d'un utilisateur sans données sensibles.
 * Contient l'identifiant, le nom d'utilisateur, et l'avatar.
 * Utilisée pour les opérations publiques simples.
 */
export interface SafeUserBasic {
	id:number;
	username: string;
	avatar: string;
}

/**
 * Contient le strict minimum d'informations pour l'affichage public.
 */
export interface PublicUser {
	id: number;
	username: string;
	avatar: string;
	beginLog: string;
	endLog: string;
	status: UserStatus;
}

/**
 * Alias de type pour représenter un utilisateur qui peut être null.
 * Utile dans les cas de déconnexion ou les vérifications de session.
 */
export type OptionalUser = SafeUserModel | null;

/**
 * Interfaces et types pour les requêtes utilisateurs avec pagination et paramètres de tri.
 */

export interface PaginationInfos {
	currentPage: number;
	totalPages: number;
	totalUsers: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	limit: number;
}
export interface PaginatedUsers {
	users: SafeUserModel[] | User[];
	pagination: PaginationInfos;
}
export type SortOrder = 'ASC' | 'DESC';
export type UserSortField = 'id' | 'username' | 'registration' | 'game_played' | 'game_win' | 'game_loose' | 'time_played' | 'n_friends' | 'status' | 'is_deleted' | 'register_from';
export type UserSearchField = UserSortField;
