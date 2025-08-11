import { webSocketService } from "../../services/user/user.service";
import { PositionObj, GameData } from "../../shared/types/game.types"

const clamp = (val: number, min: number, max: number) => { return Math.min(Math.max(val, min), max) };

let lastframe = performance.now();

export class PlayerBar {
    public oldState = { time: 0, x: 0, y: 0 };
    public newState = { time: 0, x: 0, y: 0 };
    public x: number;
    public y: number;
    public w: number;
    public h: number;
    public moveUnit: number;
    public inputMap: Map<string, (value: boolean) => void>;
    private ctx: CanvasRenderingContext2D;

    public draw(): void {
        const xPixels = ((this.x + 1) / 2) * this.ctx.canvas.clientWidth;
        const yPixels = (1 - ((this.y + 1) / 2)) * this.ctx.canvas.clientHeight;
        const pixelWidth = this.w * (this.ctx.canvas.width / 2);
        const pixelHeight = this.h * (this.ctx.canvas.clientHeight / 2);
        this.ctx.fillStyle = "rgba(255, 0, 0)";
        this.ctx.fillRect(
            xPixels - pixelWidth / 2,
            yPixels - pixelHeight / 2,
            pixelWidth,
            pixelHeight);
        this.ctx.fillStyle = "rgba(0, 255, 0)";
        this.ctx.fillRect(xPixels, yPixels, 1, 1);
    };

    constructor(ctx: CanvasRenderingContext2D) {
        this.x = 0;
        this.y = 0;
        this.w = 0;
        this.h = 0;
        this.moveUnit = 0;
        this.ctx = ctx;
        this.inputMap = new Map();
    }
};

export class Ball {
    public oldState = { time: 0, x: 0, y: 0 };
    public newState = { time: 0, x: 0, y: 0 };
    public x: number;
    public y: number;
    public radius: number;
    public moveUnit: number;
    private ctx: CanvasRenderingContext2D;

    draw() {
        const xPixels = ((this.x + 1) / 2) * this.ctx.canvas.width;
        const yPixels = (1 - ((this.y + 1) / 2)) * this.ctx.canvas.height;
        const radiusPix = this.radius * (Math.min(this.ctx.canvas.width, this.ctx.canvas.height) / 2);
        this.ctx.beginPath();
        this.ctx.arc(
            xPixels,
            yPixels,
            radiusPix, 0, Math.PI * 2, true
        );
        this.ctx.closePath();
        this.ctx.fillStyle = "rgba(0, 0, 255)";
        this.ctx.fill();
    };

    constructor(ctx: CanvasRenderingContext2D) {
        this.x = 0;
        this.y = 0;
        this.moveUnit = 0;
        this.radius = 0.03;
        this.ctx = ctx;
    }
};

export class MultiPlayerGame {
    private gameCanvas: HTMLCanvasElement = document.createElement('canvas');
    private canvasCtx: CanvasRenderingContext2D = this.gameCanvas.getContext("2d", { alpha: true })!;
    private players: PlayerBar[] = [];
    private ball = new Ball(this.canvasCtx);
    private score: number[] = [0, 0];
    private frameReq: number = 0;
    private playersCount: number = 0;
    private clearFillStyle: number = 1;
    private gameStarted: boolean = false;
    public gameMoveUnit: number = 0;
    private playerWebSocket: WebSocket;
    public inputUp: boolean;
    public inputDown: boolean;
    private playerID: number;
    private gameID: number;

    constructor(playersCount: number, playerID: number, gameID: number) {
        // const inputs: string[] = ["w", "s", "ArrowUp", "ArrowDown"];
        this.playersCount = playersCount;
        this.playerWebSocket = webSocketService.getWebSocket()!;
        this.playerID = playerID;
        this.gameID = gameID;
        this.inputUp = false;
        this.inputDown = false;
        // this.side = 0;
        for (let i = 0; i < playersCount; i++) {
            this.players.push(new PlayerBar(this.canvasCtx));
        }
    }

    public clearScreen(): void {
        this.canvasCtx.globalCompositeOperation = 'destination-out';
        this.canvasCtx.fillStyle = `rgba(0, 0, 0, ${this.clearFillStyle})`;
        this.canvasCtx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
        this.canvasCtx.globalCompositeOperation = 'source-over';
    };

    protected attachListeners(): void {
        document.addEventListener("keydown", (event) => {
            if ((event.key == "w" && this.inputUp == true) || (event.key == "s" && this.inputDown == true))
                return;
            this.playerWebSocket.send(JSON.stringify({
                type: "movement",
                playerID: this.playerID,
                gameID: this.gameID,
                key: event.key,
                status: true,
            }))
        });
        document.addEventListener("keyup", (event) => {
            if ((event.key == "w" && this.inputUp == true) || (event.key == "s" && this.inputDown == true))
                return;
            this.playerWebSocket.send(JSON.stringify({
                type: "movement",
                playerID: this.playerID,
                gameID: this.gameID,
                key: event.key,
                status: false,
            }))
        });
    };

    private counter(): Promise<void> {
        this.canvasCtx.font = "64px font-title";
        return new Promise((resolve) => {
            let counterIdx: number = 3;
            const intervalId = setInterval(() => {
                if (counterIdx == 0) {
                    clearInterval(intervalId);
                    this.clearScreen();
                    resolve();
                    return;
                }
                this.clearScreen();
                this.canvasCtx.fillText(counterIdx.toString(), this.gameCanvas.width / 2, this.gameCanvas.height / 2);
                counterIdx--;
            }, 1000);

        })
    };

    public setScore(score: number[]): void { this.score = score };

    private printScore(): void {
        this.canvasCtx.textAlign = "center";  // Centre horizontalement
        this.canvasCtx.textBaseline = "middle"; // Centre verticalement
        const scoreStr = this.score[0].toString() + " : " + this.score[1].toString();
        this.canvasCtx.fillText(scoreStr, this.gameCanvas.width / 2, this.gameCanvas.height / 2);
    }

    public setAllPositions(posData: GameData): void {
        this.ball.oldState = { ...this.ball.newState }
        this.ball.newState = {
            x: posData.ball.x,
            y: posData.ball.y,
            time: performance.now()
        };

        for (let i = 0; i < posData.players.length; i++) {
            this.players[i].oldState = { ...this.players[i].newState };
            this.players[i].newState = {
                x: posData.players[i].pos.x,
                y: posData.players[i].pos.y,
                time: performance.now()
            };
        }
    }

    private initSizePos(): void {
        this.gameMoveUnit = 1 / 2;
        for (const player of this.players) {
            player.w = 0.02;
            player.h = 0.30;
        }
        if (this.playersCount == 2) {
            this.players[0].moveUnit = this.players[1].moveUnit = this.gameMoveUnit * 0.01;
            this.players[0].y = this.players[1].y = 0;
            this.players[0].x = -1;
            this.players[1].x = 1;
        }
        this.ball.moveUnit = this.gameMoveUnit * 0.01;
    };

    private gameLoop(): void {
        if (!this.gameStarted) return;
        this.clearScreen();

        const now = performance.now();
        const fps = Math.round(1000 / (now - lastframe));
        lastframe = now;

        console.log(fps);
        
        const tickDuration = 1000 / 60; // durée serveur, ou la vraie moyenne
        const t = Math.min((now - this.ball.oldState.time) / tickDuration, 1);

        this.ball.x = this.ball.oldState.x + (this.ball.newState.x - this.ball.oldState.x) * t;
        this.ball.y = this.ball.oldState.y + (this.ball.newState.y - this.ball.oldState.y) * t;

        for (const player of this.players) {
            const tp = Math.min((now - player.oldState.time) / tickDuration, 1);
            player.x = player.oldState.x + (player.newState.x - player.oldState.x) * tp;
            player.y = player.oldState.y + (player.newState.y - player.oldState.y) * tp;
            player.draw();
        }
        this.ball.draw();
        this.printScore();
        this.frameReq = requestAnimationFrame(this.gameLoop.bind(this));
    };

    public async initGame(): Promise<void> {
        const parentContainer: HTMLElement = document.getElementById("pong-section")!;
        this.gameCanvas.height = parentContainer.getBoundingClientRect().height * 0.9;    // will need to update that every frame later (responsiveness)
        this.gameCanvas.width = parentContainer.getBoundingClientRect().width * 0.9;
        this.gameCanvas.style.border = "1px solid black";
        parentContainer.append(this.gameCanvas);
        this.initSizePos();
        this.clearFillStyle = 0.3;
        this.attachListeners();
        this.gameStarted = true;
        this.ball.oldState.time = performance.now();
        this.frameReq = requestAnimationFrame(this.gameLoop.bind(this));
    };

    public getGameStarted(): boolean { return (this.gameStarted) };
}