export class PlayerBar {
    public oldState = { time: 0, x: 0, y: 0 };
    public newState = { time: 0, x: 0, y: 0 };
    public x: number;
    public y: number;
    public w: number;
    public h: number;
    public moveUnit: number;
    private ctx: CanvasRenderingContext2D;

    public draw(): void {
        const xPixels = ((this.x + 1) / 2) * this.ctx.canvas.clientWidth;
        const yPixels = (1 - ((this.y + 1) / 2)) * this.ctx.canvas.clientHeight;
        const pixelWidth = this.w * (this.ctx.canvas.width / 2) + 20;
        const pixelHeight = this.h * (this.ctx.canvas.clientHeight / 2);
        this.ctx.fillStyle = "rgba(255, 255, 255)";
        this.ctx.fillRect(
            xPixels - pixelWidth / 2,
            yPixels - pixelHeight / 2,
            pixelWidth,
            pixelHeight);
        this.ctx.strokeStyle = "black";
        this.ctx.strokeRect(xPixels - pixelWidth / 2,
            yPixels - pixelHeight / 2,
            pixelWidth,
            pixelHeight);
    };

    constructor(ctx: CanvasRenderingContext2D) {
        this.x = 0;
        this.y = 0;
        this.w = 0;
        this.h = 0;
        this.moveUnit = 0;
        this.ctx = ctx;
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
        this.ctx.fillStyle = "rgba(255, 255, 255)";
        this.ctx.fill();
        this.ctx.strokeStyle = "rgba(0, 0, 0)";
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    };

    constructor(ctx: CanvasRenderingContext2D) {
        this.x = 0;
        this.y = 0;
        this.moveUnit = 0;
        this.radius = 0.03;
        this.ctx = ctx;
    }
};