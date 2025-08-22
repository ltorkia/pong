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

/**
 * Formatte une date en une chaîne de caractères relative, en fonction de la
 * date actuelle. Si la date est nulle, renvoie "User has never logged in".
 *
 * Si la date est inférieure à 1 minute, renvoie "just now".
 * Si la date est inférieure à 1 heure, renvoie "X minute(s) ago".
 * Si la date est inférieure à 1 jour, renvoie "X heure(s) Y minute(s) ago".
 * Si la date est inférieure à 15 jours, renvoie "X days ago".
 * Sinon, renvoie la date au format "DD MMM YYYY" (par exemple, "01 Jan 2022").
 *
 * @param {string | null} dateStr - La date à formatter, au format ISO 8601.
 * @returns {string} La date formatée.
 */
export function formatRelativeDate(dateStr: string | null): string {
	if (!dateStr) 
		return 'never';

	// Forcer l'interprétation en UTC en ajoutant 'Z'
	const date = new Date(dateStr + 'Z');
	const now = new Date();

	const diffMs = Math.abs(now.getTime() - date.getTime());
	const diffMinutes = Math.floor(diffMs / (1000 * 60));
	const diffHours = Math.floor(diffMinutes / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffMinutes < 1) return 'just now';
	if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
	if (diffHours < 24) {
		const remainingMinutes = diffMinutes % 60;
		if (remainingMinutes === 0) {
			return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
		}
		return `${diffHours} hour${diffHours > 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''} ago`;
	}

	if (diffDays === 1) return 'yesterday';
	if (diffDays <= 14) return `${diffDays} days ago`;

	return date.toLocaleDateString('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	});
}