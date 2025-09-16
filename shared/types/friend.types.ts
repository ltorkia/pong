import { DB_CONST } from '../config/constants.config';
import { UserStatus } from './user.types';

export interface FriendModel {
	id: number;
	requesterId: number;
	username: string;
	avatar: string;
	beginLog: string;
	endLog: string;
	tournament: number;
	friendStatus: FriendStatus;
	blockedBy: number;
	challengedBy: number;
	meetDate: string;
	status: UserStatus;
	gamePlayed: number;
	gameWin: number;
	gameLoose: number;
	timePlayed: number;
	isDesactivated: number;
}

export type FriendStatus = 
	typeof DB_CONST.FRIENDS.STATUS[keyof typeof DB_CONST.FRIENDS.STATUS];

export interface ChatModel {
	id: number;
	senderId: number;
	receiverId: number;
	timeSend: string;
	message: string;
}