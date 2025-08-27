// import { BasePage } from '../base/base.page';
// import { RouteConfig } from '../../types/routes.types';
// import { LocalGame } from '../../components/game/Localgame.component';
// import { BaseGame } from '../../components/game/BaseGame.component';

// export class GameMenuLocal extends BasePage {

//     constructor(config: RouteConfig) {
//         super(config);
//     }

//     protected async mount(): Promise<void> {
//     }

//     private launchGame(): void {
//         const mainContainer = document.querySelector("#pong-section");
//         while (mainContainer?.lastChild)
//             mainContainer.removeChild(mainContainer.lastChild);
//         const gameInstance = new LocalGame(2);
//         // const gameInstance = new BaseGame(1, );
//         gameInstance.initGame();
//     }

//     protected attachListeners(): any {
//         document.addEventListener("keydown", (event) => {
//             const nodes: NodeListOf<HTMLElement> = document.querySelectorAll(".control");
//             if (event.key === " ") {
//                 return this.launchGame();
//             }
//             for (const node of nodes) {
//                 if (node.dataset.key == event.key)
//                     node.classList.add("button-press");
//             }
//         }
//         );
//         document.addEventListener("keyup", (event) => {
//             const nodes: NodeListOf<HTMLElement> = document.querySelectorAll(".control");
//             for (const node of nodes) {
//                 if (node.dataset.key == event.key)
//                     node.classList.remove("button-press");
//             }
//         });
//     }

// }

/////////////////////////////////////////////////////////////////////////////////////

// import { BasePage } from '../base/base.page';
// import { RouteConfig } from '../../types/routes.types';
// import { MatchMakingReq } from '../../shared/types/websocket.types';
// import { MultiPlayerGame } from '../../components/game/MultiplayerGame.component';
// import { BaseGame } from '../../components/game/BaseGame.component';
// import { webSocketService } from '../../services/user/user.service';

// export class GameMenuLocal extends BasePage {
//     private webSocket!: WebSocket | undefined;
//     private gameStarted: boolean = false;
//     private game?: BaseGame;
//     private finalScore: number[] = [];
//     private controlNodesUp!: NodeListOf<HTMLElement>;
//     private controlNodesDown!: NodeListOf<HTMLElement>;
//     private isSearchingGame: boolean = false;



//     constructor(config: RouteConfig) {
//         super(config);
//         this.webSocket = webSocketService.getWebSocket();
//     }

//     protected insertNetworkError(): void {
//         const errorDiv = document.createElement("div");
//         errorDiv.textContent = "Network error. Please try again later";
//         document.getElementById("pong-section")!.append(errorDiv);
//     }

//     private appendWaitText(): void {
//         const waitDiv: HTMLElement | null = document.getElementById("wait-div");
//         if (!waitDiv) {
//             const lobby: HTMLElement = document.createElement("div");
//             lobby.textContent = "Waiting for other players to connect...";
//             lobby.id = "wait-div";
//             document.getElementById("pong-section")?.append(lobby);
//         }
//     }

//     // private async sendMatchMakingRequest(confirm : boolean): Promise<void> {
//     //     let message = "matchmaking_request";
//     //     if (confirm === false)
//     //         message = "no_matchmaking_request";
            
//     //     const matchMakingReq: MatchMakingReq = {
//     //         type: message,
//     //         playerID: this.currentUser!.id,
//     //     }
//     //     const res = await fetch("/api/game/multiplayer", {
//     //         method: 'POST',
//     //         headers: { 'Content-Type': 'application/json' },
//     //         body: JSON.stringify(matchMakingReq),
//     //         credentials: 'include',
//     //     });
//     //     if (!res.ok) {
//     //         const error = await res.json();
//     //         console.error(error.error);
//     //         return;
//     //     }
//     // }

//     private async initGame(playerID: number, gameID: number): Promise<void> {
//         const allChildren = document.getElementById("pong-section");
//         while (allChildren?.firstChild)
//             allChildren.firstChild.remove();
//         this.game = new BaseGame(2, playerID, gameID);
//         // await this.game.counter(); //a voir ou le rajouter
//         await this.game.initGame();
//     }

//     private showEndGamePanel(): void {
//         const panel = document.getElementById("endgame-panel")!;
//         panel.classList.remove("hidden");
//         panel.innerText = `Result = ${this.finalScore[0]} : ${this.finalScore[1]}`;
//     }

//     private handleKeyDown = (event: KeyboardEvent): void => {
//         this.controlNodesDown = document.querySelectorAll(".control");
//         if (event.key == " " && this.isSearchingGame === false) { //TODO : creer un bouton pour lancer le jeu et replay pour sendmatchmaquingrequest pour eviter de le lancer en dehors de la page jeu
//             this.isSearchingGame = true;                
//             this.appendWaitText();
//         }
//         for (const node of this.controlNodesDown) {
//             if (node.dataset.key == event.key)
//                 node.classList.remove("button-press");
//         }
//     }

//     private handleKeyup = (event: KeyboardEvent): void => {
//         this.controlNodesUp = document.querySelectorAll(".control");
//         for (const node of this.controlNodesUp) {
//             if (node.dataset.key == event.key)
//                 node.classList.remove("button-press");
//         }
//     }

//     protected attachListeners(): void {
//         webSocketService.getWebSocket()!.addEventListener("message", (event) => {
//             const msg = JSON.parse(event.data);
//             // console.log("@@@@@@@@@@@@@@@@@@@@@@msg = ", msg);
//             if (msg.type == "start_game") {
//                 console.log(`game starts ! id = ${msg.gameID}`);
//                 // this.game!.clearScreen(); //
//                 // document.querySelector("endgame-panel")?.remove();
//                 this.gameStarted = true;
//                 this.initGame(this.currentUser!.id, msg.gameID);
//             } else if (msg.type == "end" && this.gameStarted) {
//                 this.game!.gameStarted = false;
//                 this.isSearchingGame = false;
//                 this.game!.setScore(msg.score);
//                 console.log("END GAME DETECTED")
//                 this.game!.clearScreen();
//                 document.querySelector("canvas")?.remove();
//                 // document.querySelector("#pong-section")!.remove(); //pour permettre de voir le jeu si on decide de le relancer direct avec le meme joueur
//                 this.finalScore = this.game!.getScore(); //TODO = clean le final score je sais pas ou et le show en haut
//                 this.showEndGamePanel();
//             } else if (msg.type == "GameData") {
//                 this.game!.registerGameData(msg);
//                 console.log("oooooook", msg.score);
//                 this.game!.setScore(msg.score);
//             } else if (msg.type == "msg")
//                 console.log(msg.msg);
//         })
//         this.webSocket?.addEventListener("error", (event) => {
//             console.log(event);
//         })
//         document.addEventListener("keydown", this.handleKeyDown);
//         document.addEventListener("keyup", this.handleKeyup);
//     }

//     protected removeListeners(): void {
//         document.removeEventListener("keydown", this.handleKeyDown);
//         document.removeEventListener("keyup", this.handleKeyup);
//         console.log("@@@@@@@@@@@@@@@@@@@ romove");

//     }
// }

// // TODO = gerer les parties interrompues en cours de jeu -> ajout du score des 2 utilisateurs + check ? Ou juste refetch quand actualisation et maj des parties abandonnees ? jsp
// // TODO = affichage result -> le remettre au milieu ? 

import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';
import { MatchMakingReq } from '../../shared/types/websocket.types';
import { MultiPlayerGame } from '../../components/game/MultiplayerGame.component';
import { webSocketService } from '../../services/user/user.service';

export class GameMenuLocal extends BasePage {
    private webSocket!: WebSocket | undefined;
    private gameStarted: boolean = false;
    private game?: MultiPlayerGame;
    private finalScore: number[] = [];
    private controlNodesUp!: NodeListOf<HTMLElement>;
    private controlNodesDown!: NodeListOf<HTMLElement>;
    private isSearchingGame: boolean = false;



    constructor(config: RouteConfig) {
        super(config);
        this.webSocket = webSocketService.getWebSocket();
    }

    protected insertNetworkError(): void {
        const errorDiv = document.createElement("div");
        errorDiv.textContent = "Network error. Please try again later";
        document.getElementById("pong-section")!.append(errorDiv);
    }

    private appendWaitText(): void {
        // const waitDiv: HTMLElement | null = document.getElementById("wait-div");
        // if (!waitDiv) {
            const lobby: HTMLElement = document.createElement("div");
        //     lobby.textContent = "Waiting for other players to connect...";
        //     lobby.id = "wait-div";
            document.getElementById("pong-section")?.append(lobby);
        // }
    }

    private async sendMatchMakingRequest(type : string): Promise<void> {
        // console.log("type = ", type);
        // let message = "matchmaking_request";
        // if (type = "quit")
        //     type = "no_matchmaking_request";
        // else if (type = "local")
            const message = type;
        console.log("type2 = ", type);           
        const matchMakingReq: MatchMakingReq = {
            type: message,
            playerID: this.currentUser!.id,
        }
        console.log("matchMakingReq = ", matchMakingReq);
        const res = await fetch("/api/game/multiplayer", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(matchMakingReq),
            credentials: 'include',
        });
        if (!res.ok) {
            const error = await res.json();
            console.error(error.error);
            return;
        }
    }

    private async initGame(playerID: number, gameID: number): Promise<void> {
        const allChildren = document.getElementById("pong-section");
        while (allChildren?.firstChild)
            allChildren.firstChild.remove();
        this.game = new MultiPlayerGame(2, playerID, gameID);
        // await this.game.counter(); //a voir ou le rajouter
        await this.game.initGame();
    }

    private showEndGamePanel(): void {
        const panel = document.getElementById("endgame-panel")!;
        panel.classList.remove("hidden");
        panel.innerText = `Result = ${this.finalScore[0]} : ${this.finalScore[1]}`;
    }

    private handleKeyDown = (event: KeyboardEvent): void => {
        this.controlNodesDown = document.querySelectorAll(".control");
        if (event.key == " " && this.isSearchingGame === false) { //TODO : creer un bouton pour lancer le jeu et replay pour sendmatchmaquingrequest pour eviter de le lancer en dehors de la page jeu
            this.isSearchingGame = true;   
            console.log("ici fdp");             
            this.sendMatchMakingRequest("local");
            // document.getElementById("pong-section")?.append(lobby);
            this.appendWaitText();
        }
        for (const node of this.controlNodesDown) {
            if (node.dataset.key == event.key)
                node.classList.remove("button-press");
        }
    }

    private handleKeyup = (event: KeyboardEvent): void => {
        this.controlNodesUp = document.querySelectorAll(".control");
        for (const node of this.controlNodesUp) {
            if (node.dataset.key == event.key)
                node.classList.remove("button-press");
        }
    }

    protected attachListeners() {
        webSocketService.getWebSocket()!.addEventListener("message", async (event) => {
            const msg = JSON.parse(event.data);
            // console.log("@@@@@@@@@@@@@@@@@@@@@@msg = ", msg);
            if (msg.type == "start_game") {
                console.log(`game starts ! id = ${msg.gameID}`);
                // this.game!.clearScreen(); 
                // document.querySelector("endgame-panel")?.remove();
                this.gameStarted = true;
                await this.initGame(this.currentUser!.id, msg.gameID);
            } else if (msg.type == "end" && this.gameStarted) {
                this.game!.gameStarted = false;
                this.isSearchingGame = false;
                this.game!.setScore(msg.score);
                console.log("END GAME DETECTED")
                this.game!.clearScreen();
                document.querySelector("canvas")?.remove();
                // document.querySelector("#pong-section")!.remove(); //pour permettre de voir le jeu si on decide de le relancer direct avec le meme joueur
                this.finalScore = this.game!.getScore(); //TODO = clean le final score je sais pas ou et le show en haut
                this.showEndGamePanel();
            } else if (msg.type == "GameData") {
                this.game!.registerGameData(msg);
                console.log("oooooook", msg.score);
                this.game!.setScore(msg.score);
            } else if (msg.type == "msg")
                console.log(msg.msg);
        })
        this.webSocket?.addEventListener("error", (event) => {
            console.log(event);
        })
        document.addEventListener("keydown", this.handleKeyDown);
        document.addEventListener("keyup", this.handleKeyup);
    }

    protected removeListeners(): void {
        document.removeEventListener("keydown", this.handleKeyDown);
        document.removeEventListener("keyup", this.handleKeyup);
        this.sendMatchMakingRequest("quit");
        console.log("@@@@@@@@@@@@@@@@@@@ romove");

    }
}

// TODO = gerer les parties interrompues en cours de jeu -> ajout du score des 2 utilisateurs + check ? Ou juste refetch quand actualisation et maj des parties abandonnees ? jsp
// TODO = affichage result -> le remettre au milieu ? 