import { Player } from './game.types';
import { SafeUserModel} from './user.types';
import { GAME_TYPE_MSG, TOURNAMENT_TYPE_MSG } from '../config/constants.config';

export type StartGame = {
    type: "start_game",
    otherPlayer?: SafeUserModel, //a modifier
    userId1?: SafeUserModel,
    userId2?: SafeUserModel,
    gameID: number,
    mode: string
};

export type StartTournament = { // master client request
    type: "start_tournament",
    playerID: number,
    tournamentID: number,
};

export type StartTournamentSignal = { // server answers to all other clients
    type: "start_tournament_signal",
}

export type DismantleTournament = {
    type: "dismantle_tournament",
    playerID: number,
    tournamentID: number,
};

export type DismantleSignal = {
    type: "dismantle_signal",
}

export type TournamentLobbyUpdate = {
    type: "tournament_lobby_update",
    playerID: number,
    tournamentID: number,
    players: Player[],
};

export type PlayerReadyUpdate = {
    type: "player_ready_update",
    playerID: number,
    tournamentID: number,
    ready: boolean,
};

export type MatchMakingReq = {
    type: "matchmaking_request",
    playerID: number,
    tournamentID?: number,
    invitedId?: number,
    inviterId?: number,
    gameId?: number
};

export type decountgame = {
    type: "decount_game",
    message: number, //pour le decompte
    gameID: number,
}

export type GameTypeMsg =
    typeof GAME_TYPE_MSG[keyof typeof GAME_TYPE_MSG];
export type TournamentTypeMsg =
    typeof TOURNAMENT_TYPE_MSG[keyof typeof TOURNAMENT_TYPE_MSG];
export type AllGameMsgType = GameTypeMsg | TournamentTypeMsg;