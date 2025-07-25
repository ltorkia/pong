import { BasePage } from '../../base/base.page';
import { RouteConfig } from '../../../types/routes.types';
import { router } from '../../../router/router';
import { RouteParams } from '../../../types/routes.types';

export class GameMenuTournament extends BasePage {
    private playersNb: number = 3; // Minimum players required

    constructor(config: RouteConfig) {
        super(config);
    }
    
    protected async mount(): Promise<void> {
        console.log(window.location);
    }

    protected attachListeners(): void {
        const tournamentBtns = document.querySelectorAll("#btn-counter");
        tournamentBtns[0].addEventListener("click", () => {
            this.playersNb += 1;
            document.getElementById("btn-counter-nb")!.textContent = this.playersNb.toString();
        });
        tournamentBtns[1].addEventListener("click", () => {
            if (this.playersNb > 3) {
                this.playersNb -= 1;
                document.getElementById("btn-counter-nb")!.textContent = this.playersNb.toString();
            }
        });
        document.getElementById("tournament-start-btn")!.addEventListener("click", () => {
            sessionStorage.setItem("fromRedirect", "true");
            router.navigate(`/game/tournament/register/:${this.playersNb}`);
        })
    }
}