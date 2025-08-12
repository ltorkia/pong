import { DB_CONST } from '../config/constants.config';

export interface GameModel {
    id: number;
    nParticipants: number;
    begin: string;
    end: string;
    tournament: number;
    status: GameStatus;
    temporaryResult: number;
}

export type GameStatus =
    typeof DB_CONST.GAME.STATUS[keyof typeof DB_CONST.GAME.STATUS];

export type PositionObj = {
    x: number,
    y: number
};

export class Player {
    public ID: number;
    public inGame: boolean;
    public ready: boolean;
    public matchMaking: boolean;
    public pos = { x: 0, y: 0 };
    public height: number;
    public width: number;
    public inputUp: boolean = false;
    public inputDown: boolean = false;
    public alias?: string;

    move() {
        if (this.inputUp == true && this.pos.y + (this.height / 2) + 0.02 < 1)
            this.pos.y += 0.02;
        else if (this.inputDown == true && this.pos.y - (this.height / 2) - 0.02 > -1)
            this.pos.y -= 0.02;
    }

    constructor(ID: number) {
        this.ID = ID;
        this.inGame = false;
        this.ready = false;
        this.matchMaking = false;
        this.width = 0.02;
        this.height = 0.40;
    }
}

export class GameData {
    type: string = "GameData";
    ball: PositionObj;
    score: number[];
    players: { id: number, pos: { x: number, y: number } }[] = [];

    constructor(players: Player[], ball: { x: number, y: number }, score: number[]) {
        for (const player of players) {
            this.players.push({
                id: player.ID,
                pos: { x: player.pos.x, y: player.pos.y }
            });
        }
        this.ball = { x: ball.x, y: ball.y };
        this.score = score;
    }
}

export class Tournament {
    public name: string;
    public alias?: string;
    public maxPlayers: number;
    public ID?: number;
    public masterPlayerID?: number;
    public isStarted?: boolean;
    public players: Player[] = [];

    constructor(name: string, maxPlayers: number, ID?: number, masterPlayerID?: number, isStarted?: boolean) {
        this.name = name;
        this.maxPlayers = maxPlayers;
        this.ID = ID ?? 0;
        this.masterPlayerID = masterPlayerID ?? 0;
        this.isStarted = isStarted ?? true;
    }
}