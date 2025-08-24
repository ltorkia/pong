import { FriendStatus, FriendModel } from '../shared/types/friend.types';
import { FriendRequestAction } from '../shared/types/notification.types';
import { DB_CONST, FRIEND_REQUEST_ACTIONS } from '../shared/config/constants.config';

/**
 * Vérifie si l'action demandée (accept, block, unblock, decline, cancel) est valide
 * par rapport au statut de la relation actuelle (pending, accepted, blocked).
 *
 * @param {FriendRequestAction} action - L'action demandée
 * @param {FriendStatus} friendStatus - Le statut de la relation actuelle
 * @returns {boolean} - true si l'action est valide, false sinon
 */
export function isFriendRequestValid(action: FriendRequestAction, friendStatus: FriendStatus): boolean {
	switch (action) {
		case FRIEND_REQUEST_ACTIONS.ACCEPT:
		case FRIEND_REQUEST_ACTIONS.DECLINE:
		case FRIEND_REQUEST_ACTIONS.CANCEL:
			return friendStatus === DB_CONST.FRIENDS.STATUS.PENDING;
		case FRIEND_REQUEST_ACTIONS.BLOCK:
		case FRIEND_REQUEST_ACTIONS.UNFRIEND:
			return friendStatus === DB_CONST.FRIENDS.STATUS.ACCEPTED;
		case FRIEND_REQUEST_ACTIONS.UNBLOCK:
			return friendStatus === DB_CONST.FRIENDS.STATUS.BLOCKED;
		case FRIEND_REQUEST_ACTIONS.DELETE:
			return friendStatus === DB_CONST.FRIENDS.STATUS.ACCEPTED
				|| friendStatus === DB_CONST.FRIENDS.STATUS.PENDING;
		default:
			return false;
	}
}

/**
 * Vérifie si l'utilisateur actuel est autorisé à réaliser l'action demandée.
 *
 * @param {FriendRequestAction} action - L'action demandée
 * @param {FriendModel} relation - La relation actuelle
 * @param {number} currUserId - L'identifiant de l'utilisateur actuel
 * @returns {boolean} - true si l'utilisateur est autorisé, false sinon
 */
export function isValidRequester(action: FriendRequestAction, relation: FriendModel, currUserId: number): boolean {
	switch (action) {
		case FRIEND_REQUEST_ACTIONS.ACCEPT:
		case FRIEND_REQUEST_ACTIONS.DECLINE:
			return relation.requesterId != currUserId;
		case FRIEND_REQUEST_ACTIONS.UNBLOCK:
			return relation.blockedBy == currUserId;
		case FRIEND_REQUEST_ACTIONS.CANCEL:
			return relation.requesterId == currUserId;
		case FRIEND_REQUEST_ACTIONS.BLOCK:
		case FRIEND_REQUEST_ACTIONS.UNFRIEND:
		case FRIEND_REQUEST_ACTIONS.DELETE:
			return true;
		default:
			return false;
	}
}