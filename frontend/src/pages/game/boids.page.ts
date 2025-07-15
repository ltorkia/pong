import { BasePage } from '../base.page';
import { RouteConfig } from '../../types/routes.types';

const lerp = (a: number, b: number, t: number) => {
    return (a * (1 - t) + b * t);
}

class Triangle {
    public x: number;
    public y: number;
    public R: number;
    public v1: { x: number, y: number };
    public v2: { x: number, y: number };
    public v3: { x: number, y: number };
    public center: { x: number, y: number };
    public target: { x: number, y: number };
    private angle: number = 0;
    private maxTurn: number = 0.05;
    public allTriangles: Triangle[] = [];
    public neighbours: Triangle[] = [];
    public targetAngle: number = 0;
    public desiredAngle: number = 0;
    private ctx: CanvasRenderingContext2D;

    constructor(xArg: number, yArg: number, RArg: number, ctx: CanvasRenderingContext2D) {
        this.x = xArg;
        this.y = yArg;
        this.R = RArg;
        this.v1 = { x: 0, y: 0 };
        this.v2 = { x: 0, y: 0 };
        this.v3 = { x: 0, y: 0 };
        this.center = { x: 0, y: 0 };
        this.target = { x: 0, y: 0 };
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

    public getVerticeLength(vertice1: { x: number, y: number }, vertice2: { x: number, y: number }) {
        return (Math.sqrt(vertice2.x - vertice1.x) ** 2 + (vertice2.y - vertice1.y) ** 2);
    }

    public setCenter() {
        this.center.x = (this.v1.x + this.v2.x + this.v3.x) / 3;
        this.center.y = (this.v1.y + this.v2.y + this.v3.y) / 3;
    }

    public draw() {
        this.ctx.beginPath();
        this.ctx.moveTo(this.v1.x, this.v1.y);
        this.ctx.lineTo(this.v2.x, this.v2.y);
        this.ctx.lineTo(this.v3.x, this.v3.y);
        this.ctx.lineTo(this.v1.x, this.v1.y);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fillStyle = "rgb(0, 255, 0)";
        this.ctx.fillRect(this.center.x, this.center.y, 1, 1);
    };

    public rotateToTarget() {
        let angleDiff = this.targetAngle - this.angle;
        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        else if (angleDiff < Math.PI * -1) angleDiff += 2 * Math.PI;
        if (angleDiff > this.maxTurn) this.angle += this.maxTurn;
        else if (angleDiff < this.maxTurn * -1) this.angle -= this.maxTurn;
        else this.angle += angleDiff;
    }

    public moveToTarget() {
        const xDir = Math.cos(this.angle);
        const yDir = Math.sin(this.angle);
        const dx = xDir * 2;
        const dy = yDir * 2;
        this.x += dx;
        this.y += dy;
    }

    public checkNeighbours() {
        for (const triangle of this.allTriangles) {
            if (triangle == this) continue;
            const dx = triangle.x - this.x;
            const dy = triangle.y - this.y;
            const dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
            if (dist < this.R * 1.5)
                this.neighbours.push(triangle);
        }
    }

    public setRepellingForce() {
        if (this.neighbours.length == 0) {
            this.targetAngle = this.desiredAngle;
            return;
        }
        let avgDx = 0;
        let avgDy = 0;

        for (const neighbour of this.neighbours) {
            avgDx += -(neighbour.x - this.x);
            avgDy += -(neighbour.y - this.y);
        }
        const meanVec = { x: avgDx / this.neighbours.length, y: avgDy / this.neighbours.length };
        const repelAngle = Math.atan2(meanVec.y, meanVec.x);
        const targetVec = { x: Math.cos(this.desiredAngle), y: Math.sin(this.desiredAngle) };
        const repelVec = { x: Math.cos(repelAngle), y: Math.sin(repelAngle) };
        const blendVec = { x: lerp(targetVec.x, repelVec.x, 0.8), y: lerp(targetVec.y, repelVec.y, 0.8) };
        this.targetAngle = Math.atan2(blendVec.y, blendVec.x);
        this.neighbours = [];
    }

    public setTargetAngle() {
        const targetVec = { dx: this.target.x - this.center.x, dy: this.target.y - this.center.y };
        this.desiredAngle = Math.atan2(targetVec.dy, targetVec.dx)
    }

    public update() {
        this.setTargetAngle();
        this.checkNeighbours();
        this.setRepellingForce();
        if (this.targetAngle != this.angle)
            this.rotateToTarget();
        if (this.center.x != this.target.x || this.center.y != this.target.y)
            this.moveToTarget();
        this.setVertices();
        this.setCenter();
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
    public L: number = 20;
    public R: number = (this.L * .5) / Math.cos(Math.PI / 6);
    public triangles: Triangle[] = [];
    public clearFillStyle = 1;

    constructor(config: RouteConfig) {
        super(config);
    }

    clearScreen = () => {
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.fillStyle = `rgba(0, 0, 0, ${this.clearFillStyle})`;
        this.ctx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
        this.ctx.globalCompositeOperation = 'source-over';
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
        for (let i = 0; i < 200; i++) {
            const triangle = new Triangle(this.cx, this.cy, this.R, this.ctx);
            this.triangles.push(triangle);
            this.cx -= 5;
            this.cy -= 5;
        }
        for (const triangle of this.triangles)
            triangle.allTriangles = this.triangles;
    }

    launchAnim = () => {
        this.clearScreen();
        this.clearFillStyle = 0.05;
        this.ctx.strokeStyle = "red";
        for (const triangle of this.triangles) {
            this.ctx.fillStyle = "rgb(255, 0, 0)";
            triangle.draw();
            triangle.update();
        }
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
        document.addEventListener("click", (event) => {
            for (const triangle of this.triangles) {
                triangle.draw();
                triangle.update();
                triangle.target.x = event.x;
                triangle.target.y = event.y;
            }
        })
    }
}