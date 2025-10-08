import { EventEmitter } from "node:stream";
import { resultGame, addGame, addGamePlayers, registerUserTournament, updateTournamentStatus } from "../db/game";
import { GameData, Player } from "../shared/types/game.types"
import { getUsersGame } from "../db/user";
import { incrementUserTournamentStats } from "../db/game";
import { cleanGame } from "../routes/game.routes";

const DEG_TO_RAD = Math.PI / 180;

const MAX_SCORE = 3;

const clamp = (val: number, min: number, max: number) => { return Math.min(Math.max(val, min), max) };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const randomNb = (min: number, max: number) => { return (Math.random() * (max - min) + min) };

const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

export class Ball {
    public x: number;
    public y: number;
    public dirX: number;
    public dirY: number;
    public vx: number;
    public vy: number;
    private initSpeed: number;
    public speed: number;
    public radius: number;

    constructor() {
        this.x = 0;
        this.y = 0;
        this.dirX = 0;
        this.dirY = 0;
        this.vx = 0;
        this.vy = 0;
        this.initSpeed = 0.015;
        this.speed = 0;
        this.radius = 0.03;
        this.reset();
    }

    move() {
        this.x += this.vx;
        this.y += this.vy;
    }

    verticalCollision() {
        this.vy = -this.vy;
    }

    horizontalCollision(players: Player[]) {
        const player = this.vx < 0 ? players[0] : players[1];

        if (this.vx < 0) {
            this.x = player.pos.x + player.width / 2 + this.radius;
        } else {
            this.x = player.pos.x - player.width / 2 - this.radius;
        }

        // Si la balle va vers le joueur et que le joueur se deplace
        const ballAboveCenter = this.y < player.pos.y;
        const playerMovingDown = player.inputDown;
        const playerMovingUp = player.inputUp;
        const playerThird = player.height / 3;
        const playerBegin = player.pos.y - player.height / 2;

        // Distance of ball from top of paddle
        const relativeY = this.y - playerBegin;

        if (relativeY < playerThird) {
            this.dirY -= 0.3;
            this.speed += 0.01;
        } else if (relativeY > playerThird * 2) {
            this.dirY += 0.3;
            this.speed += 0.005;
        } else {
            if (!(this.speed - 0.005 < this.initSpeed))
                this.speed -= 0.005;
        }

        if (this.vx < 0) {
            this.x = player.pos.x + player.width / 2 + this.radius;
        } else {
            this.x = player.pos.x - player.width / 2 - this.radius;
        }

        // Inverse la direction si le joueur se déplace dans la même direction que la balle
        if ((ballAboveCenter && playerMovingDown) || (!ballAboveCenter && playerMovingUp)) {
            console.log("ball inverted");
            this.dirX = -this.dirX;
            this.dirY = -this.dirY;
            this.speed += 0.001;
        } else // Rebond normal
            this.dirX = -this.dirX;

        this.setDirectionVector();
    }

    isGoingRight() {
        return this.vx > 0;
    }

    isGoingLeft() {
        return this.vx < 0;
    }

    isGoingUp() {
        return this.vy < 0;
    }

    isGoingDown() {
        return this.vy > 0;
    }


    setDirectionVector() {
        // Normaliser le vecteur de direction
        const magnitude = Math.sqrt(this.dirX * this.dirX + this.dirY * this.dirY);
        if (magnitude > 0) {
            this.vx = (this.dirX / magnitude) * this.speed;
            this.vy = (this.dirY / magnitude) * this.speed;
        }
    }

    // Méthode utilitaire pour définir la direction avec un angle
    setDirection(angleDegrees: number, speed: number) {
        const angleRad = angleDegrees * DEG_TO_RAD;
        this.speed = speed;
        this.vx = Math.cos(angleRad) * speed;
        this.vy = Math.sin(angleRad) * speed;
    }

    // Méthode utilitaire pour obtenir l'angle actuel
    getAngle(): number {
        return Math.atan2(this.vy, this.vx) / DEG_TO_RAD;
    }

    reset(lastGoal?: boolean[]) {
        this.x = 0;
        this.y = 0;
        this.speed = this.initSpeed;

        if (lastGoal && lastGoal[0]) {
            this.dirX = -1;
            this.dirY = randomNb(-0.3, 0.3);
            this.setDirectionVector();
        } else {
            this.dirX = 1;
            this.dirY = randomNb(-0.3, 0.3);
            this.setDirectionVector();
        }
    }

    public checkPlayerCollision(players: Player[]): boolean {
        for (const player of players) {
            const playerBounds = {
                xRange: { x0: player.pos.x - player.width / 2, x1: player.pos.x + player.width / 2 },
                yRange: { y0: player.pos.y - player.height / 2, y1: player.pos.y + player.height / 2 }
            };

            const xClamp = clamp(this.x, playerBounds.xRange.x0, playerBounds.xRange.x1);
            const yClamp = clamp(this.y, playerBounds.yRange.y0, playerBounds.yRange.y1);

            if (Math.sqrt(Math.pow(this.x - xClamp, 2) + Math.pow(this.y - yClamp, 2)) <= this.radius / 2) {
                return true;
            }
        }
        return false;
    }
}

export class Game extends EventEmitter {
    public players: Player[] = [];
    private ball = new Ball();
    public playersCount: number = 0;

    public gameStarted: boolean = false;
    public isOver: boolean = false;
    public isPaused: boolean = false;
    public cancellerID: number = 0;

    private score: number[] = [0, 0];
    public gameID: number = 0;
    public tournamentID?: number;

    constructor(gameID: number, playersCount: number, players: Player[], tournamentID?: number) {
        super();
        this.gameID = gameID;
        this.playersCount = playersCount;
        this.players = players;
        this.tournamentID = tournamentID;
    }

    private async gameLoop(): Promise<void> {
        const fps = 1000 / 60;
        let then = Date.now();
        const startTime = then;
        let frame = 0;
        while (this.gameStarted == true) {
            for (const player of this.players)
                player.move();

            for (let i = 0; i < 10; i++) {
                this.ball.x += this.ball.vx / 10;
                this.ball.y += this.ball.vy / 10;

                if (this.ball.checkPlayerCollision(this.players))
                    this.ball.horizontalCollision(this.players);

                if (this.ball.y + this.ball.radius / 2 <= -1 || this.ball.y + this.ball.radius / 2 >= 1)
                    this.ball.verticalCollision();
                if (this.ball.x - this.ball.radius / 2 <= -1 || this.ball.x + this.ball.radius / 2 >= 1)
                    return (this.checkScore());
            }
            const now = Date.now();
            if (now - then < fps) {
                await sleep(fps - (now - then));
            }
            frame++;
            this.sendGameUpdate();
            then = Date.now();
        }
        console.log("----------------- GAME ENDED -----------------");
    };

    private initSizePos(): void {
        if (this.playersCount == 2) {
            this.players[0].pos.x = -1 + this.players[0].width / 2;
            this.players[0].pos.y = this.players[1].pos.y = 0;
            this.players[1].pos.x = 1 - this.players[0].width / 2;
        }
        for (const player of this.players) {
            player.inputUp = false;
            player.inputDown = false;
        }
    };

    private checkScore(): void {
        const lastGoal: boolean[] = [];
        console.log("BALL X Y: ", this.ball.x, " ", this.ball.y);

        if (this.ball.x < 0) {
            this.score[1] += 1;
            lastGoal[1] = true;
            console.log("PLAYER X Y: ", this.players[0].pos.x, this.players[0].pos.y);
        }
        else if (this.ball.x > 0) {
            this.score[0] += 1;
            lastGoal[0] = true;
            console.log("PLAYER X : ", this.players[1].pos.x, this.players[0].pos.y);
        }

        this.score.forEach(async score => {
            if (score >= 3)
                return (await this.endGame())
        });

        this.isPaused = true;
        this.sendGameUpdate();
    }

    public initGame(): void {
        this.gameStarted = true;
        this.initSizePos();
        this.gameLoop();
    };

    public initRound(lastGoal?: boolean[]): void {
        this.ball.reset(lastGoal);
        this.initSizePos();
        this.gameLoop();
    }

    public async endGame(): Promise<void> {
        this.gameStarted = false;
        this.isOver = true;

        // Si un joueur quitte la page / cancel le game, il déclare forfait -> 3 points pour l'autre joueur
        // En local le perdant est sélectionné aléatoirement
        if (this.cancellerID) {
            if (this.players.some(p => p.isTemp)) {
                const randomLooser = this.players[Math.floor(Math.random() * this.players.length)];
                this.cancellerID = randomLooser.ID;
            }
            this.score[0] = (this.cancellerID === this.players[1].ID) ? MAX_SCORE : this.score[0];
            this.score[1] = (this.cancellerID === this.players[0].ID) ? MAX_SCORE : this.score[1];
        }

        for (const player of this.players) {

            let scoreToDisplay = [...this.score];
            if (player === this.players[1])
                scoreToDisplay.reverse();

            if (player.webSocket) {
                player.webSocket.send(JSON.stringify({
                    type: "end",
                    score: scoreToDisplay,
                    tournamentID: this.tournamentID || null
                }));
            }
        }
        cleanGame(this);
        const winnerID = this.getWinnerID();
        const isCancelled = this.cancellerID ? true : false;
        await resultGame(this.gameID, winnerID, this.score, isCancelled);

        this.emit("finished", this); // envoie un event "finished" qui est capte par une classe parent (TournamentLocal)
    }

    private sendGameUpdate() {
        const gameUpdate = new GameData(this.players, this.ball, this.score);
        for (const player of this.players) {
            if (this.players[1] == player) {
                gameUpdate.ball.x *= -1;
                gameUpdate.players[1].pos.x *= -1;
                gameUpdate.players[0].pos.x *= -1;
                gameUpdate.score = [this.score[1], this.score[0]];
            }
            if (player.webSocket)
                player.webSocket.send(JSON.stringify(gameUpdate));
        }
    };

    public registerInputLocal(playerID: number, key: string, status: boolean): void {
        for (const player of this.players) {
            if (player.ID == playerID) {
                if (key == "w" && player.inputUp != status) player.inputUp = status;
                else if (key == "s" && player.inputDown != status) player.inputDown = status;
            }
            else {
                if (key == "ArrowUp" && player.inputUp != status) player.inputUp = status;
                else if (key == "ArrowDown" && player.inputDown != status) player.inputDown = status;
            }
        }
    };

    public registerInputLocalTournament(key: string, status: boolean): void {
        if (key == "w" && this.players[0].inputUp != status)
            this.players[0].inputUp = status;
        else if (key == "s" && this.players[0].inputDown != status)
            this.players[0].inputDown = status;

        if (key == "ArrowUp" && this.players[1].inputUp != status)
            this.players[1].inputUp = status;
        else if (key == "ArrowDown" && this.players[1].inputDown != status)
            this.players[1].inputDown = status;
    }

    public registerInput(playerID: number, key: string, status: boolean): void {
        for (const player of this.players) {
            if (player.ID == playerID) {
                if (key == "w" && player.inputUp != status) player.inputUp = status;
                else if (key == "s" && player.inputDown != status) player.inputDown = status;
            }
        }
    };

    // Touch inputs. Player ID transmis uniquement si remote
    public registerTouchInput(coords: {x: number, y: number}, mode?: string, playerID?: number) {
        if (mode === "multi") {
            this.players.forEach((p: Player) => {
                if (p.ID === playerID)
                    p.pos.y = clamp(coords.y, -1, 1);
            })
            return ;
        }
        if ((mode === "local" || mode === "tournament") && coords.x > 0)
            this.players[1].pos.y = clamp(coords.y, -1, 1);
        else
            this.players[0].pos.y = clamp(coords.y, -1, 1);
    }

    public getWinnerID() { return this.score[0] === MAX_SCORE ? this.players[0].ID : this.players[1].ID };
    public getIsOver() { return this.isOver };
    public getScore() { return this.score };
    public setGameStarted(started: boolean) { this.gameStarted = started };
};

export class TournamentLocal {
    public players: Player[] = [];
    public winner: Player | undefined;
    public maxPlayers: number;
    public masterPlayerID: number;
    public ID: number;
    public stageOne: Game[] = [];
    public stageTwo!: Game;

    constructor(players: Player[], maxPlayers: number, masterPlayerID: number, ID: number) {
        this.players = players;
        this.maxPlayers = maxPlayers;
        this.winner = undefined;
        this.masterPlayerID = masterPlayerID;
        this.ID = ID ?? 0;
    }

    public getWinner(game: Game): Player {
        const score = game.getScore();
        return score[0] > score[1] ? game.players[0] : game.players[1];
    }

    public async startTournament(): Promise<void> {
        for (const player of this.players)
            await registerUserTournament(player.ID, this.ID, player.alias);

        // this.players est melange pour avoir des matchs aleatoire
        shuffleArray(this.players);
        await updateTournamentStatus(this.ID, "in_progress");

        const gameID1 = await addGame(this.ID);
        await addGamePlayers(gameID1, [this.players[0].ID, this.players[1].ID], [this.players[0].alias ?? "", this.players[1].alias ?? ""]);
        this.stageOne[0] = new Game(gameID1, 2, [this.players[0], this.players[1]], this.ID);

        const gameID2 = await addGame(this.ID);
        await addGamePlayers(gameID2, [this.players[2].ID, this.players[3].ID], [this.players[2].alias ?? "", this.players[3].alias ?? ""]);
        this.stageOne[1] = new Game(gameID2, 2, [this.players[2], this.players[3]], this.ID);

        const stageTwoID = await addGame(this.ID)
        this.stageTwo = new Game(stageTwoID, 2, [], this.ID); // creee maintenant mais les joueurs sont ajoutes plus tard

        // Listeners pour etre notifie quand une game est finie
        for (const game of this.stageOne)
            game.on("finished", (g: Game) => this.update());
        this.stageTwo.on("finished", (g: Game) => this.update());
    }

    // si les games du premier tour sont finies, update pour determiner la derniere game
    public async update(): Promise<void> {
        if (this.stageTwo.getIsOver()) {
            this.winner = this.getWinner(this.stageTwo);
            await incrementUserTournamentStats(this.ID, this.winner.ID, true);
            const looser = await getUsersGame(this.stageTwo.gameID, this.winner.ID);
            if (looser != undefined)
                await incrementUserTournamentStats(this.ID, looser.id, false);
            await updateTournamentStatus(this.ID, "finished");
            return;
        }
        for (const game of this.stageOne) {
            if (game.getIsOver() && !game.players.some((p: Player) => this.stageTwo?.players.includes(p))) {
                const winner = this.getWinner(game);
                this.stageTwo?.players.push(winner);
                await incrementUserTournamentStats(this.ID, winner.ID, true);
                const looser = await getUsersGame(game.gameID, winner.ID);
                if (looser != undefined)
                    await incrementUserTournamentStats(this.ID, looser.id, false);
            }
        }
        if (this.stageTwo.players.length == 2)
        await addGamePlayers(
            this.stageTwo.gameID,
            this.stageTwo.players.map(p => p.ID),
            this.stageTwo.players.map(p => p.alias ?? "")
        );
        console.log("SCORE : ", this.stageOne[0].getScore());
    }
}

export class Lobby {
    public allPlayers: Map<number, Player[]> = new Map();
    public allGames: Game[] = [];
    public allTournamentsLocal: TournamentLocal[] = [];
}
