import { Player } from '../../shared/types/game.types'

export type startGame = {
    type: "start",
    playerID: number,
    gameID: number,
};

export type TournamentLobbyUpdate = {
    type: "tournament_lobby_update",
    players: Player[],
}