import { GameData, Player } from "../shared/types/game.types"

const DEG_TO_RAD = Math.PI / 180;

const clamp = (val: number, min: number, max: number) => { return Math.min(Math.max(val, min), max) };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class Ball {
    public x: number;
    public y: number;
    public vAngle: number;
    public vSpeed: number;
    public radius: number;

    move() {
        this.x += Math.cos(this.vAngle * DEG_TO_RAD) * this.vSpeed;
        this.y += Math.sin(this.vAngle * DEG_TO_RAD) * this.vSpeed;
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
    public checkPlayerCollision(players: Player[]): boolean {
        for (const player of players) {
            const playerBounds = {
                xRange: { x0: player.pos.x - player.width / 2, x1: player.pos.x + player.width / 2 },
                yRange: { y0: player.pos.y - player.height / 2, y1: player.pos.y + player.height / 2 }
            }
            const xClamp = clamp(this.x, playerBounds.xRange.x0, playerBounds.xRange.x1);
            const yClamp = clamp(this.y, playerBounds.yRange.y0, playerBounds.yRange.y1);
            if (Math.sqrt(Math.pow(this.x - xClamp, 2) + (Math.pow(this.y - yClamp, 2))) <= this.radius / 2)
                return (true);
        } 
        return (false);
    };
    constructor() {
        this.x = 0;
        this.y = 0;
        this.vAngle = 60;
        this.vSpeed = 0.01;
        this.radius = 0.03;
    }
};

export class GameInstance {
    private players: Player[] = [];
    private ball = new Ball();
    private playersCount: number = 0;
    private gameStarted: boolean = false;

    constructor(playersCount: number, players: Player[]) {
        // const inputs: string[] = ["w", "s", "ArrowUp", "ArrowDown"];
        this.playersCount = playersCount;
        this.players = players;
    }

    private async gameLoop(): Promise<void> {
        const fps = 1000 / 60;
        let then = Date.now();
        const startTime = then;
        while (this.gameStarted == true) {
            // console.log("angle ", this.ball.vAngle);
            this.ball.move();
            for (const player of this.players)
                player.move();
            const collision: boolean = this.ball.checkPlayerCollision(this.players);
            if (collision && (this.ball.isGoingRight() || this.ball.isGoingLeft())) {
                // console.log("HORIZONTAL");
                this.ball.horizontalCollision();
            }
            else if (collision && (this.ball.isGoingUp() || this.ball.isGoingDown())) {
                // console.log("VERTICAL");
                this.ball.verticalCollision();
            }
            // console.log("x: ", this.ball.x, "y :", this.ball.y);
            if (this.playersCount == 2 && (this.ball.y >= 1 || this.ball.y <= -1)) {
                // console.log("angle ", this.ball.vAngle);
                this.ball.verticalCollision();
            }
            // if (this.ball.x + this.ball.radius <= 1|| this.ball.x + this.ball.radius >= 1) {
            //     this.gameStarted = false;
            // }
            const now = Date.now();
            if (now - then < fps)
                await sleep(fps - (now - then));
            this.sendGameUpdate();
            then = Date.now();
        }
        console.log("GAME ENDEED");
        this.endGame();
        // console.log("update!a")
    };

    private initSizePos(): void {
        if (this.playersCount == 2) {
            this.players[0].pos.x = -1 + this.players[0].width / 2;
            this.players[0].pos.y = this.players[1].pos.y = 0;
            this.players[1].pos.x = 1 - this.players[0].width / 2;
            console.log("player width = ", this.players[0].width / 2);
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

    public endGame(): void {
        for (const player of this.players) {
            player.webSocket.send(JSON.stringify({
            type: "end",
        }));
        }
    }

    private sendGameUpdate() {
        const gameUpdate = new GameData(this.players, this.ball);
        for (const player of this.players) {
            player.webSocket.send(JSON.stringify(gameUpdate));
        }
    };

    public registerInput(playerID: number, key: string, status: boolean): void {
        // console.log("coucou")
        for (const player of this.players) {
            if (player.playerID == playerID) {
                if (key == "w" && player.inputUp != status) player.inputUp = status;
                else if (key == "s" && player.inputDown != status) player.inputDown = status;
            }
        }
    }

    public setGameStarted(started: boolean) {this.gameStarted = started};
};

export class Lobby {
    public allPlayers: Player[];
    public games: Game[];

    constructor() {
        this.allPlayers = [];
        this.games = [];
    }
}

export class Game {
	id: number;
	// status_win: boolean;
    players: Player[];
	duration: number;
    instance: GameInstance;

    constructor(id: number, duration: number, gameInstance: GameInstance, players: Player[]) {
        this.id = id;
        this.duration = duration;
        this.instance = gameInstance;
        this.players = players;
    }
}
