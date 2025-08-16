import { FRIEND_REQUEST_ACTIONS } from '../config/constants.config';

export interface NotificationModel {
	id: number;
	from: number;
	to: number;
	type: NotificationType;
	content: string | null;
	createdAt: string;
	status: number;
};

export type NotificationType = FriendRequestAction;

export type FriendRequestAction =
	typeof FRIEND_REQUEST_ACTIONS[keyof typeof FRIEND_REQUEST_ACTIONS];