import { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import { PositionObj, GameData, Player } from '../shared/types/game.types'
// import { Player } from '../types/game.types'

const clamp = (val: number, min: number, max: number) => { return Math.min(Math.max(val, min), max) };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// export class PlayerBar {
//     public x: number;
//     public y: number;
//     public moveUnit: number;
//     // public inputUp: boolean;
//     // public inputDown: boolean;

//     public moveUp(): void {
//         if (this.y + this.moveUnit - (this.h / 2) > 0)
//             this.y -= this.moveUnit;
//     };

//     public moveDown(): void {
//         if (this.y + this.moveUnit + (this.h / 2) < this.ctx.canvas.clientHeight)
//             this.y += this.moveUnit;
//     };

//     // private setInputUp(value: boolean): void {
//     //     this.inputUp = value;
//     // };

//     // private setInputDown(value: boolean): void {
//     //     this.inputDown = value;
//     // };

//     constructor() {
//         this.x = 0;
//         this.y = 0;
//         this.moveUnit = 0.1;
//         // this.inputUp = false;
//         // this.inputDown = false;
//     }
// };

export class Ball {
    public x: number;
    public y: number;
    public vAngle: number;
    public vSpeed: number;
    public radius: number;

    // draw() {
        // this.ctx.beginPath();
        // this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
        // this.ctx.closePath();
        // this.ctx.fillStyle = "rgba(0, 0, 255)";
        // this.ctx.fill();
    // };
    move() {
        this.x += Math.cos(this.vAngle * 0.0174533) * this.vSpeed;
        this.y += Math.sin(this.vAngle * 0.0174533) * this.vSpeed;
    };
    verticalCollision() {
        this.vAngle = (360 - this.vAngle) % 360;
    }
    horizontalCollision() {
        this.vAngle = (180 - this.vAngle + 360) % 360;
    }
    isGoingRight() {
        return ((this.vAngle >= 0 && this.vAngle < 90) || (this.vAngle >= 270 && this.vAngle <= 360));
    };
    isGoingLeft() {
        return (this.vAngle >= 90 && this.vAngle < 270);
    };
    isGoingUp() {
        return (this.vAngle >= 180 && this.vAngle < 360);
    }
    isGoingDown() {
        return (this.vAngle >= 0 && this.vAngle < 180);
    }
    // public checkPlayerCollision(players: PlayerBar[]): boolean {
    //     for (const player of players) {
    //         const playerBounds = {
    //             xRange: { x0: player.x - player.w / 2, x1: player.x + player.w / 2 },
    //             yRange: { y0: player.y - player.h / 2, y1: player.y + player.h / 2 }
    //         }
    //         const xClamp = clamp(this.x, playerBounds.xRange.x0, playerBounds.xRange.x1);
    //         const yClamp = clamp(this.y, playerBounds.yRange.y0, playerBounds.yRange.y1);
    //         if (Math.sqrt(Math.pow(this.x - xClamp, 2) + (Math.pow(this.y - yClamp, 2))) <= this.radius / 2)
    //             return (true);
    //     }
    //     return (false);
    // };

    constructor() {
        this.x = 0;
        this.y = 0;
        this.vAngle = 30;
        this.vSpeed = 0.01;
        this.radius = 0.05;
    }
};

export class GameInstance {
    private players: Player[] = [];
    private ball = new Ball();
    private playersCount: number = 0;
    private gameStarted: boolean = false;

    private async gameLoop(): Promise<void> {
        const fps = 1000 / 60;
        let then = Date.now();
        const startTime = then;
        while (this.gameStarted == true)
        {
            this.ball.move();
            const now = Date.now();
            if (now - then < fps)
                await sleep(fps - (now - then));
            this.sendGameUpdate();
            // if (this.ball.x <= 1 || this.ball.x >= 1)
                // this.gameStarted = false;
            then = Date.now();
        }
            // console.log("update!a")
        // const collision: boolean = this.ball.checkPlayerCollision(this.players);
        // if (collision && (this.ball.isGoingRight() || this.ball.isGoingLeft())) {
        //     console.log("HORIZONTAL");
        //     this.ball.horizontalCollision();
        // }
        // else if (collision && (this.ball.isGoingUp() || this.ball.isGoingDown())) {
        //     console.log("VERTICAL");
        //     this.ball.verticalCollision();
        // }
        // if (this.playersCount == 2 && (this.ball.y >= 1 || this.ball.y <= 0)) {
        //     this.ball.verticalCollision();
        // }
        // if (this.ball.x + this.ball.radius < -0.9 || this.ball.x + this.ball.radius > 0.9) {
        //     this.gameStarted = false;
        // }
    };

    private initSizePos(): void {
        if (this.playersCount == 2) {
            this.players[0].pos.x = -1;
            this.players[0].pos.y = this.players[1].pos.y = 0;
            this.players[1].pos.x = 1;
        }
    };

    public initGame(): void {
        this.initSizePos();
        // await this.counter();
        // this.clearFillStyle = 0.3;
        // this.attachListeners();
        this.gameStarted = true;
        this.gameLoop();
        // this.frameReq = requestAnimationFrame(this.gameLoop.bind(this));
    };

    private sendGameUpdate() {
        const gameUpdate = new GameData(this.players, this.ball);
        for (const player of this.players) {
            player.webSocket.send(JSON.stringify(gameUpdate));
        }
    };
    
    constructor(playersCount: number, players: Player[]) {
        // const inputs: string[] = ["w", "s", "ArrowUp", "ArrowDown"];
        this.playersCount = playersCount;
        this.players = players;
        }
    };

function startGame(p1: Player, p2: Player) {
    p1.webSocket.send(JSON.stringify({
        type: "start",
        ID: p1.playerID,
    }));
    p2.webSocket.send(JSON.stringify({
        type: "start",
        ID: p2.playerID,
    }));
    p1.webSocket.send(`Game started! you are player two with id ${p1.playerID}`);
    p2.webSocket.send(`Game started! you are player two with id ${p2.playerID}`);
    let players: Player[] = []; 
    players.push(p1);
    players.push(p2);
    const game = new GameInstance(2, players);
    game.initGame();
} 

export async function gameRoutes(app: FastifyInstance) {
  app.get('/ws/multiplayer', { websocket: true }, (connection: any, req: any) => {
    const allPlayers: Player[] = app.lobby.allPlayers;
    const newPlayer = new Player(allPlayers.length, connection);
    console.log(newPlayer);
    if (allPlayers.length != 0) {
        startGame(allPlayers[0], newPlayer);   // this is wrong and needs to be changed
    } else
        allPlayers.push(new Player(allPlayers.length, connection));
    connection.on('message', (message: string) => {
        const player: PositionObj = JSON.parse(message); 
    });
    connection.on('close', () => {
      console.log('Connection closed');
    });

  });
}