import { UserModel } from '../shared/types/user.types';	// en rouge car dossier local 'shared' != dossier conteneur

// ===========================================
// API TYPES
// ===========================================
/**
 * Types de réponse pour les requêtes API.
 *
 * Les types de réponse sont utilisés pour définir les types de
 * retour pour les fonctions qui font des requêtes API,
 * et pour définir les types de propriétés pour les objets
 * qui contiennent les données de la réponse.
 *
 * Les types de réponse sont exportés pour être utilisés
 * dans les parties de l'application qui font des requêtes API.
 */

/**
 * Type de base pour les réponses API.
 * 
 * Contient un booléen `success` qui indique si la requête a réussi,
 * un code de statut `statusCode` qui indique le code de statut de la requête,
 * un message `errorMessage` qui contient l'erreur si la requête a échoué,
 * un message `message` qui contient le message de confirmation si la requête a réussi,
 */
export type BasicResponse = {
	success?: boolean;
	statusCode?: number;
	errorMessage?: string;
	message?: string;
};

/**
 * Type de réponse pour les requêtes d'authentification.
 * 
 * Surcharge de BasicResponse:
 * Contient un booléen `success` qui indique si la requête a réussi,
 * un message `errorMessage` qui contient l'erreur si la requête a échoué,
 * un message `message` qui contient le message de confirmation si la requête a réussi,
 * et un objet `user` qui contient l'utilisateur connecté (avec email) si la requête a réussi.
 */
export type AuthResponse = BasicResponse & {
	user?: UserModel;
};