import { BasePage } from '../../base/base.page';
import { RouteConfig } from '../../../types/routes.types';
import { Tournament } from '../../../types/game.types';
import { TournamentService } from '../../../api/game/game.api';
import { router } from '../../../router/router';

const MAX_PLAYERS = 16;
const MIN_PLAYERS = 4;

export class GameTournamentOverview extends BasePage {
    private tournamentID: number;
    private tournament: Tournament | undefined;

    protected async beforeMount(): Promise<void> {
        this.tournament = await TournamentService.fetchTournament(this.tournamentID);
        if (!this.tournament) {
            console.error("Tournament not found");
            router.navigate("/game/tournaments");
        }
        console.log(this.tournament);
    }

    constructor(config: RouteConfig) {
        super(config);
        this.tournamentID = Number(window.location.href.split('/').reverse()[1].slice(1));
    }

    protected async mount(): Promise<void> {
    }


    protected attachListeners(): void {
    }
}