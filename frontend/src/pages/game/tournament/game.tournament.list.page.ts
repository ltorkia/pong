import { BasePage } from '../../base/base.page';
import { RouteConfig } from '../../../types/routes.types';
import { router } from '../../../router/router';
import { Tournament } from '../../../shared/types/game.types';
import { secureFetch } from '../../../utils/app.utils';

const MAX_PLAYERS = 16;
const MIN_PLAYERS = 4;

export class GameTournamentList extends BasePage {
    private allTournaments: Tournament[] = [];
    private playersNb: number = MIN_PLAYERS; // Minimum players required
    private tournamentItemHTML: Node;

    constructor(config: RouteConfig) {
        super(config);
        this.tournamentItemHTML = document.createElement("div");
        this.fetchTournamentItem();
    }

    protected async mount(): Promise<void> {
        this.getTournaments();
        this.applyAppClasses();
    }

    private applyAppClasses(): void {
        const app = document.getElementById("app");
        console.log(app);
        app!.classList.add("flex", "border-white");
    }

    private async fetchTournamentItem(): Promise<void> {
        const response = await fetch("../../../../public/templates/game/tournament_item.html");
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const item = doc.querySelector("#tournament-item");
        if (item && this.tournamentItemHTML)
            this.tournamentItemHTML = item.cloneNode(true);
    }

    private printError(error: string): void {
        const errorDiv = document.createElement("div");
        const container = document.getElementById("alias-container");
        const inputsContainer = document.getElementById("inputs-container");
        errorDiv.textContent = error;
        errorDiv.classList.add(
            "absolute", "bottom-10", "left-0", "right-0",
            "border-2", "border-red-500", "rounded-md",
            "bg-black", "bg-opacity-30", "m-2", "p-2", "text-center",
            "animate__animated", "animate__fadeIn"
        );
        container?.append(errorDiv);
        inputsContainer!.classList.add("transition-transform", "duration-500", "-translate-y-10");
        setTimeout(() => {
            errorDiv.classList.add("animate__animated", "animate__fadeOut");
            setTimeout(() => {
                inputsContainer!.classList.remove("-translate-y-10");
                inputsContainer!.classList.add("translate-y-0");
                errorDiv.addEventListener("animationend", () => {
                    errorDiv.remove();
                });
            }, 500);
        }, 1500);
        inputsContainer?.classList.remove("translate-y-0");
    }

    private printTournaments(allTournaments: Tournament[]): void {
        const tournamentList = document.getElementById("all-tournaments") as HTMLElement;
        while (tournamentList.lastChild)
            tournamentList.lastChild.remove();
        for (const tournament of allTournaments) {
            const tournamentItem = this.tournamentItemHTML.cloneNode(true) as HTMLElement;
            tournamentItem.querySelector("#tournament-name")!.textContent = tournament.name;
            tournamentItem.querySelector("#players")!.textContent = `${tournament.players.length} / ${tournament.maxPlayers}`;
            if (tournament.players == tournament.maxPlayers) { }
            tournamentItem.querySelector("#status")!.classList.add("text-red");
            tournamentList!.append(tournamentItem);
            tournamentItem.addEventListener("click", () => router.navigate(`/game/tournaments/:${tournament.ID}`));
        }
    }

    protected async getTournaments(): Promise<void> {
        const res = await secureFetch("/api/game/tournaments");
        if (!res.ok)
            return this.printError("Network issue. Please try again later..");
        const allTournaments = await res.json();
        allTournaments.map((t: Tournament) => this.allTournaments.push(new Tournament(
            t.name,
            t.maxPlayers,
            t.ID,
            t.masterPlayerID,
            t.isStarted,
        )))
        this.printTournaments(allTournaments);
        console.log(allTournaments);
    }

    private async sendTournament(tournamentName: string): Promise<void> {
        const newTournament = { name: tournamentName, maxPlayers: this.playersNb };
        const res: Response = await fetch('/api/game/new_tournament', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTournament),
                credentials: 'include',
            });
            if (!res.ok) {
                const error = await res.json();
                return this.printError(error.error);
            }
    }

    protected attachListeners(): void {
        const tournamentBtns = document.querySelectorAll("#btn-counter");
        const tournamentInput = document.getElementById("tournament-name-input") as HTMLInputElement;
        const tournamentList = document.getElementById("all-tournaments") as HTMLElement;

        tournamentBtns[0].addEventListener("click", () => {
            if (this.playersNb > MIN_PLAYERS)
                this.playersNb /= 2;
            document.getElementById("btn-counter-nb")!.textContent = this.playersNb.toString();
        });
        tournamentBtns[1].addEventListener("click", () => {
            if (this.playersNb < MAX_PLAYERS) {
                this.playersNb *= 2;
                document.getElementById("btn-counter-nb")!.textContent = this.playersNb.toString();
            }
        });
        tournamentInput!.addEventListener("keydown", (event) => {
            if (event.key == "Enter") {
                this.sendTournament(tournamentInput.value);
                this.getTournaments();
                tournamentInput.value = "";
            }
        })
        tournamentList.addEventListener("wheel", (e) => {
            e.preventDefault(); // empêche le scroll page
            tournamentList.scrollTop += e.deltaY; // pour scroll horizontal avec molette
            console.log(e.deltaY);
        });
        document.getElementById("tournament-start-btn")!.addEventListener("click", () => {
            sessionStorage.setItem("fromRedirect", "true");
            router.navigate(`/game/tournament/register/:${this.playersNb}`);
        })
    }
}