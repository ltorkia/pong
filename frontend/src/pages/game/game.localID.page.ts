import { BasePage } from '../base/base.page';
import { RouteConfig } from '../../types/routes.types';
import { MatchMakingReq } from '../../shared/types/websocket.types';
import { MultiPlayerGame } from '../../components/game/BaseGame.component';
import { webSocketService } from '../../services/user/user.service';
import { GamePage } from './game.page';
import { TournamentService } from '../../api/game/game.api';
import { Game } from '../../types/game.types';

export class GameMenuLocalID extends GamePage {
    protected gameID: number;
    private gameInfos: Game | undefined;

    constructor(config: RouteConfig) {
        super(config);
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

    protected async initMatchRequest(): Promise<void> {
        this.isSearchingGame = true;          
        this.sendMatchMakingRequest("tournament", this.gameID);
    }
}

// TODO = gerer les parties interrompues en cours de jeu -> ajout du score des 2 utilisateurs + check ? Ou juste refetch quand actualisation et maj des parties abandonnees ? jsp
// TODO = affichage result -> le remettre au milieu ? 