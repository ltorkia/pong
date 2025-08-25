import { Player } from './game.types'

export type StartGame = {
    type: "start_game",
    gameID: number,
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
}