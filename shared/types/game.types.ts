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
    public webSocket: WebSocket | undefined;
    public inGame: boolean;
    public ready: boolean;
    public pos = { x: 0, y: 0 };
    public height: number;
    public width: number;
    public inputUp: boolean = false;
    public inputDown: boolean = false;

    move() {
        if (this.inputUp == true && this.pos.y + (this.height / 2) + 0.02 < 1)
            this.pos.y += 0.02;
        else if (this.inputDown == true && this.pos.y - (this.height / 2) - 0.02 > -1)
            this.pos.y -= 0.02;
    }

    constructor(ID: number, webSocket: WebSocket | undefined) {
        this.ID = ID;
        this.webSocket = webSocket;
        this.inGame = false;
        this.ready = false;
        this.width = 0.02;
        this.height = 0.30;
    }
}

export class GameData {
    type: string = "GameData";
    ball: PositionObj;
    players: { id: number, pos: { x: number, y: number } }[] = [];

    constructor(players: Player[], ball: { x: number, y: number }) {
        for (const player of players) {
            this.players.push({
                id: player.ID,
                pos: { x: player.pos.x, y: player.pos.y }
            });
        }
        this.ball = { x: ball.x, y: ball.y };
    }
}

export class Tournament {
    public name: string;
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