import { BasePage } from '../../base/base.page';
import { RouteConfig } from '../../../types/routes.types';
import { router } from '../../../router/router';
import { Tournament } from '../../../../../shared/types/game.types';
import { dataApi } from '../../../api/index.api';
import { secureFetch } from '../../../utils/app.utils';

const MAX_PLAYERS = 16;
const MIN_PLAYERS = 4;

export class GameTournamentList extends BasePage {
    private allTournaments: Tournament[] = [];

    private playersNb: number = MIN_PLAYERS; // Minimum players required

    constructor(config: RouteConfig) {
        super(config);
        this.getTournaments();
    }

    protected async mount(): Promise<void> {
    }

    protected async getTournaments(): Promise<void> {
        const res = secureFetch("/api/tournaments");
        console.log(res);
        // const data = (await res).json();
    }

    protected attachListeners(): void {
        const tournamentBtns = document.querySelectorAll("#btn-counter");
        const tournamentInput = document.getElementById("tournament-name-input");

        tournamentBtns[0].addEventListener("click", () => {
            if (this.playersNb < MAX_PLAYERS)
            this.playersNb *= 2;
            document.getElementById("btn-counter-nb")!.textContent = this.playersNb.toString();
        });
        tournamentBtns[1].addEventListener("click", () => {
            if (this.playersNb > MIN_PLAYERS) {
                this.playersNb /= 2;
                document.getElementById("btn-counter-nb")!.textContent = this.playersNb.toString();
            }
        });
        tournamentInput?.addEventListener("keydown", (event) => {
            // handle user input
            // const newTournament = new Tournament(event.da)
        })
        document.getElementById("tournament-start-btn")!.addEventListener("click", () => {
            sessionStorage.setItem("fromRedirect", "true");
            router.navigate(`/game/tournament/register/:${this.playersNb}`);
        })
    }
}