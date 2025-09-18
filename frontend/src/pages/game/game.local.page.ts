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

// // TODO = gerer les parties interrompues en cours de jeu -> ajout du score des 2 utilisateurs + check ? Ou juste refetch quand actualisation et maj des parties abandonnees ? jsp
// peut se check en checkant si le joueur est tjrs dans le lobby ? ->dans ce vas, modifier le back pour que ce soit la variable qui definisse qui est dispo pour jouer et on splice quand on change de page
// // TODO = affichage result -> le remettre au milieu ? 

import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';
import { MatchMakingReq } from '../../shared/types/websocket.types';
import { MultiPlayerGame } from '../../components/game/BaseGame.component';
import { webSocketService } from '../../services/user/user.service';
import { GamePage } from './game.page';

export class GameMenuLocal extends GamePage {

    constructor(config: RouteConfig) {
        super(config);
        // this.webSocket = webSocketService.getWebSocket();
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

    protected handleKeyDown = (event: KeyboardEvent): void => {
        event.preventDefault(); //permet de skip un event par defaut supose en cas de besoin
        this.controlNodesDown = document.querySelectorAll(".control");
        if (event.key == " " && this.isSearchingGame === false) { //TODO : creer un bouton pour lancer le jeu et replay pour sendmatchmaquingrequest pour eviter de le lancer en dehors de la page jeu
            this.isSearchingGame = true;          
            this.sendMatchMakingRequest("local");
            // document.getElementById("pong-section")?.append(lobby);
            this.appendWaitText();
        }
        for (const node of this.controlNodesDown) {
            if (node.dataset.key == event.key)
                node.classList.add("button-press");
        }
    }

    protected handleKeyup = (event: KeyboardEvent): void => {
        this.controlNodesUp = document.querySelectorAll(".control");
        for (const node of this.controlNodesUp) {
            if (node.dataset.key == event.key)
                node.classList.remove("button-press");
        }
    }
}

// TODO = gerer les parties interrompues en cours de jeu -> ajout du score des 2 utilisateurs + check ? Ou juste refetch quand actualisation et maj des parties abandonnees ? jsp
// TODO = affichage result -> le remettre au milieu ? 