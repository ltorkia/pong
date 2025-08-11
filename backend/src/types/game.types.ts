import { GameData, Player, Tournament } from "../shared/types/game.types"

const DEG_TO_RAD = Math.PI / 180;

const MAX_SCORE = 3;

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
    reset() {
        this.x = 0;
        this.y = 0;
        this.vAngle = 60;
        this.vSpeed = 0.02;
        this.radius = 0.03;
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
        this.vSpeed = 0.02;
        this.radius = 0.03;
    }
};

export class Game {
    private ID: number;
    private duration: number = 0;
    private players: Player[] = [];
    private webSockets: WebSocket[] = [];
    private ball = new Ball();
    private playersCount: number = 0;
    private gameStarted: boolean = false;
    private score: number[] = [];

    constructor(playersCount: number, players: Player[], webSockets: WebSocket[], ID: number) {
        this.playersCount = playersCount;
        this.players = players;
        this.webSockets = webSockets,
            this.ID = ID;
    }

    private async gameLoop(): Promise<void> {
        const fps = 1000 / 60;
        let then = Date.now();
        const startTime = then;
        let frame = 0;
        while (this.gameStarted == true) {
            this.ball.move();
            for (const player of this.players) {
                player.move();
                // console.log(player.pos.x, player.pos.y);
            }
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
            if (this.ball.x + this.ball.radius / 2 <= -1 || this.ball.x + this.ball.radius / 2 >= 1)
                return (this.checkScore());
            const now = Date.now();
            if (now - then < fps) {
                console.log(`i did sleep at frame ${frame}`);
                await sleep(fps - (now - then));
            }
            frame++;
            this.sendGameUpdate();
            then = Date.now();
        }
        console.log("EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEND");
        console.log("GAME ENDEED");
        this.endGame();
    };

    private initSizePos(): void {
        if (this.playersCount == 2) {
            this.players[0].pos.x = -1 + this.players[0].width / 2;
            this.players[0].pos.y = this.players[1].pos.y = 0;
            this.players[1].pos.x = 1 - this.players[0].width / 2;
        }
    };

    private checkScore(): void {
        if (this.ball.x < 0)
            this.score[0] += 1;
        else if (this.ball.x > 0)
            this.score[1] += 1;
        this.score.forEach(score => {
            if (score == 3)
                return (this.endGame())
        });
        this.initRound();
    }

    public initGame(): void {
        for (let i = 0; i < this.players.length; i++)
            this.score.push(0);
        this.gameStarted = true;
        this.initSizePos();
        this.gameLoop();
    };

    public initRound(): void {
        this.ball.reset();
        this.initSizePos();
        this.gameLoop();
    }

    public endGame(): void {
        this.gameStarted = false;
        for (const ws of this.webSockets) {
            ws.send(JSON.stringify({
                type: "end",
            }));
        }
    }

    private sendGameUpdate() {
        const gameUpdate = new GameData(this.players, this.ball, this.score);
        for (let i = 0; i < this.players.length; i++) {
            this.webSockets[i].send(JSON.stringify(gameUpdate));
        }
    };

    public registerInput(playerID: number, key: string, status: boolean): void {
        for (const player of this.players) {
            if (player.ID == playerID) {
                if (key == "w" && player.inputUp != status) player.inputUp = status;
                else if (key == "s" && player.inputDown != status) player.inputDown = status;
            }
        }
    };

    public setGameStarted(started: boolean) { this.gameStarted = started };
};

export class Lobby {
    public allPlayers: Player[] = [];
    public allGames: Game[] = [];
    public allTournaments: Tournament[] = [];
}
