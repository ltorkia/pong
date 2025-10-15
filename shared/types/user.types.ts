import { DB_CONST, IMAGE_CONST, USER_ONLINE_STATUS, UserSortFieldEnum, SortOrderEnum } from '../config/constants.config';
import { User } from '../models/user.model';
import { AppNotification } from '../models/notification.model';
import { FriendStatus } from '../types/friend.types';

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
	typeof USER_ONLINE_STATUS[keyof typeof USER_ONLINE_STATUS];

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
	registerFrom: RegisterMethod;
	isDesactivated: number;
	notifications?: AppNotification[];
	friendStatus?: FriendStatus | null;
	alias?: string;
	statusWin: 0 | 1 | null
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
	alias?: string;
	statusWin: 0 | 1 | null;
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
	incCurrUser?: boolean;
}
export interface PaginatedUsers {
	users: SafeUserModel[] | User[];
	pagination: PaginationInfos;
}

/**
 * Types pour les paramètres de recherche.
 */
export interface SearchParams {
	searchTerm?: string;
	status?: UserStatus;
	level?: number;
	friendsOnly?: boolean;
}
export interface UsersPageParams {
	page: string;
	limit: string;
}
export type UserSortField = keyof typeof UserSortFieldEnum; // "id" | "username" | ... | "register_from"
export type SortOrder = keyof typeof SortOrderEnum; // "ASC" | "DESC"
