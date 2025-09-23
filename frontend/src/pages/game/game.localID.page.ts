import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';
import { MatchMakingReq } from '../../shared/types/websocket.types';
import { MultiPlayerGame } from '../../components/game/BaseGame.component';
import { webSocketService } from '../../services/user/user.service';
import { GamePage } from './game.page';
import { TournamentService } from '../../api/game/game.api';
import { Game } from '../../types/game.types';
import { router } from '../../router/router';

export class GameMenuLocalID extends GamePage {
    private gameID: number;
    private tournamentID: number = 0;
    private gameInfos: Game | undefined;

    constructor(config: RouteConfig) {
        super(config);
        this.webSocket = webSocketService.getWebSocket();
        this.gameID = Number(window.location.href.split('/').reverse()[0].slice(1));
    }

    protected async beforeMount(): Promise<void> {
        console.log("GAME IDDDDD = ", this.gameID);
        const gameData: { tournamentID: number, game: Game } | undefined
            = await TournamentService.fetchLocalTournamentGame(this.gameID);
        console.log("GAME DATAAA =", gameData);
        this.tournamentID = gameData!.tournamentID;
        this.gameInfos = gameData!.game;
        console.log(this.gameInfos);
        this.insertPlayerNames();
    }

    protected insertPlayerNames(): void {
        const playerOne = document.getElementById("player-one")!;
        const playerTwo = document.getElementById("player-two")!;

        playerOne.textContent = this.gameInfos?.players[0].alias;
        playerTwo.textContent = this.gameInfos?.players[1].alias;
    }

    protected async endGameAftermatch(): Promise<void> {
        this.showEndGamePanel();
        const btn = document.createElement("button");
        const panel = document.getElementById("pong-section");

        btn.innerText = "BACK TO TOURNAMENT";
        btn.id = "navigate-btn";

        const navigateTournamentBtnHandler = () => {
            console.log("TOURNAMENT IDDD = ", this.tournamentID);
            document.getElementById("navigate-btn")!.removeEventListener("click", navigateTournamentBtnHandler);
            router.navigate(`/game/tournaments_local/:${this.tournamentID}/overview`);
        }

        btn.addEventListener("click", navigateTournamentBtnHandler);
        panel?.append(btn);
        // await TournamentService.updateTournamentRequest(this.tournamentID);
    }

    protected handleKeyDown = (event: KeyboardEvent): void => {
        this.controlNodesDown = document.querySelectorAll(".control");
        if (event.key == " " && this.isSearchingGame === false) { //TODO : creer un bouton pour lancer le jeu et replay pour sendmatchmaquingrequest pour eviter de le lancer en dehors de la page jeu
            this.isSearchingGame = true;
            this.sendMatchMakingRequest("tournament", this.gameID);
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