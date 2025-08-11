import { Player } from './game.types'
import { FRIEND_REQUEST_ACTIONS } from '../config/constants.config';

export type startGame = {
	type: "start",
	playerID: number,
	gameID: number,
};

export type TournamentLobbyUpdate = {
	type: "tournament_lobby_update",
	players: Player[],
}

export type FriendRequest = {
	action: FriendRequestAction,
	from: number,
	to: number,
}
export type FriendRequestAction =
	typeof FRIEND_REQUEST_ACTIONS[keyof typeof FRIEND_REQUEST_ACTIONS];