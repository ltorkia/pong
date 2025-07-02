// ===========================================
// USER TYPES
// ===========================================
/**
 * Ce fichier contient les définitions de types pour représenter les informations relatives
 * à un utilisateur.
 * 
 * Les types définis dans ce fichier servent à définir la structure des données liées
 * à un utilisateur, comme son identifiant, son nom d'utilisateur, son adresse e-mail, etc.
 * 
 * Les types exportés sont utilisés dans les parties de l'application qui ont besoin de
 * connaître les informations relatives à un utilisateur.
 */

/**
 * Interface représentant le modèle de base de l'utilisateur.
 * Contient toutes les informations internes d'un utilisateur (excepté l'email).
 * 
 * Utilisée pour les opérations internes où l'email n'est pas nécessaire.
 */
export interface SafeUserModel {
	id: number;
	username: string;
	avatar: string;
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

/**
 * Interface représentant le modèle complet de l'utilisateur.
 * Contient toutes les informations, y compris les données sensibles (email).
 * 
 * Utilisée pour les communications avec l'API et la gestion complète du profil.
 * Reçue après login/register et pour les opérations sur son propre profil.
 */
export interface UserModel extends SafeUserModel {
	email: string;
}

/**
 * Interface représentant un utilisateur pour l'affichage public.
 * Contient uniquement les informations non-sensibles visibles par d'autres utilisateurs.
 * 
 * Utilisée pour les listes d'utilisateurs, classements, profils publics, etc.
 */
export interface PublicUser {
	id: number;
	username: string;
	avatar: string;
	game_played: number;
	game_win: number;
	game_loose: number;
	time_played: number;
	n_friends: number;
}

/**
 * Alias de type pour représenter un utilisateur qui peut être null.
 * Utile dans les cas de déconnexion ou les vérifications de session.
 */
export type OptionalUser = SafeUserModel | null;

/**
 * Interface représentant les informations de base d'un utilisateur.
 * Contient l'identifiant, le nom d'utilisateur, l'adresse e-mail et l'avatar.
 */
export interface UserBasic {
	id:number;
	username: string;
	email: string;
	avatar: string;
}

/**
 * Interface représentant un utilisateur avec son avatar.
 * Contient l'identifiant, le nom d'utilisateur et l'avatar.
 */
export interface UserWithAvatar {
	id:number;
	username: string;
	avatar: string;
}

/**
 * Interface représentant un ami d'un utilisateur.
 * Contient l'identifiant, le nom d'utilisateur, l'avatar et la dernière connexion.
 */
export interface Friends {
	id: number;
	username: string;
	avatar?: string | null;
	lastlog: number;
}

