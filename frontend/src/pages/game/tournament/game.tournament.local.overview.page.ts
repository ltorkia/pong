import { BasePage } from '../../base/base.page';
import { RouteConfig, RouteParams } from '../../../types/routes.types';
import { Game, TournamentLocal } from '../../../types/game.types';
import { TournamentService } from '../../../api/game/game.api';
import { router } from '../../../router/router';
import { UserModel } from '../../../shared/types/user.types';
import { DataService } from '../../../services/user/data.service';
import { storageService } from '../../../services/index.service';
import { Player } from '../../../shared/types/game.types';
import { User } from '../../../shared/models/user.model';
import { ROUTE_PATHS } from '../../../config/routes.config';
import { animateCSS } from '../../../utils/animate.utils';

const MAX_PLAYERS = 4;
const MIN_PLAYERS = 4;

export class GameTournamentLocalOverview extends BasePage {
    private tournamentID?: number;
    private pastilleHTML: HTMLElement | undefined;
    private toolTipHTML: HTMLElement | undefined;
    private tournament: TournamentLocal | undefined;
    private dataApi = new DataService();
    private users: UserModel[] = [];
    private mobile: boolean = false;
    private matchListeners: Map<HTMLElement, { enter: (e: Event) => void, leave: (e: Event) => void }> = new Map();
    private handlerNavigate: (() => Promise<void>) | null = null;

    // listener lorsque navigation, pour enlever le rotate et restart les differents styles
    constructor(config: RouteConfig, params?: RouteParams) {
        super(config);
        if (params && params.tournamentId)
            this.tournamentID = Number(params.tournamentId);
        if (window.innerWidth < 1024) {
            this.mobile = true;
            this.onClientNavigation(() => {
                const app = document.getElementById("app");
                app?.classList.remove(
                    "m-0", "rotate-[-90deg]", "origin-bottom-left",
                    "top-0", "left-0", "fixed"
                );
                app?.removeAttribute("style");
                document.body.removeAttribute("style");
                void document.body.offsetWidth;
            });
        }
    }

    private onClientNavigation(callback: (type: "pushState" | "replaceState" | "popstate" | "refresh", ...args: any[]) => void) {
        const originalPushState = history.pushState;
        history.pushState = function (...args) {
            const result = originalPushState.apply(this, args);
            callback("pushState", ...args);
            return result;
        };

        const originalReplaceState = history.replaceState;
        history.replaceState = function (...args) {
            const result = originalReplaceState.apply(this, args);
            callback("replaceState", ...args);
            return result;
        };

        window.addEventListener("popstate", () => {
            callback("popstate");
        });
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

        if (!this.tournamentID || !this.currentUser!.tournament) {
            console.error("Tournament id undefined");
            this.redirectRoute = ROUTE_PATHS.GAME_TOURNAMENT_LOCAL_MENU;
			this.currentUser!.tournament = 0;
            storageService.setCurrentTournamentID(0);
            return false;
        }
        this.tournament = await TournamentService.fetchLocalTournament(this.tournamentID!);
        if (!this.tournament) {
            this.redirectRoute = ROUTE_PATHS.GAME_TOURNAMENT_LOCAL_MENU;
			this.currentUser!.tournament = 0;
            storageService.setCurrentTournamentID(0);
            return false;
        }
        return true;
    }

    protected async beforeMount(): Promise<void> {
        // Fetch du html qui va etre reutilise plusieurs fois
        this.pastilleHTML = await this.fetchHTML("/templates/game/tournament/tournament_pastille.html", ".tournament-pastille");
        this.toolTipHTML = await this.fetchHTML("/templates/game/tournament/tournament_tooltip.html", "#tooltip");
        await this.fetchUsers();
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
            return undefined;
        }
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
        const winner: HTMLElement = document.getElementById("winner")!;

        await this.displayStageOne(this.tournament?.stageOne!, firstStage);
        await this.displayStageOne([this.tournament?.stageTwo!], secondStage);
        await this.displayWinner(winner);
        this.displayNextGameAndSetNavigate();

        const allPastilles = document.querySelectorAll(".tournament-pastille");
        for (const pastille of allPastilles) {
            pastille.classList.remove("opacity-0");
            pastille.classList.add("opacity-100");
        }

        if (this.mobile) {
            const app = document.getElementById("app")!;
            app.style.width = `${window.innerHeight.toString()}px`;
            app.style.height = `${window.innerWidth.toString()}px`;
            app.classList.add(
                "m-0", "rotate-[-90deg]", "fixed",
                "top-0", "left-0"
            );
        }

    }

    // Trouve la prochaine game a jouer pour continuer le tournoi
    private getNextGame(): Game | undefined {
        for (const game of this.tournament!.stageOne!) {
            if (!game.isOver)
                return game;
        }
        if (this.tournament?.stageTwo && this.tournament.stageTwo.players.length == 2)
            return this.tournament.stageTwo;
        return undefined;
    }

    // Affiche la next game a jouer et set le bouton pour naviguer a l'adresse de la prochaine game
    private displayNextGameAndSetNavigate(): void {
        const nextGame = this.getNextGame();
        if (nextGame) {
            document.getElementById("player-one")!.textContent = `${nextGame?.players[0].alias}`;
            document.getElementById("player-two")!.textContent = `${nextGame?.players[1].alias}`;
            if (this.handlerNavigate)
                document.getElementById("tournament-start-btn")!.removeEventListener("click", this.handlerNavigate);
            this.handlerNavigate = () => this.navigateHandler(nextGame);
            document.getElementById("tournament-start-btn")!.addEventListener("click", this.handlerNavigate);
        }
        if (this.mobile) {
            const nextGameHTML = document.getElementById("next-game")?.cloneNode(true) as HTMLElement;
            const winnerContainer = document.getElementById("winner");
            if (nextGameHTML) {
                nextGameHTML.classList.remove("max-lg:hidden");
                const startBtn = nextGameHTML.querySelector("#tournament-start-btn") as HTMLElement;
                if (startBtn) {
                    if (this.handlerNavigate)
                        startBtn.removeEventListener("click", this.handlerNavigate);
                    this.handlerNavigate = () => this.navigateHandler(nextGame);
                    startBtn.addEventListener("click", this.handlerNavigate);
                }
                winnerContainer?.append(nextGameHTML);
            }
        }
    }

    private navigateHandler = async (nextGame?: Game): Promise<void> => {
        await router.navigate(`${ROUTE_PATHS.GAME_LOCAL}/${this.tournamentID}/${nextGame?.gameID}`);
    }

    // Display et anime l'overlay winner
    private showWinnerDialog(): void {
        const overlay = document.getElementById("redirect-dialog-overlay");
        const dialog = document.getElementById("redirect-dialog");
        const winner = document.getElementById("tournament-winner-name");

        if (overlay && dialog && winner) {

            overlay.classList.remove("hidden");
            overlay.classList.remove("opacity-0");

            if (this.tournament?.winner?.alias)
                winner.textContent = this.tournament.winner.alias;
            // Animate the dialog itself
            animateCSS(overlay, "fadeIn").then;
            animateCSS(dialog, "fadeIn").then(() => dialog.classList.remove("opacity-0"))
                .then(() => animateCSS(winner, "fadeInLeft"))
                .then(() => winner.classList.remove("opacity-0"));
        }
    }

    // Afficher le winner, display l'overlay winner et insere le nom du gagnant
    private async displayWinner(winnerContainer: HTMLElement): Promise<void> {
        const playerPastille = await this.createAndFillPlayerPastille(this.tournament?.winner!, 0);
        if (!this.mobile)
            winnerContainer.append(playerPastille);

        if (this.tournament?.winner) {
            document.getElementById("next-game")!.classList.add("hidden");
            if (!this.mobile) {
                setInterval(() => {
                    animateCSS(winnerContainer, "tada");
                }, 1500);
                setInterval(() => {
                    playerPastille.classList.toggle("border-yellow-500");
                }, 500);
            }
            const redirectDialog = document.getElementById("redirect-dialog-overlay");
            if (redirectDialog) {
                setTimeout(() => this.showWinnerDialog(), 1000);
            }
        }
    }

    // Cree une pastille player, la remplie avec les infos du joueur et la retourne 
    private async createAndFillPlayerPastille(player: Player, index: number, tooltipH2Name?: Element): Promise<HTMLElement> {
        const playerPastille = this.pastilleHTML?.cloneNode(true) as HTMLElement;
        const pastille = playerPastille.querySelector(".pastille-name")!;
        const img = playerPastille.querySelector(".user-avatar") as HTMLImageElement;

        if (!player) {
            img.remove();
            pastille.textContent = "?";
            if (tooltipH2Name)
                tooltipH2Name.textContent = "?";
            return playerPastille;
        }

        const user = this.users.find((u: UserModel) => u.id == player.ID);
        const name = player.alias || user?.username;

        if (user)
            img.src = await this.dataApi.getUserAvatarURL(user! as User);
        else
            img.src = await this.dataApi.returnDefaultAvatarURL();

        if (name)
            pastille.textContent = name;
        if (name && tooltipH2Name)
            tooltipH2Name.textContent = name || null;
        return playerPastille;
    }

    // Loop pour les joueurs du match, cherche le user approprie, lui cree un container et l'affiche
    private async displayGamePlayers(game: Game, container: HTMLDivElement) {
        const tooltip = this.toolTipHTML?.cloneNode(true) as HTMLElement;

        for (let i = 0; i < 2; i++) {
            const player = game.players[i];
            const h2 = tooltip.querySelector(`#player-${i}`)!;
            const playerPastille = await this.createAndFillPlayerPastille(player, i, h2);

            if (game.isOver) {
                if (game.score[i] == 3) {
                    playerPastille.classList.remove("border-white");
                    playerPastille.classList.add("border-green-500");
                } else {
                    playerPastille.classList.remove("border-white");
                    playerPastille.classList.add("border-red-500");
                }
            }
            tooltip.querySelector(`#score-${i}`)!.textContent = String(game.score[i]);
            container.append(playerPastille);
        }
        if (!this.mobile)
            container.append(tooltip);
    }

    // Afficher les deux etapes du tournoi
    private async displayStageOne(stage: Game[], container: HTMLElement): Promise<void> {
        // Loop pour le nombre de match par etape (== 2 ou 1) 
        for (let i = 0; i < stage.length; i++) {
            const div = document.createElement("div");
            div.id = "match-container";
            div.classList.add("relative");
            if (this.mobile)
                div.classList.add("h-1/2", "m-3");
            await this.displayGamePlayers(stage[i], div);
            container.append(div);
        }
    }

    protected async mount(): Promise<void> {
        await this.displayTournament();
    }

    protected attachListeners(): void {
        const allMatches = document.querySelectorAll("#match-container");
        const redirectBtn = document.getElementById("redirect-btn");

        redirectBtn?.addEventListener("click", this.redirectHandler);

        for (const match of allMatches) {
            const tooltip = match.querySelector("#tooltip");
            if (tooltip) {
                const listenerEnter = () => this.mouseEnterHandler(tooltip);
                const listenerLeave = () => this.mouseLeaveHandler(tooltip);
                this.matchListeners.set(match as HTMLElement, { enter: listenerEnter, leave: listenerLeave });
                match.addEventListener("mouseenter", listenerEnter);
                match.addEventListener("mouseleave", listenerLeave)
            }
        }
    }

    protected removeListeners(): void {
        const redirectBtn = document.getElementById("redirect-btn");
        redirectBtn?.removeEventListener("click", this.redirectHandler);

        this.matchListeners.forEach((value, key) => {
            key.removeEventListener("mouseenter", value.enter);
            key.removeEventListener("mouseleave", value.leave);
        });
        this.matchListeners.clear();

        const tournamentStartBtn = document.getElementById("tournament-start-btn")!;
        if (tournamentStartBtn && this.handlerNavigate)
            tournamentStartBtn.removeEventListener("click", this.handlerNavigate);
    }

    private redirectHandler = async (): Promise<void> => {
        const matchMakingReq = new Blob([JSON.stringify({
            type: "tournament_clean_request",
            playerID: this.currentUser!.id,
            tournamentID: this.tournamentID,
        })], { type: 'application/json' });
        navigator.sendBeacon("/api/game/playgame", matchMakingReq);

		this.currentUser!.tournament = 0;
        storageService.setCurrentTournamentID(0);
        await router.navigate("/");
    }

    private mouseEnterHandler = (tooltip: Element): void => {
        tooltip!.classList.remove("opacity-0", "pointer-events-none");
        tooltip!.classList.add("opacity-100");
        tooltip?.querySelector("h2");
    }

    private mouseLeaveHandler = (tooltip: Element): void => {
        tooltip?.classList.remove("opacity-100");
        tooltip?.classList.add("opacity-0", "pointer-events-none");
    }
}