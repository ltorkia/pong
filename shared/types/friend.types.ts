import { DB_CONST } from '../config/constants.config';

export interface FriendModel {
	id: number;
	username: string;
	avatar: string;
	beginLog: string;
	endLog: string;
	// user1Id: number;
	// user2Id: number;
	friendStatus: FriendStatus;
	isBlocked: number;
	date: string;
}

export type FriendStatus = 
	typeof DB_CONST.FRIENDS.STATUS[keyof typeof DB_CONST.FRIENDS.STATUS];
