import { resultGame, addGame, cancelledGame, createTournament, registerUserTournament } from "../db/game";
import { GameData, Player } from "../shared/types/game.types"

const DEG_TO_RAD = Math.PI / 180;

const MAX_SCORE = 3;

const clamp = (val: number, min: number, max: number) => { return Math.min(Math.max(val, min), max) };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
    horizontalCollision(players: Player[]) {
        if ((this.isGoingLeft() && this.y < players[0].pos.y / 2 && players[0].inputDown) ||
            (this.isGoingRight() && this.y < players[1].pos.y / 2 && players[1].inputDown) ||
            (this.isGoingLeft() && this.y > players[0].pos.y / 2 && players[0].inputUp) ||
            (this.isGoingRight() && this.y > players[1].pos.y / 2 && players[1].inputUp))
            this.vAngle = (180 + this.vAngle + 360) % 360;
        else
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
    private duration: number = 0;
    public  players: Player[] = [];
    private ball = new Ball();
    private playersCount: number = 0;
    private gameStarted: boolean = false;
    private isOver: boolean = false;
    private score: number[] = [];
    public gameIDforDB: number = 0; // a voir
    // public type: string;
    // public sidePlayer: string; //dans player plutot
    // private async addGame(userId1: number, userId2: number): Promise<number> ;
    // private async resultGame(gameId: number, winnerId: number, looserId: number);

    constructor(playersCount: number, players: Player[]) {
        this.playersCount = playersCount;
        this.players = players;
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
                this.ball.horizontalCollision(this.players);
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
                // console.log(`i did sleep at frame ${frame}`);
                await sleep(fps - (now - then));
            }
            frame++;
            this.sendGameUpdate();
            then = Date.now();
        }
        console.log("EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEND");
        console.log("GAME ENDEED");
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
        // console.log("iiiciiiiiii", this.score);
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

    public async endGame(): Promise<void> {
        console.log("coucou end !");
        this.gameStarted = false;
        this.isOver = true;
        for (const player of this.players) {
            if (player === this.players[1])
                this.score = [this.score[1], this.score[0]];
            if (player.webSocket)
                player.webSocket.send(JSON.stringify({
                    type: "end",
                    score: this.score
                }));
            // console.log("////////////////////////////////////////////////////////////////////////player = ", player, "score = ", this.score);
        }
        let winner = this.players[1];
        let looser = this.players[0];
        if ((this.score[0] = 3) | (this.score[1] = 3))
        {
            console.log("iiiiiiiiiiiiiiiiiiciiiii dans condition endgsameeee ")
            winner = this.players[0];
            looser = this.players[1];
            // if multiplayer si on veut garder que en db le multiplayer
            await resultGame(this.gameIDforDB, winner.ID, looser.ID, this.score);
        }
        else
        {
            console.log("iiiiiiiiiiiiiiiiiiciiiii dans else endgsameeee ")
            await cancelledGame(this.gameIDforDB, winner.ID, looser.ID, this.score);
        }
        // allPlayers.splice(playerIdx, 1);
        winner.matchMaking = false;
        looser.matchMaking = false;
    }

    private sendGameUpdate() {
        const gameUpdate = new GameData(this.players, this.ball, this.score);
        for (const player of this.players) {
            if (this.players[1] == player)
            {
                gameUpdate.ball.x *=-1;
                gameUpdate.players[1].pos.x *= -1;
                gameUpdate.players[0].pos.x *= -1;
                gameUpdate.score = [this.score[1], this.score[0]];
            }
            if (player.webSocket)
                player.webSocket.send(JSON.stringify(gameUpdate));
        }
    };

    public registerInputLocal(playerID: number, key: string, status: boolean): void { //peut etre ajouter le type de jeu jsp
        for (const player of this.players) {
             if (player.ID == playerID) {
        //     if (player.sidePlayer === "left") {
                if (key == "w" && player.inputUp != status) player.inputUp = status;
                else if (key == "s" && player.inputDown != status) player.inputDown = status;
            }
            // if (player.sidePlayer === "right") {
            else {
                if (key == "ArrowUp" && player.inputUp != status) player.inputUp = status;
                else if (key == "ArrowDown" && player.inputDown != status) player.inputDown = status;
            }
            }
        // }
        // }
    };

    public registerInput(playerID: number, key: string, status: boolean): void { //peut etre ajouter le type de jeu jsp
        for (const player of this.players) {
            if (player.ID == playerID) {
                if (key == "w" && player.inputUp != status) player.inputUp = status;
                else if (key == "s" && player.inputDown != status) player.inputDown = status;
            }
        }
    };

    public setGameStarted(started: boolean) { this.gameStarted = started };
};

export class TournamentLocal {
    public players: Player[] = [];
    public maxPlayers: number;
    public masterPlayerID: number;
    public ID?: number;
    protected IDforDB?: number;
    public stageOne: Game[] = [];
    public stageTwo: Game | undefined;

    constructor(players: Player[], maxPlayers: number, masterPlayerID: number, ID?: number) {
        this.players = players;
        this.maxPlayers = maxPlayers;
        this.masterPlayerID = masterPlayerID;
        this.ID = ID ?? 0;
    }

    public async startTournament(): Promise<void> {
        console.log("iciiii starttournament baaaackkkk /////")
        this.IDforDB = await createTournament(this.maxPlayers, this.maxPlayers/2);
        if (this.IDforDB === undefined)
            return; //TODO : put some error
        console.log("game at start tournament is ?", this.stageOne);

        for (const player of this.players)
            await registerUserTournament(player.ID, this.IDforDB);

        // this.players est melange pour avoir des matchs aleatoire
        shuffleArray(this.players);
        this.stageOne[0] = new Game(2, [this.players[0], this.players[1]]);
        this.stageOne[0].gameIDforDB = await addGame(this.players[0].ID, this.players[1].ID, true);
        this.stageOne[1] = new Game(2, [this.players[2], this.players[3]]);
        this.stageOne[1].gameIDforDB = await addGame(this.players[2].ID, this.players[3].ID, true);
    }
}


export class Tournament {
    public name: string;
    public alias?: string;
    public maxPlayers: number;
    public ID?: number;
    protected IDforDB?: number;
    public masterPlayerID?: number;
    public isStarted?: boolean;
    public players: Player[] = [];
    public stageOneGames: Game[] = [];
    public stageTwoGames: Game[] = [];

    constructor(name: string, maxPlayers: number, ID?: number, masterPlayerID?: number, isStarted?: boolean) {
        this.name = name;
        this.maxPlayers = maxPlayers;
        this.ID = ID ?? 0;
        this.masterPlayerID = masterPlayerID ?? 0;
        this.isStarted = isStarted ?? true;
    }

    // Les joueurs sont rajoutes post creation d'une instance de classe, via requete HTTP (/join_tournament)
    // Seulement 4 joueurs max dont uniquement deux etapes de tournoi : stage 1 et stage 2
    // this.players est melange et l'ordre du tableau donne les differents matchs
    // Match 1 : players[0] && players[1] | Match 2 : players[2] && players[3]
    // Dans l'ideal les games du tournoi sont des Game remote classiques pour ne pas avoir a adapter grand chose
    // TODO : actualiser le tournoi quand une game est finie pour pouvoir continuer
    // exemple de logique :
    // game 1 finie -> front fait une requete au back -> le back recherche le tournoi -> la game fait elle partie dun tournoi ? oui -> met a jour le tournoi
    // le winner de stage one game 1 devient player[0] de stageTwoGame (c'est un tableau actuellement mais en vrai c'est qu'un seul match)
    // le winner de stage one game 2 devient player[1] de stageTwoGame
    // c'etait ce sur quoi je travaillais en dernier donc la logique est pas finie ni en front ni en back

    public async startTournament(): Promise<void> {
        console.log("iciiii starttournament baaaackkkk /////")
        this.IDforDB = await createTournament(this.maxPlayers, this.maxPlayers/2);
        if (this.IDforDB === undefined)
            return; //TODO : put some error
        console.log("game at start tournament is ?", this.stageOneGames);

        for (const player of this.players)
        {
            await registerUserTournament(player.ID, this.IDforDB);
        }
        
        // this.players est melange pour avoir des matchs aleatoire
        shuffleArray(this.players);
        let playerIdx = 0;
        for (let i = 0; i < 2; i++) {
            // tu peux la changer sa mere si tu veux par game1 = new Game(2, this.players[0], this.players[1]);
            // game2 = newGame(2, this.players[2], this.players[3])
            // mais en soit ca marche deja
            const newGame = new Game(2, [this.players[playerIdx], this.players[playerIdx + 1]]); // a changer sa mere
            this.stageOneGames.push(newGame);
            playerIdx += 2;
        }
    }
}

export class Lobby {
    public allPlayers: Player[] = [];
    public allGames: Game[] = [];
    public allTournaments: Tournament[] = [];
    public allTournamentsLocal: TournamentLocal[] = [];
}
