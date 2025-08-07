import { Player } from '../../shared/types/game.types'

export type StartGame = {
    type: "start",
    playerID: number,
    gameID: number,
};

export type StartTournament = {
    type: "start_tournament",
    playerID: number,
    tournamentID: number,
};

export type StartSignal = {
    type: "start_signal",
}

export type DismantleTournament = {
    type: "dismantle_tournament",
    playerID: number,
    tournamentID: number,
};

export type TournamentLobbyUpdate = {
    type: "tournament_lobby_update",
    players: Player[],
};

export type PlayerReadyUpdate = {
    type: "player_ready_update",
    playerID: number,
    tournamentID: number,
    ready: boolean,
};