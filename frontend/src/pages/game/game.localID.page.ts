import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';
import { MatchMakingReq } from '../../shared/types/websocket.types';
import { MultiPlayerGame } from '../../components/game/BaseGame.component';
import { webSocketService } from '../../services/user/user.service';
import { GamePage } from './game.page';
import { TournamentService } from '../../api/game/game.api';
import { Game } from '../../types/game.types';

export class GameMenuLocalID extends GamePage {
    private gameID: number;
    private gameInfos: Game | undefined;

    constructor(config: RouteConfig) {
        super(config);
        this.webSocket = webSocketService.getWebSocket();
        this.gameID = Number(window.location.href.split('/').reverse()[0].slice(1));
    }

    protected async beforeMount(): Promise<void> {
        this.gameInfos = await TournamentService.fetchLocalTournamentGame(this.gameID);
        console.log(this.gameInfos);
        this.insertPlayerNames();
    }

    protected insertPlayerNames(): void {
        const playerOne = document.getElementById("player-one")!;
        const playerTwo = document.getElementById("player-two")!;

        playerOne.textContent = this.gameInfos?.players[0].alias;
        playerTwo.textContent = this.gameInfos?.players[1].alias;
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
        this.controlNodesDown = document.querySelectorAll(".control");
        if (event.key == " " && this.isSearchingGame === false) { //TODO : creer un bouton pour lancer le jeu et replay pour sendmatchmaquingrequest pour eviter de le lancer en dehors de la page jeu
            this.isSearchingGame = true;          
            this.sendMatchMakingRequest("tournament", this.gameID);
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