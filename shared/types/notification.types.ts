import { FRIEND_REQUEST_ACTIONS, USER_ONLINE_STATUS } from '../config/constants.config';

export interface NotificationModel {
	id: number;
	from: number;
	to: number;
	type: NotificationType;
	toType?: NotificationType;
	content?: string | null;
	createdAt: string | null;
	read: number;
};

export type FriendRequestAction =
	typeof FRIEND_REQUEST_ACTIONS[keyof typeof FRIEND_REQUEST_ACTIONS];

export type UserOnlineStatus =
	typeof USER_ONLINE_STATUS[keyof typeof USER_ONLINE_STATUS];

export type NotificationType = FriendRequestAction | UserOnlineStatus;