import { GameInterface, TournamentInterface } from "../shared/types/game.types";
import { Player } from "../shared/types/game.types";

export class Tournament implements TournamentInterface {
    name: string;
    alias?: string;
    maxPlayers: number;
    ID: number;
    masterPlayerID?: number;
    isStarted?: boolean;
    stageOneGames?: Game[] | undefined;
    stageTwoGames?: Game[] | undefined;
    players?: Player[]

    constructor(name: string, maxPlayers: number, ID: number, masterPlayerID?: number,
        stageOneGames?: Game[], stageTwoGames?: Game[],
        isStarted?: boolean, players?: Player[]) {
        this.name = name;
        this.maxPlayers = maxPlayers;
        this.ID = ID;
        this.masterPlayerID = masterPlayerID ?? 0;
        this.isStarted = isStarted ?? true;
        this.stageOneGames = stageOneGames ?? undefined;
        this.stageTwoGames = this.stageTwoGames ?? undefined;
        this.players = players
    }
}

export class TournamentLocal implements TournamentInterface {
    players: Player[];
    masterPlayerID: number;
    maxPlayers: number;
    stageOne?: Game[] | undefined;
    stageTwo?: Game | undefined;
    winner: Player | undefined;
    tabID?: string;

    constructor(maxPlayers: number, winner: Player | undefined, masterPlayerID: number, players: Player[], tabID?: string,
        stageOne?: Game[], stageTwo?: Game) {
        this.maxPlayers = maxPlayers;
        this.masterPlayerID = masterPlayerID;
        this.players = players;
        this.tabID = tabID;
        this.stageOne = stageOne ?? undefined;
        this.stageTwo = stageTwo ?? undefined;
        this.winner = winner;
    }
}

export class Game implements GameInterface {
    duration?: number;
    gameID: number;
    players: Player[];
    playersCount: number;
    gameStarted: boolean;
    isOver: boolean;
    score: number[];

    constructor(players: Player[], gameID: number, playersCount: number, gameStarted: boolean, isOver: boolean, score: number[]) {
        this.players = players;
        this.gameID = gameID;
        this.playersCount = playersCount;
        this.gameStarted = gameStarted;
        this.score = score;
        this.isOver = isOver;
    }
}

const lerp = (a: number, b: number, t: number) => {
    return (a * (1 - t) + b * t);
};

export class Triangle {
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

    constructor(x: number, y: number, canvas: HTMLCanvasElement, canvasCtx: CanvasRenderingContext2D) {
        this.x = x;
        this.y = y;
        this.R = (15 * .5) / Math.cos(Math.PI / 6);
        this.v1 = { x: 0, y: 0 };
        this.v2 = { x: 0, y: 0 };
        this.v3 = { x: 0, y: 0 };
        this.center = { x: 0, y: 0 };
        this.target = { x: 0, y: 0 };
        this.setVertices();
        this.ctx = canvasCtx;
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

    public draw(color: string) {
        this.ctx.beginPath();
        this.ctx.moveTo(this.v1.x, this.v1.y);
        this.ctx.lineTo(this.v2.x, this.v2.y);
        this.ctx.lineTo(this.v3.x, this.v3.y);
        this.ctx.lineTo(this.v1.x, this.v1.y);
        this.ctx.closePath();
        this.ctx.strokeStyle = "green";
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        // this.ctx.fillStyle = color;
        // this.ctx.fill();
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
        const dx = xDir * 5;
        const dy = yDir * 5;
        this.x += dx;
        this.y += dy;
    }

    public checkNeighbours() {
        for (const triangle of this.allTriangles) {
            if (triangle == this) continue;
            const dx = triangle.x - this.x;
            const dy = triangle.y - this.y;
            const dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
            if (dist < this.R * 2.5)
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
        const blendVec = { x: lerp(targetVec.x, repelVec.x, 0.9), y: lerp(targetVec.y, repelVec.y, 0.9) };
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