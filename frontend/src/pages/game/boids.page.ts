import { BasePage } from '../base.page';
import { RouteConfig } from '../../types/routes.types';

class Triangle {
    public x: number;
    public y: number;
    public R: number;
    public v1: { x: number, y: number };
    public v2: { x: number, y: number };
    public v3: { x: number, y: number };
    private angle: number = 0;
    private ctx: CanvasRenderingContext2D;

    constructor(xArg: number, yArg: number, RArg: number, ctx: CanvasRenderingContext2D) {
        this.x = xArg;
        this.y = yArg;
        this.R = RArg;
        this.v1 = { x: 0, y: 0 };
        this.v2 = { x: 0, y: 0 };
        this.v3 = { x: 0, y: 0 };
        this.setVertices();
        this.ctx = ctx;
    }

    public setVertices() {
        this.v1.x = this.x + this.R * Math.cos(this.angle);
        this.v1.y = this.y + this.R * Math.sin(this.angle);
        this.v2.x = this.x + this.R * Math.cos(2 * Math.PI / 3 + this.angle);
        this.v2.y = this.y + this.R * Math.sin(2 * Math.PI / 3 + this.angle);
        this.v3.x = this.x + this.R * Math.cos(4 * Math.PI / 3 + this.angle);
        this.v3.y = this.y + this.R * Math.sin(4 * Math.PI / 3 + this.angle);
    }

    public draw() {
        this.ctx.beginPath();
        this.ctx.moveTo(this.v1.x, this.v1.y);
        this.ctx.lineTo(this.v2.x, this.v2.y);
        this.ctx.lineTo(this.v3.x, this.v3.y);
        this.ctx.lineTo(this.v1.x, this.v1.y);
        this.ctx.closePath();
        this.ctx.stroke();
    }

    public update(newAngle: number) {
        this.angle = (this.angle + newAngle) % (2 * Math.PI);
        this.setVertices();
    }

    public updateDegrees(newAngleDegrees: number) {
        const newAngleRadians = (newAngleDegrees * Math.PI) / 180;
        this.update(newAngleRadians);
    }
}

export class BoidsPage extends BasePage {
    private gameCanvas: HTMLCanvasElement = document.createElement('canvas');
    private ctx: CanvasRenderingContext2D = this.gameCanvas.getContext("2d", { alpha: true })!;
    // the width of the canvas
    public cw: number = 0;
    public cx: number = 0;
    //the height of the canvas
    public ch: number = 0;
    public cy: number = 0;
    public L: number = 60;
    public R: number = (this.L * .5) / Math.cos(Math.PI / 6);
    public triangles: Triangle[] = [];

    constructor(config: RouteConfig) {
        super(config);
    }

    clearScreen = () => {
        this.ctx.clearRect(0, 0, this.cw, this.ch);
    };

    initSizes = () => {
        // the width of the canvas
        this.cw = this.gameCanvas.width;
        this.cx = this.cw / 1.5;
        //the height of the canvas
        this.ch = this.gameCanvas.height;
        this.cy = this.ch / 1.5;
    }

    initTriangles = () => {
        for (let i = 0; i < 80; i++) {
            const triangle = new Triangle(this.cx, this.cy, this.R, this.ctx);
            this.triangles.push(triangle);
            this.cx -= 5;
            this.cy -= 5;
        }
    }

    launchAnim = () => {
        this.clearScreen();
        this.ctx.strokeStyle = "red";
        this.ctx.fillStyle = "rgb(255, 0, 0)";
        let deg = 1;
        for (const triangle of this.triangles) {
            triangle.draw();
            triangle.updateDegrees(deg);
            deg += 0.005;
        }
        // myTriangle.update(1);
        // if (myTriangle.v1.x > ctx.canvas.width && myTriangle.v2.x > ctx.canvas.width && myTriangle.v3.x > ctx.canvas.width)
        // {
        // cx = 0;
        // myTriangle.setVertices();
        // }
        requestAnimationFrame(this.launchAnim);
    }

    protected async mount(): Promise<void> {
        const canvasContainer: HTMLElement = document.getElementById("pong-section")!;
        this.gameCanvas.height = canvasContainer.getBoundingClientRect().height;    // will need to update that every frame later (responsiveness)
        this.gameCanvas.width = canvasContainer.getBoundingClientRect().width;
        canvasContainer.append(this.gameCanvas);
        this.initSizes();
        this.initTriangles();
        requestAnimationFrame(this.launchAnim);
    }

    protected attachListeners(): void {
    }
}