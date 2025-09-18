import { BasePage } from '../../base/base.page';
import { GamePage } from '../game.page';
import { RouteConfig } from '../../../types/routes.types';
import { Game, Tournament } from '../../../types/game.types';
import { TournamentService } from '../../../api/game/game.api';
import { router } from '../../../router/router';
import { UserModel } from '../../../shared/types/user.types';
import { DataService } from '../../../services/user/data.service';
import { Player } from '../../../shared/types/game.types';
import { User } from '../../../shared/models/user.model';

const MAX_PLAYERS = 4;
const MIN_PLAYERS = 4;

export class GameTournamentOverview extends GamePage { //changement de basepage mais a voir
    private tournamentID: number;
    private pastilleHTML: HTMLElement | undefined;
    private toolTipHTML: HTMLElement | undefined;
    private tournament: Tournament | undefined;
    private dataApi = new DataService();
    private users: UserModel[] = [];
    private winner: Player | undefined;


	/**
	 * Procède aux vérifications nécessaires avant le montage de la page.
	 * Exécute les vérifications de base de la classe parente (`BasePage`).
	 *
	 * @returns {Promise<boolean>} Une promesse qui se résout lorsque les vérifications sont terminées.
	 */
	protected async preRenderCheck(): Promise<boolean> {
		if (!super.preRenderCheck())
			return false;
        // Check si le tournoi existe ou redirection
        this.tournament = await TournamentService.fetchTournament(this.tournamentID);
		if (!this.tournament) {
            console.error("Tournament not found");
            this.redirectRoute = "/game/tournaments";
			return false;
		}
		return true;
	}

    protected async beforeMount(): Promise<void> {
        // Fetch du html qui va etre reutilise plusieurs fois
        this.pastilleHTML = await this.fetchHTML("../../../../public/templates/game/tournament_pastille.html", "#tournament-pastille");
        this.toolTipHTML = await this.fetchHTML("../../../../public/templates/game/tournament_tooltip.html", "#tooltip");
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

        await this.displayStage(this.tournament?.stageTwoGames!, 2, secondStage);
        await this.displayStage(this.tournament?.stageOneGames!, 4, firstStage);
        await this.displayWinner();

        const allPastilles = document.querySelectorAll("#tournament-pastille");
        for (const pastille of allPastilles) {
            pastille.classList.remove("opacity-0");
            pastille.classList.add("opacity-100");
        }
    }

    // Afficher le winner
    private async displayWinner(): Promise<void> {
        const playerPastille = this.pastilleHTML?.cloneNode(true) as HTMLElement;
        if (this.winner) {
            const user = this.users!.find((u: UserModel) => u.id == this.winner!.ID)
            playerPastille.querySelector("#pastille-name")!.textContent = user!.username;
            const img = playerPastille.querySelector("#user-avatar") as HTMLImageElement;
            img.src = await this.dataApi.getUserAvatarURL(user as User);
        } else {
            playerPastille.textContent = "?";
        }
        document.getElementById("winner")?.append(playerPastille);
    }

    // Afficher chaque etape du tournoi
    private async displayStage(stage: Game[], playerNb: number, container: HTMLElement): Promise<void> {
        // Loop pour le nombre de match par stage 
        for (let i = 0; i < playerNb / 2; i++) {
            const div = document.createElement("div");
            div.id = "match-container";
            div.classList.add("relative");
            // div.dataset
            // Loop pour le nombre de joueur par match, cherche le user approprie, lui cree un container et l'affiche
            for (let j = 0; j < 2; j++) {
                const playerPastille = this.pastilleHTML?.cloneNode(true) as HTMLElement;
                if (stage && stage[i]) {
                    const player = stage[i].players[j];
                    const user = this.users.find((u: UserModel) => u.id == player.ID)
                    playerPastille.querySelector("#pastille-name")!.textContent = user!.username;
                    playerPastille.dataset.id = user?.id.toString();
                    const img = playerPastille.querySelector("#user-avatar") as HTMLImageElement;
                    img.src = await this.dataApi.getUserAvatarURL(user! as User);
                } else {
                    playerPastille.textContent = "?";
                }
                div.append(playerPastille);
            }
            container.append(div);
            const newTooltip = this.toolTipHTML?.cloneNode(true) as HTMLElement;
            // newTooltip!.style.top = div.getBoundingClientRect().top.toString();
            // newTooltip!.style.left = div.getBoundingClientRect().left.toFixed(0).toString() + "px";
            div.append(newTooltip);
        }
    }

    protected async mount(): Promise<void> {
        await this.displayTournament();
        // Création du bouton
        const btn = document.createElement("button");
        btn.id = "start-game-btn";
        btn.textContent = "Lancer la partie";
        btn.classList.add("px-4", "py-2", "bg-blue-900", "text-white", "rounded", "mt-4");

        document.getElementById("tournament-overview")?.append(btn);

        // Ajout du listener
        btn.addEventListener("click", async () => {
            this.isSearchingGame = true;
            // const res = await fetch("/api/game/update_tournament_games", {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     // body: JSON.stringify(lobbyUpdate),
            //     credentials: 'include',
            // });
        // if (!res.ok) {
        //     const error = await res.json();
        //     throw new Error(error.error);
        // }
            // await fetch("/update_tournament_games")
            this.sendMatchMakingRequest("tournament", this.tournamentID); // On passe par cette fonction pour lancer le tournoi et les game
            // this.startGame(); // fonction qui fetch avec les infos en contenu des joueurs
        });
            // await this.attachPastilleListeners();
        }

    private getGameByPlayerID(id: number, stage: Game[]): Game | undefined {
        return stage.find((game: Game) => game.players.find((p: Player) => p.ID == id));
    }

    protected attachListeners(): void {
        const allMatches = document.querySelectorAll("#match-container");
        
        for (const match of allMatches) {
            const tooltip = match.querySelector("#tooltip");
            match.addEventListener("mouseenter", (event) => {
                tooltip!.classList.remove("opacity-0", "pointer-events-none");
                tooltip!.classList.add("opacity-90");
                tooltip?.querySelector("h2");
            });
            match.addEventListener("mouseleave", () => {
                tooltip?.classList.remove("opacity-90");
                tooltip?.classList.add("opacity-0", "pointer-events-none");
            })
        }
    }
}
