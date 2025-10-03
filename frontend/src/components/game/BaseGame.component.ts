import { animateCSS } from "../../utils/animate.utils";
import { Triangle } from "../../pages/game/boids.page";
import { webSocketService } from "../../services/user/user.service";
import { GameData } from "../../shared/types/game.types"
import { PlayerBar, Ball } from "./ToolsGame.component";

const randomNb = (min: number, max: number) => { return (Math.random() * (max - min) + min) };
const lerp = (a: number, b: number, t: number) => { return a + t * (b - a) };
const getTargetTimestamp = (arr: number[], target: number) => {
    for (let i = arr.length - 2; i >= 0; i--) { // Partir de la fin
        if (arr[i] <= target && target <= arr[i + 1]) {
            return i;
        }
    }
    // Si pas trouvé, prendre les deux plus récents
    return arr.length >= 2 ? arr.length - 2 : 0;
}
const BUFFER_DELAY = 50; // ms

export class MultiPlayerGame {
    private gameCanvas: HTMLCanvasElement = document.createElement('canvas');
    private canvasCtx: CanvasRenderingContext2D = this.gameCanvas.getContext("2d", { alpha: true })!;
    private players: PlayerBar[] = [];
    private aliases: string[];
    private ball = new Ball(this.canvasCtx);
    private score: number[] = [0, 0];
    private scoreChangeFrames: number = 0;
    private frameReq: number = 0;
    private playersCount: number = 0;
    private clearFillStyle: number = 1;
    public gameStarted: boolean = false;
    public gameMoveUnit: number = 0;
    private playerWebSocket: WebSocket;
    public inputUp: boolean;
    public inputDown: boolean;
    private playerID: number;
    public gameID: number;
    public gameStates: { states: GameData[], timestamps: number[] };
    public birds: Triangle[] = [];
    private gameLoopBind: any;
    private testStartTime = 0;
    private stutterCount = 0;
    private kindOfGame: string = "multi";


    constructor(playersCount: number, playerID: number, gameID: number, aliases: string[]) {
        this.playersCount = playersCount;
        const tabID = webSocketService.getTabID();
        this.playerWebSocket = webSocketService.getWebSocket(tabID)!;
        this.playerID = playerID;
        this.gameID = gameID;
        this.inputUp = false;
        this.inputDown = false;
        this.gameStates = { states: [], timestamps: [] }
        for (let i = 0; i < playersCount; i++) {
            this.players.push(new PlayerBar(this.canvasCtx));
        }
        this.aliases = aliases;
    }

    public clearScreen(): void {
        this.canvasCtx.globalCompositeOperation = 'destination-out';
        this.canvasCtx.fillStyle = `rgba(0, 0, 0, ${this.clearFillStyle})`;
        this.canvasCtx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
        this.canvasCtx.globalCompositeOperation = 'source-over';
    };

    // public clearScreen(): void {
    // this.canvasCtx.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
    // };


    public drawMiddleLine(): void {
        const lineWidth = 2;        // px
        const lineHeight = 30;
        const space = 10;
        const middle = this.gameCanvas.clientWidth / 2;

        this.canvasCtx.fillStyle = "rgba(255, 255, 255, 1)";
        for (let i = 0; i <= this.gameCanvas.clientHeight; i++) {
            this.canvasCtx.fillRect(middle - lineWidth / 2, i, lineWidth, lineHeight);
            i += lineHeight + space;
        }
    }

    protected attachListeners() {
        document.addEventListener("keydown", this.handleGameKeyDown);
        document.addEventListener("keyup", this.handleGameKeyUp);
    }

    protected removeListeners(): void {
        document.removeEventListener("keydown", this.handleGameKeyDown);
        document.removeEventListener("keyup", this.handleGameKeyUp);
    }

    public cleanupListeners(): void {
        this.removeListeners()
    }

    protected handleGameKeyDown = (event: KeyboardEvent): void => {
        if ((event.key == "w" && this.inputUp == true) || (event.key == "s" && this.inputDown == true))
            return;
        this.playerWebSocket.send(JSON.stringify({
            type: "movement",
            playerID: this.playerID,
            gameID: this.gameID,
            key: event.key,
            status: true,
            tabID: webSocketService.getTabID()
        }))
    };

    protected handleGameKeyUp = (event: KeyboardEvent): void => {
        if ((event.key == "w" && this.inputUp == true) || (event.key == "s" && this.inputDown == true))
            return;
        this.playerWebSocket.send(JSON.stringify({
            type: "movement",
            playerID: this.playerID,
            gameID: this.gameID,
            key: event.key,
            status: false,
            tabID: webSocketService.getTabID()
        }))
    };

    public counter(): Promise<void> {
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

    public setScore(score: number[]): void {
        if (this.score[0] != score[0] || this.score[1] != score[1]) {
            this.score = score;
            this.scoreChangeFrames = 10;
        }
    };

    public getScore(): number[] { return this.score };

    private printScore(): void {
        this.canvasCtx.font = "5rem 'Courier New', monospace";
        this.canvasCtx.textAlign = "center";  // Centre horizontalement
        this.canvasCtx.textBaseline = "middle"; // Centre verticalement
        const scoreStr = this.score[0].toString() + " " + this.score[1].toString();
        this.canvasCtx.fillText(scoreStr, this.gameCanvas.width / 2, 50);
    }

    private printAliases(): void {
        this.canvasCtx.font = "2rem 'Courier New', monospace";
        this.canvasCtx.fillText(this.aliases[0], (this.gameCanvas.width / 2) / 2, 100);
        this.canvasCtx.fillText(this.aliases[1], (this.gameCanvas.width / 2) + ((this.gameCanvas.width / 2) / 2), 100);
    }

    public registerGameData(newGameState: GameData): void {
        this.gameStates.states.push(newGameState);
        this.gameStates.timestamps.push(performance.now());
        if (this.gameStates.states.length > 10) {
            this.gameStates.states.shift();
            this.gameStates.timestamps.shift();
        }
    }

    public setAllPositions(): void {
        const now = performance.now();
        const targetTime = now - BUFFER_DELAY;

        const target = getTargetTimestamp(this.gameStates.timestamps, targetTime);
        if (target) {
            const next = target + 1;

            const t = (targetTime - this.gameStates.timestamps[target]) /
                (this.gameStates.timestamps[next] - this.gameStates.timestamps[target]);
            // if (this.scoreChangeFrames) {
                // this.scoreChangeFrames -= 1;
                // this.ball.x = 0;
                // this.ball.y = 0;
            // }
            // else {
                this.ball.x = lerp(this.gameStates.states[target].ball.x, this.gameStates.states[next].ball.x, t);
                this.ball.y = lerp(this.gameStates.states[target].ball.y, this.gameStates.states[next].ball.y, t);
            // }
            this.players[0].x = this.gameStates.states[next].players[0].pos.x;
            this.players[1].x = this.gameStates.states[next].players[1].pos.x;
            this.players[0].y = this.gameStates.states[next].players[0].pos.y;
            this.players[1].y = this.gameStates.states[next].players[1].pos.y;
        } else {
            if (this.gameStates.states.length) {
                const lastIndex = this.gameStates.states.length - 1;

                this.ball.x = this.gameStates.states[lastIndex].ball.x;
                this.ball.y = this.gameStates.states[lastIndex].ball.y;
                this.players[0].x = this.gameStates.states[lastIndex].players[0].pos.x;
                this.players[1].x = this.gameStates.states[lastIndex].players[1].pos.x;
                this.players[0].y = this.gameStates.states[lastIndex].players[0].pos.y;
                this.players[1].y = this.gameStates.states[lastIndex].players[1].pos.y;
            }
        }
    }

    private initSizePos(): void {
        this.gameMoveUnit = 1 / 2;
        for (const player of this.players) {
            player.w = 0.02;
            player.h = 0.40;
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
        if (!this.gameStarted) {
            cancelAnimationFrame(this.frameReq);
            return;
        }
        this.clearScreen();
        this.setAllPositions()
        for (const player of this.players)
            player.draw();
        this.ball.draw();
        this.printScore();
        this.printAliases();
        this.drawMiddleLine();

        for (const bird of this.birds) {
            bird.target.x = (this.ball.x + 1) / 2 * this.gameCanvas.width;
            bird.target.y = (1 - ((this.ball.y + 1) / 2)) * this.gameCanvas.height;
            bird.update();
            bird.draw("rgba(0, 255, 0, 0.5)");
        }
        this.frameReq = requestAnimationFrame(this.gameLoopBind);
    };

    public initCanvas(): void {
        const parentContainer: HTMLElement = document.getElementById("pong-section")!;
        this.gameCanvas.height = parentContainer.getBoundingClientRect().height;    // will need to update that every frame later (responsiveness)
        this.gameCanvas.width = parentContainer.getBoundingClientRect().width;
        this.gameCanvas.classList.add("border-1", "border-black" ,"bg-black" ,"bg-opacity-70")
        animateCSS(this.gameCanvas, "zoomIn");
        this.gameCanvas.style.imageRendering = "pixelated";
        parentContainer.append(this.gameCanvas);
    }

    public initBirds(): void {
        const allTriangles = [];
        for (let i = 0; i < 200; i++) {
            const triangle = new Triangle(randomNb(1, this.gameCanvas.width), randomNb(1, this.gameCanvas.height), this.gameCanvas, this.canvasCtx);
            allTriangles.push(triangle);
        }
        this.birds = allTriangles;
        for (const bird of this.birds)
            bird.allTriangles = allTriangles;
    }

    private startGameLoop(): void {
        this.gameStarted = true;
        this.frameReq = requestAnimationFrame(this.gameLoopBind);
    }

    public stopGameLoop(): void {
        this.gameStarted = false;
        cancelAnimationFrame(this.frameReq);
    }

    public async initGame(): Promise<void> {
        this.initCanvas();
        this.initSizePos();
        this.initBirds();
        this.clearFillStyle = 0.3;
        this.attachListeners();
        this.ball.oldState.time = performance.now();
        this.gameLoopBind = this.gameLoop.bind(this);
        this.startGameLoop();
    };

    public getGameStarted(): boolean { return (this.gameStarted) };
}