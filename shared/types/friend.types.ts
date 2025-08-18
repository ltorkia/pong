import { DB_CONST } from '../config/constants.config';

export interface FriendModel {
	id: number;
	requesterId: number;
	username: string;
	avatar: string;
	beginLog: string;
	endLog: string;
	friendStatus: FriendStatus;
	blockedBy: number;
	date: string;
}

export type FriendStatus = 
	typeof DB_CONST.FRIENDS.STATUS[keyof typeof DB_CONST.FRIENDS.STATUS];
