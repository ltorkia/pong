export class PlayerBar {
    public x: number;
    public y: number;
    public w: number;
    public h: number;
    public moveUnit: number;
    public inputUp: boolean;
    public inputDown: boolean;
    public inputMap: Map<string, (value: boolean) => void>;
    private ctx: CanvasRenderingContext2D;

    public draw(): void {
        this.ctx.fillStyle = "rgba(255, 0, 0)";
        this.ctx.fillRect(this.x, this.y - (this.h / 2), this.w, this.h);
        this.ctx.fillStyle = "rgba(0, 255, 0)";
        this.ctx.fillRect(this.x, this.y, 1, 1);
    };

    public moveUp(): void {
        if (this.y + this.moveUnit - (this.h / 2) > 0)
            this.y -= this.moveUnit;
    };

    public moveDown(): void {
        if (this.y + this.moveUnit + (this.h / 2) < this.ctx.canvas.clientHeight)
            this.y += this.moveUnit;
    };

    private setInputUp(value: boolean): void {
        this.inputUp = value;
    };

    private setInputDown(value: boolean): void {
        this.inputDown = value;
    };

    constructor(ctx: CanvasRenderingContext2D, inputUp: string, inputDown: string) {
        this.x = 0;
        this.y = 0;
        this.w = 20;
        this.h = 100;
        this.moveUnit = 10;
        this.ctx = ctx;
        this.inputUp = false;
        this.inputDown = false;
        this.inputMap = new Map();
        this.inputMap.set(inputUp, this.setInputUp.bind(this));
        this.inputMap.set(inputDown, this.setInputDown.bind(this));
    }
};

export class Ball {
    public x: number;
    public y: number;
    public vAngle: number;
    public vSpeed: number;
    public radius: number;
    private ctx: CanvasRenderingContext2D;

    draw() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
        this.ctx.closePath();
        this.ctx.fillStyle = "rgba(0, 0, 255)";
        this.ctx.fill();
    };
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
        if ((this.vAngle >= 0 && this.vAngle <= 90) || (this.vAngle >= 270 && this.vAngle <= 360))
            return true;
        return false;
    };
    isGoingLeft() {
        if (this.vAngle >= 90 && this.vAngle < 270)
            return true;
        return false;
    };

    constructor(ctx: CanvasRenderingContext2D) {
        this.x = ctx.canvas.width / 2;
        this.y = ctx.canvas.height / 2;
        this.vAngle = 30;
        this.vSpeed = 5;
        this.radius = 10;
        this.ctx = ctx;
    }
};

export class BaseGame {
    private gameCanvas: HTMLCanvasElement = document.createElement('canvas');
    private canvasCtx: CanvasRenderingContext2D = this.gameCanvas.getContext("2d", { alpha: true })!;
    private players: PlayerBar[] = [];
    private ball = new Ball(this.canvasCtx);
    private frameReq: number = 0;
    private playersCount: number = 0;
    private clearFillStyle: number = 1;
    private gameStarted: boolean = false;

    public clearScreen(): void {
        this.canvasCtx.globalCompositeOperation = 'destination-out';
        this.canvasCtx.fillStyle = `rgba(0, 0, 0, ${this.clearFillStyle})`;
        this.canvasCtx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
        this.canvasCtx.globalCompositeOperation = 'source-over';
    };

    public checkPlayerMovement(): void {
        for (const player of this.players) {
            if (player.inputUp == true)
                player.moveUp();
            else if (player.inputDown == true)
                player.moveDown();
        }
    };

    protected attachListeners(): void {
        document.addEventListener("keydown", (event) => {
            for (const player of this.players) {
                const inputFunc = player.inputMap.get(event.key);
                if (inputFunc) inputFunc(true);
            }
        });
        document.addEventListener("keyup", (event) => {
            for (const player of this.players) {
                const inputFunc = player.inputMap.get(event.key);
                if (inputFunc) inputFunc(false);
            }
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

    private gameLoop(): void {
        if (!this.gameStarted) return;
        this.clearScreen();
        this.checkPlayerMovement();
        for (const player of this.players)
            player.draw();
        console.log("coucou")
        requestAnimationFrame(this.gameLoop.bind(this));
    };

    private initPlayersSizePos(): void {
        if (this.playersCount == 2) {
            this.players[0].y = this.players[1].y = this.gameCanvas.height / 2;
            this.players[1].x = this.gameCanvas.width - this.players[1].w;
        }
    };

    public async initGame(): Promise<void> {
        const canvasContainer: HTMLElement = document.getElementById("pong-section")!;
        this.gameCanvas.height = canvasContainer.getBoundingClientRect().height;    // will need to update that every frame later (responsiveness)
        this.gameCanvas.width = canvasContainer.getBoundingClientRect().width;
        this.initPlayersSizePos();
        canvasContainer.append(this.gameCanvas);
        await this.counter();
        this.clearFillStyle = 0.3;
        this.attachListeners();
        this.gameStarted = true;
        this.frameReq = requestAnimationFrame(this.gameLoop.bind(this));
    };

    constructor(playersCount: number) {
        const inputs: string[] = ["w", "s", "ArrowUp", "ArrowDown"];
        this.playersCount = playersCount;
        for (let i = 0; i < playersCount; i++) {
            this.players.push(new PlayerBar(this.canvasCtx, inputs[0], inputs[1]));
            inputs.shift();
            inputs.shift();
        }
    };
}