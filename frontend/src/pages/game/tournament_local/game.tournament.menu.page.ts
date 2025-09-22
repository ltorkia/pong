import { BasePage } from '../../base/base.page';
import { RouteConfig } from '../../../types/routes.types';
import { router } from '../../../router/router';

const MAX_PLAYERS = 16;
const MIN_PLAYERS = 4;

export class GameMenuTournament extends BasePage {
    private playersNb: number = MIN_PLAYERS; // Minimum players required

    constructor(config: RouteConfig) {
        super(config);
    }
    
    protected async mount(): Promise<void> {
    }

    protected attachListeners(): void {
        const tournamentBtns = document.querySelectorAll("#btn-counter");
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
        document.getElementById("tournament-start-btn")!.addEventListener("click", () => {
            sessionStorage.setItem("fromRedirect", "true");
            router.navigate(`/game/tournament/register/:${this.playersNb}`);
        })
    }
}