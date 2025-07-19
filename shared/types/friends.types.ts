import { DB_CONST } from '../config/constants.config';

export interface FriendsModel {
	user1Id: number;
	user2Id: number;
	status: FriendStatus;
	isBlocked: number;
	date: string;
}

export type FriendStatus = 
	typeof DB_CONST.FRIENDS.STATUS[keyof typeof DB_CONST.FRIENDS.STATUS];
