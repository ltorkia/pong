import { FRIEND_REQUEST_ACTIONS } from '../config/constants.config';

export interface NotificationModel {
	id: number;
	from: number;
	to: number;
	type: FriendRequestAction;
	content?: string;
	createdAt?: string;
	status?: number;
};

export interface NotifResponse {
	notif?: NotificationModel;
	notifs?: NotificationModel[];
	errorMessage: string;
}
export type FriendRequestAction =
	typeof FRIEND_REQUEST_ACTIONS[keyof typeof FRIEND_REQUEST_ACTIONS];