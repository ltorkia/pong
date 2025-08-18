import { FRIEND_REQUEST_ACTIONS } from '../config/constants.config';

export interface NotificationModel {
	id: number;
	from: number;
	to: number;
	type: NotificationType;
	toType?: NotificationType;
	content: string | null;
	createdAt: string;
	read: number;
};

export type NotificationType = FriendRequestAction;

export type FriendRequestAction =
	typeof FRIEND_REQUEST_ACTIONS[keyof typeof FRIEND_REQUEST_ACTIONS];