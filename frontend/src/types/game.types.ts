import { GameInterface, TournamentInterface } from "../shared/types/game.types";
import { Player } from "../shared/types/game.types";

export class Tournament implements TournamentInterface {
    name: string;
    alias?: string;
    maxPlayers: number;
    ID: number;
    masterPlayerID?: number;
    isStarted?: boolean;
    stageOneGames?: GameInterface[] | undefined;
    stageTwoGames?: GameInterface[] | undefined;
    players?: Player[]

    constructor(name: string, maxPlayers: number, ID: number, masterPlayerID?: number,
        stageOneGames?: Game[], stageTwoGames?: Game[],
        isStarted?: boolean, players?: Player[]) {
        this.name = name;
        this.maxPlayers = maxPlayers;
        this.ID = ID;
        this.masterPlayerID = masterPlayerID ?? 0;
        this.isStarted = isStarted ?? true;
        this.stageOneGames = stageOneGames ?? undefined;
        this.stageTwoGames = this.stageTwoGames ?? undefined;
        this.players = players
    }
}

export class TournamentLocal implements TournamentInterface {
    players: Player[];
    masterPlayerID: number;
    maxPlayers: number;
    stageOne?: GameInterface[] | undefined;
    stageTwo?: GameInterface | undefined;
    winner: Player | undefined;

    constructor(maxPlayers: number, winner: Player, masterPlayerID: number, players: Player[],
        stageOne?: Game[], stageTwo?: Game[]
    ) {
        this.maxPlayers = maxPlayers;
        this.masterPlayerID = masterPlayerID;
        this.players = players;
        this.stageOne = stageOne ?? undefined;
        this.stageTwo = stageTwo ?? undefined;
        this.winner = winner;
    }
}

export class Game implements GameInterface {
    duration?: number;
    gameIDforDB: number;
    players: Player[];
    playersCount: number;
    gameStarted: boolean;
    isOver: boolean;
    score: number[];

    constructor(players: Player[], gameIDforDB: number, playersCount: number, gameStarted: boolean, isOver: boolean, score: number[]) {
        this.players = players;
        this.gameIDforDB = gameIDforDB;
        this.playersCount = playersCount;
        this.gameStarted = gameStarted;
        this.score = score;
        this.isOver = isOver;
    }
}