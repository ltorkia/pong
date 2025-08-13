import { GameInterface, TournamentInterface } from "../../../shared/types/game.types";
import { Player } from "../../../shared/types/game.types";

export class Tournament implements TournamentInterface {
    name: string;
    alias?: string;
    maxPlayers: number;
    ID: number;
    masterPlayerID?: number;
    isStarted?: boolean;
    games?: GameInterface[] | undefined;
    players?: Player[]

    constructor(name: string, maxPlayers: number, ID: number, masterPlayerID?: number, games?: Game[], isStarted?: boolean, players?: Player[]) {
        this.name = name;
        this.maxPlayers = maxPlayers;
        this.ID = ID;
        this.masterPlayerID = masterPlayerID ?? 0;
        this.isStarted = isStarted ?? true;
        this.games = games ?? undefined;
        this.players = players
    }
}

export class Game implements GameInterface {
    duration?: number;
    players: Player[];
    playersCount: number;
    gameStarted: boolean;
    score: number[];

    constructor(players: Player[], playersCount: number, gameStarted: boolean, score: number[]) {
        this.players = players;
        this.playersCount = playersCount;
        this.gameStarted = gameStarted;
        this.score = score;
    }
}