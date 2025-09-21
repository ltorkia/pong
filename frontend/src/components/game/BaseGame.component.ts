import { webSocketService } from "../../services/user/user.service";
import { GameData } from "../../shared/types/game.types"
import { PlayerBar, Ball } from "./ToolsGame.component";

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
const BUFFER_DELAY = 100; // ms

export class MultiPlayerGame {
    private gameCanvas: HTMLCanvasElement = document.createElement('canvas');
    private canvasCtx: CanvasRenderingContext2D = this.gameCanvas.getContext("2d", { alpha: true })!;
    private players: PlayerBar[] = [];
    private ball = new Ball(this.canvasCtx);
    private score: number[] = [0, 0];
    private frameReq: number = 0;
    private playersCount: number = 0;
    private clearFillStyle: number = 1;
    public gameStarted: boolean = false;
    public gameMoveUnit: number = 0;
    private playerWebSocket: WebSocket;
    public inputUp: boolean;
    public inputDown: boolean;
    private playerID: number;
    private gameID: number;
    public gameStates: { states: GameData[], timestamps: number[] };
    private frameTimings: number[] = [];
    private testStartTime = 0;
    private stutterCount = 0;
    private kindOfGame: string = "multi";

    constructor(playersCount: number, playerID: number, gameID: number) {
        // const inputs: string[] = ["w", "s", "ArrowUp", "ArrowDown"];
        this.playersCount = playersCount;
        this.playerWebSocket = webSocketService.getWebSocket()!;
        this.playerID = playerID;
        this.gameID = gameID;
        this.inputUp = false;
        this.inputDown = false;
        this.gameStates = { states: [], timestamps: [] }
        // this.side = 0;
        for (let i = 0; i < playersCount; i++) {
            this.players.push(new PlayerBar(this.canvasCtx));
        }
    }

    private sendMovementMsg(key: string, status: boolean): void {
        this.playerWebSocket.send(JSON.stringify({
            type: "movement",
            playerID: this.playerID,
            gameID: this.gameID,
            key: key,
            status: status,
        }))
    }

    private inputKeyDown = (event: KeyboardEvent) => {
        if ((event.key == "w" && this.inputUp == true) || (event.key == "s" && this.inputDown == true))
            return;
        if (event.key == "w" || event.key == "s" || event.key == "ArrowUp" || event.key == "ArrowDown")
            this.sendMovementMsg(event.key, true);
    }

    private inputKeyUp = (event: KeyboardEvent) => {
        if (event.key == "w" || event.key == "s" || event.key == "ArrowUp" || event.key == "ArrowDown")
            this.sendMovementMsg(event.key, false);
    }

    public clearScreen(): void {
        this.canvasCtx.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height)
        // this.canvasCtx.globalCompositeOperation = 'destination-out';
        // this.canvasCtx.fillStyle = `rgba(0, 0, 0, ${this.clearFillStyle})`;
        // this.canvasCtx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
        // this.canvasCtx.globalCompositeOperation = 'source-over';
    };

    protected attachListeners(): void {
        document.addEventListener("keydown", this.inputKeyDown);
        document.addEventListener("keyup", this.inputKeyUp);
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

    public setScore(score: number[]): void { this.score = score };

    public getScore(): number[] { return this.score };

    private printScore(): void {
        this.canvasCtx.textAlign = "center";  // Centre horizontalement
        this.canvasCtx.textBaseline = "middle"; // Centre verticalement
        const scoreStr = this.score[0].toString() + " : " + this.score[1].toString();
        this.canvasCtx.fillText(scoreStr, this.gameCanvas.width / 2, this.gameCanvas.height / 2);
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
            // // Après le calcul de t :
            // console.log(`t=${t.toFixed(3)}, target=${target}, next=${next}, buffer_size=${this.gameStates.states.length}`);

            // // Si t sort de [0,1] :
            // if (t < 0 || t > 1) {
            //     console.error(`⚠️ t invalide: ${t}, targetTime=${targetTime}, timestamps=[${this.gameStates.timestamps[target]}, ${this.gameStates.timestamps[next]}]`);
            // }
            this.ball.x = lerp(this.gameStates.states[target].ball.x, this.gameStates.states[next].ball.x, t);
            this.ball.y = lerp(this.gameStates.states[target].ball.y, this.gameStates.states[next].ball.y, t);
            // this.players[0].x = lerp(this.gameStates.states[target].players[0].pos.x, this.gameStates.states[next].players[0].pos.x, t)
            // this.players[1].x = lerp(this.gameStates.states[target].players[1].pos.x, this.gameStates.states[next].players[1].pos.x, t)
            // this.players[0].y = lerp(this.gameStates.states[target].players[0].pos.y, this.gameStates.states[next].players[0].pos.y, t)
            // this.players[1].y = lerp(this.gameStates.states[target].players[1].pos.y, this.gameStates.states[next].players[1].pos.y, t)
            this.players[0].x = this.gameStates.states[next].players[0].pos.x;
            this.players[1].x = this.gameStates.states[next].players[1].pos.x;
            this.players[0].y = this.gameStates.states[next].players[0].pos.y;
            this.players[1].y = this.gameStates.states[next].players[1].pos.y;
        } else {
            console.error("target not found")
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
        // // === TEST DE FLUIDITÉ - DÉBUT ===
        // const frameStart = performance.now();
        // if (this.testStartTime === 0) this.testStartTime = frameStart;

        // // Mesurer le temps entre frames
        // if (this.frameTimings.length > 0) {
        //     const lastFrameTime = this.frameTimings[this.frameTimings.length - 1];
        //     const deltaTime = frameStart - lastFrameTime;

        //     // Détecter les saccades (frame > 20ms = moins de 50fps)
        //     if (deltaTime > 20) {
        //         this.stutterCount++;
        //         console.warn(`⚠️ Saccade détectée: ${deltaTime.toFixed(1)}ms`);
        //     }
        // }

        // this.frameTimings.push(frameStart);
        // if (this.frameTimings.length > 300) { // Garder 5s d'historique à 60fps
        //     this.frameTimings.shift();
        // }

        // // Afficher stats toutes les 5 secondes
        // if (frameStart - this.testStartTime > 5000 && this.frameTimings.length > 250) {
        //     this.printSmoothnesStats();
        //     this.testStartTime = frameStart; // Reset pour le prochain cycle
        // }
        // // === TEST DE FLUIDITÉ - FIN ===

        if (!this.gameStarted) {
            document.removeEventListener("keydown", this.inputKeyDown)
            document.removeEventListener("keyup", this.inputKeyUp);
            return;
        }
        this.clearScreen();
        this.setAllPositions()
        for (const player of this.players)
            player.draw();
        this.ball.draw();
        this.printScore();
        this.frameReq = requestAnimationFrame(this.gameLoop.bind(this));
    };

    // Ajoutez cette méthode pour afficher les stats
    private printSmoothnesStats(): void {
        if (this.frameTimings.length < 10) return;

        // Calculer les délais entre frames
        const deltas = [];
        for (let i = 1; i < this.frameTimings.length; i++) {
            deltas.push(this.frameTimings[i] - this.frameTimings[i - 1]);
        }

        const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
        const minDelta = Math.min(...deltas);
        const maxDelta = Math.max(...deltas);
        const variance = maxDelta - minDelta;
        const avgFps = 1000 / avgDelta;

        console.log(`
🎮 === STATS DE FLUIDITÉ (5s) ===
📊 FPS moyen: ${avgFps.toFixed(1)}
⏱️  Frame time: ${avgDelta.toFixed(1)}ms (min: ${minDelta.toFixed(1)}, max: ${maxDelta.toFixed(1)})
📈 Variance: ${variance.toFixed(1)}ms
⚠️  Saccades: ${this.stutterCount}
${this.getSmoothnessVerdict(variance, avgFps, this.stutterCount)}
================================`);

        // Reset pour le prochain cycle
        this.stutterCount = 0;
    }

    // Verdict automatique
    private getSmoothnessVerdict(variance: number, fps: number, stutters: number): string {
        if (variance < 3 && fps > 58 && stutters === 0) {
            return "✅ PARFAITEMENT FLUIDE !";
        } else if (variance < 6 && fps > 55 && stutters < 3) {
            return "🟡 FLUIDE (quelques micro-saccades)";
        } else if (variance < 10 && fps > 45) {
            return "🟠 SACCADES VISIBLES mais jouable";
        } else {
            return "🔴 PROBLÈME DE FLUIDITÉ - Action requise !";
        }
    }


    public async initGame(): Promise<void> {
        const parentContainer: HTMLElement = document.getElementById("pong-section")!;
        this.gameCanvas.height = parentContainer.getBoundingClientRect().height;    // will need to update that every frame later (responsiveness)
        this.gameCanvas.width = parentContainer.getBoundingClientRect().width;
        this.gameCanvas.style.border = "1px solid black";
        this.gameCanvas.style.backgroundColor = "black";
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