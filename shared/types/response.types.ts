import { UserModel } from './user.types';	// en rouge car dossier local 'shared' != dossier conteneur
import { NotificationModel } from './notification.types';
import { FriendModel } from './friend.types';
import { AppNotification } from '../models/notification.model';

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
 * Représente une réponse qui étend la structure de base avec un utilisateur optionnel.
 */
export type UserResponse = BasicResponse & {
	user?: UserModel;
};

/**
 * Représente la réponse retournée après une authentification réussie.
 * Étend le type `UserResponse` et peut inclure une URL d'authentification OTP (QR code) optionnelle
 * si la requête a réussi.
 */
export type AuthResponse = UserResponse & {
	otpauth_url?: string;
};

/**
 * Type de réponse pour les requêtes liées aux notifications.
 * 
 * Surcharge de BasicResponse:
 * Contient éventuellement un objet `notification` représentant la notification concernée.
 *
 * @property {NotificationModel} [notification] - Les données de la notification, si disponibles.
 */
export type NotifResponse = BasicResponse & {
	notif?: NotificationModel | AppNotification;
	notifs?: NotificationModel[] | AppNotification[];
};

/**
 * Type de réponse pour les requêtes liées aux amis.
 * 
 * Surcharge de NotifResponse pour ajouter la notification liée à la demande d'ami.
 * Contient un objet `relation` représentant la relation.
 */
export type FriendResponse = NotifResponse & {
	relation?: FriendModel;
};