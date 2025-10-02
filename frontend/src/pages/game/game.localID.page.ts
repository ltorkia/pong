import { RouteConfig, RouteParams } from '../../types/routes.types';
import { ROUTE_PATHS } from '../../config/routes.config';
import { GamePage } from './game.page';
import { TournamentService } from '../../api/game/game.api';
import { Game } from '../../types/game.types';

export class GameMenuLocalID extends GamePage {
    public challengedFriendID: number = 0;
    protected gameInfos: Game | undefined;

    constructor(config: RouteConfig, params?: RouteParams) {
        super(config);
        if (params && params.gameId && params.tournamentId) {
            this.gameID = Number(params.gameId);
            this.tournamentID = Number(params.tournamentId);
        }
        this.gameType = "tournament";
        this.requestType = "tournament";
    }

    /**
     * Procède aux vérifications nécessaires avant le montage de la page.
     * Exécute les vérifications de base de la classe parente (`BasePage`).
     *
     * @returns {Promise<boolean>} Une promesse qui se résout lorsque les vérifications sont terminées.
     */
    protected async preRenderCheck(): Promise<boolean> {
        const isPreRenderChecked = await super.preRenderCheck();
        if (!isPreRenderChecked)
            return false;

        if (!this.gameID || !this.tournamentID) {
            console.error("GameID or tournamentID undefined");
            this.redirectRoute = `${ROUTE_PATHS.GAME_TOURNAMENT_LOCAL_MENU}`;
            return false;
        }
        this.gameInfos = await TournamentService.fetchLocalTournamentGame(this.gameID);
        if (!this.gameInfos) {
            console.error("Tournament game not found");
            this.redirectRoute = `${ROUTE_PATHS.GAME_TOURNAMENT_LOCAL_MENU}/${this.tournamentID}`;
            return false;
        }
        return true;
    }

    protected async beforeMount(): Promise<void> {
        await super.beforeMount();
        this.insertPlayerNames();
        this.players = this.gameInfos?.players;
        if (this.gameInfos?.isOver) {
            this.finalScore = this.gameInfos.score;
            this.showEndGamePanel(this.gameInfos);
        }
    }

    protected insertPlayerNames(): void {
        const playerOne = document.getElementById("player-one")!;
        const playerTwo = document.getElementById("player-two")!;

        playerOne.textContent = this.gameInfos?.players[0].alias ?? null;
        playerTwo.textContent = this.gameInfos?.players[1].alias ?? null;
    }

    protected async initMatchRequest(): Promise<void> {
        this.isSearchingGame = true;
        this.sendMatchMakingRequest(this.requestType!);
    }
}