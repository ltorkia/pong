import { BasePage } from '../../base/base.page';
import { GamePage } from '../game.page';
import { RouteConfig } from '../../../types/routes.types';
import { Game, TournamentLocal } from '../../../types/game.types';
import { TournamentService } from '../../../api/game/game.api';
import { router } from '../../../router/router';
import { UserModel } from '../../../shared/types/user.types';
import { DataService } from '../../../services/user/data.service';
import { Player } from '../../../shared/types/game.types';
import { User } from '../../../shared/models/user.model';

const MAX_PLAYERS = 4;
const MIN_PLAYERS = 4;

export class GameTournamentLocalOverview extends GamePage {
    private tournamentID: number;
    private pastilleHTML: HTMLElement | undefined;
    private toolTipHTML: HTMLElement | undefined;
    private tournament: TournamentLocal | undefined;
    private dataApi = new DataService();
    private users: UserModel[] = [];

    protected async beforeMount(): Promise<void> {
        // Check si le tournoi existe ou redirection
        this.tournament = await TournamentService.fetchLocalTournament(this.tournamentID);
        if (!this.tournament) {
            console.error("Tournament not found");
            router.navigate("/game/tournament_local");
        }
        // Fetch du html qui va etre reutilise plusieurs fois
        this.pastilleHTML = await this.fetchHTML("../../../../public/templates/game/tournament/tournament_pastille.html", "#tournament-pastille");
        this.toolTipHTML = await this.fetchHTML("../../../../public/templates/game/tournament/tournament_tooltip.html", "#tooltip");
        await this.fetchUsers();
        console.log(this.tournament);
    }

    // Methode pour fetch une partie de HTML depuis une url
    private async fetchHTML(src: string, idTopContainer: string): Promise<HTMLElement | undefined> {
        const response = await fetch(src);
        if (!response) {
            console.error("fetch pastille failed");
            return undefined;
        }
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const div = doc.querySelector(idTopContainer);
        if (div)
            return div.cloneNode(true) as HTMLElement;
        else {
            console.error("didnt find top container");
            return undefined;
        }
    }

    constructor(config: RouteConfig) {
        super(config);
        this.tournamentID = Number(window.location.href.split('/').reverse()[1].slice(1));
    }

    // Fetch les players d'un tournoi stocke dans le back pour les avoir a disposition dans le front
    // Users plutot que players probablement pour avoir acces a id, avatar, etc
    private async fetchUsers() {
        for (const player of this.tournament?.players!) {
            const user = await TournamentService.fetchUser(player.ID);
            if (user)
                this.users?.push(user);
        }
    }

    // Afficher le tournoi 
    private async displayTournament(): Promise<void> {
        const firstStage: HTMLElement = document.getElementById("first-stage")!;
        const secondStage: HTMLElement = document.getElementById("second-stage")!;

        await this.displayStageOne(this.tournament?.stageOne!, firstStage);
        await this.displayStageOne([this.tournament?.stageTwo!], secondStage);
        await this.displayWinner();
        this.displayNextGameAndSetNavigate();

        const allPastilles = document.querySelectorAll("#tournament-pastille");
        for (const pastille of allPastilles) {
            pastille.classList.remove("opacity-0");
            pastille.classList.add("opacity-100");
        }
    }

    // Trouve la prochaine game a jouer pour continuer le tournoi
    private getNextGame(): Game | undefined {
        for (const game of this.tournament!.stageOne!) {
            if (!game.isOver)
                return game;
        }
        if (!this.tournament?.stageTwo?.isOver)
            return this.tournament?.stageTwo;
        return undefined;
    }

    // Affiche la next game a jouer et set le bouton pour naviguer a l'adresse de la prochaine game
    private displayNextGameAndSetNavigate(): void {
        const nextGame = this.getNextGame();
        if (nextGame) {
            console.log(nextGame.gameIDforDB);
            document.getElementById("player-one")!.textContent = `${nextGame?.players[0].alias}`;
            document.getElementById("player-two")!.textContent = `${nextGame?.players[1].alias}`;
            document.getElementById("tournament-start-btn")!.addEventListener("click", () => {
                router.navigate(`/game/local/:${nextGame.gameIDforDB}`);
            })
        }
    }

    // Afficher le winner
    private async displayWinner(): Promise<void> {
        const playerPastille = this.pastilleHTML?.cloneNode(true) as HTMLElement;
        if (this.tournament?.winner) {
            const user = this.users!.find((u: UserModel) => u.id == this.tournament?.winner!.ID)
            playerPastille.querySelector("#pastille-name")!.textContent = user!.username;
            const img = playerPastille.querySelector("#user-avatar") as HTMLImageElement;
            img.src = await this.dataApi.getUserAvatarURL(user as User);
        } else {
            playerPastille.textContent = "?";
        }
        document.getElementById("winner")?.append(playerPastille);
    }

    // Loop pour les joueurs du match, cherche le user approprie, lui cree un container et l'affiche
    private async displayGamePlayers(game: Game, container: HTMLDivElement) {
        const tooltip = this.toolTipHTML?.cloneNode(true) as HTMLElement;

        // console.log(players);
        for (let i = 0; i < 2; i++) {
            const playerPastille = this.pastilleHTML?.cloneNode(true) as HTMLElement;
            const pastille = playerPastille.querySelector("#pastille-name")!;
            const img = playerPastille.querySelector("#user-avatar") as HTMLImageElement;
            const player = game.players[i];
            if (!player) {
                img.remove();
                pastille.textContent = "?";
                tooltip.querySelector(`#player-${i}`)!.textContent = "?";
                container.append(playerPastille);
                continue ;
            }
            const user = this.users.find((u: UserModel) => u.id == player.ID)
            const name = player.alias || user?.username;

            if (user)
                img.src = await this.dataApi.getUserAvatarURL(user! as User);
            else
                img.src = await this.dataApi.returnDefaultAvatarURL();

            pastille.textContent = name;
            tooltip.querySelector(`#player-${i}`)!.textContent = name;
            
            if (game.isOver) {
                console.log("GAME SCORE : ", game.score)
                if (game.score[i] == 3) {
                    playerPastille.classList.remove("border-white");
                    playerPastille.classList.add("border-green-500");
                } else {
                    console.log("ELSE");
                    playerPastille.classList.remove("border-white");
                    playerPastille.classList.add("border-red-500");
                }
            }
            container.append(playerPastille);
        }
        container.append(tooltip);
    }

    // Afficher les deux etapes du tournoi
    private async displayStageOne(stage: Game[], container: HTMLElement): Promise<void> {
        // Loop pour le nombre de match par etape (== 2 ou 1) 
        for (let i = 0; i < stage.length; i++) {
            const div = document.createElement("div");
            div.id = "match-container";
            div.classList.add("relative");
            await this.displayGamePlayers(stage[i], div);
            container.append(div);
        }
    }

    protected async mount(): Promise<void> {
        await this.displayTournament();
    }

    protected attachListeners(): void {
        const allMatches = document.querySelectorAll("#match-container");

        for (const match of allMatches) {
            const tooltip = match.querySelector("#tooltip");
            match.addEventListener("mouseenter", (event) => {
                tooltip!.classList.remove("opacity-0", "pointer-events-none");
                tooltip!.classList.add("opacity-100");
                tooltip?.querySelector("h2");
            });
            match.addEventListener("mouseleave", () => {
                tooltip?.classList.remove("opacity-100");
                tooltip?.classList.add("opacity-0", "pointer-events-none");
            })
        }
    }
}