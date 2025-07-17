export type PositionObj = {
    x: number, 
    y: number
};

export class Player {
    public playerID: number;
    public webSocket: WebSocket;
    public pos = { x: 0, y: 0 };

    constructor(playerID: number, webSocket: WebSocket) {
        this.playerID = playerID;
        this.webSocket = webSocket;
    } 
}

export class GameData {
    type: string = "GameData";
    players: PositionObj[] = [];
    ball: PositionObj;

    constructor(players: Player[], ball: {x: number, y: number}) {
        for (const player of players) {
            this.players.push({x: player.pos.x, y: player.pos.y});
        }
        this.ball = {x: ball.x, y: ball.y};
    }
}