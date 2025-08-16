import { NOTIFICATION_TYPES } from '../config/constants.config';
import { NotificationType } from '../types/notification.types';

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