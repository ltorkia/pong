import { BasePage } from '../../base/base.page';
import { RouteConfig } from '../../../types/routes.types';
import { Game, Tournament } from '../../../types/game.types';
import { TournamentService } from '../../../api/game/game.api';
import { router } from '../../../router/router';
import { UserModel } from '../../../../../shared/types/user.types';
import { DataService } from '../../../services/user/data.service';
import { Player } from '../../../../../shared/types/game.types';

const MAX_PLAYERS = 16;
const MIN_PLAYERS = 4;

export class GameTournamentOverview extends BasePage {
    private tournamentID: number;
    private pastilleHTML: Node | undefined;
    private tournament: Tournament | undefined;
    private dataApi = new DataService();
    private users: UserModel[] = [];
    private winner: Player | undefined;

    protected async beforeMount(): Promise<void> {
        this.tournament = await TournamentService.fetchTournament(this.tournamentID);
        if (!this.tournament) {
            console.error("Tournament not found");
            router.navigate("/game/tournaments");
        }
        await this.fetchPastille();
        await this.fetchUsers();
        console.log(this.tournament);
    }

    private async fetchPastille(): Promise<void> {
        const response = await fetch("../../../../public/templates/game/tournament_pastille.html");
        if (!response)
            return console.error("fetch pastille failed");
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const pastilleDiv = doc.querySelector("#tournament-pastille");
        if (pastilleDiv)
            this.pastilleHTML = pastilleDiv.cloneNode(true);
    }

    constructor(config: RouteConfig) {
        super(config);
        this.tournamentID = Number(window.location.href.split('/').reverse()[1].slice(1));
    }

    private async fetchUsers() {
        for (const player of this.tournament?.players!) {
            const user = await TournamentService.fetchUser(player.ID);
            if (user)
                this.users?.push(user);
        }
    }

    private async displayTournament(): Promise<void> {
        const firstStage: HTMLElement = document.getElementById("first-stage")!;
        const secondStage: HTMLElement = document.getElementById("second-stage")!;

        await this.displayStage(this.tournament?.stageTwoGames!, 2, secondStage);
        await this.displayStage(this.tournament?.stageOneGames!, 4, firstStage);
        await this.displayWinner();
    }

    private async displayWinner(): Promise<void> {
        const playerPastille = this.pastilleHTML?.cloneNode(true) as HTMLElement;
        if (this.winner) {
            const user = this.users.find((u: UserModel) => u.id == this.winner.ID)
            playerPastille.querySelector("#pastille-name")!.textContent = user!.username;
            const img = playerPastille.querySelector("#user-avatar") as HTMLImageElement;
            img.src = await this.dataApi.getUserAvatarURL(user);
        } else {
            playerPastille.textContent = "?";
        }
        document.getElementById("winner")?.append(playerPastille);
    }

    private async displayStage(stage: Game[], playerNb: number, container: HTMLElement): Promise<void> {
        for (let i = 0; i < playerNb / 2; i++) {
            for (let j = 0; j < 2; j++) { 
                const playerPastille = this.pastilleHTML?.cloneNode(true) as HTMLElement;
                if (stage && stage[i]) {
                    const player = stage[i].players[j];
                    const user = this.users.find((u: UserModel) => u.id == player.ID)
                    playerPastille.querySelector("#pastille-name")!.textContent = user!.username;
                    const img = playerPastille.querySelector("#user-avatar") as HTMLImageElement;
                    img.src = await this.dataApi.getUserAvatarURL(user);
                } else {
                    playerPastille.textContent = "?";
                }
                container.append(playerPastille);
            }
        }
    }


    protected async mount(): Promise<void> {
        this.displayTournament();
    }


    protected attachListeners(): void {
    }
}