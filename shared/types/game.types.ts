export type PositionObj = {
    x: number, 
    y: number
};

export class Player {
    public playerID: number;
    public webSocket: WebSocket;
    public inGame: boolean;
    public pos = { x: 0, y: 0 };
    public inputUp: boolean = false;
    public inputDown: boolean = false;
    
    constructor(playerID: number, webSocket: WebSocket) {
        this.playerID = playerID;
        this.webSocket = webSocket;
        this.inGame = false;
    } 
}

export class GameData {
    type: string = "GameData";
    ball: PositionObj;
    players: {id: number, pos: {x: number, y: number}}[] = [];

    constructor(players: Player[], ball: {x: number, y: number}) {
        for (const player of players) {
            this.players.push({
                id: player.playerID, 
                pos: {x: player.pos.x, y: player.pos.y}
            });
        }
        this.ball = {x: ball.x, y: ball.y};
    }
}