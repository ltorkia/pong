import { FRIEND_REQUEST_ACTIONS, NOTIFICATION_TYPES, USER_ONLINE_STATUS } from '../config/constants.config';
import { NotificationType, FriendRequestAction, UserOnlineStatus } from '../types/notification.types';
import type { NotificationModel } from '../types/notification.types';
/**
 * Vérifie si `type` est un type de notification valide.
 *
 * Un type de notification valide est un type de notification qui appartient à
 * la liste des types de notifications valides définie dans `NOTIFICATION_TYPES`.
 *
 * @param {string} type - Le type de notification à vérifier.
 * @returns {type is NotificationType} - `true` si `type` est un type de notification
 * valide, `false` sinon.
 */
export function isValidNotificationType(type: string): type is NotificationType {
	return NOTIFICATION_TYPES.includes(type as NotificationType);
}

/**
 * Vérifie si `type` est un type de demande d'ami valide.
 *
 * Un type de demande d'ami valide est un type de demande d'ami qui appartient à
 * la liste des types de demandes d'ami valides définie dans `FRIEND_REQUEST_ACTIONS`.
 *
 * @param {string} type - Le type de demande d'ami à vérifier.
 * @returns {type is FriendRequestAction} - `true` si `type` est un type de demande
 * d'ami valide, `false` sinon.
 */
export function isFriendRequestAction(type: string): type is FriendRequestAction {
	return Object.values(FRIEND_REQUEST_ACTIONS).includes(type as FriendRequestAction);
}

/**
 * Vérifie si `type` est un type d'état en ligne valide.
 *
 * Un type d'état en ligne valide est un type d'état en ligne qui appartient à
 * la liste des types d'état en ligne valides définie dans `USER_ONLINE_STATUS`.
 *
 * @param {string} type - Le type d'état en ligne à vérifier.
 * @returns {type is UserOnlineStatus} - `true` si `type` est un type d'état
 * en ligne valide, `false` sinon.
 */
export function isUserOnlineStatus(type: string): type is UserOnlineStatus {
	return Object.values(USER_ONLINE_STATUS).includes(type as UserOnlineStatus);
}

/**
 * Vérifie si `obj` est un objet de type `NotificationModel`.
 *
 * Un objet de type `NotificationModel` est un objet qui a les propriétés suivantes :
 * - `id` : un nombre entier.
 * - `from` : un nombre entier.
 * - `to` : un nombre entier.
 * - `createdAt` : une chaîne de caractères.
 * - `read` : un nombre entier.
 * - `type` : un type de notification valide.
 *
 * @param {any} obj - L'objet à vérifier.
 * @returns {obj is NotificationModel} - `true` si `obj` est un objet de type `NotificationModel`,
 * `false` sinon.
 */
export function isNotificationModel(obj: any): obj is NotificationModel {
	return (
		typeof obj === "object" &&
		obj !== null &&
		typeof obj.id === "number" &&
		typeof obj.from === "number" &&
		typeof obj.to === "number" &&
		typeof obj.createdAt === "string" &&
		typeof obj.read === "number" &&
		NOTIFICATION_TYPES.includes(obj.type as NotificationType)
	);
}